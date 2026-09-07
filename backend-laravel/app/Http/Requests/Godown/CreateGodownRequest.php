<?php

namespace App\Http\Requests\Godown;

use Illuminate\Foundation\Http\FormRequest;

class CreateGodownRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branchId' => ['required', 'string'],
            'name' => ['required', 'string'],
            'address' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
