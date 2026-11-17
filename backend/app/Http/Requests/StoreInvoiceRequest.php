<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $invoiceNumber = $this->invoice_number;
        if (!empty($invoiceNumber) && Invoice::where('invoice_number', $invoiceNumber)->exists()) {
            // Auto-advance so stale client-side previews don't hard-fail
            $invoiceNumber = null;
        }

        $this->merge([
            'invoice_number' => $invoiceNumber,
            'project_id' => !empty($this->project_id) ? (int) $this->project_id : null,
            'estimate_id' => !empty($this->estimate_id) ? (int) $this->estimate_id : null,
            'proforma_invoice_id' => !empty($this->proforma_invoice_id) ? (int) $this->proforma_invoice_id : null,
            'client_email' => !empty($this->client_email) ? trim($this->client_email) : null,
            'client_phone' => !empty($this->client_phone) ? trim($this->client_phone) : null,
            'client_company' => !empty($this->client_company) ? trim($this->client_company) : null,
            'client_address' => !empty($this->client_address) ? trim($this->client_address) : null,
            'client_gstin' => !empty($this->client_gstin) ? trim($this->client_gstin) : null,
            'tax_rate' => $this->has('tax_rate') && $this->tax_rate !== '' ? (float) $this->tax_rate : 18.00,
            'tax_calculation_type' => !empty($this->tax_calculation_type) ? $this->tax_calculation_type : 'exclusive',
            'discount_type' => !empty($this->discount_type) ? $this->discount_type : 'percentage',
            'discount_rate' => $this->has('discount_rate') && $this->discount_rate !== '' ? (float) $this->discount_rate : 0.00,
            'discount_amount' => $this->has('discount_amount') && $this->discount_amount !== '' ? (float) $this->discount_amount : 0.00,
            'round_off' => $this->has('round_off') && $this->round_off !== '' ? (float) $this->round_off : 0.00,
            'status' => !empty($this->status) ? $this->status : 'unpaid',
            'currency' => !empty($this->currency) ? $this->currency : 'INR',
        ]);
    }

    public function rules(): array
    {
        return [
            'invoice_number' => ['nullable', 'string', 'max:50', 'unique:invoices,invoice_number'],
            'proforma_invoice_id' => ['nullable', 'exists:proforma_invoices,id'],
            'estimate_id' => ['nullable', 'exists:estimates,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_company' => ['nullable', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_address' => ['nullable', 'string'],
            'client_gstin' => ['nullable', 'string', 'max:30'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'])],
            'currency' => ['required', 'string', 'max:10'],
            'tax_calculation_type' => ['nullable', 'string', Rule::in(['exclusive', 'inclusive'])],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_type' => ['nullable', 'string', Rule::in(['percentage', 'fixed'])],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'round_off' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'bank_details' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'payment_date' => ['nullable', 'date'],
            'payment_notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.hsn_sac' => ['nullable', 'string', 'max:20'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
