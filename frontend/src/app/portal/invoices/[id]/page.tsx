"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Invoice } from "@/lib/api";
import { toast } from "sonner";
import {
  FileText,
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Building,
  Calendar,
  ShieldCheck,
} from "lucide-react";

export default function ClientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.portal.invoice(invoiceId);
        setInvoice(res.invoice);
      } catch (err: unknown) {
        console.error("Failed to load invoice:", err);
        toast.error("Invoice not found or inaccessible.");
        router.push("/portal/invoices");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [invoiceId, router]);

  const handlePay = async () => {
    if (!invoice) return;
    try {
      setPaying(true);
      const res = await api.portal.invoicePaymentLink(invoice.id);
      if (res.success && res.payment_link?.link_url) {
        toast.info("Opening Cashfree Payment Gateway...");
        window.location.href = res.payment_link.link_url;
      } else {
        toast.error("Could not generate Cashfree payment link.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate payment.";
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      await api.downloadPdf(
        `/invoices/${invoice.id}/pdf`,
        `Tax_Invoice_${invoice.invoice_number}.pdf`
      );
      toast.success("Invoice PDF downloaded.");
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
        <p className="text-xs font-semibold text-slate-500">Loading invoice document...</p>
      </div>
    );
  }

  if (!invoice) return null;

  const isPaid = invoice.status === "paid";
  const due = Number(invoice.due_amount || invoice.total_amount);
  const items = invoice.items || [];
  const payments = invoice.payments || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/portal" className="hover:text-slate-900">Portal</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/portal/invoices" className="hover:text-slate-900">Invoices</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">{invoice.invoice_number}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Tax Invoice: {invoice.invoice_number}</span>
            <span className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded ${
              isPaid
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}>
              {invoice.status}
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

          {!isPaid && due > 0 && (
            <button
              onClick={handlePay}
              disabled={paying}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span>Pay ₹{due.toLocaleString("en-IN")} via Cashfree</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document Paper Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Parties Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To</div>
            <div className="text-base font-bold text-slate-900">{invoice.client_company || invoice.client_name}</div>
            {invoice.client_name && invoice.client_company && (
              <div className="text-xs text-slate-600">Attn: {invoice.client_name}</div>
            )}
            {invoice.client_gstin && (
              <div className="text-xs font-mono text-slate-600 mt-1">GSTIN: {invoice.client_gstin}</div>
            )}
            {invoice.client_email && (
              <div className="text-xs text-slate-500">{invoice.client_email}</div>
            )}
            {invoice.client_address && (
              <div className="text-xs text-slate-500 mt-1 max-w-xs">{invoice.client_address}</div>
            )}
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Invoice Metadata</div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Issue Date:</span> {invoice.invoice_date?.slice(0, 10)}
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Due Date:</span> {invoice.due_date?.slice(0, 10)}
            </div>
            {invoice.project && (
              <div className="text-xs text-blue-600 font-semibold mt-1">
                Project: {invoice.project.name}
              </div>
            )}
          </div>
        </div>

        {/* Deliverables Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-4">Deliverable / Description</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Rate</th>
                <th className="py-2.5 px-4 text-right">Taxable Amount</th>
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
                ₹{Number(invoice.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>GST ({invoice.tax_rate || 18}%):</span>
              <span className="font-mono font-medium">
                ₹{Number(invoice.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {Number(invoice.round_off || 0) !== 0 && (
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Round-off:</span>
                <span className="font-mono">
                  {Number(invoice.round_off) > 0 ? `+₹${invoice.round_off}` : `-₹${Math.abs(Number(invoice.round_off))}`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Total Amount:</span>
              <span className="font-mono">
                ₹{Number(invoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span className="font-mono font-semibold text-emerald-700">
                ₹{Number(invoice.paid_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm font-bold text-rose-600">
              <span>Balance Due:</span>
              <span className="font-mono">
                ₹{due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Settlement History */}
        {payments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment History</div>
            <div className="divide-y divide-slate-100 text-xs">
              {payments.map((p: any) => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{p.payment_date}</span>
                    <span className="text-slate-400 ml-2">via {p.payment_method?.toUpperCase()}</span>
                    {p.transaction_reference && (
                      <span className="font-mono text-slate-400 ml-2">({p.transaction_reference})</span>
                    )}
                  </div>
                  <div className="font-mono font-bold text-emerald-700">
                    ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
