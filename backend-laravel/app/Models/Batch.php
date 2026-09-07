<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = ['business_id', 'product_id', 'batch_number', 'manufacture_date', 'expiry_date'];

    protected function casts(): array
    {
        return [
            'manufacture_date' => 'date',
            'expiry_date' => 'date',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Batch $batch) {
            if (! $batch->created_at) {
                $batch->created_at = now();
            }
        });
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function stocks()
    {
        return $this->hasMany(ProductStock::class);
    }
}
