<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReceiptVoucher;
use App\Models\RefundVoucher;
use App\Services\DocumentNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RefundVoucherController extends Controller
{
    /**
     * Store new Statutory GST Refund Voucher under Section 31(3)(e) & Rule 51.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receipt_voucher_id' => ['required', 'exists:receipt_vouchers,id'],
            'voucher_date' => ['required', 'date'],
            'refund_amount' => ['required', 'numeric', 'min:0.01'],
            'refund_mode' => ['required', 'in:bank_transfer,upi,cheque,card,cash,other'],
            'refund_reference' => ['nullable', 'string', 'max:255'],
            'reason' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $receiptVoucher = ReceiptVoucher::findOrFail($validated['receipt_voucher_id']);
        $refundAmount = (float) $validated['refund_amount'];

        if ($refundAmount > (float) $receiptVoucher->remaining_advance) {
            return response()->json([
                'message' => "Refund amount (₹{$refundAmount}) cannot exceed available advance balance (₹{$receiptVoucher->remaining_advance}).",
            ], 422);
        }

        $refundVoucher = DB::transaction(function () use ($validated, $receiptVoucher, $refundAmount, $request) {
            $voucherNumber = DocumentNumberService::getNextRefundVoucherNumber(true);

            $taxRate = (float) $receiptVoucher->tax_rate;
            $taxCalculationType = $receiptVoucher->tax_calculation_type ?? 'inclusive';

            if ($taxCalculationType === 'inclusive') {
                $taxable = $taxRate > 0 ? round($refundAmount / (1 + ($taxRate / 100)), 2) : $refundAmount;
                $tax = round($refundAmount - $taxable, 2);
            } else {
                $taxable = $refundAmount;
                $tax = round(($taxable * $taxRate) / 100, 2);
            }

            $cgst = 0.00;
            $sgst = 0.00;
            $igst = 0.00;

            if ($receiptVoucher->is_inter_state) {
                $igst = $tax;
            } else {
                $cgst = round($tax / 2, 2);
                $sgst = round($tax - $cgst, 2);
            }

            $rfv = RefundVoucher::create([
                'voucher_number' => $voucherNumber,
                'receipt_voucher_id' => $receiptVoucher->id,
                'client_id' => $receiptVoucher->client_id,
                'created_by' => $request->user()->id,
                'voucher_date' => $validated['voucher_date'],
                'refund_amount' => $refundAmount,
                'taxable_amount' => $taxable,
                'tax_rate' => $taxRate,
                'tax_amount' => $tax,
                'cgst_amount' => $cgst,
                'sgst_amount' => $sgst,
                'igst_amount' => $igst,
                'refund_mode' => $validated['refund_mode'],
                'refund_reference' => $validated['refund_reference'] ?? null,
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Recompute remaining advance on Receipt Voucher
            $receiptVoucher->syncAdjustedTotals();

            return $rfv;
        });

        return response()->json([
            'message' => 'GST Refund Voucher successfully issued.',
            'refund_voucher' => $refundVoucher->load(['receiptVoucher', 'client']),
        ], 201);
    }

    /**
     * Show single Refund Voucher.
     */
    public function show(RefundVoucher $refundVoucher): JsonResponse
    {
        $refundVoucher->load(['receiptVoucher', 'client']);
        return response()->json(['refund_voucher' => $refundVoucher]);
    }
}
