<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Estimate;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Invoice;
use App\Models\InvoiceAdvanceAdjustment;
use App\Models\InvoicePayment;
use App\Models\Project;
use App\Models\ReceiptVoucher;
use App\Models\RefundVoucher;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Helper to resolve start and end dates from user filters.
     * Supports:
     * - explicit start_date & end_date
     * - fy: e.g. "2025-2026" (April 1, 2025 to March 31, 2026)
     * - year: e.g. 2026 (calendar year)
     * - quarter: Q1, Q2, Q3, Q4 for given year/fy
     * - defaults to Current Indian Fiscal Year
     */
    protected function resolveDateRange(Request $request): array
    {
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
            $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
            return [$startDate, $endDate, 'custom'];
        }

        $now = Carbon::now();
        $currentMonth = $now->month;
        $currentYear = $now->year;

        // Indian Financial Year: April 1 to March 31
        $defaultFyStartYear = $currentMonth >= 4 ? $currentYear : $currentYear - 1;

        if ($request->filled('fy')) {
            $parts = explode('-', $request->input('fy'));
            $fyStart = (int) $parts[0];
            $startDate = Carbon::createFromDate($fyStart, 4, 1)->startOfDay();
            $endDate = Carbon::createFromDate($fyStart + 1, 3, 31)->endOfDay();
            $label = "FY {$fyStart}-" . ($fyStart + 1);
        } elseif ($request->filled('year')) {
            $year = (int) $request->input('year');
            $startDate = Carbon::createFromDate($year, 1, 1)->startOfDay();
            $endDate = Carbon::createFromDate($year, 12, 31)->endOfDay();
            $label = "CY {$year}";
        } else {
            // Default to current FY
            $startDate = Carbon::createFromDate($defaultFyStartYear, 4, 1)->startOfDay();
            $endDate = Carbon::createFromDate($defaultFyStartYear + 1, 3, 31)->endOfDay();
            $label = "FY {$defaultFyStartYear}-" . ($defaultFyStartYear + 1);
        }

        // Quarter filter within the resolved date range
        if ($request->filled('quarter')) {
            $quarter = strtoupper($request->input('quarter'));
            $baseYear = $startDate->year;
            if ($quarter === 'Q1') {
                $startDate = Carbon::createFromDate($baseYear, 4, 1)->startOfDay();
                $endDate = Carbon::createFromDate($baseYear, 6, 30)->endOfDay();
            } elseif ($quarter === 'Q2') {
                $startDate = Carbon::createFromDate($baseYear, 7, 1)->startOfDay();
                $endDate = Carbon::createFromDate($baseYear, 9, 30)->endOfDay();
            } elseif ($quarter === 'Q3') {
                $startDate = Carbon::createFromDate($baseYear, 10, 1)->startOfDay();
                $endDate = Carbon::createFromDate($baseYear, 12, 31)->endOfDay();
            } elseif ($quarter === 'Q4') {
                $startDate = Carbon::createFromDate($baseYear + 1, 1, 1)->startOfDay();
                $endDate = Carbon::createFromDate($baseYear + 1, 3, 31)->endOfDay();
            }
        }

        return [$startDate, $endDate, $label];
    }

    /**
     * 1. Executive Overview Hub KPIs
     */
    public function overview(Request $request)
    {
        [$startDate, $endDate, $periodLabel] = $this->resolveDateRange($request);

        // Invoiced Revenue (Accrual)
        $invoicedGross = (float) Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $invoicedTaxable = (float) Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->sum('subtotal');

        $outputGstInvoices = (float) Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->sum('tax_amount');

        // Cash Collections (Active Non-Deleted Invoices Only)
        $collectionsCash = (float) InvoicePayment::whereHas('invoice', function ($q) {
            $q->where('status', '!=', 'cancelled');
        })->whereBetween('payment_date', [$startDate, $endDate])
            ->sum('amount');

        // Rule 50 Advances Received
        $advancesReceived = (float) ReceiptVoucher::whereBetween('voucher_date', [$startDate, $endDate])
            ->sum('amount_received');

        $advancesUnadjusted = (float) ReceiptVoucher::whereIn('status', ['unadjusted', 'partially_adjusted'])
            ->sum('remaining_advance');

        $gstOnAdvances = (float) ReceiptVoucher::whereBetween('voucher_date', [$startDate, $endDate])
            ->sum('tax_amount');

        // Operating Expenses
        $expensesPaid = (float) Expense::where('status', 'paid')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->sum('total_amount');

        $inputGstClaimed = (float) Expense::where('status', 'paid')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->sum('tax_amount');

        // Outstanding Receivables
        $totalOutstandingDue = (float) Invoice::where('status', '!=', 'cancelled')
            ->where('status', '!=', 'paid')
            ->sum('due_amount');

        // Margins & Ratios
        $totalInflow = $collectionsCash + $advancesReceived;
        $netProfit = $totalInflow - $expensesPaid;
        $realizationRate = $invoicedGross > 0 ? round(($collectionsCash / $invoicedGross) * 100, 1) : 0;
        $netMarginPct = $totalInflow > 0 ? round(($netProfit / $totalInflow) * 100, 1) : 0;

        // Active Counts
        $activeProjectsCount = Project::whereIn('status', ['in_progress', 'active', 'started'])->count();
        $totalClientsCount = Client::count();
        $acceptedEstimatesCount = Estimate::whereBetween('estimate_date', [$startDate, $endDate])
            ->whereIn('status', ['accepted', 'invoiced'])
            ->count();
        $totalEstimatesCount = Estimate::whereBetween('estimate_date', [$startDate, $endDate])->count();
        $estimateWinRate = $totalEstimatesCount > 0
            ? round(($acceptedEstimatesCount / $totalEstimatesCount) * 100, 1)
            : 0;

        // Recent 6 cash movements (Active Non-Deleted Invoices Only)
        $recentInflows = InvoicePayment::whereHas('invoice', function ($q) {
            $q->where('status', '!=', 'cancelled');
        })
            ->with('invoice:id,invoice_number,client_name')
            ->orderBy('payment_date', 'desc')
            ->limit(4)
            ->get()
            ->map(fn($p) => [
                'id' => 'PAY-' . $p->id,
                'type' => 'inflow',
                'title' => 'Payment: ' . ($p->invoice->invoice_number ?? 'Invoice'),
                'party' => $p->invoice->client_name ?? 'Client',
                'date' => Carbon::parse($p->payment_date)->toDateString(),
                'amount' => (float) $p->amount,
            ]);

        $recentOutflows = Expense::where('status', 'paid')
            ->orderBy('expense_date', 'desc')
            ->limit(4)
            ->get()
            ->map(fn($e) => [
                'id' => 'EXP-' . $e->id,
                'type' => 'outflow',
                'title' => 'Expense: ' . $e->title,
                'party' => $e->vendor_name ?: 'Vendor',
                'date' => Carbon::parse($e->expense_date)->toDateString(),
                'amount' => (float) $e->total_amount,
            ]);

        $recentCashflow = $recentInflows->concat($recentOutflows)
            ->sortByDesc('date')
            ->values()
            ->take(6);

        return response()->json([
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'label' => $periodLabel,
            ],
            'kpis' => [
                'invoiced_gross' => $invoicedGross,
                'invoiced_taxable' => $invoicedTaxable,
                'collections_cash' => $collectionsCash,
                'advances_received' => $advancesReceived,
                'advances_unadjusted' => $advancesUnadjusted,
                'total_inflow' => $totalInflow,
                'expenses_paid' => $expensesPaid,
                'net_profit' => $netProfit,
                'net_margin_pct' => $netMarginPct,
                'realization_rate' => $realizationRate,
                'outstanding_due' => $totalOutstandingDue,
                'output_gst' => $outputGstInvoices + $gstOnAdvances,
                'input_gst' => $inputGstClaimed,
                'net_gst_payable' => max(0, ($outputGstInvoices + $gstOnAdvances) - $inputGstClaimed),
                'active_projects' => $activeProjectsCount,
                'total_clients' => $totalClientsCount,
                'estimate_win_rate' => $estimateWinRate,
                'accepted_estimates_count' => $acceptedEstimatesCount,
            ],
            'recent_cashflow' => $recentCashflow,
        ]);
    }

    /**
     * 2. Revenue & P&L Analytics
     */
    public function revenue(Request $request)
    {
        [$startDate, $endDate, $periodLabel] = $this->resolveDateRange($request);

        // Generate 12-month sequence or month-by-month within range
        $periodMonths = [];
        $cursor = $startDate->copy()->startOfMonth();
        $endCursor = $endDate->copy()->endOfMonth();

        while ($cursor->lte($endCursor)) {
            $mStart = $cursor->copy()->startOfMonth();
            $mEnd = $cursor->copy()->endOfMonth();

            $invoiced = (float) Invoice::whereBetween('invoice_date', [$mStart, $mEnd])
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');

            $collected = (float) InvoicePayment::whereHas('invoice', function ($q) {
                $q->where('status', '!=', 'cancelled');
            })->whereBetween('payment_date', [$mStart, $mEnd])
                ->sum('amount');

            $advances = (float) ReceiptVoucher::whereBetween('voucher_date', [$mStart, $mEnd])
                ->sum('amount_received');

            $expense = (float) Expense::where('status', 'paid')
                ->whereBetween('expense_date', [$mStart, $mEnd])
                ->sum('total_amount');

            $totalInflow = $collected + $advances;
            $net = $totalInflow - $expense;

            $periodMonths[] = [
                'month' => $cursor->format('M Y'),
                'short_month' => $cursor->format('M'),
                'year' => $cursor->year,
                'invoiced' => $invoiced,
                'collected' => $collected,
                'advances' => $advances,
                'total_inflow' => $totalInflow,
                'expense' => $expense,
                'net_profit' => $net,
                'margin_pct' => $totalInflow > 0 ? round(($net / $totalInflow) * 100, 1) : 0,
            ];

            $cursor->addMonth();
        }

        // Quarterly aggregation
        $quarters = [
            'Q1 (Apr-Jun)' => ['invoiced' => 0, 'collected' => 0, 'expense' => 0, 'net' => 0],
            'Q2 (Jul-Sep)' => ['invoiced' => 0, 'collected' => 0, 'expense' => 0, 'net' => 0],
            'Q3 (Oct-Dec)' => ['invoiced' => 0, 'collected' => 0, 'expense' => 0, 'net' => 0],
            'Q4 (Jan-Mar)' => ['invoiced' => 0, 'collected' => 0, 'expense' => 0, 'net' => 0],
        ];

        foreach ($periodMonths as $m) {
            $date = Carbon::createFromFormat('M Y', $m['month']);
            $monthNum = $date->month;
            if ($monthNum >= 4 && $monthNum <= 6) {
                $q = 'Q1 (Apr-Jun)';
            } elseif ($monthNum >= 7 && $monthNum <= 9) {
                $q = 'Q2 (Jul-Sep)';
            } elseif ($monthNum >= 10 && $monthNum <= 12) {
                $q = 'Q3 (Oct-Dec)';
            } else {
                $q = 'Q4 (Jan-Mar)';
            }

            if (isset($quarters[$q])) {
                $quarters[$q]['invoiced'] += $m['invoiced'];
                $quarters[$q]['collected'] += $m['total_inflow'];
                $quarters[$q]['expense'] += $m['expense'];
                $quarters[$q]['net'] += $m['net_profit'];
            }
        }

        // Expense category breakdown
        $categoryBreakdown = ExpenseCategory::withSum(['expenses' => function ($q) use ($startDate, $endDate) {
            $q->where('status', 'paid')->whereBetween('expense_date', [$startDate, $endDate]);
        }], 'total_amount')
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'color' => $cat->color,
                'total_amount' => (float) ($cat->expenses_sum_total_amount ?? 0),
            ])
            ->filter(fn($c) => $c['total_amount'] > 0)
            ->values();

        $totalInvoicedPeriod = array_sum(array_column($periodMonths, 'invoiced'));
        $totalInflowPeriod = array_sum(array_column($periodMonths, 'total_inflow'));
        $totalExpensePeriod = array_sum(array_column($periodMonths, 'expense'));
        $netProfitPeriod = $totalInflowPeriod - $totalExpensePeriod;

        return response()->json([
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'label' => $periodLabel,
            ],
            'summary' => [
                'total_invoiced' => $totalInvoicedPeriod,
                'total_inflow' => $totalInflowPeriod,
                'total_expense' => $totalExpensePeriod,
                'net_profit' => $netProfitPeriod,
                'net_margin_pct' => $totalInflowPeriod > 0 ? round(($netProfitPeriod / $totalInflowPeriod) * 100, 1) : 0,
            ],
            'monthly' => $periodMonths,
            'quarters' => $quarters,
            'expense_categories' => $categoryBreakdown,
        ]);
    }

    /**
     * 3. Statutory GST Compliance (GSTR-1 & GSTR-3B)
     */
    public function gst(Request $request)
    {
        [$startDate, $endDate, $periodLabel] = $this->resolveDateRange($request);
        $companyGstin = SystemSetting::get('company_gstin', '18AAGCK2934D1Z2');
        $companyStateCode = substr(trim($companyGstin), 0, 2) ?: '18';

        // 1. Invoices in Period
        $invoices = Invoice::with(['items', 'advanceAdjustments'])
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->orderBy('invoice_date', 'asc')
            ->get();

        $b2bRecords = [];
        $b2cRecords = [];

        $totalB2bTaxable = 0;
        $totalB2bIgst = 0;
        $totalB2bCgst = 0;
        $totalB2bSgst = 0;
        $totalB2bInvoiceVal = 0;

        $totalB2cTaxable = 0;
        $totalB2cIgst = 0;
        $totalB2cCgst = 0;
        $totalB2cSgst = 0;
        $totalB2cInvoiceVal = 0;

        foreach ($invoices as $inv) {
            $gstin = strtoupper(trim((string) $inv->client_gstin));
            $isB2b = !empty($gstin) && strlen($gstin) >= 15;
            $clientStateCode = (strlen($gstin) >= 2) ? substr($gstin, 0, 2) : $companyStateCode;
            $isInterState = $clientStateCode !== $companyStateCode;

            $taxRate = (float) ($inv->tax_rate ?? 18);
            $totalVal = (float) $inv->total_amount;
            $taxAmount = (float) $inv->tax_amount;
            $taxableVal = (float) ($inv->subtotal > 0 ? $inv->subtotal : max(0, $totalVal - $taxAmount));

            $igst = $isInterState ? $taxAmount : 0;
            $cgst = $isInterState ? 0 : round($taxAmount / 2, 2);
            $sgst = $isInterState ? 0 : round($taxAmount - $cgst, 2);

            $record = [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'invoice_date' => Carbon::parse($inv->invoice_date)->toDateString(),
                'client_name' => $inv->client_name,
                'client_company' => $inv->client_company,
                'client_gstin' => $gstin ?: 'UNREGISTERED',
                'place_of_supply' => $clientStateCode . ' - ' . ($isInterState ? 'Inter-State' : 'Intra-State'),
                'invoice_value' => $totalVal,
                'taxable_value' => $taxableVal,
                'tax_rate' => $taxRate,
                'igst' => $igst,
                'cgst' => $cgst,
                'sgst' => $sgst,
                'total_tax' => $taxAmount,
                'reverse_charge' => 'N',
            ];

            if ($isB2b) {
                $b2bRecords[] = $record;
                $totalB2bTaxable += $taxableVal;
                $totalB2bIgst += $igst;
                $totalB2bCgst += $cgst;
                $totalB2bSgst += $sgst;
                $totalB2bInvoiceVal += $totalVal;
            } else {
                $b2cRecords[] = $record;
                $totalB2cTaxable += $taxableVal;
                $totalB2cIgst += $igst;
                $totalB2cCgst += $cgst;
                $totalB2cSgst += $sgst;
                $totalB2cInvoiceVal += $totalVal;
            }
        }

        // 2. Table 11A: Tax on Advances Received (Rule 50 Receipt Vouchers)
        $receiptVouchers = ReceiptVoucher::whereBetween('voucher_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->orderBy('voucher_date', 'asc')
            ->get();

        $table11aRecords = [];
        $total11aGross = 0;
        $total11aTaxable = 0;
        $total11aIgst = 0;
        $total11aCgst = 0;
        $total11aSgst = 0;

        foreach ($receiptVouchers as $rv) {
            $gross = (float) $rv->amount_received;
            $taxable = (float) $rv->taxable_amount;
            $igst = (float) $rv->igst_amount;
            $cgst = (float) $rv->cgst_amount;
            $sgst = (float) $rv->sgst_amount;

            $table11aRecords[] = [
                'id' => $rv->id,
                'voucher_number' => $rv->voucher_number,
                'voucher_date' => Carbon::parse($rv->voucher_date)->toDateString(),
                'client_name' => $rv->client_name,
                'place_of_supply' => $rv->place_of_supply ?: ($rv->is_inter_state ? 'Inter-State' : 'Intra-State'),
                'amount_received' => $gross,
                'taxable_amount' => $taxable,
                'tax_rate' => (float) ($rv->tax_rate ?? 18),
                'igst' => $igst,
                'cgst' => $cgst,
                'sgst' => $sgst,
                'status' => $rv->status,
                'remaining_advance' => (float) $rv->remaining_advance,
            ];

            $total11aGross += $gross;
            $total11aTaxable += $taxable;
            $total11aIgst += $igst;
            $total11aCgst += $cgst;
            $total11aSgst += $sgst;
        }

        // 3. Table 11B: Advance Adjustments on Invoices
        $advanceAdjustments = InvoiceAdvanceAdjustment::with(['invoice:id,invoice_number,invoice_date,client_name', 'receiptVoucher:id,voucher_number'])
            ->whereHas('invoice', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('invoice_date', [$startDate, $endDate]);
            })
            ->get();

        $table11bRecords = [];
        $total11bAdjusted = 0;

        foreach ($advanceAdjustments as $adj) {
            $amt = (float) $adj->adjusted_amount;
            $table11bRecords[] = [
                'id' => $adj->id,
                'invoice_number' => $adj->invoice->invoice_number ?? 'INV',
                'voucher_number' => $adj->receiptVoucher->voucher_number ?? 'RV',
                'adjusted_amount' => $amt,
                'invoice_date' => Carbon::parse($adj->invoice->invoice_date)->toDateString(),
                'client_name' => $adj->invoice->client_name ?? 'Client',
            ];
            $total11bAdjusted += $amt;
        }

        // 4. Table 13: Document Register
        $invRange = Invoice::whereBetween('invoice_date', [$startDate, $endDate])->orderBy('id', 'asc')->get();
        $rvRange = ReceiptVoucher::whereBetween('voucher_date', [$startDate, $endDate])->orderBy('id', 'asc')->get();
        $rfvRange = RefundVoucher::whereBetween('refund_date', [$startDate, $endDate])->orderBy('id', 'asc')->get();

        $docRegister = [
            [
                'nature_of_doc' => 'Invoices for Outward Supply (Rule 46)',
                'sr_from' => $invRange->first()->invoice_number ?? 'None',
                'sr_to' => $invRange->last()->invoice_number ?? 'None',
                'total_number' => $invRange->count(),
                'cancelled' => $invRange->where('status', 'cancelled')->count(),
                'net_issued' => $invRange->where('status', '!=', 'cancelled')->count(),
            ],
            [
                'nature_of_doc' => 'Receipt Vouchers for Advance (Rule 50)',
                'sr_from' => $rvRange->first()->voucher_number ?? 'None',
                'sr_to' => $rvRange->last()->voucher_number ?? 'None',
                'total_number' => $rvRange->count(),
                'cancelled' => $rvRange->where('status', 'cancelled')->count(),
                'net_issued' => $rvRange->where('status', '!=', 'cancelled')->count(),
            ],
            [
                'nature_of_doc' => 'Refund Vouchers (Rule 51)',
                'sr_from' => $rfvRange->first()->refund_number ?? 'None',
                'sr_to' => $rfvRange->last()->refund_number ?? 'None',
                'total_number' => $rfvRange->count(),
                'cancelled' => 0,
                'net_issued' => $rfvRange->count(),
            ],
        ];

        // 5. Input Tax Credit (ITC from Expenses)
        $itcExpenses = Expense::where('status', 'paid')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->where('tax_amount', '>', 0)
            ->get();

        $totalItcClaimed = (float) $itcExpenses->sum('tax_amount');

        // Net GSTR-3B Calculation
        $totalOutputTax = ($totalB2bIgst + $totalB2bCgst + $totalB2bSgst)
            + ($totalB2cIgst + $totalB2cCgst + $totalB2cSgst)
            + ($total11aIgst + $total11aCgst + $total11aSgst);

        $netGstPayable = max(0, $totalOutputTax - $totalItcClaimed);

        return response()->json([
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'label' => $periodLabel,
            ],
            'company_info' => [
                'gstin' => $companyGstin,
                'state_code' => $companyStateCode,
            ],
            'gstr3b_summary' => [
                'total_turnover' => $totalB2bInvoiceVal + $totalB2cInvoiceVal + $total11aGross,
                'taxable_turnover' => $totalB2bTaxable + $totalB2cTaxable + $total11aTaxable,
                'total_output_tax' => $totalOutputTax,
                'total_itc_claimed' => $totalItcClaimed,
                'net_gst_payable' => $netGstPayable,
            ],
            'table4_b2b' => [
                'records' => $b2bRecords,
                'totals' => [
                    'count' => count($b2bRecords),
                    'invoice_value' => $totalB2bInvoiceVal,
                    'taxable_value' => $totalB2bTaxable,
                    'igst' => $totalB2bIgst,
                    'cgst' => $totalB2bCgst,
                    'sgst' => $totalB2bSgst,
                    'total_tax' => $totalB2bIgst + $totalB2bCgst + $totalB2bSgst,
                ],
            ],
            'table7_b2c' => [
                'records' => $b2cRecords,
                'totals' => [
                    'count' => count($b2cRecords),
                    'invoice_value' => $totalB2cInvoiceVal,
                    'taxable_value' => $totalB2cTaxable,
                    'igst' => $totalB2cIgst,
                    'cgst' => $totalB2cCgst,
                    'sgst' => $totalB2cSgst,
                    'total_tax' => $totalB2cIgst + $totalB2cCgst + $totalB2cSgst,
                ],
            ],
            'table11a_advances' => [
                'records' => $table11aRecords,
                'totals' => [
                    'count' => count($table11aRecords),
                    'gross_amount' => $total11aGross,
                    'taxable_amount' => $total11aTaxable,
                    'igst' => $total11aIgst,
                    'cgst' => $total11aCgst,
                    'sgst' => $total11aSgst,
                    'total_tax' => $total11aIgst + $total11aCgst + $total11aSgst,
                ],
            ],
            'table11b_adjustments' => [
                'records' => $table11bRecords,
                'total_adjusted' => $total11bAdjusted,
            ],
            'table13_documents' => $docRegister,
        ]);
    }

    /**
     * 4. Accounts Receivable & Aging Ledger (Debtors)
     */
    public function receivables(Request $request)
    {
        $now = Carbon::now();

        $unpaidInvoices = Invoice::where('status', '!=', 'cancelled')
            ->where('status', '!=', 'paid')
            ->where('due_amount', '>', 0)
            ->orderBy('due_date', 'asc')
            ->get();

        $totalReceivables = 0;
        $bucket0to30 = 0;
        $bucket31to60 = 0;
        $bucket61to90 = 0;
        $bucket90plus = 0;

        $clientMap = [];
        $detailedInvoices = [];

        foreach ($unpaidInvoices as $inv) {
            $dueAmt = (float) $inv->due_amount;
            $totalReceivables += $dueAmt;

            $dueDate = $inv->due_date ? Carbon::parse($inv->due_date) : Carbon::parse($inv->invoice_date);
            $daysOverdue = max(0, $dueDate->diffInDays($now, false));

            if ($daysOverdue <= 30) {
                $bucket = '0-30 days';
                $bucket0to30 += $dueAmt;
            } elseif ($daysOverdue <= 60) {
                $bucket = '31-60 days';
                $bucket31to60 += $dueAmt;
            } elseif ($daysOverdue <= 90) {
                $bucket = '61-90 days';
                $bucket61to90 += $dueAmt;
            } else {
                $bucket = '90+ days';
                $bucket90plus += $dueAmt;
            }

            $clientId = $inv->client_id ?: 'C-' . md5($inv->client_name);
            if (!isset($clientMap[$clientId])) {
                $clientMap[$clientId] = [
                    'client_id' => $inv->client_id,
                    'client_name' => $inv->client_name,
                    'client_company' => $inv->client_company,
                    'client_email' => $inv->client_email,
                    'client_phone' => $inv->client_phone,
                    'total_due' => 0,
                    'total_invoiced' => 0,
                    'unpaid_invoices_count' => 0,
                    'oldest_due_date' => $dueDate->toDateString(),
                    'max_days_overdue' => 0,
                ];
            }

            $clientMap[$clientId]['total_due'] += $dueAmt;
            $clientMap[$clientId]['total_invoiced'] += (float) $inv->total_amount;
            $clientMap[$clientId]['unpaid_invoices_count']++;
            $clientMap[$clientId]['max_days_overdue'] = max($clientMap[$clientId]['max_days_overdue'], $daysOverdue);

            $detailedInvoices[] = [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'client_name' => $inv->client_name,
                'client_company' => $inv->client_company,
                'invoice_date' => Carbon::parse($inv->invoice_date)->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'total_amount' => (float) $inv->total_amount,
                'paid_amount' => (float) $inv->paid_amount,
                'due_amount' => $dueAmt,
                'days_overdue' => $daysOverdue,
                'bucket' => $bucket,
                'status' => $inv->status,
            ];
        }

        // Days Sales Outstanding (DSO) = (Total Receivables / Credit Sales in last 365 days) * 365
        $oneYearAgo = $now->copy()->subDays(365);
        $yearlySales = (float) Invoice::where('invoice_date', '>=', $oneYearAgo)
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $dso = $yearlySales > 0 ? round(($totalReceivables / $yearlySales) * 365) : 0;

        usort($clientMap, fn($a, $b) => $b['total_due'] <=> $a['total_due']);

        return response()->json([
            'summary' => [
                'total_receivables' => $totalReceivables,
                'dso_days' => $dso,
                'unpaid_invoices_count' => count($unpaidInvoices),
                'debtors_count' => count($clientMap),
            ],
            'aging_buckets' => [
                'current_0_30' => $bucket0to30,
                'overdue_31_60' => $bucket31to60,
                'overdue_61_90' => $bucket61to90,
                'overdue_90_plus' => $bucket90plus,
            ],
            'debtors' => array_values($clientMap),
            'invoices' => $detailedInvoices,
        ]);
    }

    /**
     * 5. Client Portfolio & Sales Conversion
     */
    public function clients(Request $request)
    {
        [$startDate, $endDate, $periodLabel] = $this->resolveDateRange($request);

        $clients = Client::all();
        $clientMetrics = [];
        $totalSystemRevenue = 0;

        foreach ($clients as $client) {
            $invoiced = (float) Invoice::where('client_id', $client->id)
                ->where('status', '!=', 'cancelled')
                ->whereBetween('invoice_date', [$startDate, $endDate])
                ->sum('total_amount');

            $collected = (float) InvoicePayment::whereHas('invoice', function ($q) use ($client) {
                $q->where('client_id', $client->id);
            })->whereBetween('payment_date', [$startDate, $endDate])->sum('amount');

            $outstanding = (float) Invoice::where('client_id', $client->id)
                ->where('status', '!=', 'cancelled')
                ->where('status', '!=', 'paid')
                ->sum('due_amount');

            $estimatesWon = Estimate::where('client_id', $client->id)
                ->whereIn('status', ['accepted', 'invoiced'])
                ->whereBetween('estimate_date', [$startDate, $endDate])
                ->count();

            $estimatesTotal = Estimate::where('client_id', $client->id)
                ->whereBetween('estimate_date', [$startDate, $endDate])
                ->count();

            $totalSystemRevenue += $invoiced;

            if ($invoiced > 0 || $collected > 0 || $outstanding > 0 || $estimatesTotal > 0) {
                $clientMetrics[] = [
                    'id' => $client->id,
                    'name' => $client->name,
                    'company_name' => $client->company_name ?: $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'gstin' => $client->gstin ?: 'Unregistered',
                    'city' => $client->city,
                    'state' => $client->state,
                    'total_invoiced' => $invoiced,
                    'total_collected' => $collected,
                    'total_outstanding' => $outstanding,
                    'estimates_won' => $estimatesWon,
                    'estimates_total' => $estimatesTotal,
                    'conversion_rate' => $estimatesTotal > 0 ? round(($estimatesWon / $estimatesTotal) * 100, 1) : 0,
                ];
            }
        }

        // Rank by total invoiced
        usort($clientMetrics, fn($a, $b) => $b['total_invoiced'] <=> $a['total_invoiced']);

        // Pareto concentration (Top 3 and Top 5 %)
        $top3Sum = array_sum(array_slice(array_column($clientMetrics, 'total_invoiced'), 0, 3));
        $top5Sum = array_sum(array_slice(array_column($clientMetrics, 'total_invoiced'), 0, 5));

        $top3Pct = $totalSystemRevenue > 0 ? round(($top3Sum / $totalSystemRevenue) * 100, 1) : 0;
        $top5Pct = $totalSystemRevenue > 0 ? round(($top5Sum / $totalSystemRevenue) * 100, 1) : 0;

        return response()->json([
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'label' => $periodLabel,
            ],
            'concentration' => [
                'total_revenue' => $totalSystemRevenue,
                'top_3_revenue' => $top3Sum,
                'top_3_pct' => $top3Pct,
                'top_5_revenue' => $top5Sum,
                'top_5_pct' => $top5Pct,
            ],
            'clients' => $clientMetrics,
        ]);
    }

    /**
     * 6. Project Profitability & Cost Margin Ledger
     */
    public function projects(Request $request)
    {
        $projects = Project::with(['client:id,name,company_name'])
            ->orderBy('id', 'desc')
            ->get();

        $projectMetrics = [];
        $totalTurnover = 0;
        $totalDirectCost = 0;

        foreach ($projects as $proj) {
            $invoiced = (float) Invoice::where('project_id', $proj->id)
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');

            $collected = (float) InvoicePayment::whereHas('invoice', function ($q) use ($proj) {
                $q->where('project_id', $proj->id);
            })->sum('amount');

            $outstanding = (float) Invoice::where('project_id', $proj->id)
                ->where('status', '!=', 'cancelled')
                ->where('status', '!=', 'paid')
                ->sum('due_amount');

            // Direct expenses logged for this project (via description match or future relation)
            $expenses = (float) Expense::where('status', 'paid')
                ->where(function ($q) use ($proj) {
                    $q->where('title', 'like', "%{$proj->name}%")
                      ->orWhere('description', 'like', "%{$proj->name}%");
                })
                ->sum('total_amount');

            $grossMargin = $invoiced - $expenses;
            $marginPct = $invoiced > 0 ? round(($grossMargin / $invoiced) * 100, 1) : 0;

            $totalTurnover += $invoiced;
            $totalDirectCost += $expenses;

            $projectMetrics[] = [
                'id' => $proj->id,
                'name' => $proj->name,
                'client_name' => $proj->client->company_name ?? $proj->client->name ?? 'Internal',
                'status' => $proj->status,
                'start_date' => $proj->start_date ? Carbon::parse($proj->start_date)->toDateString() : null,
                'deadline' => $proj->deadline ? Carbon::parse($proj->deadline)->toDateString() : null,
                'budget' => (float) ($proj->budget ?? 0),
                'total_invoiced' => $invoiced,
                'total_collected' => $collected,
                'total_outstanding' => $outstanding,
                'total_expenses' => $expenses,
                'gross_margin' => $grossMargin,
                'margin_pct' => $marginPct,
            ];
        }

        $overallNetMargin = $totalTurnover - $totalDirectCost;
        $overallMarginPct = $totalTurnover > 0 ? round(($overallNetMargin / $totalTurnover) * 100, 1) : 0;

        return response()->json([
            'summary' => [
                'total_projects' => count($projects),
                'total_turnover' => $totalTurnover,
                'total_direct_cost' => $totalDirectCost,
                'overall_margin' => $overallNetMargin,
                'overall_margin_pct' => $overallMarginPct,
            ],
            'projects' => $projectMetrics,
        ]);
    }

    /**
     * 7. Streamed CSV Export
     */
    public function export(Request $request, string $type)
    {
        [$startDate, $endDate, $periodLabel] = $this->resolveDateRange($request);
        $filename = "Kabhyan_Report_{$type}_{$periodLabel}.csv";

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return new StreamedResponse(function () use ($type, $startDate, $endDate) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel compatibility

            if ($type === 'gst') {
                fputcsv($handle, ['GST SCHEDULE: OUTWARD SUPPLIES (TAX INVOICES)']);
                fputcsv($handle, ['Invoice No', 'Date', 'Client Name', 'Client GSTIN', 'Place of Supply', 'Taxable Value (INR)', 'IGST', 'CGST', 'SGST', 'Total Invoice Value (INR)']);

                $invoices = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
                    ->where('status', '!=', 'cancelled')
                    ->get();

                foreach ($invoices as $inv) {
                    $taxAmount = (float) $inv->tax_amount;
                    $taxable = (float) ($inv->subtotal > 0 ? $inv->subtotal : max(0, $inv->total_amount - $taxAmount));
                    $isInterState = substr((string)$inv->client_gstin, 0, 2) !== '18' && !empty($inv->client_gstin);

                    fputcsv($handle, [
                        $inv->invoice_number,
                        $inv->invoice_date,
                        $inv->client_name,
                        $inv->client_gstin ?: 'UNREGISTERED',
                        $inv->client_gstin ? substr($inv->client_gstin, 0, 2) : '18',
                        number_format($taxable, 2, '.', ''),
                        $isInterState ? number_format($taxAmount, 2, '.', '') : '0.00',
                        !$isInterState ? number_format($taxAmount / 2, 2, '.', '') : '0.00',
                        !$isInterState ? number_format($taxAmount / 2, 2, '.', '') : '0.00',
                        number_format($inv->total_amount, 2, '.', ''),
                    ]);
                }

                fputcsv($handle, []);
                fputcsv($handle, ['GST SCHEDULE: RULE 50 RECEIPT VOUCHERS (ADVANCES)']);
                fputcsv($handle, ['Voucher No', 'Date', 'Client Name', 'Place of Supply', 'Taxable Advance', 'IGST', 'CGST', 'SGST', 'Amount Received']);

                $vouchers = ReceiptVoucher::whereBetween('voucher_date', [$startDate, $endDate])
                    ->where('status', '!=', 'cancelled')
                    ->get();

                foreach ($vouchers as $rv) {
                    fputcsv($handle, [
                        $rv->voucher_number,
                        $rv->voucher_date,
                        $rv->client_name,
                        $rv->place_of_supply ?: 'Intra-State',
                        number_format($rv->taxable_amount, 2, '.', ''),
                        number_format($rv->igst_amount, 2, '.', ''),
                        number_format($rv->cgst_amount, 2, '.', ''),
                        number_format($rv->sgst_amount, 2, '.', ''),
                        number_format($rv->amount_received, 2, '.', ''),
                    ]);
                }
            } elseif ($type === 'receivables') {
                fputcsv($handle, ['ACCOUNTS RECEIVABLE & DEBTORS AGING LEDGER']);
                fputcsv($handle, ['Invoice No', 'Client Name', 'Company', 'Phone', 'Invoice Date', 'Due Date', 'Days Overdue', 'Aging Bucket', 'Total Invoiced', 'Paid Amount', 'Due Balance']);

                $invoices = Invoice::where('status', '!=', 'cancelled')
                    ->where('status', '!=', 'paid')
                    ->where('due_amount', '>', 0)
                    ->orderBy('due_date', 'asc')
                    ->get();

                $now = Carbon::now();
                foreach ($invoices as $inv) {
                    $due = $inv->due_date ? Carbon::parse($inv->due_date) : Carbon::parse($inv->invoice_date);
                    $days = max(0, $due->diffInDays($now, false));
                    $bucket = $days <= 30 ? '0-30 days' : ($days <= 60 ? '31-60 days' : ($days <= 90 ? '61-90 days' : '90+ days'));

                    fputcsv($handle, [
                        $inv->invoice_number,
                        $inv->client_name,
                        $inv->client_company,
                        $inv->client_phone,
                        $inv->invoice_date,
                        $due->toDateString(),
                        $days,
                        $bucket,
                        number_format($inv->total_amount, 2, '.', ''),
                        number_format($inv->paid_amount, 2, '.', ''),
                        number_format($inv->due_amount, 2, '.', ''),
                    ]);
                }
            } elseif ($type === 'revenue') {
                fputcsv($handle, ['INCOME VS EXPENSE & CASH FLOW STATEMENT']);
                fputcsv($handle, ['Date', 'Type', 'Reference / Title', 'Party', 'Payment Mode', 'Amount (INR)']);

                $payments = InvoicePayment::whereHas('invoice', function ($q) {
                    $q->where('status', '!=', 'cancelled');
                })->with('invoice')->whereBetween('payment_date', [$startDate, $endDate])->get();
                foreach ($payments as $p) {
                    fputcsv($handle, [
                        $p->payment_date,
                        'INFLOW (Payment)',
                        $p->invoice->invoice_number ?? 'Invoice Payment',
                        $p->invoice->client_name ?? 'Client',
                        $p->payment_method ?? 'Direct',
                        number_format($p->amount, 2, '.', ''),
                    ]);
                }

                $expenses = Expense::where('status', 'paid')->whereBetween('expense_date', [$startDate, $endDate])->get();
                foreach ($expenses as $e) {
                    fputcsv($handle, [
                        $e->expense_date,
                        'OUTFLOW (Expense)',
                        $e->title,
                        $e->vendor_name ?: 'Vendor',
                        $e->payment_method ?? 'Direct',
                        number_format($e->total_amount, 2, '.', ''),
                    ]);
                }
            }

            fclose($handle);
        }, 200, $headers);
    }
}
