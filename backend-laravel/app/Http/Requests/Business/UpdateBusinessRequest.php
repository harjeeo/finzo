<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string'],
            'gstin' => ['sometimes', 'nullable', 'string'],
            'pan' => ['sometimes', 'nullable', 'string'],
            'address' => ['sometimes', 'nullable', 'string'],
            'city' => ['sometimes', 'nullable', 'string'],
            'state' => ['sometimes', 'nullable', 'string'],
            'pincode' => ['sometimes', 'nullable', 'string'],
            'invoicePrefix' => ['sometimes', 'nullable', 'string'],
            'currency' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
