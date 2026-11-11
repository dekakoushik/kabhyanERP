"use client";

import { useEffect, useState, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, FinancialReportResponse, CashflowTransaction } from "@/lib/api";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Building2,
  PieChart,
  BarChart3,
  FileCheck,
  Receipt,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Printer,
} from "lucide-react";

function AccountsContent() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [data, setData] = useState<FinancialReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/financial-reports/income-vs-expense?year=${year}`);
      setData(res);
    } catch (err) {
      console.error("Failed to load financial report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  if (loading || !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Generating Income vs Expense Accounts Ledger...</p>
      </div>
    );
  }

  const { summary, monthly, category_breakdown, recent_transactions } = data;

  // Find max value in monthly for scaling chart bars
  const maxMonthlyVal = Math.max(
    ...monthly.map((m) => Math.max(m.income, m.expense)),
    100000
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </span>
            Income vs Expense (P&L Ledger)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time cashflow analytics, revenue realization, operational expenses, and net profit margin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={currentYear}>FY {currentYear}</option>
              <option value={currentYear - 1}>FY {currentYear - 1}</option>
              <option value={currentYear - 2}>FY {currentYear - 2}</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF Report</span>
          </button>

          <Link
            href="/dashboard/expenses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </Link>
        </div>
      </div>

      {/* Official Printable Statement Banner (Only visible during print) */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">KABHYAN TECHNOLOGIES PRIVATE LIMITED</h2>
            <p className="text-xs text-slate-500 font-medium">Annual Financial Accounts & Cashflow Statement (FY {year})</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
            <p className="text-[10px] text-slate-400">Enterprise Audited Report</p>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Income Realized</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-emerald-700 mt-2">
            ₹{Number(summary.total_collected_income).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>Invoiced Gross:</span>
            <strong className="font-mono text-slate-700">
              ₹{Number(summary.total_invoiced_gross).toLocaleString("en-IN")}
            </strong>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Total Expenses Paid */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses Paid</span>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-red-600 mt-2">
            ₹{Number(summary.total_expenses_paid).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>Input GST Credit:</span>
            <strong className="font-mono text-slate-700">
              ₹{Number(summary.total_input_gst_credit).toLocaleString("en-IN")}
            </strong>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Operating Profit</span>
            <div className={`p-2.5 rounded-xl ${summary.net_operating_profit >= 0 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-mono font-black mt-2 ${summary.net_operating_profit >= 0 ? "text-blue-900" : "text-amber-700"}`}>
            ₹{Number(summary.net_operating_profit).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${summary.profit_margin >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {summary.profit_margin}% Margin
            </span>
            <span>Operating health</span>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${summary.net_operating_profit >= 0 ? "bg-blue-600" : "bg-amber-500"}`} />
        </div>

        {/* Outstanding Client Receivables */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Due</span>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-amber-700 mt-2">
            ₹{Number(summary.total_outstanding_due).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>Pending collection across clients</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>
      </div>

      {/* Monthly Comparative Chart Bar Graph */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Monthly Cashflow Trend ({year})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side comparison of Income received vs Operating Expenses.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-600">Income (Collections)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-400" />
              <span className="text-slate-600">Expenses (Payouts)</span>
            </div>
          </div>
        </div>

        {/* Bar Visualization */}
        <div className="pt-8">
          <div className="grid grid-cols-12 gap-2 sm:gap-4 h-64 items-end pb-4 border-b border-slate-200">
            {monthly.map((m) => {
              const incomeHeight = maxMonthlyVal > 0 ? (m.income / maxMonthlyVal) * 100 : 0;
              const expenseHeight = maxMonthlyVal > 0 ? (m.expense / maxMonthlyVal) * 100 : 0;

              return (
                <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                  <div className="flex items-end gap-1 w-full justify-center h-full pb-1">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(incomeHeight, 2)}%` }}
                      className={`w-2.5 sm:w-5 rounded-t-sm transition-all duration-300 ${
                        m.income > 0 ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-100"
                      }`}
                      title={`${m.month} Income: ₹${m.income.toLocaleString("en-IN")}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                      className={`w-2.5 sm:w-5 rounded-t-sm transition-all duration-300 ${
                        m.expense > 0 ? "bg-red-400 hover:bg-red-500" : "bg-slate-100"
                      }`}
                      title={`${m.month} Expense: ₹${m.expense.toLocaleString("en-IN")}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-2">{m.month}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Net Insight Row */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Average Monthly Revenue</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">
                ₹{Math.round(summary.total_collected_income / 12).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Average Monthly Burn</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">
                ₹{Math.round(summary.total_expenses_paid / 12).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cash Flow Multiple</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">
                {summary.total_expenses_paid > 0
                  ? (summary.total_collected_income / summary.total_expenses_paid).toFixed(2) + "x"
                  : "N/A"}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tax Deductible Ratio</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">
                {summary.total_expenses_paid > 0
                  ? ((summary.total_input_gst_credit / summary.total_expenses_paid) * 100).toFixed(1) + "%"
                  : "0%"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Category Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <PieChart className="w-5 h-5 text-purple-600" />
              Expense by Category
            </h3>
            <p className="text-xs text-slate-500 mb-6">Distribution of corporate spending in {year}.</p>

            <div className="space-y-4">
              {category_breakdown.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No expenses recorded for this fiscal period.</p>
              ) : (
                category_breakdown.map((cat) => {
                  const pct = summary.total_expenses_paid > 0
                    ? ((cat.total_amount / summary.total_expenses_paid) * 100).toFixed(1)
                    : "0";
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            ₹{Number(cat.total_amount).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Link
              href="/dashboard/expenses"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition"
            >
              <span>Manage Detailed Expenses</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Combined Cashflow Transactions Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Cashflow Movements</h3>
              <p className="text-xs text-slate-500 mt-0.5">Unified ledger of customer receipts & vendor disbursements.</p>
            </div>
            <Link
              href="/dashboard/invoices"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Tax Invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recent_transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No recent transactions found.
              </div>
            ) : (
              recent_transactions.map((txn) => (
                <div key={txn.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        txn.type === "income"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {txn.type === "income" ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{txn.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{txn.party}</span>
                        <span>•</span>
                        <span className="font-mono">{txn.date}</span>
                        {txn.reference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-400">{txn.reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono font-bold text-sm ${
                        txn.type === "income" ? "text-emerald-700" : "text-slate-900"
                      }`}
                    >
                      {txn.type === "income" ? "+" : "-"}₹
                      {Number(txn.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                        txn.type === "income" ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100"
                      }`}
                    >
                      {txn.method.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Financial Ledger...</p>
          </div>
        }
      >
        <AccountsContent />
      </Suspense>
    </AdminLayout>
  );
}

