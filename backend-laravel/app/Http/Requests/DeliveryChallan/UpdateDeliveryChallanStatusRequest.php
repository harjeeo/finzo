<?php

namespace App\Http\Requests\DeliveryChallan;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryChallanStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:DRAFT,DISPATCHED,DELIVERED,CANCELLED'],
        ];
    }
}
