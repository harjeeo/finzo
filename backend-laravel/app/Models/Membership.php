<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Membership extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = ['user_id', 'business_id', 'role'];

    protected $attributes = [];

    public function getDates()
    {
        return [];
    }

    protected static function booted(): void
    {
        static::creating(function (Membership $membership) {
            if (! $membership->created_at) {
                $membership->created_at = now();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
