"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import { api, Client, Project } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Receipt,
  ArrowLeft,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  IndianRupee,
  Loader2,
  FileText,
  Info,
} from "lucide-react";

export default function CreateReceiptVoucherPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountReceived, setAmountReceived] = useState<string>("5000");
  const [taxCalculationType, setTaxCalculationType] = useState<"inclusive" | "exclusive">("inclusive");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [paymentMode, setPaymentMode] = useState<"bank_transfer" | "upi" | "cheque" | "card" | "cash">("bank_transfer");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("");
  const [notes, setNotes] = useState<string>("Advance mobilization received for project milestone execution.");

  // Fetch Clients and Projects
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingInitial(true);
        const [cRes, pRes] = await Promise.all([
          api.request("/clients?per_page=100"),
          api.request("/projects?per_page=100"),
        ]);
        const clientList = cRes?.clients?.data || cRes?.clients || [];
        setClients(Array.isArray(clientList) ? clientList : []);

        const projectList = pRes?.projects?.data || pRes?.projects || [];
        setProjects(Array.isArray(projectList) ? projectList : []);
      } catch (err: any) {
        toast.error("Failed to load initial directory data");
      } finally {
        setLoadingInitial(false);
      }
    };
    initData();
  }, []);

  // Update Place of Supply based on Selected Client GSTIN
  useEffect(() => {
    if (selectedClient) {
      const gstin = (selectedClient.tax_number || selectedClient.gstin || "").trim().toUpperCase();
      const supplierCode = "18"; // Assam
      if (gstin.length >= 2) {
        const clientStateCode = gstin.substring(0, 2);
        if (clientStateCode !== supplierCode) {
          setPlaceOfSupply(`Inter-State Supply (Code: ${clientStateCode})`);
        } else {
          setPlaceOfSupply("Assam (State Code: 18)");
        }
      } else {
        const stateName = (selectedClient.state || "").toLowerCase();
        if (stateName && !stateName.includes("assam") && stateName !== "as") {
          setPlaceOfSupply(`Inter-State (${selectedClient.state})`);
        } else {
          setPlaceOfSupply("Assam (State Code: 18)");
        }
      }
    }
  }, [selectedClient]);

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

    if (!selectedClient) {
      toast.error("Please select a verified corporate client.");
      return;
    }

    if (numAmount <= 0) {
      toast.error("Please enter a valid advance payment amount.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_company: selectedClient.company_name || selectedClient.name,
        client_email: selectedClient.email,
        client_phone: selectedClient.phone,
        client_address: [
          selectedClient.address,
          selectedClient.city,
          selectedClient.state,
          selectedClient.postal_code,
        ]
          .filter(Boolean)
          .join(", "),
        client_gstin: selectedClient.tax_number || selectedClient.gstin || null,
        project_id: projectId ? parseInt(projectId) : null,
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

      toast.success(`GST Receipt Voucher ${res.receipt_voucher.voucher_number} issued!`);
      router.push(`/dashboard/receipt-vouchers/${res.receipt_voucher.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to issue receipt voucher.");
    } finally {
      setSubmitting(false);
    }
  };

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
              <span className="text-slate-900">Issue Voucher</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Issue GST Receipt Voucher</h1>
            <p className="text-xs text-slate-500">
              Record advance payments received for services in compliance with Section 31(3)(d) of CGST Act, 2017 & Rule 50.
            </p>
          </div>

          <Link
            href="/dashboard/receipt-vouchers"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Client Auto-Fetch Card (Rule 2) */}
          <ClientSnapshotCard
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            onOpenQuickAdd={() => router.push("/dashboard/clients/create")}
            title="Received From (Client Details)"
            subtitle="Search verified client directory to auto-populate GSTIN, billing address & state code"
            required={true}
          />

          {/* 2. Advance Financials & GST Bifurcation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Input Form (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Advance Payment Particulars</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Voucher Issue Date <span className="text-rose-500">*</span>
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
                    Advance Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 5000"
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
                    Place of Supply (POS)
                  </label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    placeholder="e.g. Assam (18) or Inter-State (State Code)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Auto-determined by client GSTIN & state.
                  </span>
                </div>

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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment / UTR Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Transaction ID / Cheque #"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Linked Project (Optional)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- No Project Selected --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Statutory Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Right Column: Live Statutory GST Breakdown & GSTR-1 Mapping (5 cols) */}
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
                    <span className="text-sm font-bold text-white">Total Advance Received:</span>
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
                    Advance receipts for supply of services mandate GST payment at the time of receipt.
                    When the final invoice is issued upon project completion, this advance is deducted under Table 11B.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedClient}
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
                  Auto-generates sequential number (RV-YYYY-XXXX) and official signed PDF.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
