<?php

namespace App\Http\Requests\StockTransfer;

use Illuminate\Foundation\Http\FormRequest;

class CreateStockTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'productId' => ['required', 'string'],
            'batchId' => ['sometimes', 'nullable', 'string'],
            'fromGodownId' => ['required', 'string'],
            'toGodownId' => ['required', 'string'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
