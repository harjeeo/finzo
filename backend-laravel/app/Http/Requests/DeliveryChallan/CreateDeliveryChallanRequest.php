<?php

namespace App\Http\Requests\DeliveryChallan;

use Illuminate\Foundation\Http\FormRequest;

class CreateDeliveryChallanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customerId' => ['required', 'string'],
            'branchId' => ['sometimes', 'nullable', 'string'],
            'salesInvoiceId' => ['sometimes', 'nullable', 'string'],
            'vehicleNumber' => ['sometimes', 'nullable', 'string'],
            'transporterName' => ['sometimes', 'nullable', 'string'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unitPrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }
}
