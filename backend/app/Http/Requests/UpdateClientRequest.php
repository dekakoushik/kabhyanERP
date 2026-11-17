<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $client = $this->route('client');
        $clientId = is_object($client) ? $client->id : $client;

        return [
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                Rule::unique('clients', 'email')->ignore($clientId)->whereNull('deleted_at'),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'gstin' => ['nullable', 'string', 'max:25'],
            'pan' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'currency' => ['nullable', 'string', 'max:10'],
            'payment_terms' => ['nullable', 'string', 'max:50'],
            'portal_access_status' => ['nullable', Rule::in(['active', 'inactive'])],
            'notes' => ['nullable', 'string'],
            'reset_portal_password' => ['nullable', 'string', 'min:6'],
        ];
    }
}
