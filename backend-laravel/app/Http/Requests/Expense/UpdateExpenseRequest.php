<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['sometimes', 'string'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'branchId' => ['sometimes', 'nullable', 'string'],
            'paymentMode' => ['sometimes', 'nullable', 'string'],
            'reference' => ['sometimes', 'nullable', 'string'],
            'expenseDate' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
