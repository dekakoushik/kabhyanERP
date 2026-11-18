"use client";

import { useState, useMemo, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, BusinessAssociate } from "@/lib/api";
import { GST_STATE_CODES, validateGSTIN } from "@/lib/gst";
import { toast } from "sonner";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Smartphone,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  CreditCard,
  Globe,
  Hash,
  Check,
  Handshake,
  Sparkles,
} from "lucide-react";

const STANDARD_CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "SGD", label: "SGD (S$) - Singapore Dollar" },
  { code: "CAD", label: "CAD (C$) - Canadian Dollar" },
  { code: "AUD", label: "AUD (A$) - Australian Dollar" },
];

const STANDARD_PAYMENT_TERMS = [
  { value: "Due Upon Receipt", label: "Due Upon Receipt (Immediate Payment)" },
  { value: "Net 15", label: "Net 15 (Payment within 15 days)" },
  { value: "Net 30", label: "Net 30 (Payment within 30 days - Standard)" },
  { value: "Net 45", label: "Net 45 (Payment within 45 days)" },
  { value: "Net 60", label: "Net 60 (Payment within 60 days)" },
  { value: "50% Advance / 50% Delivery", label: "50% Advance / 50% On Milestone Delivery" },
];

export default function AssociateAddClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [associate, setAssociate] = useState<BusinessAssociate | null>(null);
  const [loadingAssociate, setLoadingAssociate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    gstin: "",
    pan: "",
    address: "",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    postal_code: "",
    currency: "INR",
    payment_terms: "Net 30",
    notes: "",
    grant_mobile_access: true,
    send_invitation_email: true,
    portal_access_status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    const fetchAssociate = async () => {
      try {
        setLoadingAssociate(true);
        const res = await api.request(`/business-associates/${resolvedParams.id}`);
        if (res?.associate) {
          setAssociate(res.associate);
        }
      } catch (err: any) {
        toast.error("Failed to load business associate details");
        router.push("/dashboard/business-associates");
      } finally {
        setLoadingAssociate(false);
      }
    };
    fetchAssociate();
  }, [resolvedParams.id]);

  // Real-time GSTIN validation and metadata extraction
  const gstAnalysis = useMemo(() => {
    return validateGSTIN(formData.gstin);
  }, [formData.gstin]);

  const handleGstinChange = (value: string) => {
    const uppercaseVal = value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    const analysis = validateGSTIN(uppercaseVal);

    setFormData((prev) => {
      const updated = { ...prev, gstin: uppercaseVal };
      if (analysis.stateName) {
        updated.state = analysis.stateName;
      }
      if (analysis.pan) {
        updated.pan = analysis.pan;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.company_name.trim()) {
      setFormError("Both Primary Contact Name and Company/Organization are required.");
      return;
    }

    if (formData.gstin.trim() && !gstAnalysis.isValid) {
      setFormError(gstAnalysis.errorMessage || "Please enter a valid 15-digit statutory GSTIN, or leave it blank if unregistered.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        business_associate_id: Number(resolvedParams.id),
      };

      await api.request("/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(`Client ${formData.company_name} registered and attributed to ${associate?.name || "Business Associate"}!`);
      router.push(`/dashboard/business-associates/${resolvedParams.id}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to create client account.");
      setSaving(false);
    }
  };

  if (loadingAssociate) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading partner context...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/business-associates/${resolvedParams.id}`}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              title="Return to Associate Dossier"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Partner Referral Onboarding
                </span>
                <span className="text-xs text-slate-400">Attributed Client Registry</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Add Client for {associate?.name || "Partner"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/dashboard/business-associates/${resolvedParams.id}`}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Saving Client..." : "Save & Attribute Client"}</span>
            </button>
          </div>
        </div>

        {/* Partner Attribution Banner */}
        {associate && (
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-950">Attributed Referring Partner:</span>
                  <span className="text-xs font-black text-indigo-900">{associate.name}</span>
                  <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {associate.associate_code}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Model: <span className="font-semibold uppercase">{associate.engagement_model}</span> &bull; 
                  Commission: <span className="font-bold">{associate.commission_rate}%</span> ({associate.commission_basis === "taxable_turnover" ? "Taxable turnover scope" : "Gross"}) &bull; 
                  Tier: <span className="font-semibold uppercase">{associate.partner_tier}</span>
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-indigo-800 bg-white px-3 py-1.5 rounded-xl border border-indigo-200/80 shrink-0 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Auto-Accrual Enabled</span>
            </span>
          </div>
        )}

        {formError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Primary Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Company & Commercial Profile
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Company / Legal Entity Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kolkata Fintech Labs Pvt Ltd"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        GSTIN / Tax ID Number
                      </label>
                      <span className="text-[10px] text-slate-400">15 alphanumeric characters</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="e.g. 19AAAAA0000A1Z5"
                        value={formData.gstin}
                        onChange={(e) => handleGstinChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono uppercase rounded-xl border focus:outline-none focus:ring-2 transition ${
                          formData.gstin
                            ? gstAnalysis.isValid
                              ? "border-emerald-300 bg-emerald-50/20 text-emerald-900 focus:ring-emerald-500/20 focus:border-emerald-600"
                              : "border-amber-300 bg-amber-50/20 text-slate-800 focus:ring-amber-500/20 focus:border-amber-600"
                            : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-600"
                        }`}
                      />
                      {formData.gstin && (
                        <div className="absolute right-3 top-2.5">
                          {gstAnalysis.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <span className="text-[11px] font-mono font-bold text-amber-600">
                              {formData.gstin.length}/15
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.gstin && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                        {gstAnalysis.isValid ? (
                          <>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3" /> State: {gstAnalysis.stateName} ({gstAnalysis.stateCode})
                            </span>
                            {gstAnalysis.pan && (
                              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                PAN: {gstAnalysis.pan}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {gstAnalysis.errorMessage || "Format: 2 state digits + 10 PAN + 1 entity + Z + 1 checksum"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Primary Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Debojyoti Banerjee"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Billing / Contact Email Address
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="accounts@client.com (Optional)"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contact Phone / Mobile
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="+91 98300 12345"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Permanent Account Number (PAN)
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. AAAAA0000A"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Commercial & Billing Address
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Street Address / Suite / Tech Park / Floor
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Module 402, Webel IT Park, Salt Lake Sector V"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">City / District</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">State / UT (GST Registered)</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    >
                      {Object.entries(GST_STATE_CODES).map(([code, name]) => (
                        <option key={code} value={name}>
                          {code} - {name}
                        </option>
                      ))}
                      <option value="Other Territory">97 - Other Territory</option>
                      <option value="International">International / Overseas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN / Postal Code</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. 700091"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Terms & Currency Defaults */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Invoicing & Commercial Terms
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Default Billing Currency
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      >
                        {STANDARD_CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Default Payment Terms
                    </label>
                    <div className="relative">
                      <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      >
                        {STANDARD_PAYMENT_TERMS.map((term) => (
                          <option key={term.value} value={term.value}>
                            {term.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Referral Attribution Summary</h3>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Business Associate</span>
                  <span className="font-bold text-slate-900">{associate?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Associate Code</span>
                  <span className="font-mono font-bold text-blue-700">{associate?.associate_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commission Rate</span>
                  <span className="font-bold text-emerald-700">{associate?.commission_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Basis</span>
                  <span className="font-semibold text-slate-700">
                    {associate?.commission_basis === "taxable_turnover" ? "Taxable turnover" : "Gross invoice"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When tax invoices for this client are marked paid in the accounting ledger, commission payouts will automatically accrue for {associate?.name}.
              </p>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Registering Client..." : "Save & Attribute Client"}</span>
              </button>
              <Link
                href={`/dashboard/business-associates/${resolvedParams.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Cancel & Return
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
