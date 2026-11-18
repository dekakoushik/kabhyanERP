"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import { api, Client, Project, ProformaInvoice } from "@/lib/api";
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
  CheckCircle2,
} from "lucide-react";

export default function ReceiptVoucherCreateForm({
  proformaIdentifier,
}: {
  proformaIdentifier?: string | null;
}) {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);
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

  // Fetch Clients, Projects, and optional Proforma
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingInitial(true);
        const [cRes, pRes] = await Promise.all([
          api.request("/clients?per_page=100"),
          api.request("/projects?per_page=100"),
        ]);
        const clientList: Client[] = Array.isArray(cRes?.clients?.data)
          ? cRes.clients.data
          : Array.isArray(cRes?.clients)
          ? cRes.clients
          : [];
        setClients(clientList);

        const projectList = pRes?.projects?.data || pRes?.projects || [];
        setProjects(Array.isArray(projectList) ? projectList : []);

        if (proformaIdentifier) {
          const piRes = await api.request(`/proforma-invoices/${proformaIdentifier}`);
          const pi: ProformaInvoice = piRes?.proforma_invoice;
          if (pi) {
            setProforma(pi);
            const remaining = pi.remaining_amount !== undefined && Number(pi.remaining_amount) > 0
              ? Number(pi.remaining_amount)
              : Number(pi.total_amount);
            setAmountReceived(remaining.toString());
            setNotes(`Advance payment received against Proforma Invoice ${pi.proforma_number}.`);
            if (pi.project_id) {
              setProjectId(pi.project_id.toString());
            }
            if (pi.tax_calculation_type) {
              setTaxCalculationType(pi.tax_calculation_type as "inclusive" | "exclusive");
            }

            // Match Client
            const matched = clientList.find(
              (c) =>
                (pi.client_email && c.email?.toLowerCase() === pi.client_email.toLowerCase()) ||
                (pi.client_company && c.company_name?.toLowerCase() === pi.client_company.toLowerCase()) ||
                c.name.toLowerCase() === pi.client_name.toLowerCase()
            );

            if (matched) {
              setSelectedClient(matched);
            } else {
              setSelectedClient({
                id: (pi as any).client_id || 0,
                name: pi.client_name,
                company_name: pi.client_company || pi.client_name,
                email: pi.client_email,
                phone: pi.client_phone || "",
                address: pi.client_address || "",
                tax_number: (pi as any).client_gstin || null,
                gstin: (pi as any).client_gstin || null,
              } as Client);
            }
          }
        }
      } catch (err: any) {
        toast.error("Failed to load initial data: " + (err.message || "Unknown error"));
      } finally {
        setLoadingInitial(false);
      }
    };
    initData();
  }, [proformaIdentifier]);

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
      const payload: Record<string, any> = {
        client_id: selectedClient.id || null,
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

      if (proforma) {
        payload.proforma_invoice_id = proforma.id;
        if (proforma.estimate_id) {
          payload.estimate_id = proforma.estimate_id;
        }
      }

      const res = await api.request("/receipt-vouchers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (proforma) {
        toast.success(`GST Receipt Voucher ${res.receipt_voucher.voucher_number} issued against Proforma ${proforma.proforma_number}!`);
        router.push(`/dashboard/proforma/${proforma.proforma_number}`);
      } else {
        toast.success(`GST Receipt Voucher ${res.receipt_voucher.voucher_number} issued!`);
        router.push(`/dashboard/receipt-vouchers/${res.receipt_voucher.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to issue receipt voucher.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-xs font-semibold text-slate-500">Loading document parameters...</p>
        </div>
      </AdminLayout>
    );
  }

  const cancelHref = proforma
    ? `/dashboard/proforma/${proforma.proforma_number}`
    : "/dashboard/receipt-vouchers";

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>&gt;</span>
              {proforma ? (
                <>
                  <Link href="/dashboard/proforma" className="hover:text-slate-800 transition">Proforma Invoices</Link>
                  <span>&gt;</span>
                  <Link href={`/dashboard/proforma/${proforma.proforma_number}`} className="hover:text-slate-800 transition font-mono">
                    {proforma.proforma_number}
                  </Link>
                  <span>&gt;</span>
                  <span className="text-slate-900">Issue Advance Voucher</span>
                </>
              ) : (
                <>
                  <Link href="/dashboard/receipt-vouchers" className="hover:text-slate-800 transition">Receipt Vouchers</Link>
                  <span>&gt;</span>
                  <span className="text-slate-900">Issue Voucher</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {proforma ? `Issue Advance Voucher for ${proforma.proforma_number}` : "Issue GST Receipt Voucher"}
            </h1>
            <p className="text-xs text-slate-500">
              Official statutory document under Section 31(3)(d) of CGST Act 2017 & Rule 50 for advance mobilization receipts.
            </p>
          </div>

          <Link
            href={cancelHref}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </Link>
        </div>

        {/* Proforma Link Context Banner */}
        {proforma && (
          <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-950">
                  Target Proforma: <span className="font-mono">{proforma.proforma_number}</span>
                </p>
                <p className="text-[11px] text-purple-700">
                  Total Contract: ₹{Number(proforma.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} • 
                  Pending Balance: ₹{Number(proforma.remaining_amount ?? proforma.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/proforma/${proforma.proforma_number}`}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-1"
            >
              <span>View Proforma Document</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}

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
                    placeholder="e.g. Assam (State Code: 18)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Determines CGST + SGST (Intra-state) vs IGST (Inter-state).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bank / Transaction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / IMPS / Txn ID #9823412"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Associated Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">None / General Advance</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.code ? `(${p.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Scope & Settlement Terms
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes on deliverables or conditions under which advance is received..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Right Column: Statutory Summary & Tax Breakdown (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Statutory Tax Bifurcation</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                    Rule 50
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Taxable Base Value:</span>
                    <span className="font-mono text-white font-semibold">
                      ₹{taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isInterState ? (
                    <div className="flex justify-between items-center text-slate-400">
                      <span>IGST ({taxRate}%):</span>
                      <span className="font-mono text-purple-400 font-semibold">
                        +₹{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>CGST ({taxRate / 2}%):</span>
                        <span className="font-mono text-purple-400 font-semibold">
                          +₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>SGST ({taxRate / 2}%):</span>
                        <span className="font-mono text-purple-400 font-semibold">
                          +₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Total GST Discharged:</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      ₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400">Gross Advance Realized:</p>
                      <p className="text-[10px] text-slate-500">(Credited to Bank Account)</p>
                    </div>
                    <span className="font-mono text-xl font-bold text-emerald-400">
                      ₹{totalAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                    <Info className="w-3.5 h-3.5" />
                    <span>Statutory Tax Compliance</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Under Indian GST Law, GST on services is payable upon receipt of advance (Section 13(2)). When the final Tax Invoice is issued upon completion of services, this Receipt Voucher will be adjusted to prevent double taxation.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href={cancelHref}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold text-center transition shadow-xs"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Issuing Voucher...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Issue Statutory Receipt Voucher</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
