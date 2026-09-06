<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string'],
            'sku' => ['sometimes', 'nullable', 'string'],
            'barcode' => ['sometimes', 'nullable', 'string'],
            'category' => ['sometimes', 'nullable', 'string'],
            'unit' => ['sometimes', 'nullable', 'string'],
            'hsnCode' => ['sometimes', 'nullable', 'string'],
            'purchasePrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sellingPrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'gstRate' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'openingStock' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'minStockLevel' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'tracksBatches' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
