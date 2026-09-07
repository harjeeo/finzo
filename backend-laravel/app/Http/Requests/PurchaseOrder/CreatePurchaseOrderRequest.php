<?php

namespace App\Http\Requests\PurchaseOrder;

use Illuminate\Foundation\Http\FormRequest;

class CreatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplierId' => ['required', 'string'],
            'branchId' => ['sometimes', 'nullable', 'string'],
            'expectedDate' => ['sometimes', 'nullable', 'date'],
            'discountTotal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unitPrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }
}
