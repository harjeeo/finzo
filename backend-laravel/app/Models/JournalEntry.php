<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'entry_number', 'entry_date', 'narration', 'source_type', 'source_id',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (JournalEntry $entry) {
            if (! $entry->created_at) {
                $entry->created_at = now();
            }
        });
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}
