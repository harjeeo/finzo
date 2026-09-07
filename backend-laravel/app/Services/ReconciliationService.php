<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntryLine;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ReconciliationService
{
    /** Bank/cash accounts eligible for reconciliation. */
    public function listBankAccounts(string $businessId)
    {
        return Account::where('business_id', $businessId)
            ->where('is_bank_account', true)
            ->orderBy('code')
            ->get();
    }

    public function getReconciliation(string $businessId, string $accountId): array
    {
        $account = Account::where('id', $accountId)->where('business_id', $businessId)->first();
        if (! $account) {
            throw new HttpException(404, 'Account not found');
        }
        if (! $account->is_bank_account) {
            throw new HttpException(400, 'This account is not marked as a bank account');
        }

        $lines = JournalEntryLine::where('account_id', $accountId)
            ->whereHas('journalEntry', fn ($q) => $q->where('business_id', $businessId))
            ->with('journalEntry')
            ->get()
            ->sortBy([
                fn ($l) => $l->journalEntry->entry_date,
                fn ($l) => $l->journalEntry->created_at,
            ])
            ->values();

        $isDebitNormal = in_array($account->type, ['ASSET', 'EXPENSE'], true);
        $bookBalance = (float) $account->opening_balance;
        $reconciledBalance = (float) $account->opening_balance;

        $entries = $lines->map(function (JournalEntryLine $line) use (&$bookBalance, &$reconciledBalance, $isDebitNormal) {
            $debit = (float) $line->debit;
            $credit = (float) $line->credit;
            $delta = $isDebitNormal ? $debit - $credit : $credit - $debit;
            $bookBalance += $delta;
            if ($line->is_reconciled) {
                $reconciledBalance += $delta;
            }

            return [
                'id' => $line->id,
                'journalEntryId' => $line->journal_entry_id,
                'entryNumber' => $line->journalEntry->entry_number,
                'entryDate' => $line->journalEntry->entry_date->toJSON(),
                'narration' => $line->journalEntry->narration,
                'description' => $line->description,
                'debit' => $debit,
                'credit' => $credit,
                'isReconciled' => (bool) $line->is_reconciled,
                'reconciledAt' => $line->reconciled_at?->toJSON(),
            ];
        })->values()->all();

        return [
            'account' => $account,
            'openingBalance' => (float) $account->opening_balance,
            'bookBalance' => $bookBalance,
            'reconciledBalance' => $reconciledBalance,
            'entries' => $entries,
        ];
    }

    public function setReconciled(string $businessId, string $accountId, string $lineId, bool $reconciled): JournalEntryLine
    {
        $line = JournalEntryLine::where('id', $lineId)
            ->where('account_id', $accountId)
            ->whereHas('journalEntry', fn ($q) => $q->where('business_id', $businessId))
            ->first();

        if (! $line) {
            throw new HttpException(404, 'Journal entry line not found for this account');
        }

        $line->is_reconciled = $reconciled;
        $line->reconciled_at = $reconciled ? now() : null;
        $line->save();

        return $line;
    }
}
