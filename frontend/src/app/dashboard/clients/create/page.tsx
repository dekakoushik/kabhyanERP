"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { GST_STATE_CODES, validateGSTIN } from "@/lib/gst";
import { toast } from "sonner";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  KeyRound,
  FileText,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Receipt,
  CreditCard,
  Globe,
  Send,
  HelpCircle,
  Hash,
  Check,
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

export default function CreateClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);

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
    create_portal_account: true,
    send_welcome_email: true,
    portal_password: "Client@2026",
    portal_access_status: "active" as "active" | "inactive",
  });

  // Real-time GSTIN validation and metadata extraction
  const gstAnalysis = useMemo(() => {
    return validateGSTIN(formData.gstin);
  }, [formData.gstin]);

  // Handle GSTIN Change with auto State and PAN detection
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

  // Generate strong secure random password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const specialChars = "!@#$%&*";
    let pwd = "Kbh";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    pwd += Math.floor(Math.random() * 90 + 10);
    setFormData((prev) => ({ ...prev, portal_password: pwd }));
    setShowPassword(true);
    toast.success("Secure password generated!");
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(formData.portal_password);
    setCopiedPwd(true);
    toast.success("Password copied to clipboard");
    setTimeout(() => setCopiedPwd(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.company_name.trim()) {
      setFormError("Both Primary Contact Name and Company/Organization are required.");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Client email is required for invoicing, communications, and portal access.");
      return;
    }

    if (formData.gstin.trim() && !gstAnalysis.isValid) {
      setFormError(gstAnalysis.errorMessage || "Please enter a valid 15-digit statutory GSTIN, or leave it blank if unregistered.");
      return;
    }

    try {
      setSaving(true);
      await api.request("/clients", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success(`Client ${formData.company_name} registered successfully!`);
      router.push("/dashboard/clients");
    } catch (err: any) {
      setFormError(err.message || "Failed to create client account.");
      setSaving(false);
    }
  };

  // Determine tax classification against West Bengal (19) or Assam (18) supplier base
  const taxTreatment = useMemo(() => {
    if (!formData.gstin) {
      return {
        label: "Unregistered / B2C Client",
        description: "Standard domestic rates applied; no Input Tax Credit (ITC) pass-through.",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }
    if (gstAnalysis.stateCode === "19") {
      return {
        label: "Intra-State Supply (West Bengal)",
        description: "Billed under CGST (9%) + SGST (9%) for IT services (SAC 998314).",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    return {
      label: `Inter-State Supply (${gstAnalysis.stateName || formData.state})`,
      description: "Billed under integrated tax IGST (18%) for cross-state services.",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    };
  }, [formData.gstin, gstAnalysis, formData.state]);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Top Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/clients"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              title="Return to Client Directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  New Client Record
                </span>
                <span className="text-xs text-slate-400">Enterprise CRM & GST Invoicing</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Add Enterprise Client Account
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/clients"
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
              <span>{saving ? "Saving Client..." : "Save & Register Client"}</span>
            </button>
          </div>
        </div>

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
                    {/* GSTIN Analysis Feedback */}
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Billing Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="accounts@kolkatafintech.in"
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

            {/* Address & Geographical Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Commercial & Billing Address
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Used in Tax Invoices & E-Way Bills</span>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City / District
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      State / UT (GST Registered)
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      PIN / Postal Code
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Country
                    </label>
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
                    <p className="text-[11px] text-slate-400 mt-1">Pre-selected on all future estimates and tax invoices.</p>
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
                    <p className="text-[11px] text-slate-400 mt-1">Calculates invoice due date from generation date.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Portal & Security Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Self-Service Client Portal Access
                  </h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.create_portal_account}
                    onChange={(e) => setFormData({ ...formData, create_portal_account: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="p-6 space-y-4">
                {formData.create_portal_account ? (
                  <>
                    <p className="text-xs text-slate-500">
                      When enabled, this client can securely log into <span className="font-semibold text-slate-800">erp.kabhyan.com/portal</span> to track deliverables, review invoices, and raise support tickets.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Portal Password
                          </label>
                          <button
                            type="button"
                            onClick={generatePassword}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            Generate Strong
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.portal_password}
                            onChange={(e) => setFormData({ ...formData, portal_password: e.target.value })}
                            className="w-full pl-3.5 pr-20 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                          />
                          <div className="absolute right-2 top-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={copyPasswordToClipboard}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                              title="Copy password"
                            >
                              {copiedPwd ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Credentials will be delivered to the billing email.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Account Access Status
                        </label>
                        <select
                          value={formData.portal_access_status}
                          onChange={(e) => setFormData({ ...formData, portal_access_status: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        >
                          <option value="active">Active & Enabled</option>
                          <option value="inactive">Disabled / Suspended</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.send_welcome_email}
                          onChange={(e) => setFormData({ ...formData, send_welcome_email: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Send branded HTML welcome email with login credentials and portal walkthrough immediately
                        </span>
                      </label>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Portal account disabled. Client will not receive login credentials for the external portal.
                  </p>
                )}
              </div>
            </div>

            {/* Notes & Commercial Terms */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Internal Account Notes & Relationship Background
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  rows={3}
                  placeholder="Key relationship milestones, project NDA notes, custom billing requirements, SLA agreements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Right Sticky Summary Column (4 cols) */}
          <div className="lg:col-span-4 sticky top-6 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Client Profile Preview
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                  Live Card
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-base font-black text-slate-900 leading-tight">
                    {formData.company_name.trim() || "Company Name Pending"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formData.name.trim() || "Contact Person"}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 space-y-2 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                      {formData.email || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold text-slate-800">
                      {formData.phone || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">GSTIN:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {formData.gstin || "UNREGISTERED"}
                    </span>
                  </div>
                  {formData.pan && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">PAN:</span>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        {formData.pan}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jurisdiction:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                      {formData.city}, {formData.state}
                    </span>
                  </div>
                  {formData.postal_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">PIN Code:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formData.postal_code}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tax Treatment Simulation */}
                <div className="p-3 rounded-xl border space-y-1.5 text-xs bg-slate-50/70 border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Statutory Tax Treatment
                  </span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${taxTreatment.badgeColor}`}>
                      {taxTreatment.label}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {taxTreatment.description}
                    </p>
                  </div>
                </div>

                {/* Commercial Defaults Preview */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Billing Terms
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Currency:</span>
                    <span className="font-bold text-slate-800">{formData.currency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Credit Period:</span>
                    <span className="font-semibold text-slate-800">{formData.payment_terms}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Self-Service Portal
                  </span>
                  <div className="mt-1 flex items-center justify-between">
                    {formData.create_portal_account ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Enabled ({formData.portal_access_status})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        Disabled
                      </span>
                    )}

                    {formData.create_portal_account && formData.send_welcome_email && (
                      <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                        <Send className="w-3 h-3" /> Auto-Email
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Client Account</span>
                </button>
                <Link
                  href="/dashboard/clients"
                  className="w-full flex items-center justify-center py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel & Back to Directory
                </Link>
              </div>
            </div>

            {/* Statutory Compliance Note */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                GST Compliant Invoicing
              </p>
              <p className="text-blue-700/90 leading-relaxed text-[11px]">
                Validating the 15-digit GSTIN automatically enables automated intra-state (CGST + SGST) or inter-state (IGST) split on future generated estimates and tax invoices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
