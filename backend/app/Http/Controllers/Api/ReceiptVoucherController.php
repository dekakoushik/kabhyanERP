<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Estimate;
use App\Models\ReceiptVoucher;
use App\Services\DocumentNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceiptVoucherController extends Controller
{
    /**
     * List all Receipt Vouchers.
     * Compliant with Section 31(3)(d) of CGST Act, 2017 & Rule 50.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ReceiptVoucher::with([
            'estimate:id,estimate_number,total_amount,status',
            'client:id,name,company_name,email,gstin',
            'project:id,name,code',
            'adjustments.invoice:id,invoice_number,total_amount,invoice_date',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('estimate_id')) {
            $query->where('estimate_id', $request->estimate_id);
        }

        if ($request->filled('search')) {
            $s = strtolower(trim($request->search));
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(voucher_number) LIKE ?', ["%{$s}%"])
                    ->orWhereRaw('LOWER(client_name) LIKE ?', ["%{$s}%"])
                    ->orWhereRaw('LOWER(client_company) LIKE ?', ["%{$s}%"])
                    ->orWhereRaw('LOWER(payment_reference) LIKE ?', ["%{$s}%"]);
            });
        }

        $vouchers = $query->orderBy('voucher_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json(['receipt_vouchers' => $vouchers]);
    }

    /**
     * Store new Statutory GST Receipt Voucher on advance payment received.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'estimate_id' => ['nullable', 'exists:estimates,id'],
            'proforma_invoice_id' => ['nullable', 'exists:proforma_invoices,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_company' => ['nullable', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_address' => ['nullable', 'string'],
            'client_gstin' => ['nullable', 'string', 'max:30'],
            'voucher_date' => ['required', 'date'],
            'amount_received' => ['required', 'numeric', 'min:0.01'],
            'tax_calculation_type' => ['nullable', 'in:inclusive,exclusive'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'place_of_supply' => ['nullable', 'string', 'max:100'],
            'payment_mode' => ['required', 'in:bank_transfer,upi,cheque,card,cash,other'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $voucher = DB::transaction(function () use ($validated, $request) {
            $voucherNumber = DocumentNumberService::getNextReceiptVoucherNumber(true);

            $amountReceived = (float) $validated['amount_received'];
            $taxCalculationType = $validated['tax_calculation_type'] ?? 'inclusive';
            $taxRate = isset($validated['tax_rate']) ? (float) $validated['tax_rate'] : 18.00;

            // Determine GST bifurcation
            $clientGstin = strtoupper(trim($validated['client_gstin'] ?? ''));
            $supplierStateCode = '18'; // Assam
            $isInterState = false;

            if (strlen($clientGstin) >= 2) {
                $clientStateCode = substr($clientGstin, 0, 2);
                $isInterState = ($clientStateCode !== $supplierStateCode);
            } else {
                $addr = strtolower($validated['client_address'] ?? '');
                $isInterState = (!empty($addr) && !str_contains($addr, 'assam') && !str_contains($addr, 'as'));
            }

            $placeOfSupply = $validated['place_of_supply'] ?? ($isInterState ? 'Inter-State Supply' : 'Assam (State Code: 18)');

            if ($taxCalculationType === 'inclusive') {
                $taxableAmount = $taxRate > 0 ? round($amountReceived / (1 + ($taxRate / 100)), 2) : $amountReceived;
                $taxAmount = round($amountReceived - $taxableAmount, 2);
            } else {
                $taxableAmount = $amountReceived;
                $taxAmount = round(($taxableAmount * $taxRate) / 100, 2);
                $amountReceived = $taxableAmount + $taxAmount; // Total advance with tax
            }

            $cgst = 0.00;
            $sgst = 0.00;
            $igst = 0.00;

            if ($isInterState) {
                $igst = $taxAmount;
            } else {
                $cgst = round($taxAmount / 2, 2);
                $sgst = round($taxAmount - $cgst, 2);
            }

            $estimateId = $validated['estimate_id'] ?? null;
            $proformaId = $validated['proforma_invoice_id'] ?? null;
            $projectId = $validated['project_id'] ?? null;

            if ($proformaId && (!$estimateId || !$projectId)) {
                $proforma = \App\Models\ProformaInvoice::find($proformaId);
                if ($proforma) {
                    $estimateId = $estimateId ?? $proforma->estimate_id;
                    $projectId = $projectId ?? $proforma->project_id;
                }
            }

            return ReceiptVoucher::create([
                'voucher_number' => $voucherNumber,
                'estimate_id' => $estimateId,
                'proforma_invoice_id' => $proformaId,
                'project_id' => $projectId,
                'client_id' => $validated['client_id'] ?? null,
                'created_by' => $request->user()->id,
                'client_name' => $validated['client_name'],
                'client_company' => $validated['client_company'] ?? null,
                'client_email' => $validated['client_email'] ?? null,
                'client_phone' => $validated['client_phone'] ?? null,
                'client_address' => $validated['client_address'] ?? null,
                'client_gstin' => $validated['client_gstin'] ?? null,
                'voucher_date' => $validated['voucher_date'],
                'amount_received' => $amountReceived,
                'tax_calculation_type' => $taxCalculationType,
                'taxable_amount' => $taxableAmount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'cgst_amount' => $cgst,
                'sgst_amount' => $sgst,
                'igst_amount' => $igst,
                'is_inter_state' => $isInterState,
                'place_of_supply' => $placeOfSupply,
                'payment_mode' => $validated['payment_mode'],
                'payment_reference' => $validated['payment_reference'] ?? null,
                'status' => 'active',
                'adjusted_amount' => 0.00,
                'remaining_advance' => $amountReceived,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        if ($voucher->proforma_invoice_id) {
            $voucher->proformaInvoice?->syncInvoicedTotals();
        }

        return response()->json([
            'message' => 'GST Receipt Voucher successfully issued.',
            'receipt_voucher' => $voucher->load(['estimate', 'client', 'proformaInvoice']),
        ], 201);
    }

    /**
     * Show single Receipt Voucher details.
     */
    public function show(ReceiptVoucher $receiptVoucher): JsonResponse
    {
        $receiptVoucher->load([
            'estimate',
            'client',
            'project',
            'adjustments.invoice',
            'refundVouchers',
        ]);

        return response()->json(['receipt_voucher' => $receiptVoucher]);
    }

    /**
     * Delete a Receipt Voucher.
     * Only unadjusted vouchers with zero invoice adjustments and zero refund vouchers can be deleted.
     */
    public function destroy(ReceiptVoucher $receiptVoucher): JsonResponse
    {
        // 1. Guard against vouchers adjusted against Tax Invoices
        if ($receiptVoucher->adjustments()->exists() || (float) $receiptVoucher->adjusted_amount > 0) {
            return response()->json([
                'message' => 'Cannot delete this Receipt Voucher because an advance of ₹' . number_format($receiptVoucher->adjusted_amount, 2) . ' has already been adjusted against Tax Invoice(s). Please remove the invoice adjustment first.',
            ], 422);
        }

        // 2. Guard against vouchers with Refund Vouchers issued
        if ($receiptVoucher->refundVouchers()->exists()) {
            return response()->json([
                'message' => 'Cannot delete this Receipt Voucher because a statutory Refund Voucher has already been issued against it.',
            ], 422);
        }

        // 3. Execute soft delete and re-sync linked proforma totals if applicable
        DB::transaction(function () use ($receiptVoucher) {
            $proforma = $receiptVoucher->proformaInvoice;
            $receiptVoucher->delete();

            if ($proforma) {
                $proforma->syncInvoicedTotals();
            }
        });

        return response()->json([
            'message' => 'Receipt Voucher ' . $receiptVoucher->voucher_number . ' successfully deleted.',
        ]);
    }
}
