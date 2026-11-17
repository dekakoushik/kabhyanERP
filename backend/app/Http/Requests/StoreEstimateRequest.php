<?php

namespace App\Http\Requests;

use App\Models\Estimate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEstimateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $estimateNumber = $this->estimate_number;
        if (!empty($estimateNumber) && Estimate::withTrashed()->where('estimate_number', $estimateNumber)->exists()) {
            // Auto-advance so stale client-side previews don't hard-fail
            $estimateNumber = null;
        }

        $this->merge([
            'estimate_number' => $estimateNumber,
            'project_id' => !empty($this->project_id) ? (int) $this->project_id : null,
            'client_email' => !empty($this->client_email) ? trim($this->client_email) : null,
            'client_phone' => !empty($this->client_phone) ? trim($this->client_phone) : null,
            'client_company' => !empty($this->client_company) ? trim($this->client_company) : null,
            'client_address' => !empty($this->client_address) ? trim($this->client_address) : null,
            'tax_rate' => $this->has('tax_rate') && $this->tax_rate !== '' ? (float) $this->tax_rate : 18.00,
            'tax_calculation_type' => !empty($this->tax_calculation_type) ? $this->tax_calculation_type : 'exclusive',
            'discount_type' => !empty($this->discount_type) ? $this->discount_type : 'percentage',
            'discount_rate' => $this->has('discount_rate') && $this->discount_rate !== '' ? (float) $this->discount_rate : 0.00,
            'discount_amount' => $this->has('discount_amount') && $this->discount_amount !== '' ? (float) $this->discount_amount : 0.00,
            'round_off' => $this->has('round_off') && $this->round_off !== '' ? (float) $this->round_off : 0.00,
            'status' => !empty($this->status) ? $this->status : 'draft',
            'currency' => !empty($this->currency) ? $this->currency : 'INR',
        ]);
    }

    public function rules(): array
    {
        return [
            'estimate_number' => ['nullable', 'string', 'max:50'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_company' => ['nullable', 'string', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_address' => ['nullable', 'string'],
            'estimate_date' => ['required', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:estimate_date'],
            'status' => ['required', Rule::in(['draft', 'sent', 'accepted', 'declined', 'invoiced'])],
            'currency' => ['required', 'string', 'max:10'],
            'tax_calculation_type' => ['nullable', 'string', Rule::in(['exclusive', 'inclusive'])],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_type' => ['nullable', 'string', Rule::in(['percentage', 'fixed'])],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'round_off' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
