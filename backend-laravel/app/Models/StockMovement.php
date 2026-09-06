<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'product_id', 'godown_id', 'batch_id', 'quantity',
        'source_type', 'source_id', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (StockMovement $movement) {
            if (! $movement->created_at) {
                $movement->created_at = now();
            }
        });
    }
}
