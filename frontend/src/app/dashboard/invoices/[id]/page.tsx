"use client";

import { useEffect, useState, use, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Invoice, InvoicePayment } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDate, getDueDateStatus, formatRelativeTime } from "@/lib/date";
import { toast } from "sonner";
import {
  FileCheck,
  ArrowLeft,
  Printer,
  CreditCard,
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
  ShieldCheck,
  IndianRupee,
  Receipt,
  X,
} from "lucide-react";

function InvoiceDetailContent({ invoiceParam }: { invoiceParam: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Recording Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/invoices/${invoiceParam}`);
      setInvoice(res.invoice);
      if (res.invoice) {
        setPaymentAmount(res.invoice.due_amount ? res.invoice.due_amount.toString() : "0");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tax invoice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceParam]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError("Please enter a valid payment amount");
      return;
    }

    try {
      setRecordingPayment(true);
      setPaymentError(null);
      await api.request(`/invoices/${invoice.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount: amt,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          transaction_reference: paymentRef || null,
          notes: paymentNotes || null,
        }),
      });
      toast.success(`Payment of ₹${amt.toLocaleString("en-IN")} recorded successfully!`);
      setPaymentModalOpen(false);
      setPaymentRef("");
      setPaymentNotes("");
      fetchInvoice();
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment.");
    } finally {
      setRecordingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading tax invoice document...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Invoice Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || "The requested invoice does not exist or has been deleted."}</p>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  const dueDateInfo = getDueDateStatus(invoice.due_date);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs cursor-pointer"
            title="Back to Invoices"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {invoice.invoice_number}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  invoice.status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : invoice.status === "partially_paid"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : invoice.status === "overdue"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {invoice.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued {formatDate(invoice.invoice_date)} • Due {formatDate(invoice.due_date)}
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

          {invoice.status !== "paid" && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Client Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Document Sheet (Left) + Document Lifecycle Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Printable A4 Tax Invoice Document Sheet */}
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
              <h2 className="text-xl font-black text-slate-900 tracking-tight">TAX INVOICE</h2>
              <p className="font-mono text-sm font-bold text-blue-600">#{invoice.invoice_number}</p>
              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p>Invoice Date: <span className="font-medium text-slate-700">{formatDate(invoice.invoice_date)}</span></p>
                <p>Payment Due: <span className="font-medium text-slate-700">{formatDate(invoice.due_date)}</span></p>
                {invoice.project?.name && (
                  <p>Project: <span className="font-medium text-slate-700">{invoice.project.name}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Billed To</p>
              <h3 className="text-sm font-bold text-slate-900">{invoice.client_name || "Client"}</h3>
              {invoice.client_company && (
                <p className="font-medium text-slate-700">{invoice.client_company}</p>
              )}
              {invoice.client_gstin && (
                <p className="text-blue-600 font-mono mt-0.5">GSTIN: {invoice.client_gstin}</p>
              )}
              <div className="text-slate-500 mt-2 space-y-0.5">
                {invoice.client_address && <p>{invoice.client_address}</p>}
                {invoice.client_email && <p>{invoice.client_email}</p>}
                {invoice.client_phone && <p>{invoice.client_phone}</p>}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Project Reference</p>
              <h3 className="text-sm font-bold text-slate-900">{invoice.project?.name || "Corporate Engagement"}</h3>
              {invoice.project?.description && (
                <p className="text-slate-500 mt-1 line-clamp-3">{invoice.project.description}</p>
              )}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Invoice Status</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-500' : invoice.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  {invoice.status.toUpperCase()} (₹{Number(invoice.paid_amount || 0).toLocaleString("en-IN")} received)
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Qty / Hrs</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{item.item_name || item.description}</p>
                        {item.sac_code && (
                          <span className="text-[10px] text-slate-400 font-mono">SAC: {item.sac_code}</span>
                        )}
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

          {/* Summary / Totals */}
          <div className="flex flex-col sm:flex-row justify-between pt-4 border-t border-slate-100 gap-6">
            <div className="sm:max-w-xs space-y-2 text-xs text-slate-500">
              <p className="font-bold text-slate-700">Bank Transfer Details:</p>
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
                  ₹{Number(invoice.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax:</span>
                <span className="font-mono font-semibold">
                  ₹{Number(invoice.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-600">
                  ₹{Number(invoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono font-semibold text-emerald-600">
                  - ₹{Number(invoice.paid_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span className="text-amber-900">Balance Due:</span>
                <span className="font-mono text-amber-700">
                  ₹{Number(invoice.due_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {invoice.notes && (
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
              <p className="font-bold text-slate-700 mb-1">Payment Terms & Notes:</p>
              <p className="whitespace-pre-line leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Lifecycle & Payment History Sidebar */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          {/* Payment Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Collection Status</h3>
                <p className="text-[11px] text-slate-500">Accounts receivable progress</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Settled Amount:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ₹{Number(invoice.paid_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (Number(invoice.paid_amount || 0) / Number(invoice.total_amount || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                <span>Total: ₹{Number(invoice.total_amount).toLocaleString("en-IN")}</span>
                <span>
                  {(
                    (Number(invoice.paid_amount || 0) / Number(invoice.total_amount || 1)) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>

            {invoice.status !== "paid" && (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Client Payment</span>
              </button>
            )}
          </div>

          {/* Payment Receipts History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payment Receipts</h3>
                  <p className="text-[11px] text-slate-500">{invoice.payments?.length || 0} disbursements logged</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {invoice.payments && invoice.payments.length > 0 ? (
                invoice.payments.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-emerald-700">
                        ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDate(p.payment_date)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="uppercase text-[10px] font-bold text-slate-400">{p.payment_method}</span>
                      {p.transaction_reference && (
                        <span className="font-mono text-[10px] text-slate-600">{p.transaction_reference}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No payment disbursements recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Client Payment</h3>
                  <p className="text-[11px] text-slate-500">Disbursement for {invoice.invoice_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              {paymentError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                  {paymentError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Remaining balance due: ₹{Number(invoice.due_amount || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque / DD</option>
                    <option value="cash">Cash Receipt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / UTR</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC-UTR-891240182"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Reference notes, bank acknowledgment, etc."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {recordingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoiceDetailPage({
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading tax invoice document...</p>
          </div>
        }
      >
        <InvoiceDetailContent invoiceParam={resolvedParams.id} />
      </Suspense>
    </AdminLayout>
  );
}
