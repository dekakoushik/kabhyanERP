"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ReportHeader from "@/components/ReportHeader";
import { api, ReportOverviewResponse } from "@/lib/api";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Clock,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Loader2,
  BarChart3,
  Percent,
} from "lucide-react";

export default function ReportsOverviewPage() {
  const [fy, setFy] = useState("2026-2027");
  const [quarter, setQuarter] = useState("");
  const [data, setData] = useState<ReportOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const qParam = quarter ? `&quarter=${quarter}` : "";
      const res = await api.request<ReportOverviewResponse>(`/reports/overview?fy=${fy}${qParam}`);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load reports overview:", err);
      setError(err?.message || "Failed to load reports overview.");
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

  return (
    <AdminLayout>
      <ReportHeader
        title="Executive Reports & Business Intelligence"
        subtitle="Consolidated financial analytics, tax compliance, and performance metrics."
        icon={<BarChart3 className="w-4 h-4" />}
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
            Synthesizing corporate metrics and financial ledgers...
          </p>
        </div>
      ) : error || !data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div className="text-base font-bold text-slate-900">Unable to load reports overview</div>
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
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Invoiced Turnover */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Invoiced Turnover
                </span>
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {formatCurrency(data.kpis.invoiced_gross)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Taxable: {formatCurrency(data.kpis.invoiced_taxable)}
                </span>
              </div>
            </div>

            {/* 2. Collections Cash Inflow */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Realized Cash Inflow
                </span>
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                {formatCurrency(data.kpis.total_inflow)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">
                  {data.kpis.realization_rate}% Realized
                </span>
                <span>• Advances: {formatCurrency(data.kpis.advances_received)}</span>
              </div>
            </div>

            {/* 3. Outstanding Receivables */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Pending Receivables
                </span>
                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-600">
                {formatCurrency(data.kpis.outstanding_due)}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <Link
                  href="/dashboard/reports/receivables"
                  className="font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  View Debtors <ChevronRight className="w-3 h-3" />
                </Link>
                <span className="text-slate-400">Across unpaid invoices</span>
              </div>
            </div>

            {/* 4. Net Operating Profit */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Net Operating Profit
                </span>
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div
                className={`text-xl sm:text-2xl font-bold ${
                  data.kpis.net_profit >= 0 ? "text-slate-900" : "text-rose-600"
                }`}
              >
                {formatCurrency(data.kpis.net_profit)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span
                  className={`font-semibold px-1.5 py-0.5 rounded ${
                    data.kpis.net_margin_pct >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {data.kpis.net_margin_pct}% Margin
                </span>
                <span>• Expenses: {formatCurrency(data.kpis.expenses_paid)}</span>
              </div>
            </div>
          </div>

          {/* Secondary Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GST Net Position */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Net GST Liability
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(data.kpis.net_gst_payable)}
                </div>
                <div className="text-2xs text-slate-500 mt-0.5">
                  Output: {formatCurrency(data.kpis.output_gst)} | ITC: {formatCurrency(data.kpis.input_gst)}
                </div>
              </div>
              <Link
                href="/dashboard/reports/gst"
                className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition"
              >
                <Receipt className="w-4 h-4" />
              </Link>
            </div>

            {/* Active Projects */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Active Projects
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {data.kpis.active_projects} In Delivery
                </div>
                <div className="text-2xs text-slate-500 mt-0.5">
                  Portfolio margin tracking active
                </div>
              </div>
              <Link
                href="/dashboard/reports/projects"
                className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition"
              >
                <Briefcase className="w-4 h-4" />
              </Link>
            </div>

            {/* Client Portfolio */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Active Client Base
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {data.kpis.total_clients} Corporate Accounts
                </div>
                <div className="text-2xs text-slate-500 mt-0.5">
                  Concentration & LTV analysis
                </div>
              </div>
              <Link
                href="/dashboard/reports/clients"
                className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition"
              >
                <Users className="w-4 h-4" />
              </Link>
            </div>

            {/* Quotation Pipeline Win Rate */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Quotation Win Rate
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {data.kpis.estimate_win_rate}% Won
                </div>
                <div className="text-2xs text-slate-500 mt-0.5">
                  {data.kpis.accepted_estimates_count} Accepted in period
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-purple-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Jump Specialized Hub Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
              Specialized Business Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Link
                href="/dashboard/reports/revenue"
                className="group p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Revenue & P&L
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    Monthly inflow/outflow, quarterly tables, and operating margins.
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-3 group-hover:translate-x-0.5 transition">
                  Open Statement <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/dashboard/reports/gst"
                className="group p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Statutory GST
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    GSTR-1 Ready (B2B Table 4, 11A, 11B, 13) and GSTR-3B sheet.
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-3 group-hover:translate-x-0.5 transition">
                  CA Audit Sheet <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/dashboard/reports/receivables"
                className="group p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Receivables Aging
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    0-30, 31-60, 61-90, 90+ day aging buckets and DSO analysis.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 mt-3 group-hover:translate-x-0.5 transition">
                  Debtors Ledger <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/dashboard/reports/clients"
                className="group p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                    <Users className="w-4 h-4 text-purple-600" />
                    Client Portfolio
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    Top clients, Pareto concentration, LTV, and conversion rate.
                  </p>
                </div>
                <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 mt-3 group-hover:translate-x-0.5 transition">
                  Client Rankings <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/dashboard/reports/projects"
                className="group p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Project Margins
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    Billed turnover vs direct costs and gross margin per project.
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 mt-3 group-hover:translate-x-0.5 transition">
                  Project Ledger <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>

          {/* Recent Cashflow Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Cash Movement Activity</h3>
                <p className="text-xs text-slate-500">
                  Latest verified inflows and outflows recorded across the system.
                </p>
              </div>
              <Link
                href="/dashboard/accounts"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                View Full Ledger <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {data.recent_cashflow.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No cashflow activity recorded in this period.
                </div>
              ) : (
                data.recent_cashflow.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          tx.type === "inflow"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {tx.type === "inflow" ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{tx.title}</div>
                        <div className="text-2xs text-slate-500">
                          {tx.party} • {tx.date}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        tx.type === "inflow" ? "text-emerald-600" : "text-slate-800"
                      }`}
                    >
                      {tx.type === "inflow" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
