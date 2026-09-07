<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PurchaseReturn extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'purchase_bill_id', 'supplier_id', 'return_number', 'return_date',
        'subtotal', 'tax_total', 'grand_total',
    ];

    protected function casts(): array
    {
        return [
            'return_date' => 'datetime',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PurchaseReturn $return) {
            if (! $return->created_at) {
                $return->created_at = now();
            }
        });
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function purchaseBill()
    {
        return $this->belongsTo(PurchaseBill::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }
}
