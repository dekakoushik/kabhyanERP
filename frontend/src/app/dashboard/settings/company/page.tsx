"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Building,
  Save,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
} from "lucide-react";

function CompanySettingsContent() {
  const [form, setForm] = useState({
    company_name: "",
    company_legal_tagline: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const res: SettingsResponse = await api.request("/settings");
        const flat: Record<string, string> = {};
        if (res.settings && typeof res.settings === "object") {
          Object.values(res.settings).forEach((items) => {
            if (Array.isArray(items)) {
              items.forEach((item) => {
                flat[item.key] = item.value || "";
              });
            }
          });
        }
        setForm({
          company_name: flat["company_name"] || "Kabhyan Technologies Private Limited",
          company_legal_tagline: flat["company_legal_tagline"] || "Enterprise IT & Software Engineering Solutions",
          company_email: flat["company_email"] || "contact@kabhyan.com",
          company_phone: flat["company_phone"] || "+91 98200 12345",
          company_address: flat["company_address"] || "Bandra Kurla Complex, Mumbai, Maharashtra 400051",
          company_website: flat["company_website"] || "https://www.kabhyan.com",
        });
      } catch (err: any) {
        toast.error("Failed to load company profile");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "company",
      }));

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });
      toast.success("Corporate entity profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Corporate Entity Profile</h2>
              <p className="text-xs text-slate-500">
                Official particulars rendered across Estimates, Proforma Invoices, and Official Tax Invoices.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Company Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Official Sub-tagline / Business Scope
            </label>
            <input
              type="text"
              value={form.company_legal_tagline}
              onChange={(e) => setForm({ ...form, company_legal_tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={form.company_email}
                onChange={(e) => setForm({ ...form, company_email: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">HQ Telephone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={form.company_phone}
                onChange={(e) => setForm({ ...form, company_phone: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Official Website URL</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={form.company_website}
                onChange={(e) => setForm({ ...form, company_website: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="text-xs">
          <label className="block font-bold text-slate-700 mb-1.5">Registered Office Address</label>
          <div className="relative">
            <textarea
              rows={3}
              value={form.company_address}
              onChange={(e) => setForm({ ...form, company_address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading company profile...</p>
        </div>
      }
    >
      <CompanySettingsContent />
    </Suspense>
  );
}
