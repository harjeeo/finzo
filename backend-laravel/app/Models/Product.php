<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasUuids, CamelCasesAttributes;

    protected $fillable = [
        'business_id', 'name', 'sku', 'barcode', 'category', 'unit', 'hsn_code',
        'purchase_price', 'selling_price', 'gst_rate', 'opening_stock',
        'current_stock', 'min_stock_level', 'tracks_batches',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'gst_rate' => 'decimal:2',
            'opening_stock' => 'decimal:2',
            'current_stock' => 'decimal:2',
            'min_stock_level' => 'decimal:2',
            'tracks_batches' => 'boolean',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function units()
    {
        return $this->hasMany(ProductUnit::class);
    }
}
