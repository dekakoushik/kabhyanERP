"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Estimate } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDate, getDueDateStatus, formatRelativeTime } from "@/lib/date";
import { toast } from "sonner";
import {
  FileText,
  ArrowLeft,
  Printer,
  Receipt,
  Edit2,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const estimateParam = resolvedParams.id;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/estimates/${estimateParam}`);
      setEstimate(res.estimate);
    } catch (err: any) {
      setError(err.message || "Failed to load estimate.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();
  }, [estimateParam]);

  const handleStatusChange = async (newStatus: string) => {
    if (!estimate) return;
    try {
      setUpdatingStatus(true);
      await api.request(`/estimates/${estimate.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setEstimate({ ...estimate, status: newStatus as any });
      toast.success(`Estimate status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertToProforma = async () => {
    if (!estimate) return;
    try {
      setConverting(true);
      const res = await api.request(`/estimates/${estimate.id}/convert-to-proforma`, {
        method: "POST",
      });
      toast.success(`Proforma Invoice ${res.proforma_invoice.proforma_number} generated!`);
      router.push(`/dashboard/proforma/${res.proforma_invoice.proforma_number}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate Proforma Invoice");
      setConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading proposal document...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !estimate) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="p-4 rounded-full bg-red-50 text-red-600 w-16 h-16 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Proposal Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {error || "The requested estimate reference does not exist or may have been deleted."}
          </p>
          <Link
            href="/dashboard/estimates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Estimates</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const validity = getDueDateStatus(estimate.expiry_date);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-16 print:p-0 print:m-0">
        {/* Navigation & Action Bar (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/estimates"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {estimate.estimate_number}
                </span>
                <span className="text-xs text-slate-400">• Estimate Details</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Proposal for {estimate.client_name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print / Export PDF</span>
            </button>

            {estimate.status === "accepted" && (
              <button
                onClick={handleConvertToProforma}
                disabled={converting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                <span>Convert to Proforma Invoice</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Realistic A4 Printable Document Sheet (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0 print:m-0">
            {/* Header / Brand & Document Metadata */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                    K
                  </div>
                  <span className="font-black text-lg tracking-tight text-slate-900">
                    KABHYAN TECHNOLOGIES
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5 leading-relaxed">
                  <p className="font-semibold text-slate-700">Kabhyan Technologies Private Limited</p>
                  <p>Enterprise IT & Cloud Engineering Solutions</p>
                  <p>contact@kabhyan.com • www.kabhyan.com</p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-[11px] font-bold tracking-widest uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                  Commercial Estimate
                </span>
                <p className="font-mono text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  #{estimate.estimate_number}
                </p>
                <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                  <p>Date: <span className="font-semibold text-slate-700">{formatDate(estimate.estimate_date)}</span></p>
                  <p>Valid Until: <span className="font-semibold text-slate-700">{formatDate(estimate.expiry_date)}</span></p>
                </div>
              </div>
            </div>

            {/* Recipient Client & Project Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Prepared For Client
                </span>
                <p className="text-sm font-black text-slate-900">{estimate.client_name}</p>
                <p className="text-slate-600 font-medium">{estimate.client_company || "Direct Individual"}</p>
                <p className="text-slate-500">{estimate.client_email}</p>
                {estimate.client_phone && <p className="text-slate-500">{estimate.client_phone}</p>}
                {estimate.client_address && <p className="text-slate-400 pt-1 leading-snug">{estimate.client_address}</p>}
              </div>

              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Project Engagement
                </span>
                <p className="text-sm font-black text-slate-900">
                  {estimate.project?.name || "General IT Deliverables"}
                </p>
                {estimate.project?.code && (
                  <p className="font-mono text-[11px] font-semibold text-blue-600">
                    Project Code: {estimate.project.code}
                  </p>
                )}
                <p className="text-slate-500 pt-1">Currency: <span className="font-semibold text-slate-700">{estimate.currency}</span></p>
              </div>
            </div>

            {/* Itemized Deliverables Table */}
            <div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3">Item Description & Scope</th>
                    <th className="py-3 px-3 text-center">Qty / Hours</th>
                    <th className="py-3 px-3 text-right">Unit Rate</th>
                    <th className="py-3 px-3 text-right">Amount ({estimate.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {estimate.items && estimate.items.length > 0 ? (
                    estimate.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-900">{item.item_name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-700 font-medium">
                          {item.quantity} {item.unit || "hrs"}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                          {Number(item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No items added to this estimate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-4 border-t border-slate-200">
              <div className="w-full sm:max-w-md space-y-2 text-xs">
                {estimate.notes && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scope Notes</span>
                    <p className="text-slate-600 whitespace-pre-wrap">{estimate.notes}</p>
                  </div>
                )}
                {estimate.terms_and_conditions && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Commercial Terms</span>
                    <p className="text-slate-600 whitespace-pre-wrap text-[11px] leading-relaxed">
                      {estimate.terms_and_conditions}
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-800">
                    ₹{Number(estimate.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {Number(estimate.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount ({estimate.discount_rate}%):</span>
                    <span className="font-mono text-emerald-600">
                      -₹{Number(estimate.discount_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST / Tax ({estimate.tax_rate}%):</span>
                  <span className="font-mono text-slate-800">
                    ₹{Number(estimate.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-600">
                    ₹{Number(estimate.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Endorsement */}
            <div className="pt-10 border-t border-slate-100 flex items-end justify-between text-xs text-slate-400">
              <div>
                <p className="text-slate-700 font-semibold">Authorized Signatory</p>
                <p>Kabhyan Technologies Pvt. Ltd.</p>
              </div>
              <div className="text-right">
                <p className="text-slate-700 font-semibold">Client Acceptance Signature</p>
                <p>Name & Corporate Seal</p>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Lifecycle Controls Sidebar (4 cols - Hidden on Print) */}
          <div className="lg:col-span-4 sticky top-6 space-y-5 print:hidden">
            {/* Status & Lifecycle Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lifecycle Status
                </span>
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    estimate.status === "accepted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : estimate.status === "sent"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : estimate.status === "invoiced"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {estimate.status}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Change Proposal State:
                </label>
                <select
                  value={estimate.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="draft">Draft (Internal Working)</option>
                  <option value="sent">Sent to Client</option>
                  <option value="accepted">Accepted / Approved by Client</option>
                  <option value="declined">Declined</option>
                  <option value="invoiced">Invoiced (Converted)</option>
                </select>
              </div>

              {estimate.status === "accepted" && (
                <div className="pt-2">
                  <button
                    onClick={handleConvertToProforma}
                    disabled={converting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
                  >
                    {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                    <span>Generate Proforma Invoice</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-1.5">
                    1-click copy of line items, deliverables & commercial terms.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Validity status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${validity.badgeClass}`}>
                    {validity.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Created:</span>
                  <span className="font-medium text-slate-800">{formatDate(estimate.estimate_date)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Last activity:</span>
                  <span className="font-medium text-slate-800">{formatRelativeTime(estimate.updated_at || estimate.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2.5">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Document</span>
              </button>
              <Link
                href="/dashboard/estimates"
                className="w-full flex items-center justify-center py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
              >
                Back to All Estimates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
