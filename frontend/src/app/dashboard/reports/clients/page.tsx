"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ReportHeader from "@/components/ReportHeader";
import { api, ReportClientsResponse } from "@/lib/api";
import { getCurrentFiscalYear } from "@/lib/fiscalYear";
import {
  Users,
  Building,
  TrendingUp,
  Percent,
  CheckCircle2,
  DollarSign,
  Loader2,
  PieChart,
} from "lucide-react";

export default function ClientPortfolioReportsPage() {
  const [fy, setFy] = useState(getCurrentFiscalYear());
  const [quarter, setQuarter] = useState("");
  const [data, setData] = useState<ReportClientsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const qParam = quarter ? `&quarter=${quarter}` : "";
      const res = await api.request<ReportClientsResponse>(`/reports/clients?fy=${fy}${qParam}`);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load client reports:", err);
      setError(err?.message || "Failed to load client portfolio.");
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

  const activeClientsCount = data?.clients.filter((c) => c.total_invoiced > 0).length || 1;
  const arpc = data ? data.concentration.total_revenue / Math.max(activeClientsCount, 1) : 0;

  return (
    <AdminLayout>
      <ReportHeader
        title="Client Portfolio & Conversion Analytics"
        subtitle="Revenue concentration risk, client lifetime billing, and estimate win rates."
        icon={<Users className="w-4 h-4" />}
        exportType="clients"
        fy={fy}
        setFy={setFy}
        quarter={quarter}
        setQuarter={setQuarter}
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">
            Analyzing client lifetime turnover and concentration metrics...
          </p>
        </div>
      ) : error || !data ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Users className="w-10 h-10 text-rose-500" />
          <div className="text-base font-bold text-slate-900">Unable to load client portfolio</div>
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
          {/* Executive Concentration Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Period Client Revenue
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(data.concentration.total_revenue)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                Across {data.clients.length} corporate accounts
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Top 3 Concentration
              </span>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                {data.concentration.top_3_pct}%
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                {formatCurrency(data.concentration.top_3_revenue)} from Top 3 clients
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Top 5 Concentration
              </span>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
                {data.concentration.top_5_pct}%
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                {formatCurrency(data.concentration.top_5_revenue)} from Top 5 clients
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Avg Revenue Per Client (ARPC)
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(arpc)}
              </div>
              <p className="text-2xs text-slate-500 mt-1">Based on active billing accounts</p>
            </div>
          </div>

          {/* Client Performance Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Corporate Clients Revenue Ranking</h3>
              <p className="text-xs text-slate-500">
                Accounts ranked by total billed turnover in the selected fiscal period.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-2.5 px-4"># Rank</th>
                    <th className="py-2.5 px-4">Client Company</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">GSTIN</th>
                    <th className="py-2.5 px-4 text-center">Quote Win Rate</th>
                    <th className="py-2.5 px-4 text-right">Total Invoiced</th>
                    <th className="py-2.5 px-4 text-right">Collections</th>
                    <th className="py-2.5 px-4 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.clients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No clients with transactions in this period.
                      </td>
                    </tr>
                  ) : (
                    data.clients.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.company_name}</div>
                          <div className="text-2xs text-slate-500">{c.name}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.city ? `${c.city}, ${c.state || ""}` : c.state || "-"}
                        </td>
                        <td className="py-3 px-4 font-mono text-3xs text-slate-600">
                          {c.gstin}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.estimates_total > 0 ? (
                            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-3xs">
                              {c.conversion_rate}% ({c.estimates_won}/{c.estimates_total})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-3xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(c.total_invoiced)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                          {formatCurrency(c.total_collected)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">
                          {c.total_outstanding > 0 ? formatCurrency(c.total_outstanding) : "-"}
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
