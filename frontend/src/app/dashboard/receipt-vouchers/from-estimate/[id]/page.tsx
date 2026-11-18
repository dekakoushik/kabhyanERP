"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Estimate, Project } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Receipt,
  ArrowLeft,
  ShieldCheck,
  IndianRupee,
  Loader2,
  Building2,
  Info,
  FileText,
} from "lucide-react";

export default function CreateReceiptVoucherFromEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [advancePercent, setAdvancePercent] = useState<number>(50);
  const [taxCalculationType, setTaxCalculationType] = useState<"inclusive" | "exclusive">("inclusive");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [paymentMode, setPaymentMode] = useState<"bank_transfer" | "upi" | "cheque" | "card" | "cash">("bank_transfer");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        setLoading(true);
        const res = await api.request(`/estimates/${id}`);
        const est = res.estimate as Estimate;
        setEstimate(est);

        const estTotal = Number(est.total_amount || est.total || 0);
        // Default 50% mobilization advance
        const defaultAdvance = Math.round(estTotal * 0.5 * 100) / 100;
        setAmountReceived(defaultAdvance.toString());

        setTaxRate(est.tax_rate ?? 18);
        setTaxCalculationType((est as any).tax_calculation_type ?? "inclusive");
        setNotes(`Mobilization advance received for quotation #${est.estimate_number}.`);

        // Place of Supply
        const gstin = (est.client_gstin || "").trim().toUpperCase();
        if (gstin.length >= 2) {
          const clientCode = gstin.substring(0, 2);
          setPlaceOfSupply(clientCode !== "18" ? `Inter-State Supply (Code: ${clientCode})` : "Assam (State Code: 18)");
        } else {
          const addr = (est.client_address || "").toLowerCase();
          if (addr && !addr.includes("assam") && !addr.includes("as")) {
            setPlaceOfSupply("Inter-State Supply");
          } else {
            setPlaceOfSupply("Assam (State Code: 18)");
          }
        }
      } catch (err: any) {
        toast.error("Failed to load quotation details");
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [id]);

  const handlePercentClick = (pct: number) => {
    if (!estimate) return;
    setAdvancePercent(pct);
    const estTotal = Number(estimate.total_amount || estimate.total || 0);
    const calculated = Math.round(estTotal * (pct / 100) * 100) / 100;
    setAmountReceived(calculated.toString());
  };

  // Real-time GST Computations
  const numAmount = Math.max(0, parseFloat(amountReceived) || 0);
  const isInterState = placeOfSupply.toLowerCase().includes("inter-state");

  let taxableValue = 0;
  let gstAmount = 0;
  let totalAdvance = 0;

  if (taxCalculationType === "inclusive") {
    totalAdvance = numAmount;
    taxableValue = taxRate > 0 ? Math.round((numAmount / (1 + taxRate / 100)) * 100) / 100 : numAmount;
    gstAmount = Math.round((totalAdvance - taxableValue) * 100) / 100;
  } else {
    taxableValue = numAmount;
    gstAmount = Math.round(((taxableValue * taxRate) / 100) * 100) / 100;
    totalAdvance = Math.round((taxableValue + gstAmount) * 100) / 100;
  }

  const cgstAmount = isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100;
  const sgstAmount = isInterState ? 0 : Math.round((gstAmount - cgstAmount) * 100) / 100;
  const igstAmount = isInterState ? gstAmount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estimate) return;
    if (numAmount <= 0) {
      toast.error("Please enter a valid advance payment amount.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        estimate_id: estimate.id,
        project_id: estimate.project_id,
        client_name: estimate.client_name,
        client_company: estimate.client_company || estimate.client_name,
        client_email: estimate.client_email,
        client_phone: estimate.client_phone,
        client_address: estimate.client_address,
        client_gstin: estimate.client_gstin || null,
        voucher_date: voucherDate,
        amount_received: totalAdvance,
        tax_calculation_type: taxCalculationType,
        tax_rate: taxRate,
        place_of_supply: placeOfSupply,
        payment_mode: paymentMode,
        payment_reference: paymentReference.trim() || null,
        notes: notes.trim() || null,
      };

      const res = await api.request("/receipt-vouchers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(`GST Receipt Voucher ${res.receipt_voucher.voucher_number} issued against Quote #${estimate.estimate_number}!`);
      router.push(`/dashboard/receipt-vouchers/${res.receipt_voucher.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to issue receipt voucher.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
          <p className="text-sm font-medium">Loading quotation details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!estimate) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-slate-500">Quotation not found.</p>
          <Link href="/dashboard/estimates" className="mt-4 inline-block text-blue-600 text-sm font-semibold">
            Back to Estimates
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>&gt;</span>
              <Link href="/dashboard/estimates" className="hover:text-slate-800 transition">Estimates</Link>
              <span>&gt;</span>
              <Link href={`/dashboard/estimates/${estimate.id}`} className="hover:text-slate-800 font-mono transition">
                {estimate.estimate_number}
              </Link>
              <span>&gt;</span>
              <span className="text-slate-900">Issue Receipt Voucher</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Record Advance for {estimate.estimate_number}
            </h1>
            <p className="text-xs text-slate-500">
              Statutory GST Receipt Voucher acknowledging advance mobilization under Rule 50.
            </p>
          </div>

          <Link
            href={`/dashboard/estimates/${estimate.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Quotation</span>
          </Link>
        </div>

        {/* Linked Estimate Snapshot Card */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-900 text-base">{estimate.estimate_number}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {estimate.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{estimate.client_name} • {estimate.client_company}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Total Project Scope: ₹{Number(estimate.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Preset Advance Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Suggested Advance:</span>
            {[20, 25, 50, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentClick(pct)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  advancePercent === pct
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Details (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Advance Receipt Particulars</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Voucher Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Advance Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tax Calculation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxCalculationType("inclusive")}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                        taxCalculationType === "inclusive"
                          ? "bg-purple-50 text-purple-700 border-purple-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      GST Inclusive
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxCalculationType("exclusive")}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                        taxCalculationType === "exclusive"
                          ? "bg-purple-50 text-purple-700 border-purple-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Tax Exclusive
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    GST Rate
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={18}>18% GST (Standard Services)</option>
                    <option value={12}>12% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="bank_transfer">NEFT / RTGS / IMPS (Bank Transfer)</option>
                    <option value="upi">UPI (GPay / PhonePe / QR)</option>
                    <option value="cheque">Cheque / Demand Draft</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    UTR / Payment Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Transaction ID"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Place of Supply
                </label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Statutory Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Right Column: Live Tax Breakdown (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Rule 50 Tax Preview
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    GSTR-1 TABLE 11A
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Taxable Turnover Base:</span>
                    <span className="font-mono font-semibold text-white">
                      ₹{taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isInterState ? (
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Integrated Tax (IGST {taxRate}%):</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        +₹{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Central Tax (CGST {taxRate / 2}%):</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          +₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>State Tax (SGST {taxRate / 2}%):</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          +₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Advance Received:</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">
                      ₹{totalAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1.5 border border-slate-700/60">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Statutory GST Rule:</span>
                  </div>
                  <p>
                    Acknowledging this advance triggers statutory GST liability under Section 31(3)(d).
                    When services complete, the full Tax Invoice will deduct this advance under Table 11B.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Issuing GST Voucher...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Issue GST Receipt Voucher</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  Generates sequential number (RV-YYYY-XXXX) and binds to Quote #{estimate.estimate_number}.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
