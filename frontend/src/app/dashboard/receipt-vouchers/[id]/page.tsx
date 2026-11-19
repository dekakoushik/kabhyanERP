"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, ReceiptVoucher, RefundVoucher } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";
import {
  Receipt,
  ArrowLeft,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  IndianRupee,
  Loader2,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function ReceiptVoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [voucher, setVoucher] = useState<ReceiptVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundMode, setRefundMode] = useState("bank_transfer");
  const [refundRef, setRefundRef] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteVoucher = async () => {
    if (!voucher) return;
    try {
      setDeleting(true);
      await api.request(`/receipt-vouchers/${voucher.id}`, {
        method: "DELETE",
      });
      toast.success(`Receipt Voucher ${voucher.voucher_number} deleted successfully.`);
      router.push("/dashboard/receipt-vouchers");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete Receipt Voucher.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!voucher) return;
    try {
      setDownloadingPdf(true);
      await api.downloadPdf(
        `/receipt-vouchers/${voucher.id}/pdf?download=1`,
        `Receipt-Voucher-${voucher.voucher_number}.pdf`
      );
      toast.success("Receipt Voucher PDF downloaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to download Receipt Voucher PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchVoucher = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/receipt-vouchers/${id}`);
      setVoucher(res.receipt_voucher as ReceiptVoucher);
    } catch (err: any) {
      toast.error(err.message || "Failed to load receipt voucher details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucher) return;
    if (!refundReason.trim()) {
      toast.error("Please enter a statutory reason for project cancellation/refund.");
      return;
    }

    try {
      setRefunding(true);
      const remaining = Number(voucher.remaining_advance ?? (Number(voucher.amount_received || 0) - Number(voucher.adjusted_amount || 0)));
      await api.request("/refund-vouchers", {
        method: "POST",
        body: JSON.stringify({
          receipt_voucher_id: voucher.id,
          refund_date: new Date().toISOString().split("T")[0],
          amount_refunded: remaining,
          refund_mode: refundMode,
          refund_reference: refundRef.trim() || null,
          reason: refundReason.trim(),
        }),
      });

      toast.success("Statutory GST Refund Voucher issued under Rule 51!");
      setRefundModalOpen(false);
      fetchVoucher();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue refund voucher.");
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
          <p className="text-sm font-medium">Loading receipt voucher...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!voucher) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-slate-500">Receipt voucher not found.</p>
          <Link href="/dashboard/receipt-vouchers" className="mt-4 inline-block text-blue-600 text-sm font-semibold">
            Back to Receipt Vouchers
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const remaining = Number(
    voucher.remaining_advance ??
      (Number(voucher.amount_received || 0) - Number(voucher.adjusted_amount || 0))
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>&gt;</span>
              <Link href="/dashboard/receipt-vouchers" className="hover:text-slate-800 transition">Receipt Vouchers</Link>
              <span>&gt;</span>
              <span className="text-slate-900 font-mono">{voucher.voucher_number}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{voucher.voucher_number}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Rule 50 Advance Receipt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/receipt-vouchers"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloadingPdf ? "Generating..." : "Download PDF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50/50 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 shadow-xs transition cursor-pointer"
              title="Delete Voucher"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Realistic A4 Printable Voucher Sheet (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-10 space-y-8">
            {/* Header / Brand & Document Title */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">KABHYAN TECHNOLOGIES PRIVATE LIMITED</h2>
                <p className="text-xs text-slate-500">Salt Lake Sector V, Kolkata, West Bengal - 700091</p>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">GSTIN:</span> 18AABCK1234F1Z5 •{" "}
                  <span className="font-semibold text-slate-700">State:</span> Assam (Code: 18)
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  GST RECEIPT VOUCHER
                </span>
                <div className="text-lg font-bold font-mono text-slate-900">{voucher.voucher_number}</div>
                <div className="text-xs text-slate-500">
                  Date: <span className="font-semibold text-slate-800">{formatDate(voucher.voucher_date)}</span>
                </div>
              </div>
            </div>

            {/* Legal Notice Subtitle */}
            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
              <span className="font-semibold text-slate-700">Statutory Notice:</span> Issued in compliance with Section 31(3)(d) of the Central Goods and Services Tax Act, 2017 read with Rule 50 of the CGST Rules, 2017. Acknowledges receipt of advance consideration towards supply of digital engineering and IT services.
            </div>

            {/* Client & Supply Particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Received From (Client):</span>
                <div className="text-sm font-bold text-slate-900">{voucher.client_name}</div>
                {voucher.client_company && (
                  <div className="text-xs font-semibold text-slate-700">{voucher.client_company}</div>
                )}
                {voucher.client_address && (
                  <div className="text-xs text-slate-500 whitespace-pre-line">{voucher.client_address}</div>
                )}
                <div className="text-xs text-slate-600 pt-1">
                  <span className="font-semibold text-slate-700">GSTIN / UIN:</span>{" "}
                  <span className="font-mono">{voucher.client_gstin || "Unregistered (B2C)"}</span>
                </div>
              </div>

              <div className="space-y-1.5 sm:text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supply Particulars:</span>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Place of Supply:</span>{" "}
                  <span>{voucher.place_of_supply || "Assam (18)"}</span>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Supply Classification:</span>{" "}
                  <span className="font-semibold text-blue-700">{voucher.is_inter_state ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}</span>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Payment Instrument:</span>{" "}
                  <span className="capitalize">{(voucher.payment_mode || "bank_transfer").replace("_", " ")}</span>
                </div>
                {voucher.payment_reference && (
                  <div className="text-xs font-mono text-slate-600">
                    <span className="font-semibold text-slate-700 font-sans">UTR / Ref:</span> {voucher.payment_reference}
                  </div>
                )}
              </div>
            </div>

            {/* Table: Advance Consideration & GST Bifurcation */}
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Description of Service Supply</th>
                    <th className="py-3 px-4 text-right">Taxable Turnover</th>
                    <th className="py-3 px-4 text-center">Rate</th>
                    <th className="py-3 px-4 text-right">GST Amount</th>
                    <th className="py-3 px-4 text-right">Gross Advance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">Advance Mobilization Consideration</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {voucher.estimate
                          ? `Acknowledged against approved quotation #${voucher.estimate.estimate_number}`
                          : "Received against agreed commercial scope of services"}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-800">
                      ₹{Number(voucher.taxable_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-800">
                      {voucher.tax_rate}%
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-800">
                      ₹{Number(voucher.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(voucher.amount_received).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50/70 border-t border-slate-200 font-medium">
                  {voucher.is_inter_state ? (
                    <tr>
                      <td colSpan={3} className="py-2.5 px-4 text-right text-slate-600">
                        Integrated Tax (IGST {voucher.tax_rate}%):
                      </td>
                      <td colSpan={2} className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                        ₹{Number(voucher.igst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-right text-slate-600">
                          Central Tax (CGST {voucher.tax_rate / 2}%):
                        </td>
                        <td colSpan={2} className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                          ₹{Number(voucher.cgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-right text-slate-600">
                          State Tax (SGST {voucher.tax_rate / 2}%):
                        </td>
                        <td colSpan={2} className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                          ₹{Number(voucher.sgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr className="border-t border-slate-200 bg-slate-100 font-bold text-slate-900">
                    <td colSpan={3} className="py-3 px-4 text-right">
                      Total Advance Received (INR):
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right font-mono text-sm text-blue-700">
                      ₹{Number(voucher.amount_received).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signatory Footer */}
            <div className="pt-10 flex flex-col sm:flex-row items-end justify-between gap-6 border-t border-slate-200">
              <div className="space-y-1 text-xs text-slate-400">
                <p>This is a computer generated statutory document under Rule 50.</p>
                <p>Subject to Kolkata, West Bengal jurisdiction.</p>
              </div>

              <div className="text-center sm:text-right space-y-2">
                <div className="h-10 border-b border-slate-300 w-44 inline-block" />
                <div className="text-xs font-bold text-slate-800">Kabhyan Technologies Pvt. Ltd.</div>
                <div className="text-[10px] text-slate-400">Authorized Signatory / Accounts</div>
              </div>
            </div>
          </div>

          {/* Right Column: Statutory Status, Adjustment Ledger & Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Advance Status Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Voucher Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                  {voucher.status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Advance Received:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{Number(voucher.amount_received).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span>Adjusted against Invoices:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    ₹{Number(voucher.adjusted_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Unadjusted Balance:</span>
                  <span className="text-base font-bold text-purple-700 font-mono">
                    ₹{remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Adjustments against Tax Invoices (Table 11B Ledger) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Table 11B Deductions
                </h3>
              </div>

              {(!voucher.adjustments || voucher.adjustments.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  <p>No tax invoices have adjusted this advance yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When service completes, create a Final Tax Invoice from the accepted quote to automatically deduct this voucher.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {voucher.adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {adj.invoice?.invoice_number || `Invoice #${adj.invoice_id}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {adj.invoice?.invoice_date ? formatDate(adj.invoice.invoice_date) : "Adjusted"}
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-600">
                        -₹{Number(adj.adjusted_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rule 51 Refund Option (If Project Cancelled Before Invoicing) */}
            {voucher.status !== "refunded" && remaining > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Project Cancelled?
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Under Rule 51 of CGST Rules, if no tax invoice was issued and services are cancelled, issue a GST Refund Voucher to reverse the Table 11 tax liability.
                </p>
                <button
                  onClick={() => setRefundModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Refund Voucher (Rule 51)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Refund Voucher Dialog Modal */}
        {refundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">Issue GST Refund Voucher</h3>
                </div>
                <button
                  onClick={() => setRefundModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleIssueRefund} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Refund Amount (INR)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`₹${remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Full remaining unadjusted balance will be refunded and tax liability reversed.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Refund Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={refundMode}
                    onChange={(e) => setRefundMode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction / Bank Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Ref Number"
                    value={refundRef}
                    onChange={(e) => setRefundRef(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cancellation / Refund Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Contract mutually terminated prior to service commencement"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRefundModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={refunding}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition disabled:opacity-50"
                  >
                    {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    <span>Confirm Refund</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && voucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Receipt Voucher</h3>
                  <p className="text-xs text-slate-500">Statutory advance record</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">{voucher.voucher_number}</strong> for{" "}
                <strong className="text-slate-900 font-semibold">{voucher.client_name || voucher.client_company}</strong> (Advance of ₹{Number(voucher.amount_received).toLocaleString("en-IN", { minimumFractionDigits: 2 })})?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteVoucher}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deleting ? "Deleting..." : "Delete Voucher"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
