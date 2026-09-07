<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PurchasePayment extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'purchase_bill_id', 'amount', 'payment_mode', 'reference', 'payment_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PurchasePayment $payment) {
            if (! $payment->created_at) {
                $payment->created_at = now();
            }
            if (! $payment->payment_date) {
                $payment->payment_date = now();
            }
        });
    }

    public function purchaseBill()
    {
        return $this->belongsTo(PurchaseBill::class);
    }
}
