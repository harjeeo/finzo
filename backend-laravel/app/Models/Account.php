<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasUuids;

    protected $fillable = [
        'business_id', 'code', 'name', 'type', 'is_system', 'is_bank_account', 'opening_balance',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_bank_account' => 'boolean',
            'opening_balance' => 'decimal:2',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
