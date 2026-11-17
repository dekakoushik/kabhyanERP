"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Clock,
  Filter,
} from "lucide-react";

export default function ClientEstimatesPage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const res = await api.portal.estimates();
      const list = res.estimates?.data || res.estimates || [];
      setEstimates(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      console.error("Failed to load quotations:", err);
      toast.error("Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/portal" className="hover:text-slate-900">Portal</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Quotations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Project Estimates &amp; Quotations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review proposed scopes of work, budgets, and milestones with one-click approvals.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400">Loading quotations...</p>
          </div>
        ) : estimates.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No quotations found</p>
            <p className="text-xs text-slate-400 mt-1">There are no pending estimates for review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Estimated Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {estimates.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <Link href={`/portal/estimates/${est.id}`} className="hover:text-blue-600">
                        {est.estimate_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {est.estimate_date?.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {est.expiry_date?.slice(0, 10) || "No expiry"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(est.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        est.status === "accepted"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : est.status === "declined"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {est.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/portal/estimates/${est.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <span>Review Scope</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
