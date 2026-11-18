"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ReportHeader from "@/components/ReportHeader";
import { api, ReportReceivablesResponse } from "@/lib/api";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  Calendar,
  ChevronRight,
  Loader2,
  TrendingUp,
} from "lucide-react";

export default function ReceivablesReportsPage() {
  const [data, setData] = useState<ReportReceivablesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string>("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.request<ReportReceivablesResponse>("/reports/receivables");
      setData(res);
    } catch (err: any) {
      console.error("Failed to load receivables report:", err);
      setError(err?.message || "Failed to load receivables report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amt || 0);
  };

  const filteredInvoices = data
    ? data.invoices.filter((inv) => {
        if (selectedBucket === "all") return true;
        return inv.bucket === selectedBucket;
      })
    : [];

  const total = data?.summary.total_receivables || 1;
  const b0_30 = data?.aging_buckets.current_0_30 || 0;
  const b31_60 = data?.aging_buckets.overdue_31_60 || 0;
  const b61_90 = data?.aging_buckets.overdue_61_90 || 0;
  const b90_plus = data?.aging_buckets.overdue_90_plus || 0;

  return (
    <AdminLayout>
      <ReportHeader
        title="Accounts Receivable & Debtors Aging Ledger"
        subtitle="Outstanding balances segmented by standard 30-day aging buckets and DSO analysis."
        icon={<Clock className="w-4 h-4" />}
        exportType="receivables"
        showQuarterFilter={false}
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">
            Scanning receivables and calculating debtor aging schedules...
          </p>
        </div>
      ) : error || !data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <div className="text-base font-bold text-slate-900">Unable to load receivables aging</div>
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
                Total Receivables
              </span>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(data.summary.total_receivables)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                Across {data.summary.unpaid_invoices_count} pending invoices
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Days Sales Outstanding (DSO)
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {data.summary.dso_days} Days
              </div>
              <p className="text-2xs text-slate-500 mt-1">Average collection cycle</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Active Debtors
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {data.summary.debtors_count} Corporate Clients
              </div>
              <p className="text-2xs text-slate-500 mt-1">Clients with balances due</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Critical Overdue (&gt;90d)
              </span>
              <div
                className={`text-xl sm:text-2xl font-bold mt-1 ${
                  b90_plus > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(b90_plus)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">High-risk recovery balance</p>
            </div>
          </div>

          {/* Aging Distribution Visual Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Aging Bucket Allocation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time distribution of outstanding amounts by overdue timeframe.
            </p>

            {/* Distribution Segment Bar */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(b0_30 / total) * 100}%` }}
                className="bg-emerald-500 hover:opacity-90 transition relative"
                title={`Current (0-30d): ${formatCurrency(b0_30)}`}
              />
              <div
                style={{ width: `${(b31_60 / total) * 100}%` }}
                className="bg-amber-400 hover:opacity-90 transition relative"
                title={`Overdue 31-60d: ${formatCurrency(b31_60)}`}
              />
              <div
                style={{ width: `${(b61_90 / total) * 100}%` }}
                className="bg-orange-500 hover:opacity-90 transition relative"
                title={`Overdue 61-90d: ${formatCurrency(b61_90)}`}
              />
              <div
                style={{ width: `${(b90_plus / total) * 100}%` }}
                className="bg-rose-500 hover:opacity-90 transition relative"
                title={`Critical >90d: ${formatCurrency(b90_plus)}`}
              />
            </div>

            {/* Legend & Bucket Filter Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <button
                type="button"
                onClick={() => setSelectedBucket(selectedBucket === "0-30 days" ? "all" : "0-30 days")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  selectedBucket === "0-30 days"
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  0–30 Days (Current)
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatCurrency(b0_30)}
                </div>
                <div className="text-3xs text-slate-500 mt-0.5">
                  {total > 0 ? Math.round((b0_30 / total) * 100) : 0}% of receivables
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBucket(selectedBucket === "31-60 days" ? "all" : "31-60 days")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  selectedBucket === "31-60 days"
                    ? "border-amber-500 bg-amber-50/50"
                    : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  31–60 Days Overdue
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatCurrency(b31_60)}
                </div>
                <div className="text-3xs text-slate-500 mt-0.5">
                  {total > 0 ? Math.round((b31_60 / total) * 100) : 0}% of receivables
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBucket(selectedBucket === "61-90 days" ? "all" : "61-90 days")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  selectedBucket === "61-90 days"
                    ? "border-orange-500 bg-orange-50/50"
                    : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  61–90 Days Overdue
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatCurrency(b61_90)}
                </div>
                <div className="text-3xs text-slate-500 mt-0.5">
                  {total > 0 ? Math.round((b61_90 / total) * 100) : 0}% of receivables
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBucket(selectedBucket === "90+ days" ? "all" : "90+ days")}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  selectedBucket === "90+ days"
                    ? "border-rose-500 bg-rose-50/50"
                    : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  &gt;90 Days (Critical)
                </div>
                <div className="text-sm font-bold text-rose-600 mt-1">
                  {formatCurrency(b90_plus)}
                </div>
                <div className="text-3xs text-slate-500 mt-0.5">
                  {total > 0 ? Math.round((b90_plus / total) * 100) : 0}% of receivables
                </div>
              </button>
            </div>
          </div>

          {/* Client Debtors Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Debtor Accounts Ranking</h3>
                <p className="text-xs text-slate-500">
                  Clients ranked by total outstanding balance due.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {data.debtors.length} Accounts with balance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-2.5 px-4">Client Company</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4 text-center">Unpaid Invoices</th>
                    <th className="py-2.5 px-4 text-right">Total Invoiced</th>
                    <th className="py-2.5 px-4 text-right">Balance Due</th>
                    <th className="py-2.5 px-4 text-right">Max Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.debtors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Zero pending receivables! All issued invoices are fully paid.
                      </td>
                    </tr>
                  ) : (
                    data.debtors.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {d.client_company || d.client_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {d.client_phone || d.client_email || "-"}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {d.unpaid_invoices_count}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {formatCurrency(d.total_invoiced)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">
                          {formatCurrency(d.total_due)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                              d.max_days_overdue > 60
                                ? "bg-rose-50 text-rose-700"
                                : d.max_days_overdue > 30
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {d.max_days_overdue} days
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Pending Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Individual Pending Invoices</h3>
                <p className="text-xs text-slate-500">
                  Drill down into individual unpaid tax invoices.
                </p>
              </div>
              {selectedBucket !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedBucket("all")}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Clear filter (Show all {data.invoices.length} invoices)
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Invoice Date</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4 text-right">Invoice Value</th>
                    <th className="py-2.5 px-4 text-right">Paid</th>
                    <th className="py-2.5 px-4 text-right">Due Balance</th>
                    <th className="py-2.5 px-4 text-center">Aging Bucket</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No invoices match the selected aging filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {inv.client_company || inv.client_name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{inv.invoice_date}</td>
                        <td className="py-2.5 px-4 text-slate-600">{inv.due_date}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">
                          {formatCurrency(inv.total_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">
                          {formatCurrency(inv.paid_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-amber-600">
                          {formatCurrency(inv.due_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                              inv.bucket === "90+ days"
                                ? "bg-rose-50 text-rose-700"
                                : inv.bucket === "61-90 days"
                                ? "bg-orange-50 text-orange-700"
                                : inv.bucket === "31-60 days"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {inv.bucket}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Link
                            href={`/dashboard/invoices`}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
