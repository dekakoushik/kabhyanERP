"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
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
  ExternalLink,
} from "lucide-react";

export default function CreateClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    gstin: "",
    address: "",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    notes: "",
    create_portal_account: true,
    portal_password: "Client@2026",
    portal_access_status: "active" as "active" | "inactive",
  });

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

    try {
      setSaving(true);
      await api.request("/clients", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      router.push("/dashboard/clients");
    } catch (err: any) {
      setFormError(err.message || "Failed to create client account.");
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Top Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/clients"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  New Client Record
                </span>
                <span className="text-xs text-slate-400">Enterprise CRM</span>
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
                      Company / Legal Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vanguard Logistics Corp"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      GSTIN / Tax ID Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 19AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 text-sm font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Primary Contact Person Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. David Vance"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Billing Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="billing@vanguard.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="+91 (983) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address & Geographical Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Registered Commercial Address
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Street Address & Suite / Floor
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Plot 14, Sector V, Salt Lake City"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City
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
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
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
                      When enabled, this client can securely log into <span className="font-semibold text-slate-800">erp.kabhyan.com/portal</span> to view their contracts, invoices, milestones, and raise support tickets.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Initial Portal Password
                        </label>
                        <input
                          type="text"
                          value={formData.portal_password}
                          onChange={(e) => setFormData({ ...formData, portal_password: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Default temporary password for client activation.</p>
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
                  placeholder="Key relationship milestones, special billing requirements, SLA agreements..."
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
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
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
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">City / State:</span>
                    <span className="font-semibold text-slate-800">
                      {formData.city}, {formData.state}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Self-Service Portal
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {formData.create_portal_account ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Enabled & Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        Disabled
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

            {/* Quick Helper Callout */}
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

