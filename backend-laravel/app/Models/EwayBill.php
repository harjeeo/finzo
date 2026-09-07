<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EwayBill extends Model
{
    use HasUuids, CamelCasesAttributes;

    protected $fillable = [
        'business_id', 'sales_invoice_id', 'ewb_number', 'transporter_name', 'transporter_id',
        'vehicle_number', 'transport_mode', 'distance_km', 'valid_until', 'status',
    ];

    protected function casts(): array
    {
        return [
            'valid_until' => 'datetime',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function salesInvoice()
    {
        return $this->belongsTo(SalesInvoice::class);
    }
}
