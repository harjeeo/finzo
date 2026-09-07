<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'string'],
            'name' => ['sometimes', 'string'],
            'type' => ['sometimes', 'in:ASSET,LIABILITY,EQUITY,INCOME,EXPENSE'],
            'isBankAccount' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
