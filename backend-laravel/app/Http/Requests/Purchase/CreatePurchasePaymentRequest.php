<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

class CreatePurchasePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'paymentMode' => ['sometimes', 'nullable', 'string'],
            'reference' => ['sometimes', 'nullable', 'string'],
            'paymentDate' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
