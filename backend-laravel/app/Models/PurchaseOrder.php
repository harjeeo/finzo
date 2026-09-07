<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasUuids, CamelCasesAttributes;

    protected $fillable = [
        'business_id', 'branch_id', 'supplier_id', 'po_number', 'po_date',
        'expected_date', 'status', 'subtotal', 'tax_total', 'discount_total', 'grand_total',
        'notes', 'converted_bill_id',
    ];

    protected function casts(): array
    {
        return [
            'po_date' => 'datetime',
            'expected_date' => 'datetime',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
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

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function convertedBill()
    {
        return $this->belongsTo(PurchaseBill::class, 'converted_bill_id');
    }
}
