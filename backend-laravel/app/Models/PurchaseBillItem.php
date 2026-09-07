<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PurchaseBillItem extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'purchase_bill_id', 'product_id', 'product_name', 'quantity', 'unit_price',
        'unit', 'unit_conversion_factor', 'gst_rate', 'tax_amount', 'line_total',
        'batch_number', 'manufacture_date', 'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'unit_conversion_factor' => 'decimal:4',
            'gst_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'line_total' => 'decimal:2',
            'manufacture_date' => 'date',
            'expiry_date' => 'date',
        ];
    }

    public function purchaseBill()
    {
        return $this->belongsTo(PurchaseBill::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
