<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\RecordPaymentRequest;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoicePayment;
use App\Models\ProformaInvoice;
use App\Models\Estimate;
use App\Models\ReceiptVoucher;
use App\Models\InvoiceAdvanceAdjustment;
use App\Services\DocumentNumberService;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
     * Convert an approved Quotation (Estimate) directly into a 100% Final Tax Invoice.
     * Automatically adjusts linked advance Receipt Vouchers under Section 31(3)(d) & Rule 46 (GSTR-1 Table 11B).
     */
    public function convertFromEstimate(Request $request, Estimate $estimate): JsonResponse
    {
        $invoice = DB::transaction(function () use ($request, $estimate) {
            $invoiceNumber = DocumentNumberService::getNextInvoiceNumber(true);
            $taxRate = (float) ($estimate->tax_rate ?? 18.00);

            // 1. Create the 100% Final Tax Invoice
            $newInvoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'estimate_id' => $estimate->id,
                'project_id' => $estimate->project_id,
                'created_by' => $request->user()?->id ?? $estimate->created_by,
                'client_name' => $estimate->client_name,
                'client_company' => $estimate->client_company,
                'client_email' => $estimate->client_email,
                'client_phone' => $estimate->client_phone,
                'client_address' => $estimate->client_address,
                'client_gstin' => $request->input('client_gstin', '19AAECK4829K1ZX'),
                'invoice_date' => $request->input('invoice_date', now()->toDateString()),
                'due_date' => $request->input('due_date', now()->addDays(15)->toDateString()),
                'status' => 'unpaid',
                'currency' => $estimate->currency ?? 'INR',
                'tax_calculation_type' => $estimate->tax_calculation_type ?? 'exclusive',
                'subtotal' => $estimate->subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $estimate->tax_amount,
                'round_off' => $estimate->round_off ?? 0.00,
                'discount_rate' => $estimate->discount_rate ?? 0.00,
                'discount_amount' => $estimate->discount_amount ?? 0.00,
                'total_amount' => $estimate->total_amount,
                'advance_adjusted' => 0.00,
                'paid_amount' => 0.00,
                'due_amount' => $estimate->total_amount,
                'notes' => $request->input('notes', 'Final Tax Invoice issued against accepted Quotation ' . $estimate->estimate_number),
                'terms_and_conditions' => $estimate->terms_and_conditions ?? "1. All payments must be made in favor of Kabhyan Technologies Private Limited.\n2. In accordance with Section 31 of CGST Act, this is an official Tax Invoice for IT & Software Consultancy Services (SAC 998314).\n3. Any discrepancies must be notified within 7 days of invoice issuance.",
                'bank_details' => $estimate->bank_details ?? null,
            ]);

            // 2. Copy 100% of line items and specifications
            foreach ($estimate->items as $item) {
                $newInvoice->items()->create([
                    'item_name' => $item->item_name,
                    'hsn_sac' => $item->hsn_sac ?? '998314',
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'unit_price' => $item->unit_price,
                    'tax_rate' => $item->tax_rate ?? $estimate->tax_rate ?? 18.00,
                    'tax_amount' => $item->tax_amount ?? 0.00,
                    'amount' => $item->amount,
                ]);
            }

            // 3. Process statutory Advance Adjustments (Receipt Vouchers)
            $selectedVoucherIds = $request->input('receipt_voucher_ids');
            $vouchersQuery = ReceiptVoucher::where('status', 'active')
                ->where('remaining_advance', '>', 0.01);

            if (is_array($selectedVoucherIds) && count($selectedVoucherIds) > 0) {
                $vouchersQuery->whereIn('id', $selectedVoucherIds);
            } else {
                // Auto-detect vouchers linked to this estimate or client
                $vouchersQuery->where(function ($q) use ($estimate) {
                    $q->where('estimate_id', $estimate->id);
                    if ($estimate->client_email) {
                        $q->orWhere('client_email', $estimate->client_email);
                    }
                });
            }

            $activeVouchers = $vouchersQuery->orderBy('voucher_date', 'asc')->get();
            $totalAdvanceAdjusted = 0.00;
            $invoiceTotal = (float) $newInvoice->total_amount;

            foreach ($activeVouchers as $rv) {
                $unadjustedDue = max(0, $invoiceTotal - $totalAdvanceAdjusted);
                if ($unadjustedDue <= 0.01) {
                    break;
                }

                $adjustAmount = min((float) $rv->remaining_advance, $unadjustedDue);
                if ($adjustAmount > 0) {
                    InvoiceAdvanceAdjustment::create([
                        'invoice_id' => $newInvoice->id,
                        'receipt_voucher_id' => $rv->id,
                        'amount_adjusted' => $adjustAmount,
                    ]);

                    $totalAdvanceAdjusted += $adjustAmount;
                    $rv->syncAdjustedTotals();
                }
            }

            // 4. Update advance_adjusted and recalculate balance due
            $newInvoice->advance_adjusted = $totalAdvanceAdjusted;
            $newInvoice->recalculateTotals();

            // 5. Update Estimate status
            $estimate->update(['status' => 'invoiced']);

            return $newInvoice;
        });

        $this->notifyClientInvoiceIssued($invoice);

        return response()->json([
            'message' => 'Final Tax Invoice successfully created from Quotation with advance adjustment.',
            'invoice' => $invoice->fresh()->load(['items', 'payments', 'advanceAdjustments.receiptVoucher', 'project:id,name,code', 'estimate:id,estimate_number']),
        ], 201);
    }

    /**
     * Convert a Proforma Invoice directly into a Final or Progressive Milestone Tax Invoice.
     * Complies with Section 13(2) and Section 31(5) of the CGST Act 2017.
     */
    public function convertFromProforma(Request $request, ProformaInvoice $proformaInvoice): JsonResponse
    {
        $milestoneType = $request->input('milestone_type', 'full');
        $isMilestone = in_array($milestoneType, ['percentage', 'amount']) || $request->filled('milestone_percentage') || $request->filled('milestone_amount');

        $invoice = DB::transaction(function () use ($request, $proformaInvoice, $milestoneType, $isMilestone) {
            $invoiceNumber = DocumentNumberService::getNextInvoiceNumber(true);
            $taxRate = (float) ($proformaInvoice->tax_rate ?? 18.00);
            $totalScope = (float) $proformaInvoice->total_amount;
            $alreadyInvoiced = (float) $proformaInvoice->taxInvoices()->where('status', '!=', 'cancelled')->sum('total_amount');
            $remainingScope = max(0, $totalScope - $alreadyInvoiced);

            $milestoneGross = $totalScope;
            $milestoneTitle = $request->input('milestone_title');

            if ($milestoneType === 'percentage' || $request->filled('milestone_percentage')) {
                $pct = (float) $request->input('milestone_percentage', $request->input('percentage', 100));
                $milestoneGross = round(($totalScope * $pct) / 100, 2);
                if (empty($milestoneTitle)) {
                    $milestoneTitle = "Milestone ({$pct}%) against Proforma {$proformaInvoice->proforma_number}";
                }
            } elseif ($milestoneType === 'amount' || $request->filled('milestone_amount')) {
                $milestoneGross = (float) $request->input('milestone_amount', $request->input('amount', $totalScope));
                if (empty($milestoneTitle)) {
                    $milestoneTitle = "Progressive Milestone Payment against Proforma {$proformaInvoice->proforma_number}";
                }
            } elseif ($alreadyInvoiced > 0 && $remainingScope > 0) {
                // Balance invoice for an already partially invoiced proforma
                $milestoneGross = $remainingScope;
                if (empty($milestoneTitle)) {
                    $milestoneTitle = "Final Balance Settlement against Proforma {$proformaInvoice->proforma_number}";
                }
            }

            // Cap milestone gross at remaining unbilled balance if already partially invoiced
            if ($alreadyInvoiced > 0 && $milestoneGross > $remainingScope) {
                $milestoneGross = $remainingScope;
            }

            if ($isMilestone || ($alreadyInvoiced > 0 && $remainingScope > 0)) {
                // Reverse GST extraction: Gross = Taxable * (1 + taxRate/100)
                $milestoneTaxable = round($milestoneGross / (1 + ($taxRate / 100)), 2);
                $milestoneTax = round($milestoneGross - $milestoneTaxable, 2);

                $newInvoice = Invoice::create([
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
                    'invoice_date' => $request->input('invoice_date', now()->toDateString()),
                    'due_date' => $request->input('due_date', now()->addDays(15)->toDateString()),
                    'status' => 'unpaid',
                    'currency' => $proformaInvoice->currency ?? 'INR',
                    'tax_calculation_type' => $proformaInvoice->tax_calculation_type ?? 'exclusive',
                    'subtotal' => $milestoneTaxable,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $milestoneTax,
                    'round_off' => 0.00,
                    'discount_rate' => 0.00,
                    'discount_amount' => 0.00,
                    'total_amount' => $milestoneGross,
                    'paid_amount' => 0.00,
                    'due_amount' => $milestoneGross,
                    'notes' => "Tax Invoice issued for {$milestoneTitle}. Master Proforma: {$proformaInvoice->proforma_number} (Contract Value: ₹" . number_format($totalScope, 2) . ").",
                    'terms_and_conditions' => "1. All payments must be made in favor of Kabhyan Technologies Private Limited.\n2. In accordance with Section 31 of CGST Act, this is an official Tax Invoice for IT & Software Consultancy Services (SAC 998314).\n3. Any discrepancies must be notified within 7 days of invoice issuance.",
                    'bank_details' => $proformaInvoice->bank_details,
                ]);

                $newInvoice->items()->create([
                    'item_name' => $milestoneTitle,
                    'hsn_sac' => '998314',
                    'description' => "Progressive deliverable payment against Proforma Invoice {$proformaInvoice->proforma_number}. Scope: IT & Software Engineering Services for " . ($proformaInvoice->project?->name ?? 'Enterprise Project'),
                    'quantity' => 1.00,
                    'unit' => 'milestone',
                    'unit_price' => $milestoneTaxable,
                    'amount' => $milestoneTaxable,
                ]);
            } else {
                // Full initial conversion copying all items
                $newInvoice = Invoice::create([
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
                    'invoice_date' => $request->input('invoice_date', now()->toDateString()),
                    'due_date' => $request->input('due_date', now()->addDays(15)->toDateString()),
                    'status' => 'unpaid',
                    'currency' => $proformaInvoice->currency ?? 'INR',
                    'tax_calculation_type' => $proformaInvoice->tax_calculation_type ?? 'exclusive',
                    'subtotal' => $proformaInvoice->subtotal,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $proformaInvoice->tax_amount,
                    'round_off' => $proformaInvoice->round_off ?? 0.00,
                    'discount_rate' => $proformaInvoice->discount_rate,
                    'discount_amount' => $proformaInvoice->discount_amount,
                    'total_amount' => $proformaInvoice->total_amount,
                    'paid_amount' => 0.00,
                    'due_amount' => $proformaInvoice->total_amount,
                    'notes' => 'Tax Invoice issued against accepted proforma ' . $proformaInvoice->proforma_number,
                    'terms_and_conditions' => "1. All payments must be made in favor of Kabhyan Technologies Private Limited.\n2. In accordance with Section 31 of CGST Act, this is an official Tax Invoice for IT & Software Consultancy Services (SAC 998314).\n3. Any discrepancies must be notified within 7 days of invoice issuance.",
                    'bank_details' => $proformaInvoice->bank_details,
                ]);

                foreach ($proformaInvoice->items as $item) {
                    $newInvoice->items()->create([
                        'item_name' => $item->item_name,
                        'hsn_sac' => $item->hsn_sac ?? '998314',
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'unit_price' => $item->unit_price,
                        'tax_rate' => $item->tax_rate ?? $proformaInvoice->tax_rate ?? 18.00,
                        'tax_amount' => $item->tax_amount ?? 0.00,
                        'amount' => $item->amount,
                    ]);
                }
            }

            // If payment was already received for this milestone or marked as paid
            $shouldRecordPayment = $request->boolean('is_paid', false) || $request->filled('payment_reference');
            if ($shouldRecordPayment) {
                $rawMethod = $request->input('payment_method', 'bank_transfer');
                $paymentMethod = in_array($rawMethod, ['bank_transfer', 'upi', 'cheque', 'card', 'cash', 'other']) ? $rawMethod : 'bank_transfer';
                $newInvoice->payments()->create([
                    'recorded_by' => $request->user()?->id,
                    'payment_reference' => $request->input('payment_reference', 'Settled against Proforma ' . $proformaInvoice->proforma_number),
                    'amount' => $newInvoice->total_amount,
                    'payment_date' => $request->input('payment_date', now()->toDateString()),
                    'payment_method' => $paymentMethod,
                    'notes' => $request->input('payment_notes', 'Payment received for milestone against ' . $proformaInvoice->proforma_number),
                ]);
            }

            // Statutory Advance Adjustment (Section 13(2) & 31(5) of CGST Act 2017)
            // Automatically offset advances collected via Receipt Vouchers for this Proforma or origin Estimate
            $activeVouchers = ReceiptVoucher::where('remaining_advance', '>', 0)
                ->where(function ($q) use ($proformaInvoice) {
                    $q->where('proforma_invoice_id', $proformaInvoice->id);
                    if ($proformaInvoice->estimate_id) {
                        $q->orWhere('estimate_id', $proformaInvoice->estimate_id);
                    }
                })
                ->orderBy('voucher_date', 'asc')
                ->get();

            $totalAdvanceAdjusted = 0.00;
            $invoiceTotal = (float) $newInvoice->total_amount;

            foreach ($activeVouchers as $rv) {
                $unadjustedDue = max(0, $invoiceTotal - $totalAdvanceAdjusted);
                if ($unadjustedDue <= 0.01) {
                    break;
                }

                $adjustAmount = min((float) $rv->remaining_advance, $unadjustedDue);
                if ($adjustAmount > 0) {
                    InvoiceAdvanceAdjustment::create([
                        'invoice_id' => $newInvoice->id,
                        'receipt_voucher_id' => $rv->id,
                        'amount_adjusted' => $adjustAmount,
                    ]);

                    $totalAdvanceAdjusted += $adjustAmount;
                    $rv->syncAdjustedTotals();
                }
            }

            if ($totalAdvanceAdjusted > 0) {
                $newInvoice->advance_adjusted = $totalAdvanceAdjusted;
            }

            $newInvoice->recalculateTotals();
            $proformaInvoice->syncInvoicedTotals();

            if ($proformaInvoice->estimate) {
                $proformaInvoice->estimate->update(['status' => 'invoiced']);
            }

            return $newInvoice;
        });

        $this->notifyClientInvoiceIssued($invoice);

        return response()->json([
            'message' => 'Tax Invoice successfully created from Proforma Invoice with advance adjustments.',
            'invoice' => $invoice->fresh()->load(['items', 'payments', 'advanceAdjustments.receiptVoucher', 'project:id,name,code', 'proformaInvoice:id,proforma_number']),
        ], 201);
    }

    /**
     * Store new standalone Tax Invoice.
     */
    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;

        try {
            $invoice = DB::transaction(function () use ($validated) {
                $invoiceNumber = $validated['invoice_number'] ?? null;
                if (empty($invoiceNumber) || Invoice::withTrashed()->where('invoice_number', $invoiceNumber)->exists()) {
                    $invoiceNumber = DocumentNumberService::getNextInvoiceNumber(true);
                } else {
                    DocumentNumberService::getNextInvoiceNumber(true);
                }

                $newInvoice = Invoice::create([
                    'invoice_number' => $invoiceNumber,
                    'proforma_invoice_id' => !empty($validated['proforma_invoice_id']) ? (int) $validated['proforma_invoice_id'] : null,
                    'estimate_id' => !empty($validated['estimate_id']) ? (int) $validated['estimate_id'] : null,
                    'project_id' => !empty($validated['project_id']) ? (int) $validated['project_id'] : null,
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
                    'tax_calculation_type' => $validated['tax_calculation_type'] ?? 'exclusive',
                    'tax_rate' => $validated['tax_rate'] ?? 18,
                    'discount_type' => $validated['discount_type'] ?? 'percentage',
                    'discount_rate' => $validated['discount_rate'] ?? 0,
                    'discount_amount' => $validated['discount_amount'] ?? 0,
                    'round_off' => $validated['round_off'] ?? 0,
                    'notes' => $validated['notes'] ?? null,
                    'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
                    'bank_details' => $validated['bank_details'] ?? null,
                ]);

                $docTaxRate = isset($validated['tax_rate']) && $validated['tax_rate'] !== null && $validated['tax_rate'] !== ''
                    ? (float) $validated['tax_rate']
                    : 18.00;
                $isInclusive = ($validated['tax_calculation_type'] ?? 'exclusive') === 'inclusive';

                foreach ($validated['items'] as $item) {
                    $qty = (float) ($item['quantity'] ?? 1);
                    $unitPrice = (float) ($item['unit_price'] ?? 0);
                    $amount = $qty * $unitPrice;
                    $itemTaxRate = isset($item['tax_rate']) && $item['tax_rate'] !== null && $item['tax_rate'] !== ''
                        ? (float) $item['tax_rate']
                        : $docTaxRate;

                    $itemTaxAmount = 0.00;
                    if ($itemTaxRate > 0) {
                        if ($isInclusive) {
                            $taxable = round($amount / (1 + ($itemTaxRate / 100)), 2);
                            $itemTaxAmount = round($amount - $taxable, 2);
                        } else {
                            $itemTaxAmount = round(($amount * $itemTaxRate) / 100, 2);
                        }
                    }

                    $newInvoice->items()->create([
                        'item_name' => $item['item_name'],
                        'hsn_sac' => $item['hsn_sac'] ?? '998314',
                        'description' => $item['description'] ?? null,
                        'quantity' => $qty,
                        'unit' => $item['unit'] ?? 'hours',
                        'unit_price' => $unitPrice,
                        'tax_rate' => $itemTaxRate,
                        'tax_amount' => $itemTaxAmount,
                        'amount' => $amount,
                    ]);
                }

                $newInvoice->recalculateTotals();

                // Process statutory advance adjustments if Receipt Vouchers are selected
                $voucherIds = $request->input('receipt_voucher_ids', []);
                if (!empty($voucherIds) && is_array($voucherIds)) {
                    $vouchers = ReceiptVoucher::whereIn('id', $voucherIds)
                        ->where('status', 'active')
                        ->where('remaining_advance', '>', 0.01)
                        ->orderBy('voucher_date', 'asc')
                        ->get();

                    $totalAdjusted = 0.00;
                    $invoiceTotal = (float) $newInvoice->total_amount;

                    foreach ($vouchers as $rv) {
                        $unadjustedDue = max(0, $invoiceTotal - $totalAdjusted);
                        if ($unadjustedDue <= 0.01) break;

                        $adjustAmount = min((float) $rv->remaining_advance, $unadjustedDue);
                        if ($adjustAmount > 0) {
                            InvoiceAdvanceAdjustment::create([
                                'invoice_id' => $newInvoice->id,
                                'receipt_voucher_id' => $rv->id,
                                'amount_adjusted' => $adjustAmount,
                            ]);
                            $totalAdjusted += $adjustAmount;
                            $rv->syncAdjustedTotals();
                        }
                    }

                    $newInvoice->advance_adjusted = $totalAdjusted;
                    $newInvoice->recalculateTotals();
                }

                if (($validated['status'] ?? 'unpaid') === 'paid' || !empty($validated['payment_reference'])) {
                    $newInvoice->payments()->create([
                        'recorded_by' => $validated['created_by'],
                        'payment_reference' => $validated['payment_reference'] ?? 'Full settlement recorded at issuance',
                        'amount' => $newInvoice->total_amount,
                        'payment_date' => $validated['payment_date'] ?? $newInvoice->invoice_date,
                        'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
                        'notes' => $validated['payment_notes'] ?? 'Settled milestone against Proforma',
                    ]);
                    $newInvoice->recalculateTotals();
                }

                return $newInvoice;
            });

            if ($invoice->status !== 'draft') {
                $this->notifyClientInvoiceIssued($invoice);
            }

            return response()->json([
                'message' => 'Tax Invoice created successfully',
                'invoice' => $invoice->fresh()->load(['items', 'payments', 'project:id,name,code', 'creator:id,name,email']),
            ], 201);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create tax invoice: ' . $e->getMessage(), [
                'exception' => $e,
                'validated' => $validated,
            ]);

            return response()->json([
                'message' => 'Failed to generate tax invoice: ' . $e->getMessage(),
            ], 422);
        }
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
                'advanceAdjustments.receiptVoucher',
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
            'tax_calculation_type' => ['nullable', 'string', Rule::in(['exclusive', 'inclusive'])],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_type' => ['nullable', 'string', Rule::in(['percentage', 'fixed'])],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
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

        DB::transaction(function () use ($validated, $invoice) {
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
                'tax_calculation_type' => $validated['tax_calculation_type'] ?? 'exclusive',
                'tax_rate' => $validated['tax_rate'] ?? 18,
                'discount_type' => $validated['discount_type'] ?? 'percentage',
                'discount_rate' => $validated['discount_rate'] ?? 0,
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'round_off' => $validated['round_off'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
                'bank_details' => $validated['bank_details'] ?? null,
            ]);

            $docTaxRate = isset($validated['tax_rate']) && $validated['tax_rate'] !== null && $validated['tax_rate'] !== ''
                ? (float) $validated['tax_rate']
                : 18.00;
            $isInclusive = ($validated['tax_calculation_type'] ?? 'exclusive') === 'inclusive';

            $invoice->items()->delete();
            foreach ($validated['items'] as $item) {
                $qty = (float) ($item['quantity'] ?? 1);
                $unitPrice = (float) ($item['unit_price'] ?? 0);
                $amount = $qty * $unitPrice;
                $itemTaxRate = isset($item['tax_rate']) && $item['tax_rate'] !== null && $item['tax_rate'] !== ''
                    ? (float) $item['tax_rate']
                    : $docTaxRate;

                $itemTaxAmount = 0.00;
                if ($itemTaxRate > 0) {
                    if ($isInclusive) {
                        $taxable = round($amount / (1 + ($itemTaxRate / 100)), 2);
                        $itemTaxAmount = round($amount - $taxable, 2);
                    } else {
                        $itemTaxAmount = round(($amount * $itemTaxRate) / 100, 2);
                    }
                }

                $invoice->items()->create([
                    'item_name' => $item['item_name'],
                    'hsn_sac' => $item['hsn_sac'] ?? '998314',
                    'description' => $item['description'] ?? null,
                    'quantity' => $qty,
                    'unit' => $item['unit'] ?? 'hours',
                    'unit_price' => $unitPrice,
                    'tax_rate' => $itemTaxRate,
                    'tax_amount' => $itemTaxAmount,
                    'amount' => $amount,
                ]);
            }

            $invoice->recalculateTotals();
        });

        return response()->json([
            'message' => 'Invoice updated successfully',
            'invoice' => $invoice->fresh()->load(['items', 'payments', 'project:id,name,code', 'creator:id,name,email']),
        ]);
    }

    /**
     * Record payment transaction against invoice.
     */
    public function recordPayment(RecordPaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request, $invoice) {
            $payment = $invoice->payments()->create([
                'recorded_by' => $request->user()->id,
                'amount' => $validated['amount'],
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $validated['payment_reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $invoice->recalculateTotals();

            // Auto-accrue commission if the client is linked to a business associate
            try {
                $client = null;
                if (!empty($invoice->client_email)) {
                    $client = \App\Models\Client::where('email', $invoice->client_email)->first();
                }
                if ($client && $client->business_associate_id) {
                    $associate = \App\Models\BusinessAssociate::find($client->business_associate_id);
                    if ($associate && in_array($associate->engagement_model, ['commission', 'hybrid']) && $associate->commission_rate > 0) {
                        $existingPayoutCount = \App\Models\BusinessAssociatePayout::where('business_associate_id', $associate->id)
                            ->where('client_id', $client->id)
                            ->where('type', 'commission')
                            ->count();

                        if ($associate->commission_scope !== 'one_time' || $existingPayoutCount === 0) {
                            $paidAmount = (float) $validated['amount'];
                            $calcBase = $paidAmount;
                            $invoiceTotal = (float) ($invoice->total_amount ?? ($invoice->total ?? 0));
                            if ($associate->commission_basis === 'taxable_turnover' && $invoiceTotal > 0) {
                                $taxableRatio = (float) ($invoice->subtotal ?? $invoiceTotal) / $invoiceTotal;
                                $calcBase = round($paidAmount * $taxableRatio, 2);
                            }

                            $grossCommission = round($calcBase * ((float) $associate->commission_rate / 100), 2);
                            if ($grossCommission > 0) {
                                $tdsRate = $associate->pan_number ? 5.00 : 20.00;
                                $tdsAmount = round($grossCommission * ($tdsRate / 100), 2);
                                $netCommission = round($grossCommission - $tdsAmount, 2);

                                \App\Models\BusinessAssociatePayout::create([
                                    'payout_number' => \App\Models\BusinessAssociatePayout::generateNextPayoutNumber(),
                                    'business_associate_id' => $associate->id,
                                    'client_id' => $client->id,
                                    'invoice_id' => $invoice->id,
                                    'invoice_payment_id' => $payment->id,
                                    'type' => 'commission',
                                    'period_month' => date('Y-m'),
                                    'gross_amount' => $grossCommission,
                                    'tds_rate' => $tdsRate,
                                    'tds_amount' => $tdsAmount,
                                    'net_amount' => $netCommission,
                                    'status' => 'pending',
                                    'payment_method' => 'bank_transfer',
                                    'notes' => "Auto-accrued commission ({$associate->commission_rate}%) on payment for Invoice #{$invoice->invoice_number}",
                                ]);
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to auto-accrue associate commission: " . $e->getMessage());
            }
        });

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
        // Delete child payments, items, and advance adjustments to prevent orphan records
        $invoice->payments()->delete();
        $invoice->advanceAdjustments()->delete();
        $invoice->items()->delete();
        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully',
        ]);
    }

    /**
     * Notify client via push notification when a tax invoice is issued.
     */
    private function notifyClientInvoiceIssued(Invoice $invoice): void
    {
        try {
            $client = null;
            if ($invoice->client_email) {
                $client = Client::where('email', $invoice->client_email)->first();
            }
            if (!$client && $invoice->client_company) {
                $client = Client::where('company_name', $invoice->client_company)->first();
            }
            if (!$client && $invoice->client_name) {
                $client = Client::where('name', $invoice->client_name)->first();
            }

            if ($client) {
                $formattedTotal = '₹' . number_format((float) ($invoice->total_amount ?? 0), 2);
                PushNotificationService::sendToClient(
                    $client,
                    "Tax Invoice Issued",
                    "Tax Invoice #{$invoice->invoice_number} ({$formattedTotal}) has been issued.",
                    [
                        'type' => 'invoice',
                        'screen' => 'InvoiceDetail',
                        'invoiceId' => $invoice->id,
                        'invoice_number' => $invoice->invoice_number,
                        'total' => (float) ($invoice->total_amount ?? 0),
                    ]
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('[InvoiceController] Push notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Generate or retrieve Cashfree online payment link for an invoice.
     */
    public function generatePaymentLink(Request $request, Invoice $invoice, \App\Services\CashfreeService $cashfreeService): JsonResponse
    {
        try {
            $returnUrl = $request->input('return_url');
            $result = $cashfreeService->createPaymentLink($invoice, $returnUrl);

            return response()->json([
                'success' => true,
                'payment_link' => $result,
                'invoice' => $invoice->fresh(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Cashfree Webhook Listener.
     */
    public function cashfreeWebhook(Request $request, \App\Services\CashfreeService $cashfreeService): JsonResponse
    {
        $signature = $request->header('x-webhook-signature');
        $timestamp = $request->header('x-webhook-timestamp');
        $rawBody = $request->getContent();

        if ($cashfreeService->isConfigured()) {
            if (!$cashfreeService->verifyWebhookSignature($signature, $timestamp, $rawBody)) {
                return response()->json(['error' => 'Invalid signature'], 401);
            }
        }

        $payload = $request->json()->all();
        $result = $cashfreeService->processWebhookPayload($payload);

        return response()->json([
            'status' => 'received',
            'result' => $result,
        ]);
    }
}
