<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class CreatePurchaseBillRequest extends FormRequest
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
            'godownId' => ['sometimes', 'nullable', 'string'],
            'discountTotal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unitPrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'items.*.unit' => ['sometimes', 'nullable', 'string'],
            'items.*.batchNumber' => ['sometimes', 'nullable', 'string'],
            'items.*.manufactureDate' => ['sometimes', 'nullable', 'date'],
            'items.*.expiryDate' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
