"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Filter,
} from "lucide-react";

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.portal.invoices();
      const list = res.invoices?.data || res.invoices || [];
      setInvoices(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      console.error("Failed to load portal invoices:", err);
      toast.error("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async (invoiceId: number) => {
    try {
      setPayingId(invoiceId);
      const res = await api.portal.invoicePaymentLink(invoiceId);
      if (res.success && res.payment_link?.link_url) {
        toast.info("Opening Cashfree Secure Gateway...");
        window.location.href = res.payment_link.link_url;
      } else {
        toast.error("Could not generate Cashfree payment link.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate online payment.";
      toast.error(msg);
    } finally {
      setPayingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === "paid") return inv.status === "paid";
    if (statusFilter === "unpaid") return inv.status !== "paid";
    return true;
  });

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + Number(inv.due_amount || inv.total_amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/portal" className="hover:text-slate-900">Portal</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Tax Invoices</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Tax Invoices &amp; Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review GST invoices, download stamped receipts, and settle balances instantly via Cashfree.
          </p>
        </div>

        {totalOutstanding > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-600">Total Outstanding</div>
              <div className="text-base font-bold font-mono text-rose-700">
                ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Invoices ({invoices.length})</option>
            <option value="unpaid">Due / Unpaid</option>
            <option value="paid">Settled / Paid</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredInvoices.length} invoices
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No invoices found</p>
            <p className="text-xs text-slate-400 mt-1">There are no invoices matching your current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total (Inc. GST)</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === "paid";
                  const due = Number(inv.due_amount || inv.total_amount);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/portal/invoices/${inv.id}`} className="hover:text-blue-600">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {inv.invoice_date?.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {inv.due_date?.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                        ₹{Number(inv.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        ₹{due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inv.status === "partially_paid"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && due > 0 && (
                            <button
                              disabled={payingId === inv.id}
                              onClick={() => handlePay(inv.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                            >
                              {payingId === inv.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CreditCard className="w-3 h-3" />
                              )}
                              <span>Pay Online</span>
                            </button>
                          )}
                          <Link
                            href={`/portal/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                          >
                            <span>Details</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
