<?php

namespace App\Http\Requests\Quotation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuotationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:DRAFT,SENT,ACCEPTED,REJECTED,EXPIRED'],
        ];
    }
}
