"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ReportHeader from "@/components/ReportHeader";
import { api, ReportProjectsResponse } from "@/lib/api";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

export default function ProjectProfitabilityReportsPage() {
  const [data, setData] = useState<ReportProjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.request<ReportProjectsResponse>("/reports/projects");
      setData(res);
    } catch (err: any) {
      console.error("Failed to load project report:", err);
      setError(err?.message || "Failed to load project margins.");
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

  return (
    <AdminLayout>
      <ReportHeader
        title="Project Profitability & Cost Margin Ledger"
        subtitle="Billed turnover versus direct expenses and delivery gross margin realization."
        icon={<Briefcase className="w-4 h-4" />}
        exportType="projects"
        showQuarterFilter={false}
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">
            Reconciling project billing schedules and direct expenditures...
          </p>
        </div>
      ) : error || !data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Briefcase className="w-10 h-10 text-rose-500" />
          <div className="text-base font-bold text-slate-900">Unable to load project margins</div>
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
                Total Projects Billed
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(data.summary.total_turnover)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                Across {data.summary.total_projects} projects
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Direct Project Costs
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(data.summary.total_direct_cost)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">Expenses attributed to delivery</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Portfolio Gross Margin
              </span>
              <div
                className={`text-xl sm:text-2xl font-bold mt-1 ${
                  data.summary.overall_margin >= 0 ? "text-slate-900" : "text-rose-600"
                }`}
              >
                {formatCurrency(data.summary.overall_margin)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">Turnover less direct delivery expenses</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Overall Margin %
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                {data.summary.overall_margin_pct}%
              </div>
              <p className="text-2xs text-slate-500 mt-1">Blended portfolio gross margin</p>
            </div>
          </div>

          {/* Project Profitability Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Project Margins Ledger</h3>
              <p className="text-xs text-slate-500">
                Individual project breakdown with billing, expenses, and gross profitability.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-2.5 px-4">Project Name</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Budget</th>
                    <th className="py-2.5 px-4 text-right">Invoiced</th>
                    <th className="py-2.5 px-4 text-right">Collected</th>
                    <th className="py-2.5 px-4 text-right">Direct Expenses</th>
                    <th className="py-2.5 px-4 text-right">Gross Margin</th>
                    <th className="py-2.5 px-4 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.projects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No projects found in the system.
                      </td>
                    </tr>
                  ) : (
                    data.projects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4 text-slate-600">{p.client_name}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                              p.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : p.status === "in_progress"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {p.status ? p.status.replace("_", " ").toUpperCase() : "ACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {p.budget > 0 ? formatCurrency(p.budget) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(p.total_invoiced)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                          {formatCurrency(p.total_collected)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          {p.total_expenses > 0 ? formatCurrency(p.total_expenses) : "-"}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            p.gross_margin >= 0 ? "text-slate-900" : "text-rose-600"
                          }`}
                        >
                          {formatCurrency(p.gross_margin)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-3xs ${
                              p.margin_pct >= 50
                                ? "bg-emerald-50 text-emerald-700"
                                : p.margin_pct >= 25
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {p.margin_pct}%
                          </span>
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
