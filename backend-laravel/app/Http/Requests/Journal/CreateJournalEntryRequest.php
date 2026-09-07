<?php

namespace App\Http\Requests\Journal;

use Illuminate\Foundation\Http\FormRequest;

class CreateJournalEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entryDate' => ['sometimes', 'nullable', 'date'],
            'narration' => ['sometimes', 'nullable', 'string'],
            'lines' => ['required', 'array', 'min:2'],
            'lines.*.accountId' => ['required', 'string'],
            'lines.*.debit' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'lines.*.credit' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'lines.*.description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
