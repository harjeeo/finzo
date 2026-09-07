<?php

namespace App\Services;

use App\Models\JournalEntry;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Only postEntry is ported so far (used by Purchases to auto-post journal
 * entries). findAll/findOne/createManual/removeManual/getLedger/
 * getTrialBalance land with the Accounting module.
 */
class JournalService
{
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
}
