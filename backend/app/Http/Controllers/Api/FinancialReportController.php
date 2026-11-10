<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancialReportController extends Controller
{
    /**
     * Get Income vs Expense report, P&L statement, category breakdowns and monthly charts.
     */
    public function incomeVsExpense(Request $request)
    {
        $year = $request->input('year', date('Y'));

        // 1. Total Inflow (Collected from Clients via Invoices)
        $totalCollectedIncome = (float) InvoicePayment::whereYear('payment_date', $year)->sum('amount');
        
        // In case there are invoices paid directly
        $totalInvoicedGross = (float) Invoice::whereYear('invoice_date', $year)->sum('total_amount');
        $totalOutstandingDue = (float) Invoice::whereYear('invoice_date', $year)->sum('due_amount');

        // 2. Total Outflow (Expenses Paid)
        $totalExpensesPaid = (float) Expense::where('status', 'paid')
            ->whereYear('expense_date', $year)
            ->sum('total_amount');

        $totalInputGstCredit = (float) Expense::where('status', 'paid')
            ->whereYear('expense_date', $year)
            ->sum('tax_amount');

        // Net Operating Profit / Margin
        $netOperatingProfit = $totalCollectedIncome - $totalExpensesPaid;
        $profitMargin = $totalCollectedIncome > 0 ? round(($netOperatingProfit / $totalCollectedIncome) * 100, 2) : 0;

        // 3. Monthly Breakdown (Jan - Dec)
        $monthlyData = [];
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for ($m = 1; $m <= 12; $m++) {
            $monthIncome = (float) InvoicePayment::whereYear('payment_date', $year)
                ->whereMonth('payment_date', $m)
                ->sum('amount');

            $monthExpense = (float) Expense::where('status', 'paid')
                ->whereYear('expense_date', $year)
                ->whereMonth('expense_date', $m)
                ->sum('total_amount');

            $monthlyData[] = [
                'month' => $months[$m - 1],
                'month_number' => $m,
                'income' => $monthIncome,
                'expense' => $monthExpense,
                'net' => $monthIncome - $monthExpense,
            ];
        }

        // 4. Expenses by Category Breakdown
        $categoryBreakdown = ExpenseCategory::withSum(['expenses' => function ($q) use ($year) {
            $q->where('status', 'paid')->whereYear('expense_date', $year);
        }], 'total_amount')
        ->get()
        ->map(function ($cat) {
            return [
                'id' => $cat->id,
                'name' => $cat->name,
                'color' => $cat->color,
                'total_amount' => (float) ($cat->expenses_sum_total_amount ?? 0),
            ];
        })
        ->filter(fn($c) => $c['total_amount'] > 0)
        ->values();

        // 5. Recent Cashflow Activity (Last 10 transactions of Income & Expense combined)
        $recentIncome = InvoicePayment::with('invoice')
            ->orderBy('payment_date', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => 'INC-' . $p->id,
                    'type' => 'income',
                    'title' => 'Invoice Payment: ' . ($p->invoice->invoice_number ?? 'Direct'),
                    'party' => $p->invoice->client_name ?? 'Client',
                    'date' => $p->payment_date->toDateString(),
                    'amount' => (float) $p->amount,
                    'method' => $p->payment_method,
                    'reference' => $p->transaction_reference,
                    'status' => 'received',
                ];
            });

        $recentExpenses = Expense::with('category')
            ->orderBy('expense_date', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($e) {
                return [
                    'id' => 'EXP-' . $e->id,
                    'type' => 'expense',
                    'title' => $e->title,
                    'party' => $e->vendor_name ?? ($e->category->name ?? 'Vendor'),
                    'date' => $e->expense_date->toDateString(),
                    'amount' => (float) $e->total_amount,
                    'method' => $e->payment_method,
                    'reference' => $e->transaction_reference,
                    'status' => $e->status,
                ];
            });

        $recentTransactions = $recentIncome->concat($recentExpenses)
            ->sortByDesc('date')
            ->values()
            ->take(10);

        return response()->json([
            'summary' => [
                'year' => (int) $year,
                'total_collected_income' => $totalCollectedIncome,
                'total_invoiced_gross' => $totalInvoicedGross,
                'total_outstanding_due' => $totalOutstandingDue,
                'total_expenses_paid' => $totalExpensesPaid,
                'total_input_gst_credit' => $totalInputGstCredit,
                'net_operating_profit' => $netOperatingProfit,
                'profit_margin' => $profitMargin,
            ],
            'monthly' => $monthlyData,
            'category_breakdown' => $categoryBreakdown,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}

