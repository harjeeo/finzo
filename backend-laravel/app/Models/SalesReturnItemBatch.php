<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItemBatch extends Model
{
    use HasUuids, CamelCasesAttributes;

    public $timestamps = false;

    protected $fillable = ['sales_return_item_id', 'batch_id', 'quantity'];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    public function salesReturnItem()
    {
        return $this->belongsTo(SalesReturnItem::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }
}
