"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";

export default function ClientEstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const estimateId = resolvedParams.id;
  const router = useRouter();

  const [estimate, setEstimate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const res = await api.portal.estimate(estimateId);
      setEstimate(res.estimate);
    } catch (err: unknown) {
      console.error("Failed to load estimate:", err);
      toast.error("Quotation not found.");
      router.push("/portal/estimates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();
  }, [estimateId]);

  const handleRespond = async (action: "accepted" | "declined") => {
    const feedback = action === "declined"
      ? window.prompt("Please provide a reason or modification request (optional):")
      : undefined;

    try {
      setActionLoading(true);
      const res = await api.portal.respondEstimate(estimateId, {
        action,
        feedback: feedback || undefined,
      });
      toast.success(res.message);
      fetchEstimate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record response.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!estimate) return;
    try {
      setDownloading(true);
      await api.downloadPdf(
        `/estimates/${estimate.id}/pdf`,
        `Quotation_${estimate.estimate_number}.pdf`
      );
      toast.success("Quotation PDF downloaded.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to download PDF.";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading quotation details...</p>
      </div>
    );
  }

  if (!estimate) return null;

  const isAccepted = estimate.status === "accepted";
  const isDeclined = estimate.status === "declined";
  const items = estimate.items || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/portal" className="hover:text-slate-900">Portal</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/portal/estimates" className="hover:text-slate-900">Quotations</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">{estimate.estimate_number}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Quotation: {estimate.estimate_number}</span>
            <span className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded ${
              isAccepted
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isDeclined
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {estimate.status}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download PDF</span>
          </button>

          {!isAccepted && !isDeclined && (
            <div className="flex items-center gap-2">
              <button
                disabled={actionLoading}
                onClick={() => handleRespond("accepted")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Scope</span>
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleRespond("declined")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Request Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paper Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prepared For</div>
            <div className="text-base font-bold text-slate-900">{estimate.client_company || estimate.client_name}</div>
            {estimate.client_name && estimate.client_company && (
              <div className="text-xs text-slate-600">Attn: {estimate.client_name}</div>
            )}
            {estimate.client_email && (
              <div className="text-xs text-slate-500">{estimate.client_email}</div>
            )}
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs text-slate-600">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Proposal Terms</div>
            <div><span className="font-semibold text-slate-700">Proposal Date:</span> {estimate.estimate_date?.slice(0, 10)}</div>
            <div><span className="font-semibold text-slate-700">Valid Until:</span> {estimate.expiry_date?.slice(0, 10) || "Open"}</div>
            {estimate.project && (
              <div className="text-blue-600 font-semibold mt-1">Project: {estimate.project.name}</div>
            )}
          </div>
        </div>

        {/* Deliverables Scope Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-4">Deliverable Scope / Milestone</th>
                <th className="py-2.5 px-4 text-center">Estimated Units</th>
                <th className="py-2.5 px-4 text-right">Unit Rate</th>
                <th className="py-2.5 px-4 text-right">Estimated Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((it: any) => (
                <tr key={it.id}>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{it.title || it.description}</div>
                    {it.description && it.title && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{it.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {it.quantity} {it.unit || "units"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    ₹{Number(it.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    ₹{Number(it.amount || it.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end pt-2">
          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">
                ₹{Number(estimate.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>GST ({estimate.tax_rate || 18}%):</span>
              <span className="font-mono font-medium">
                ₹{Number(estimate.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Total Estimated Outlay:</span>
              <span className="font-mono text-blue-700">
                ₹{Number(estimate.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {estimate.notes && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-700">Scope Notes &amp; Assumptions:</div>
            <p className="whitespace-pre-line">{estimate.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
