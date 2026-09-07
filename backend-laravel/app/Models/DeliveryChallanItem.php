<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DeliveryChallanItem extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = [
        'delivery_challan_id', 'product_id', 'product_name', 'quantity', 'unit_price', 'line_total',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    public function deliveryChallan()
    {
        return $this->belongsTo(DeliveryChallan::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
