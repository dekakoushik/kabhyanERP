"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Building2,
  Save,
  Loader2,
  CreditCard,
  QrCode,
  ShieldCheck,
} from "lucide-react";

function BankingSettingsContent() {
  const [form, setForm] = useState({
    bank_beneficiary_name: "",
    bank_name: "",
    bank_branch: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    bank_swift_code: "",
    bank_upi_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBanking = async () => {
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
          bank_beneficiary_name: flat["bank_beneficiary_name"] || "Kabhyan Technologies Private Limited",
          bank_name: flat["bank_name"] || "HDFC Bank Ltd",
          bank_branch: flat["bank_branch"] || "Guwahati Central Branch",
          bank_account_number: flat["bank_account_number"] || "50200088921822",
          bank_ifsc_code: flat["bank_ifsc_code"] || "HDFC0001234",
          bank_swift_code: flat["bank_swift_code"] || "HDFCINBB",
          bank_upi_id: flat["bank_upi_id"] || "kabhyan@hdfcbank",
        });
      } catch (err: any) {
        toast.error("Failed to load banking coordinates");
      } finally {
        setLoading(false);
      }
    };
    fetchBanking();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "banking",
      }));

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });
      toast.success("Banking & wire coordinates updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save banking settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500">Loading banking settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Bank & Wire Settlement Details</h2>
                <p className="text-xs text-slate-500">
                  Primary corporate accounts printed on Estimates, Proforma Invoices, and Official Tax Invoices.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Beneficiary Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.bank_beneficiary_name}
                onChange={(e) => setForm({ ...form, bank_beneficiary_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.bank_account_number}
                onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                IFSC Code (RTGS / NEFT) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.bank_ifsc_code}
                onChange={(e) => setForm({ ...form, bank_ifsc_code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Branch Name</label>
              <input
                type="text"
                value={form.bank_branch}
                onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">SWIFT / BIC Code (Cross-Border)</label>
              <input
                type="text"
                value={form.bank_swift_code}
                onChange={(e) => setForm({ ...form, bank_swift_code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Corporate UPI ID / VPA</label>
              <input
                type="text"
                value={form.bank_upi_id}
                onChange={(e) => setForm({ ...form, bank_upi_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Bank Coordinates</span>
            </button>
          </div>
        </form>
      </div>

      {/* Invoice Box Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 mb-2">Live Invoice Payment Box Render</h3>
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl max-w-sm space-y-1 font-mono text-xs text-slate-700">
          <p className="font-bold text-slate-900">{form.bank_name || "Bank Name"}</p>
          <p>Beneficiary: {form.bank_beneficiary_name || "Entity Name"}</p>
          <p>A/C No: {form.bank_account_number || "••••••••"}</p>
          <p>IFSC: {form.bank_ifsc_code || "••••••••"}</p>
          <p>Branch: {form.bank_branch || "Branch"}</p>
          {form.bank_upi_id && <p className="text-emerald-700 pt-1">UPI: {form.bank_upi_id}</p>}
        </div>
      </div>
    </div>
  );
}

export default function BankingSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">Loading banking settings...</p>
        </div>
      }
    >
      <BankingSettingsContent />
    </Suspense>
  );
}

