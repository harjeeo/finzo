<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PriceList extends Model
{
    use HasUuids, CamelCasesAttributes;

    protected $fillable = ['business_id', 'name', 'is_default'];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function items()
    {
        return $this->hasMany(PriceListItem::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }
}
