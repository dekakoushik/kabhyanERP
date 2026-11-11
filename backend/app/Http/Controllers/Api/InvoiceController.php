<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoicePayment;
use App\Models\ProformaInvoice;
use App\Models\Estimate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    /**
     * List all tax invoices with filtering and revenue stats.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with([
            'project:id,name,code',
            'proformaInvoice:id,proforma_number',
            'estimate:id,estimate_number',
            'creator:id,name,email',
            'items',
            'payments.recorder:id,name',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('client_company', 'like', "%{$search}%")
                  ->orWhere('client_email', 'like', "%{$search}%")
                  ->orWhere('client_gstin', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }

        $perPage = (int) $request->input('per_page', 15);
        $invoices = $query->latest('invoice_date')->paginate($perPage);

        $stats = [
            'total_invoices' => Invoice::count(),
            'total_invoiced_value' => (float) Invoice::sum('total_amount'),
            'total_collected_value' => (float) Invoice::sum('paid_amount'),
            'total_outstanding_value' => (float) Invoice::sum('due_amount'),
            'paid_count' => Invoice::where('status', 'paid')->count(),
            'unpaid_count' => Invoice::where('status', 'unpaid')->count(),
            'partially_paid_count' => Invoice::where('status', 'partially_paid')->count(),
            'overdue_count' => Invoice::where('status', 'overdue')->count(),
        ];

        return response()->json([
            'invoices' => $invoices,
            'stats' => $stats,
        ]);
    }

    /**
     * Convert a Proforma Invoice directly into a Final Tax Invoice.
     */
    public function convertFromProforma(Request $request, ProformaInvoice $proformaInvoice): JsonResponse
    {
        // Generate next tax invoice number
        $count = Invoice::count() + 1;
        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        while (Invoice::where('invoice_number', $invoiceNumber)->exists()) {
            $count++;
            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        }

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'proforma_invoice_id' => $proformaInvoice->id,
            'estimate_id' => $proformaInvoice->estimate_id,
            'project_id' => $proformaInvoice->project_id,
            'created_by' => $request->user()?->id ?? $proformaInvoice->created_by,
            'client_name' => $proformaInvoice->client_name,
            'client_company' => $proformaInvoice->client_company,
            'client_email' => $proformaInvoice->client_email,
            'client_phone' => $proformaInvoice->client_phone,
            'client_address' => $proformaInvoice->client_address,
            'client_gstin' => $request->input('client_gstin', '19AAECK4829K1ZX'),
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(15)->toDateString(),
            'status' => 'unpaid',
            'currency' => $proformaInvoice->currency ?? 'INR',
            'subtotal' => $proformaInvoice->subtotal,
            'tax_rate' => $proformaInvoice->tax_rate,
            'tax_amount' => $proformaInvoice->tax_amount,
            'round_off' => $proformaInvoice->round_off ?? 0.00,
            'discount_rate' => $proformaInvoice->discount_rate,
            'discount_amount' => $proformaInvoice->discount_amount,
            'total_amount' => $proformaInvoice->total_amount,
            'paid_amount' => 0.00,
            'due_amount' => $proformaInvoice->total_amount,
            'notes' => 'Tax Invoice issued against accepted proforma and advance authorization.',
            'terms_and_conditions' => "1. All payments must be made in favor of Kabhyan Technologies Private Limited.\n2. In accordance with Section 31 of CGST Act, this is an official Tax Invoice for IT & Software Consultancy Services (SAC 998314).\n3. Any discrepancies must be notified within 7 days of invoice issuance.",
            'bank_details' => $proformaInvoice->bank_details,
        ]);

        // Copy proforma items
        foreach ($proformaInvoice->items as $item) {
            $invoice->items()->create([
                'item_name' => $item->item_name,
                'hsn_sac' => '998314',
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_price' => $item->unit_price,
                'amount' => $item->amount,
            ]);
        }

        // If proforma had paid amount, record as initial payment in invoice
        if ((float) $proformaInvoice->paid_amount > 0) {
            $invoice->payments()->create([
                'recorded_by' => $request->user()->id,
                'payment_reference' => 'Advance Paid via Proforma ' . $proformaInvoice->proforma_number,
                'amount' => $proformaInvoice->paid_amount,
                'payment_date' => now()->toDateString(),
                'payment_method' => 'bank_transfer',
                'notes' => 'Settled via proforma invoice advance',
            ]);
        }

        $invoice->recalculateTotals();

        return response()->json([
            'message' => 'Tax Invoice successfully created from Proforma Invoice.',
            'invoice' => $invoice->fresh()->load(['items', 'payments', 'project:id,name,code', 'proformaInvoice:id,proforma_number']),
        ], 201);
    }

    /**
     * Store new standalone Tax Invoice.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_number' => ['required', 'string', 'max:50', 'unique:invoices,invoice_number'],
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
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'round_off' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'bank_details' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.hsn_sac' => ['nullable', 'string', 'max:20'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $invoice = Invoice::create([
            'invoice_number' => $validated['invoice_number'],
            'proforma_invoice_id' => $validated['proforma_invoice_id'] ?? null,
            'estimate_id' => $validated['estimate_id'] ?? null,
            'project_id' => $validated['project_id'] ?? null,
            'created_by' => $validated['created_by'],
            'client_name' => $validated['client_name'],
            'client_company' => $validated['client_company'] ?? null,
            'client_email' => $validated['client_email'] ?? null,
            'client_phone' => $validated['client_phone'] ?? null,
            'client_address' => $validated['client_address'] ?? null,
            'client_gstin' => $validated['client_gstin'] ?? null,
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'] ?? null,
            'status' => $validated['status'],
            'currency' => $validated['currency'] ?? 'INR',
            'tax_rate' => $validated['tax_rate'] ?? 18,
            'discount_rate' => $validated['discount_rate'] ?? 0,
            'round_off' => $validated['round_off'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
            'bank_details' => $validated['bank_details'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $amount = $item['quantity'] * $item['unit_price'];
            $invoice->items()->create([
                'item_name' => $item['item_name'],
                'hsn_sac' => $item['hsn_sac'] ?? '998314',
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'hours',
                'unit_price' => $item['unit_price'],
                'amount' => $amount,
            ]);
        }

        $invoice->recalculateTotals();

        return response()->json([
            'message' => 'Tax Invoice created successfully',
            'invoice' => $invoice->fresh()->load(['items', 'payments', 'project:id,name,code', 'creator:id,name,email']),
        ], 201);
    }

    /**
     * Show single invoice.
     */
    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json([
            'invoice' => $invoice->load([
                'items',
                'payments.recorder:id,name',
                'project:id,name,code',
                'proformaInvoice:id,proforma_number',
                'estimate:id,estimate_number',
                'creator:id,name,email',
            ]),
        ]);
    }

    /**
     * Update invoice details.
     */
    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'invoice_number' => ['required', 'string', 'max:50', Rule::unique('invoices', 'invoice_number')->ignore($invoice->id)],
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
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'round_off' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'bank_details' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.hsn_sac' => ['nullable', 'string', 'max:20'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $invoice->update([
            'invoice_number' => $validated['invoice_number'],
            'project_id' => $validated['project_id'] ?? null,
            'client_name' => $validated['client_name'],
            'client_company' => $validated['client_company'] ?? null,
            'client_email' => $validated['client_email'] ?? null,
            'client_phone' => $validated['client_phone'] ?? null,
            'client_address' => $validated['client_address'] ?? null,
            'client_gstin' => $validated['client_gstin'] ?? null,
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'] ?? null,
            'currency' => $validated['currency'],
            'tax_rate' => $validated['tax_rate'] ?? 18,
            'discount_rate' => $validated['discount_rate'] ?? 0,
            'round_off' => $validated['round_off'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
            'bank_details' => $validated['bank_details'] ?? null,
        ]);

        $invoice->items()->delete();
        foreach ($validated['items'] as $item) {
            $amount = $item['quantity'] * $item['unit_price'];
            $invoice->items()->create([
                'item_name' => $item['item_name'],
                'hsn_sac' => $item['hsn_sac'] ?? '998314',
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'hours',
                'unit_price' => $item['unit_price'],
                'amount' => $amount,
            ]);
        }

        $invoice->recalculateTotals();

        return response()->json([
            'message' => 'Invoice updated successfully',
            'invoice' => $invoice->fresh()->load(['items', 'payments', 'project:id,name,code', 'creator:id,name,email']),
        ]);
    }

    /**
     * Record payment transaction against invoice.
     */
    public function recordPayment(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', Rule::in(['bank_transfer', 'upi', 'cheque', 'card', 'cash', 'other'])],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $invoice->payments()->create([
            'recorded_by' => $request->user()->id,
            'amount' => $validated['amount'],
            'payment_date' => $validated['payment_date'],
            'payment_method' => $validated['payment_method'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $invoice->recalculateTotals();

        return response()->json([
            'message' => 'Payment recorded successfully',
            'invoice' => $invoice->fresh()->load(['payments.recorder:id,name']),
        ]);
    }

    /**
     * Fast status update.
     */
    public function updateStatus(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'])],
        ]);

        $invoice->update(['status' => $validated['status']]);
        $invoice->recalculateTotals();

        return response()->json([
            'message' => 'Invoice status updated to ' . $validated['status'],
            'invoice' => $invoice->fresh(),
        ]);
    }

    /**
     * Delete invoice.
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully',
        ]);
    }
}
