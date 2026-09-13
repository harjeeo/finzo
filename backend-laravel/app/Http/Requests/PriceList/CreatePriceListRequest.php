<?php

namespace App\Http\Requests\PriceList;

use Illuminate\Foundation\Http\FormRequest;

class CreatePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string'],
            'isDefault' => ['sometimes', 'nullable', 'boolean'],
            'items' => ['sometimes', 'nullable', 'array'],
            'items.*.productId' => ['required_with:items', 'string'],
            'items.*.price' => ['required_with:items', 'numeric'],
        ];
    }
}
