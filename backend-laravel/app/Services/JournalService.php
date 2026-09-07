<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use Symfony\Component\HttpKernel\Exception\HttpException;

class JournalService
{
    public function __construct(private readonly AuditService $auditService) {}

    private const ROUNDING_TOLERANCE = 0.01;

    /**
     * Posts a balanced journal entry. $lines is a list of
     * ['accountId' => string, 'debit' => float|null, 'credit' => float|null, 'description' => string|null].
     */
    public function postEntry(string $businessId, array $params): JournalEntry
    {
        $lines = array_values(array_filter(
            $params['lines'],
            fn (array $l) => ($l['debit'] ?? 0) > 0 || ($l['credit'] ?? 0) > 0,
        ));

        if (count($lines) < 2) {
            throw new HttpException(400, 'A journal entry needs at least two non-zero lines');
        }

        $totalDebit = array_sum(array_map(fn ($l) => $l['debit'] ?? 0, $lines));
        $totalCredit = array_sum(array_map(fn ($l) => $l['credit'] ?? 0, $lines));

        if (abs($totalDebit - $totalCredit) > self::ROUNDING_TOLERANCE) {
            throw new HttpException(400, sprintf(
                'Journal entry does not balance (debit ₹%s vs credit ₹%s)',
                number_format($totalDebit, 2),
                number_format($totalCredit, 2),
            ));
        }

        $entryCount = JournalEntry::where('business_id', $businessId)->count();
        $entryNumber = 'JE-'.str_pad((string) ($entryCount + 1), 6, '0', STR_PAD_LEFT);

        $entry = JournalEntry::create([
            'business_id' => $businessId,
            'entry_number' => $entryNumber,
            'entry_date' => $params['entryDate'] ?? now(),
            'narration' => $params['narration'] ?? null,
            'source_type' => $params['sourceType'] ?? 'MANUAL',
            'source_id' => $params['sourceId'] ?? null,
        ]);

        foreach ($lines as $line) {
            $entry->lines()->create([
                'account_id' => $line['accountId'],
                'debit' => $line['debit'] ?? 0,
                'credit' => $line['credit'] ?? 0,
                'description' => $line['description'] ?? null,
            ]);
        }

        return $entry->load('lines.account');
    }

    /** Deletes any auto-posted journal entries linked to a given transaction source. */
    public function removeBySource(string $businessId, string $sourceType, string $sourceId): void
    {
        JournalEntry::where('business_id', $businessId)
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->delete();
    }

    public function findAll(string $businessId, ?string $from = null, ?string $to = null)
    {
        return JournalEntry::with('lines.account')
            ->where('business_id', $businessId)
            ->when($from, fn ($q) => $q->where('entry_date', '>=', $from))
            ->when($to, fn ($q) => $q->where('entry_date', '<=', "{$to} 23:59:59"))
            ->orderByDesc('entry_date')
            ->get();
    }

    public function findOne(string $businessId, string $id): JournalEntry
    {
        $entry = JournalEntry::with('lines.account')->where('business_id', $businessId)->find($id);

        if (! $entry) {
            throw new HttpException(404, 'Journal entry not found');
        }

        return $entry;
    }

    public function createManual(string $businessId, array $data, array $actor): JournalEntry
    {
        $accountIds = array_column($data['lines'], 'accountId');
        $accountCount = Account::whereIn('id', $accountIds)->where('business_id', $businessId)->count();
        if ($accountCount !== count(array_unique($accountIds))) {
            throw new HttpException(400, 'One or more accounts were not found');
        }

        $entry = $this->postEntry($businessId, [
            'entryDate' => $data['entryDate'] ?? null,
            'narration' => $data['narration'] ?? null,
            'sourceType' => 'MANUAL',
            'lines' => $data['lines'],
        ]);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'JournalEntry',
            'entityId' => $entry->id,
            'action' => 'CREATE',
            'summary' => "Posted manual journal entry {$entry->entry_number}",
            'changes' => ['after' => $entry->toArray()],
        ]);

        return $entry;
    }

    public function removeManual(string $businessId, string $id, array $actor): array
    {
        $entry = $this->findOne($businessId, $id);

        if ($entry->source_type !== 'MANUAL') {
            throw new HttpException(400, 'This entry was posted automatically from a transaction; delete or edit the source transaction instead');
        }

        $before = $entry->toArray();
        $entry->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'JournalEntry',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted manual journal entry {$entry->entry_number}",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }

    /** General ledger for a single account: chronological lines with a running balance. */
    public function getLedger(string $businessId, string $accountId): array
    {
        $account = Account::where('id', $accountId)->where('business_id', $businessId)->first();
        if (! $account) {
            throw new HttpException(404, 'Account not found');
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
        $balance = (float) $account->opening_balance;
        $entries = $lines->map(function (JournalEntryLine $line) use (&$balance, $isDebitNormal) {
            $debit = (float) $line->debit;
            $credit = (float) $line->credit;
            $balance += $isDebitNormal ? $debit - $credit : $credit - $debit;

            return [
                'id' => $line->id,
                'journalEntryId' => $line->journal_entry_id,
                'entryNumber' => $line->journalEntry->entry_number,
                'entryDate' => $line->journalEntry->entry_date->toJSON(),
                'narration' => $line->journalEntry->narration,
                'description' => $line->description,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $balance,
            ];
        })->values()->all();

        return [
            'account' => $account,
            'openingBalance' => (float) $account->opening_balance,
            'closingBalance' => $balance,
            'entries' => $entries,
        ];
    }

    /** Trial balance: every account's total debits/credits and net balance, plus grand totals. */
    public function getTrialBalance(string $businessId): array
    {
        $accounts = Account::where('business_id', $businessId)
            ->orderBy('type')
            ->orderBy('code')
            ->with('journalLines')
            ->get();

        $rows = $accounts->map(function (Account $account) {
            $isDebitNormal = in_array($account->type, ['ASSET', 'EXPENSE'], true);
            $totalDebit = $account->journalLines->sum(fn ($l) => (float) $l->debit);
            $totalCredit = $account->journalLines->sum(fn ($l) => (float) $l->credit);
            $balance = (float) $account->opening_balance
                + ($isDebitNormal ? $totalDebit - $totalCredit : $totalCredit - $totalDebit);

            return [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'debit' => $isDebitNormal ? max($balance, 0) : max(-$balance, 0),
                'credit' => $isDebitNormal ? max(-$balance, 0) : max($balance, 0),
                'balance' => $balance,
            ];
        })->values();

        return [
            'rows' => $rows->all(),
            'totalDebit' => $rows->sum('debit'),
            'totalCredit' => $rows->sum('credit'),
        ];
    }
}
