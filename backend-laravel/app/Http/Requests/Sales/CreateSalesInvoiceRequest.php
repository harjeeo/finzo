<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class CreateSalesInvoiceRequest extends FormRequest
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
            'godownId' => ['sometimes', 'nullable', 'string'],
            'discountTotal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'amountPaid' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'paymentMode' => ['sometimes', 'nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unitPrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'items.*.unit' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
