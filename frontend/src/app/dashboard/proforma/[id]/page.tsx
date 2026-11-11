"use client";

import { useEffect, useState, use, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, ProformaInvoice } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDate, getDueDateStatus, formatRelativeTime } from "@/lib/date";
import { toast } from "sonner";
import {
  Receipt,
  ArrowLeft,
  Printer,
  FileCheck,
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
  IndianRupee,
} from "lucide-react";

function ProformaDetailContent({ proformaParam }: { proformaParam: string }) {
  const router = useRouter();
  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProforma = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/proforma-invoices/${proformaParam}`);
      setProforma(res.proforma_invoice);
    } catch (err: any) {
      setError(err.message || "Failed to load proforma invoice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProforma();
  }, [proformaParam]);

  const handleStatusChange = async (newStatus: string) => {
    if (!proforma) return;
    try {
      setUpdatingStatus(true);
      await api.request(`/proforma-invoices/${proforma.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setProforma({ ...proforma, status: newStatus as any });
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertToTaxInvoice = async () => {
    if (!proforma) return;
    try {
      setConverting(true);
      const res = await api.request(`/proforma-invoices/${proforma.id}/convert-to-invoice`, {
        method: "POST",
      });
      toast.success(`Tax Invoice ${res.invoice.invoice_number} generated successfully!`);
      router.push(`/dashboard/invoices/${res.invoice.invoice_number}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to convert to Tax Invoice");
      setConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-xs font-semibold text-slate-500">Loading proforma document...</p>
      </div>
    );
  }

  if (error || !proforma) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Proforma Invoice Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || "The requested proforma invoice does not exist or has been deleted."}</p>
        <Link
          href="/dashboard/proforma"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Proforma Invoices</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/proforma"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Back to Proforma List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                {proforma.proforma_number}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  proforma.status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : proforma.status === "partially_paid"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : proforma.status === "cancelled"
                    ? "bg-slate-100 text-slate-500 border-slate-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {proforma.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued {formatDate(proforma.invoice_date)} • Due {formatDate(proforma.due_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleConvertToTaxInvoice}
            disabled={converting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
          >
            {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
            <span>Convert to Official Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Document Sheet (Left) + Lifecycle Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Printable A4 Document Sheet */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-8 sm:p-12 print:p-0 print:border-none print:shadow-none space-y-8">
          {/* Header with Kabhyan Logo */}
          <div className="flex justify-between items-start pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Image
                  src="/kabhyan-logo.png"
                  alt="Kabhyan Technologies"
                  width={160}
                  height={42}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm pt-2">
                <strong>Kabhyan Technologies Private Limited</strong>
                <br />
                Enterprise IT & Software Engineering Solutions
                <br />
                GSTIN: <strong>18AAGCK2934D1Z2</strong>
                <br />
                support@kabhyan.com • www.kabhyan.com
              </p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">PROFORMA INVOICE</h2>
              <p className="font-mono text-sm font-bold text-purple-600">#{proforma.proforma_number}</p>
              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p>Date: <span className="font-medium text-slate-700">{formatDate(proforma.invoice_date)}</span></p>
                <p>Due Date: <span className="font-medium text-slate-700">{formatDate(proforma.due_date)}</span></p>
                {proforma.estimate && (
                  <p>Source Quote: <span className="font-mono font-bold text-slate-700">{proforma.estimate.estimate_number}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Billed To (Client)</p>
              <h3 className="text-sm font-bold text-slate-900">{proforma.client_name}</h3>
              {proforma.client_company && (
                <p className="font-medium text-slate-700">{proforma.client_company}</p>
              )}
              <div className="text-slate-500 mt-2 space-y-0.5">
                {proforma.client_address && <p>{proforma.client_address}</p>}
                {proforma.client_email && <p>{proforma.client_email}</p>}
                {proforma.client_phone && <p>{proforma.client_phone}</p>}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Project Assignment</p>
              <h3 className="text-sm font-bold text-slate-900">{proforma.project?.name || "Corporate Engagement"}</h3>
              {proforma.project?.description && (
                <p className="text-slate-500 mt-1 line-clamp-3">{proforma.project.description}</p>
              )}
              {proforma.estimate && (
                <div className="mt-4 p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                  <span className="text-xs text-purple-900 font-medium">Derived from Estimate:</span>
                  <Link
                    href={`/dashboard/estimates/${proforma.estimate.estimate_number}`}
                    className="font-mono text-xs font-bold text-purple-700 hover:underline"
                  >
                    {proforma.estimate.estimate_number}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Qty / Hours</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proforma.items && proforma.items.length > 0 ? (
                  proforma.items.map((item, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{item.item_name || item.description}</p>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹{Number(item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No line items specified
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Grand Summary */}
          <div className="flex flex-col sm:flex-row justify-between pt-4 border-t border-slate-100 gap-6">
            <div className="sm:max-w-xs space-y-2 text-xs text-slate-500">
              <p className="font-bold text-slate-700">Bank Settlement Coordinates:</p>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 font-mono text-[11px]">
                <p>Bank: HDFC Bank Ltd</p>
                <p>Account: 50200088921822</p>
                <p>IFSC: HDFC0001234</p>
                <p>Branch: Guwahati Central</p>
              </div>
            </div>

            <div className="sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">
                  ₹{Number(proforma.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (18%):</span>
                <span className="font-mono font-semibold">
                  ₹{Number(proforma.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Payable:</span>
                <span className="font-mono text-purple-600">
                  ₹{Number(proforma.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          {proforma.notes && (
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
              <p className="font-bold text-slate-700 mb-1">Commercial Terms & Instructions:</p>
              <p className="whitespace-pre-line leading-relaxed">{proforma.notes}</p>
            </div>
          )}
        </div>

        {/* Lifecycle Sidebar */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          {/* Conversion to Tax Invoice Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tax Invoice Pipeline</h3>
                <p className="text-[11px] text-slate-500">Generate legal GST Tax Invoice</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Once advance or full settlement is confirmed from the client, convert this proforma into an official GST Tax Invoice with automatic tax numbering and ledger sync.
            </p>

            <button
              onClick={handleConvertToTaxInvoice}
              disabled={converting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              <span>Convert to Official Tax Invoice</span>
            </button>
          </div>

          {/* Status Lifecycle Stepper */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Document Status</h3>
                <p className="text-[11px] text-slate-500">Manage client settlement stage</p>
              </div>
            </div>

            <div className="space-y-2">
              {["unpaid", "partially_paid", "paid", "cancelled"].map((st) => (
                <button
                  key={st}
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(st)}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition cursor-pointer ${
                    proforma.status === st
                      ? "bg-purple-50 border-purple-300 text-purple-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="capitalize">{st.replace("_", " ")}</span>
                  {proforma.status === st && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProformaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs font-semibold text-slate-500">Loading proforma document...</p>
          </div>
        }
      >
        <ProformaDetailContent proformaParam={resolvedParams.id} />
      </Suspense>
    </AdminLayout>
  );
}
