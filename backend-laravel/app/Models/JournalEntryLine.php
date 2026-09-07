<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class JournalEntryLine extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'journal_entry_id', 'account_id', 'debit', 'credit', 'description',
        'is_reconciled', 'reconciled_at',
    ];

    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'is_reconciled' => 'boolean',
            'reconciled_at' => 'datetime',
        ];
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
