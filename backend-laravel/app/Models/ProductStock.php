<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductStock extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = ['business_id', 'product_id', 'godown_id', 'batch_id', 'quantity'];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'updated_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (ProductStock $stock) {
            $stock->updated_at = now();
        });
    }
}
