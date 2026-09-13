<?php

namespace App\Http\Requests\DiscountScheme;

use Illuminate\Foundation\Http\FormRequest;

class CreateDiscountSchemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string'],
            'discountType' => ['required', 'string', 'in:PERCENTAGE,FLAT'],
            'value' => ['required', 'numeric'],
            'productId' => ['sometimes', 'nullable', 'string'],
            'minQuantity' => ['sometimes', 'nullable', 'numeric'],
            'startDate' => ['sometimes', 'nullable', 'date'],
            'endDate' => ['sometimes', 'nullable', 'date'],
            'isActive' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
