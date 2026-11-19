"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ReportHeader from "@/components/ReportHeader";
import { api, ReportRevenueResponse } from "@/lib/api";
import { getCurrentFiscalYear } from "@/lib/fiscalYear";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  PieChart,
  BarChart3,
  Percent,
} from "lucide-react";

export default function RevenueReportsPage() {
  const [fy, setFy] = useState(getCurrentFiscalYear());
  const [quarter, setQuarter] = useState("");
  const [data, setData] = useState<ReportRevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const qParam = quarter ? `&quarter=${quarter}` : "";
      const res = await api.request<ReportRevenueResponse>(`/reports/revenue?fy=${fy}${qParam}`);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load revenue report:", err);
      setError(err?.message || "Failed to load revenue report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fy, quarter]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amt || 0);
  };

  const maxMonthlyVal = data
    ? Math.max(
        ...data.monthly.map((m) => Math.max(m.total_inflow, m.expense)),
        50000
      )
    : 100000;

  return (
    <AdminLayout>
      <ReportHeader
        title="Revenue & Profit & Loss Statement"
        subtitle="Monthly cash movements, quarterly accruals, and operating margin analytics."
        icon={<TrendingUp className="w-4 h-4" />}
        exportType="revenue"
        fy={fy}
        setFy={setFy}
        quarter={quarter}
        setQuarter={setQuarter}
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">
            Calculating revenue realization and operating margins...
          </p>
        </div>
      ) : error || !data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl p-8 text-center">
          <TrendingDown className="w-10 h-10 text-rose-500" />
          <div className="text-base font-bold text-slate-900">Unable to load revenue statement</div>
          <p className="text-xs text-slate-500 max-w-sm">{error || "Data is currently unavailable."}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Total Invoiced (Accrual)
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(data.summary.total_invoiced)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">Gross invoices issued in period</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Total Realized Inflow
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(data.summary.total_inflow)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">Collections & advance vouchers</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Operating Expenses
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(data.summary.total_expense)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">Approved company disbursements</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Net Operating Margin
              </span>
              <div
                className={`text-xl sm:text-2xl font-bold mt-1 ${
                  data.summary.net_profit >= 0 ? "text-slate-900" : "text-rose-600"
                }`}
              >
                {formatCurrency(data.summary.net_profit)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                <span
                  className={`font-bold ${
                    data.summary.net_margin_pct >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {data.summary.net_margin_pct}%
                </span>{" "}
                Net cash margin
              </p>
            </div>
          </div>

          {/* Monthly Comparison Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Monthly Inflow vs Expenses Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Visual trend comparing total cash received against operational outflows.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                  <span className="text-slate-700">Cash Inflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-400" />
                  <span className="text-slate-700">Expenses</span>
                </div>
              </div>
            </div>

            {/* Bars Container */}
            <div className="h-64 flex items-end justify-between gap-1 sm:gap-3 pt-6 border-b border-slate-200">
              {data.monthly.map((m, idx) => {
                const inflowHeight = (m.total_inflow / maxMonthlyVal) * 100;
                const expenseHeight = (m.expense / maxMonthlyVal) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                      {/* Inflow Bar */}
                      <div
                        style={{ height: `${Math.max(inflowHeight, 4)}%` }}
                        className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition relative"
                        title={`${m.month} Inflow: ${formatCurrency(m.total_inflow)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                        className="w-1/2 max-w-[20px] bg-rose-400 hover:bg-rose-500 rounded-t-sm transition relative"
                        title={`${m.month} Expense: ${formatCurrency(m.expense)}`}
                      />
                    </div>
                    <span className="text-3xs sm:text-2xs font-semibold text-slate-500 mt-2 truncate">
                      {m.short_month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quarterly Performance Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Quarterly Accrual & Cash Ledger</h3>
              <p className="text-xs text-slate-500">
                Performance grouped by standard fiscal quarters.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-2.5 px-4">Fiscal Quarter</th>
                    <th className="py-2.5 px-4 text-right">Invoiced (Accrual)</th>
                    <th className="py-2.5 px-4 text-right">Collected Inflow</th>
                    <th className="py-2.5 px-4 text-right">Expenses Paid</th>
                    <th className="py-2.5 px-4 text-right">Net Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {Object.entries(data.quarters).map(([qKey, qVal]) => (
                    <tr key={qKey} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{qKey}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(qVal.invoiced)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(qVal.collected)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {formatCurrency(qVal.expense)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          qVal.net >= 0 ? "text-slate-900" : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(qVal.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Detailed Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Monthly Detailed Breakdown</h3>
              <p className="text-xs text-slate-500">Complete month-by-month financial summary.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-2.5 px-4">Month</th>
                    <th className="py-2.5 px-4 text-right">Invoiced</th>
                    <th className="py-2.5 px-4 text-right">Inflow (Collections + Adv)</th>
                    <th className="py-2.5 px-4 text-right">Operating Expenses</th>
                    <th className="py-2.5 px-4 text-right">Net Profit</th>
                    <th className="py-2.5 px-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.monthly.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{m.month}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">
                        {formatCurrency(m.invoiced)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(m.total_inflow)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700">
                        {formatCurrency(m.expense)}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold ${
                          m.net_profit >= 0 ? "text-slate-900" : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(m.net_profit)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded text-3xs ${
                            m.margin_pct >= 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {m.margin_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
