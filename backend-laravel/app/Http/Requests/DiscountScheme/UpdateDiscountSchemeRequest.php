<?php

namespace App\Http\Requests\DiscountScheme;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDiscountSchemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string'],
            'discountType' => ['sometimes', 'string', 'in:PERCENTAGE,FLAT'],
            'value' => ['sometimes', 'numeric'],
            'productId' => ['sometimes', 'nullable', 'string'],
            'minQuantity' => ['sometimes', 'nullable', 'numeric'],
            'startDate' => ['sometimes', 'nullable', 'date'],
            'endDate' => ['sometimes', 'nullable', 'date'],
            'isActive' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
