<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class CreateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string'],
            'name' => ['required', 'string'],
            'type' => ['required', 'in:ASSET,LIABILITY,EQUITY,INCOME,EXPENSE'],
            'isBankAccount' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
