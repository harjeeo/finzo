<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasUuids, CamelCasesAttributes;

    protected $fillable = [
        'business_id', 'branch_id', 'customer_id', 'quotation_number', 'quotation_date',
        'valid_until', 'status', 'subtotal', 'tax_total', 'discount_total', 'grand_total',
        'notes', 'converted_invoice_id',
    ];

    protected function casts(): array
    {
        return [
            'quotation_date' => 'datetime',
            'valid_until' => 'datetime',
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

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function convertedInvoice()
    {
        return $this->belongsTo(SalesInvoice::class, 'converted_invoice_id');
    }
}
