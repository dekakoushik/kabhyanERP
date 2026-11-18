"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  api,
  BusinessAssociate,
  BusinessAssociatePayout,
  BusinessAssociateDocument,
  BusinessAssociateMetrics,
  Client,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Handshake,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  Calendar,
  Percent,
  Wallet,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Loader2,
  DollarSign,
  Plus,
  Upload,
  FileCheck,
  Download,
  AlertCircle,
  Clock,
  Edit,
  Building2,
  Check,
  X,
} from "lucide-react";

export default function BusinessAssociateDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [associate, setAssociate] = useState<BusinessAssociate | null>(null);
  const [clients, setClients] = useState<(Client & { total_invoices_count?: number; total_revenue_paid?: number })[]>([]);
  const [payouts, setPayouts] = useState<BusinessAssociatePayout[]>([]);
  const [documents, setDocuments] = useState<BusinessAssociateDocument[]>([]);
  const [metrics, setMetrics] = useState<BusinessAssociateMetrics>({
    total_clients_referred: 0,
    total_sales_driven: 0,
    total_paid_payouts: 0,
    pending_payouts: 0,
    lifetime_gross_earnings: 0,
    total_tds_withheld: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "payouts" | "documents">("overview");

  // Record Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    type: "commission" as "salary" | "commission" | "bonus" | "reimbursement",
    gross_amount: "",
    tds_rate: "5.00",
    period_month: new Date().toISOString().substring(0, 7),
    payment_method: "bank_transfer" as "bank_transfer" | "upi" | "cheque" | "cash",
    reference_number: "",
    status: "pending" as "pending" | "approved" | "paid",
    client_id: "",
    notes: "",
  });
  const [recordingPayout, setRecordingPayout] = useState(false);

  // Document Upload State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<"contract" | "nda" | "pan" | "kyc" | "other">("contract");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/business-associates/${resolvedParams.id}`);
      if (res?.associate) {
        setAssociate(res.associate);
        setClients(res.referred_clients || []);
        setPayouts(res.payouts || []);
        setDocuments(res.documents || []);
        setMetrics(res.metrics || metrics);
        
        // Auto default payout type
        if (res.associate.engagement_model === "salary") {
          setPayoutForm((prev) => ({
            ...prev,
            type: "salary",
            gross_amount: String(res.associate.base_salary || ""),
          }));
        }
      }
    } catch (err: any) {
      console.error("Failed to load associate dossier:", err);
      toast.error(err.message || "Failed to load associate details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [resolvedParams.id]);

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRecordingPayout(true);
      const gross = Number(payoutForm.gross_amount);
      if (!gross || gross <= 0) {
        toast.error("Please enter a valid gross payout amount");
        return;
      }

      await api.request(`/business-associates/${resolvedParams.id}/payouts`, {
        method: "POST",
        body: JSON.stringify({
          type: payoutForm.type,
          gross_amount: gross,
          tds_rate: Number(payoutForm.tds_rate) || 0,
          period_month: payoutForm.period_month,
          payment_method: payoutForm.payment_method,
          reference_number: payoutForm.reference_number || null,
          status: payoutForm.status,
          client_id: payoutForm.client_id ? Number(payoutForm.client_id) : null,
          notes: payoutForm.notes || null,
        }),
      });

      toast.success("Payout recorded successfully");
      setShowPayoutModal(false);
      fetchDossier();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payout");
    } finally {
      setRecordingPayout(false);
    }
  };

  const handleUpdatePayoutStatus = async (payoutId: number, status: string) => {
    const ref = status === "paid" ? window.prompt("Enter Transaction UTR / Bank Reference Number:") : null;
    try {
      await api.request(`/business-associates/payouts/${payoutId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          reference_number: ref || undefined,
        }),
      });
      toast.success(`Payout marked as ${status}`);
      fetchDossier();
    } catch (err: any) {
      toast.error(err.message || "Failed to update payout status");
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      toast.error("Please select a document file");
      return;
    }

    try {
      setUploadingDoc(true);
      const data = new FormData();
      data.append("title", docTitle);
      data.append("document_type", docType);
      data.append("file", docFile);

      await api.request(`/business-associates/${resolvedParams.id}/documents`, {
        method: "POST",
        body: data,
      });

      toast.success("Document uploaded successfully");
      setShowDocModal(false);
      setDocFile(null);
      setDocTitle("");
      fetchDossier();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading || !associate) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading associate dossier...</p>
        </div>
      </AdminLayout>
    );
  }

  // Calculated TDS preview in modal
  const modalGross = Number(payoutForm.gross_amount) || 0;
  const modalTdsRate = Number(payoutForm.tds_rate) || 0;
  const modalTdsAmt = Math.round(modalGross * (modalTdsRate / 100));
  const modalNetAmt = modalGross - modalTdsAmt;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>/</span>
              <Link href="/dashboard/business-associates" className="hover:text-slate-800 transition">Business Associates</Link>
              <span>/</span>
              <span className="font-semibold text-slate-800">{associate.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>{associate.name}</span>
              </h1>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {associate.associate_code}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                associate.partner_tier === "gold" ? "bg-amber-50 text-amber-700 border-amber-300" :
                associate.partner_tier === "silver" ? "bg-slate-100 text-slate-700 border-slate-300" :
                "bg-orange-50 text-orange-700 border-orange-200"
              }`}>
                {associate.partner_tier} Partner
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase">
                {associate.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {associate.email ? `${associate.email} • ` : ""}{associate.phone} &bull; Onboarded on {associate.joining_date}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/business-associates/${associate.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Terms</span>
            </Link>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payout</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Performance Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Sales Driven</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              ₹{Number(metrics.total_sales_driven).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {clients.length} referred clients
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Lifetime Earnings</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              ₹{Number(metrics.lifetime_gross_earnings).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross accrued salary & commissions
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Paid Out</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              ₹{Number(metrics.total_paid_payouts).toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Disbursed to bank account
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Pending Payout</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-amber-600">
              ₹{Number(metrics.pending_payouts).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              TDS withheld: ₹{Number(metrics.total_tds_withheld).toLocaleString()} (Sec 194H)
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            Terms & Banking
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "clients"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <span>Referred Clients</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800">
              {clients.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("payouts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "payouts"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <span>Payouts & Earnings Ledger</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800">
              {payouts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "documents"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
            }`}
          >
            <span>Contract & Document Vault</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800">
              {documents.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Terms & Banking Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Wallet className="w-4 h-4 text-blue-600" />
                Compensation Model & Commission Policy
              </h2>
              <dl className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">Engagement Model</dt>
                  <dd className="font-bold text-slate-900 uppercase">{associate.engagement_model}</dd>
                </div>
                {(associate.engagement_model === "salary" || associate.engagement_model === "hybrid") && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-slate-500 font-medium">Monthly Base Salary / Retainer</dt>
                    <dd className="font-bold text-emerald-700 font-mono">
                      ₹{Number(associate.base_salary).toLocaleString()} / month
                    </dd>
                  </div>
                )}
                {(associate.engagement_model === "commission" || associate.engagement_model === "hybrid") && (
                  <>
                    <div className="py-2.5 flex justify-between">
                      <dt className="text-slate-500 font-medium">Commission Rate</dt>
                      <dd className="font-bold text-blue-700 font-mono">{associate.commission_rate}%</dd>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <dt className="text-slate-500 font-medium">Calculation Basis</dt>
                      <dd className="font-semibold text-slate-800">
                        {associate.commission_basis === "taxable_turnover"
                          ? "Taxable Services Scope (Excl. 18% GST)"
                          : "Gross Invoice Total"}
                      </dd>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <dt className="text-slate-500 font-medium">Commission Scope</dt>
                      <dd className="font-semibold text-slate-800 capitalize">
                        {associate.commission_scope === "recurring" ? "All Invoices (Recurring)" : "First Invoice Only"}
                      </dd>
                    </div>
                  </>
                )}
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">Contract Period</dt>
                  <dd className="font-semibold text-slate-800">
                    {associate.joining_date} to {associate.contract_end_date || "Ongoing (No expiry)"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Tax Compliance & Banking Coordinates
              </h2>
              <dl className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">Income Tax PAN</dt>
                  <dd className="font-mono font-bold text-slate-900">{associate.pan_number || "Not provided"}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">GSTIN</dt>
                  <dd className="font-mono font-semibold text-slate-800">{associate.gstin || "Unregistered (Individual)"}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">Bank Partner</dt>
                  <dd className="font-semibold text-slate-800">{associate.bank_name || "Not Set"}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">Account Beneficiary</dt>
                  <dd className="font-semibold text-slate-800">{associate.bank_account_name || associate.name}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">Account Number</dt>
                  <dd className="font-mono font-bold text-slate-900">{associate.bank_account_number || "Not Set"}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">Bank IFSC Code</dt>
                  <dd className="font-mono font-semibold text-slate-800">{associate.bank_ifsc || "Not Set"}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500 font-medium">UPI ID</dt>
                  <dd className="font-mono text-slate-700">{associate.bank_upi_id || "Not Set"}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Tab 2: Referred Clients */}
        {activeTab === "clients" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {clients.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Clients Referred Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When creating new clients in the CRM, link this associate to automatically track deals and compute performance commissions.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Client Company</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Invoices Issued</th>
                      <th className="py-3 px-4">Paid Revenue Delivered</th>
                      <th className="py-3 px-4">Onboarded</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.company_name}</div>
                          <div className="text-[11px] text-slate-500">{c.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{c.email}</div>
                          <div className="text-[11px] text-slate-500">{c.phone || "No phone"}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {c.total_invoices_count || 0} invoices
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700 font-mono">
                          ₹{Number(c.total_revenue_paid || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/dashboard/clients/${c.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                          >
                            <span>View CRM Record</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payouts Ledger */}
        {activeTab === "payouts" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Disbursement & Commission Ledger</h3>
                <p className="text-[11px] text-slate-500">Tracks gross fees, statutory Sec 194H TDS withheld, and bank remittances.</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payout</span>
              </button>
            </div>

            {payouts.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Payouts Logged Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Payouts will appear here when client invoices are paid or when you record monthly salary stipends.
                </p>
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record First Payout</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Payout #</th>
                      <th className="py-3 px-4">Type & Period</th>
                      <th className="py-3 px-4">Gross Fee</th>
                      <th className="py-3 px-4">TDS (Sec 194H)</th>
                      <th className="py-3 px-4">Net Disbursed</th>
                      <th className="py-3 px-4">Status & Ref</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {p.payout_number}
                          {p.invoice && (
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              Inv #{p.invoice.invoice_number}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold capitalize text-slate-900">{p.type}</span>
                          <div className="text-[11px] text-slate-500">{p.period_month || "—"}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          ₹{Number(p.gross_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          ₹{Number(p.tds_amount).toLocaleString()} ({p.tds_rate}%)
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          ₹{Number(p.net_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            p.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            p.status === "approved" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            p.status === "cancelled" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {p.status}
                          </span>
                          {p.reference_number && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">
                              UTR: {p.reference_number}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === "pending" && (
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, "approved")}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {(p.status === "pending" || p.status === "approved") && (
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, "paid")}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Document Vault */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Contract & Document Repository</h3>
                <p className="text-[11px] text-slate-500">Secure storage for signed partnership agreements, NDAs, and KYC scans.</p>
              </div>
              <button
                onClick={() => setShowDocModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Documents Uploaded</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Upload signed associate agreements, NDAs, or identification documents for this partner.
                </p>
                <button
                  onClick={() => setShowDocModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Contract</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((d) => (
                  <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{d.title}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="uppercase font-semibold">{d.document_type}</span>
                          <span>&bull;</span>
                          <span>{d.file_size || "PDF File"}</span>
                          {d.created_at && (
                            <>
                              <span>&bull;</span>
                              <span>Uploaded {new Date(d.created_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <a
                      href={d.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Record Payout */}
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Record Associate Payout
                </h3>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayout} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payout Type
                    </label>
                    <select
                      value={payoutForm.type}
                      onChange={(e) => setPayoutForm({ ...payoutForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="commission">Commission Fee</option>
                      <option value="salary">Salary Retainer</option>
                      <option value="bonus">Performance Bonus</option>
                      <option value="reimbursement">Expense Reimbursement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Period Month
                    </label>
                    <input
                      type="month"
                      value={payoutForm.period_month}
                      onChange={(e) => setPayoutForm({ ...payoutForm, period_month: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gross Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="50"
                      required
                      value={payoutForm.gross_amount}
                      onChange={(e) => setPayoutForm({ ...payoutForm, gross_amount: e.target.value })}
                      placeholder="25000"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sec 194H TDS Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.5"
                      value={payoutForm.tds_rate}
                      onChange={(e) => setPayoutForm({ ...payoutForm, tds_rate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Statutory Calculation Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Calculation:</span>
                    <span>₹{modalGross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>TDS Withheld ({modalTdsRate}%):</span>
                    <span>- ₹{modalTdsAmt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1">
                    <span>Net Disbursable:</span>
                    <span>₹{modalNetAmt.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={payoutForm.payment_method}
                      onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="upi">UPI</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payout Status
                    </label>
                    <select
                      value={payoutForm.status}
                      onChange={(e) => setPayoutForm({ ...payoutForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid (Disbursed)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    value={payoutForm.reference_number}
                    onChange={(e) => setPayoutForm({ ...payoutForm, reference_number: e.target.value })}
                    placeholder="e.g. UTR09876543210"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingPayout}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {recordingPayout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Payout</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Upload Document */}
        {showDocModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload Associate Document
                </h3>
                <button
                  onClick={() => setShowDocModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Signed Partnership Agreement 2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="contract">Partnership Contract / Agreement</option>
                    <option value="nda">Non-Disclosure Agreement (NDA)</option>
                    <option value="pan">PAN Card Copy</option>
                    <option value="kyc">KYC / ID Verification</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Upload File (PDF or Image, max 10MB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Upload Document</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
