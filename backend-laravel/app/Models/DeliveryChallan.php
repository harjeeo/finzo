<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DeliveryChallan extends Model
{
    use HasUuids, CamelCasesAttributes;

    protected $fillable = [
        'business_id', 'branch_id', 'customer_id', 'sales_invoice_id', 'challan_number',
        'challan_date', 'vehicle_number', 'transporter_name', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'challan_date' => 'datetime',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesInvoice()
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    public function items()
    {
        return $this->hasMany(DeliveryChallanItem::class);
    }
}
