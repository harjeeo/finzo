<?php

namespace App\Http\Requests\Quotation;

use Illuminate\Foundation\Http\FormRequest;

class CreateQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customerId' => ['required', 'string'],
            'branchId' => ['sometimes', 'nullable', 'string'],
            'validUntil' => ['sometimes', 'nullable', 'date'],
            'discountTotal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unitPrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }
}
