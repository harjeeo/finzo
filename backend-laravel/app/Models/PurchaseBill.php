<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PurchaseBill extends Model
{
    use HasUuids, CamelCasesAttributes;

    protected $fillable = [
        'business_id', 'branch_id', 'godown_id', 'supplier_id', 'bill_number', 'bill_date',
        'status', 'subtotal', 'tax_total', 'discount_total', 'grand_total', 'amount_paid',
    ];

    protected function casts(): array
    {
        return [
            'bill_date' => 'datetime',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function godown()
    {
        return $this->belongsTo(Godown::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseBillItem::class);
    }

    public function payments()
    {
        return $this->hasMany(PurchasePayment::class);
    }

    public function returns()
    {
        return $this->hasMany(PurchaseReturn::class);
    }
}
