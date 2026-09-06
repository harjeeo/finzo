<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'gstin', 'pan', 'address', 'city', 'state', 'pincode',
        'logo_url', 'financial_year_start', 'invoice_prefix', 'currency', 'status',
    ];

    protected function casts(): array
    {
        return [
            'financial_year_start' => 'date',
        ];
    }

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function godowns()
    {
        return $this->hasMany(Godown::class);
    }

    public function accounts()
    {
        return $this->hasMany(Account::class);
    }
}
