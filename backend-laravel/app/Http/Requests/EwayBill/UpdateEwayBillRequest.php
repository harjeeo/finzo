<?php

namespace App\Http\Requests\EwayBill;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEwayBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transporterName' => ['sometimes', 'nullable', 'string'],
            'transporterId' => ['sometimes', 'nullable', 'string'],
            'vehicleNumber' => ['sometimes', 'nullable', 'string'],
            'transportMode' => ['sometimes', 'nullable', 'in:ROAD,RAIL,AIR,SHIP'],
            'distanceKm' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'ewbNumber' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
