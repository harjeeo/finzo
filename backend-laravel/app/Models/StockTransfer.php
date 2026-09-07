<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StockTransfer extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'product_id', 'batch_id', 'from_godown_id', 'to_godown_id',
        'quantity', 'notes', 'transfer_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'transfer_date' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (StockTransfer $transfer) {
            if (! $transfer->created_at) {
                $transfer->created_at = now();
            }
            if (! $transfer->transfer_date) {
                $transfer->transfer_date = now();
            }
        });
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function fromGodown()
    {
        return $this->belongsTo(Godown::class, 'from_godown_id');
    }

    public function toGodown()
    {
        return $this->belongsTo(Godown::class, 'to_godown_id');
    }
}
