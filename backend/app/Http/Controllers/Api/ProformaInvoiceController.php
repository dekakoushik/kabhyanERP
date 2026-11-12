<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estimate;
use App\Models\ProformaInvoice;
use App\Models\ProformaInvoiceItem;
use App\Services\DocumentNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProformaInvoiceController extends Controller
{
    /**
     * List all proforma invoices with search, filters, and stats.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProformaInvoice::with([
            'project:id,name,code',
            'estimate:id,estimate_number',
            'creator:id,name,email',
            'items',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('proforma_number', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('client_company', 'like', "%{$search}%")
                  ->orWhere('client_email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($estimateId = $request->input('estimate_id')) {
            $query->where('estimate_id', $estimateId);
        }

        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }

        $perPage = (int) $request->input('per_page', 15);
        $invoices = $query->latest('invoice_date')->paginate($perPage);

        $stats = [
            'total_invoices' => ProformaInvoice::count(),
            'total_value' => (float) ProformaInvoice::sum('total_amount'),
            'paid_value' => (float) ProformaInvoice::where('status', 'paid')->sum('total_amount'),
            'unpaid_value' => (float) ProformaInvoice::whereIn('status', ['unpaid', 'partially_paid'])->sum('total_amount'),
            'unpaid' => ProformaInvoice::where('status', 'unpaid')->count(),
            'partially_paid' => ProformaInvoice::where('status', 'partially_paid')->count(),
            'paid' => ProformaInvoice::where('status', 'paid')->count(),
            'cancelled' => ProformaInvoice::where('status', 'cancelled')->count(),
        ];

        return response()->json([
            'proforma_invoices' => $invoices,
            'stats' => $stats,
        ]);
    }

    /**
     * Convert an Accepted Estimate directly into a Proforma Invoice.
     */
    public function convertFromEstimate(Request $request, Estimate $estimate): JsonResponse
    {
        if ($estimate->status !== 'accepted') {
            return response()->json([
                'message' => 'Proforma Invoices can only be generated from Accepted estimates.',
            ], 422);
        }

        // Generate next proforma number using central DocumentNumberService
        $proformaNumber = DocumentNumberService::getNextProformaNumber(true);

        $defaultBankDetails = "Bank Name: HDFC Bank Limited\nAccount Name: Kabhyan Technologies Private Limited\nAccount Number: 50200084729184\nIFSC Code: HDFC0001234\nBranch: Salt Lake Sector V, Kolkata, West Bengal\nUPI ID: kabhyan@hdfcbank";

        $proforma = ProformaInvoice::create([
            'proforma_number' => $proformaNumber,
            'estimate_id' => $estimate->id,
            'project_id' => $estimate->project_id,
            'created_by' => $request->user()->id,
            'client_name' => $estimate->client_name,
            'client_company' => $estimate->client_company,
            'client_email' => $estimate->client_email,
            'client_phone' => $estimate->client_phone,
            'client_address' => $estimate->client_address,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(15)->toDateString(),
            'status' => 'unpaid',
            'currency' => $estimate->currency ?? 'INR',
            'subtotal' => $estimate->subtotal,
            'tax_rate' => $estimate->tax_rate,
            'tax_amount' => $estimate->tax_amount,
            'round_off' => $estimate->round_off ?? 0.00,
            'discount_rate' => $estimate->discount_rate,
            'discount_amount' => $estimate->discount_amount,
            'total_amount' => $estimate->total_amount,
            'paid_amount' => 0.00,
            'notes' => $estimate->notes ?? 'Proforma invoice generated upon estimate approval for advance mobilization.',
            'terms_and_conditions' => $estimate->terms_and_conditions ?? "1. This proforma invoice is issued for payment facilitation.\n2. Please mention the Proforma Number in transaction reference.\n3. Goods/Services will be initiated post receipt of agreed mobilization advance.",
            'bank_details' => $defaultBankDetails,
        ]);

        // Copy estimate line items
        foreach ($estimate->items as $item) {
            $proforma->items()->create([
                'item_name' => $item->item_name,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_price' => $item->unit_price,
                'amount' => $item->amount,
            ]);
        }

        // Update estimate status to invoiced
        $estimate->update(['status' => 'invoiced']);

        return response()->json([
            'message' => 'Proforma Invoice generated successfully from estimate.',
            'proforma_invoice' => $proforma->fresh()->load(['items', 'project:id,name,code', 'estimate:id,estimate_number']),
        ], 201);
    }

    /**
     * Store new custom proforma invoice.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'proforma_number' => ['nullable', 'string', 'max:50', 'unique:proforma_invoices,proforma_number'],
            'estimate_id' => ['nullable', 'exists:estimates,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_company' => ['nullable', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_address' => ['nullable', 'string'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['unpaid', 'partially_paid', 'paid', 'cancelled'])],
            'currency' => ['required', 'string', 'max:10'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'round_off' => ['nullable', 'numeric'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'bank_details' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $proformaNumber = $validated['proforma_number'] ?? null;
        if (empty($proformaNumber)) {
            $proformaNumber = DocumentNumberService::getNextProformaNumber(true);
        } else {
            DocumentNumberService::getNextProformaNumber(true);
        }

        $proforma = ProformaInvoice::create([
            'proforma_number' => $proformaNumber,
            'estimate_id' => $validated['estimate_id'] ?? null,
            'project_id' => $validated['project_id'] ?? null,
            'created_by' => $validated['created_by'],
            'client_name' => $validated['client_name'],
            'client_company' => $validated['client_company'] ?? null,
            'client_email' => $validated['client_email'] ?? null,
            'client_phone' => $validated['client_phone'] ?? null,
            'client_address' => $validated['client_address'] ?? null,
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'] ?? null,
            'status' => $validated['status'],
            'currency' => $validated['currency'] ?? 'INR',
            'tax_rate' => $validated['tax_rate'] ?? 0,
            'discount_rate' => $validated['discount_rate'] ?? 0,
            'round_off' => $validated['round_off'] ?? 0,
            'paid_amount' => $validated['paid_amount'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
            'bank_details' => $validated['bank_details'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $amount = $item['quantity'] * $item['unit_price'];
            $proforma->items()->create([
                'item_name' => $item['item_name'],
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'hours',
                'unit_price' => $item['unit_price'],
                'amount' => $amount,
            ]);
        }

        $proforma->recalculateTotals();

        return response()->json([
            'message' => 'Proforma Invoice generated successfully',
            'proforma_invoice' => $proforma->fresh()->load(['items', 'project:id,name,code', 'creator:id,name,email']),
        ], 201);
    }

    /**
     * Show single proforma invoice.
     */
    public function show(ProformaInvoice $proformaInvoice): JsonResponse
    {
        return response()->json([
            'proforma_invoice' => $proformaInvoice->load([
                'items',
                'project:id,name,code',
                'estimate:id,estimate_number',
                'creator:id,name,email',
            ]),
        ]);
    }

    /**
     * Update proforma invoice.
     */
    public function update(Request $request, ProformaInvoice $proformaInvoice): JsonResponse
    {
        $validated = $request->validate([
            'proforma_number' => ['required', 'string', 'max:50', Rule::unique('proforma_invoices', 'proforma_number')->ignore($proformaInvoice->id)],
            'project_id' => ['nullable', 'exists:projects,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_company' => ['nullable', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_address' => ['nullable', 'string'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['unpaid', 'partially_paid', 'paid', 'cancelled'])],
            'currency' => ['required', 'string', 'max:10'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'round_off' => ['nullable', 'numeric'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'bank_details' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $proformaInvoice->update([
            'proforma_number' => $validated['proforma_number'],
            'project_id' => $validated['project_id'] ?? null,
            'client_name' => $validated['client_name'],
            'client_company' => $validated['client_company'] ?? null,
            'client_email' => $validated['client_email'] ?? null,
            'client_phone' => $validated['client_phone'] ?? null,
            'client_address' => $validated['client_address'] ?? null,
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'] ?? null,
            'status' => $validated['status'],
            'currency' => $validated['currency'],
            'tax_rate' => $validated['tax_rate'] ?? 0,
            'discount_rate' => $validated['discount_rate'] ?? 0,
            'round_off' => $validated['round_off'] ?? 0,
            'paid_amount' => $validated['paid_amount'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
            'bank_details' => $validated['bank_details'] ?? null,
        ]);

        $proformaInvoice->items()->delete();
        foreach ($validated['items'] as $item) {
            $amount = $item['quantity'] * $item['unit_price'];
            $proformaInvoice->items()->create([
                'item_name' => $item['item_name'],
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'hours',
                'unit_price' => $item['unit_price'],
                'amount' => $amount,
            ]);
        }

        $proformaInvoice->recalculateTotals();

        return response()->json([
            'message' => 'Proforma Invoice updated successfully',
            'proforma_invoice' => $proformaInvoice->fresh()->load(['items', 'project:id,name,code', 'creator:id,name,email']),
        ]);
    }

    /**
     * Fast status update (e.g. Paid, Unpaid, Partially Paid).
     */
    public function updateStatus(Request $request, ProformaInvoice $proformaInvoice): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['unpaid', 'partially_paid', 'paid', 'cancelled'])],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $data = ['status' => $validated['status']];
        if (isset($validated['paid_amount'])) {
            $data['paid_amount'] = $validated['paid_amount'];
        } elseif ($validated['status'] === 'paid') {
            $data['paid_amount'] = $proformaInvoice->total_amount;
        }

        $proformaInvoice->update($data);

        return response()->json([
            'message' => 'Status updated successfully',
            'proforma_invoice' => $proformaInvoice->fresh(),
        ]);
    }

    /**
     * Delete proforma invoice.
     */
    public function destroy(ProformaInvoice $proformaInvoice): JsonResponse
    {
        $proformaInvoice->delete();

        return response()->json([
            'message' => 'Proforma Invoice deleted successfully',
        ]);
    }
}

