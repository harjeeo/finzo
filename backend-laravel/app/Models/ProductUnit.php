<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductUnit extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = ['product_id', 'name', 'conversion_factor'];

    protected function casts(): array
    {
        return [
            'conversion_factor' => 'decimal:4',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ProductUnit $unit) {
            if (! $unit->created_at) {
                $unit->created_at = now();
            }
        });
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
