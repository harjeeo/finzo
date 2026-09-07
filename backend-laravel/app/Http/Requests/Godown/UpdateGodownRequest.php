<?php

namespace App\Http\Requests\Godown;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGodownRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string'],
            'address' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
