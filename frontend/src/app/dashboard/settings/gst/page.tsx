"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  GST_STATE_CODES,
  STANDARD_IT_SAC_CODES,
  extractStateCode,
  calculateGSTSplit,
} from "@/lib/gst";
import {
  Receipt,
  Save,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calculator,
} from "lucide-react";

function GSTSettingsContent() {
  const [form, setForm] = useState({
    company_gstin: "",
    company_pan: "",
    default_sac_code: "998314",
    default_gst_rate: "18",
    reverse_charge_applicable: "false",
    lut_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGST = async () => {
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
          company_gstin: flat["company_gstin"] || "18AAGCK2934D1Z2",
          company_pan: flat["company_pan"] || "AAGCK2934D",
          default_sac_code: flat["default_sac_code"] || "998314",
          default_gst_rate: flat["default_gst_rate"] || "18",
          reverse_charge_applicable: flat["reverse_charge_applicable"] || "false",
          lut_number: flat["lut_number"] || "ARN-AD180226001924L",
        });
      } catch (err: any) {
        toast.error("Failed to load GST settings");
      } finally {
        setLoading(false);
      }
    };
    fetchGST();
  }, []);

  const handleGSTINChange = (val: string) => {
    const uppercase = val.toUpperCase().trim();
    // Auto extract PAN if valid GSTIN pattern (characters 3 through 12)
    let autoPan = form.company_pan;
    if (uppercase.length >= 12) {
      autoPan = uppercase.substring(2, 12);
    }
    setForm({
      ...form,
      company_gstin: uppercase,
      company_pan: autoPan,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "tax_compliance",
      }));

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });
      toast.success("Indian GST compliance parameters updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save GST settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-xs font-semibold text-slate-500">Loading GST compliance settings...</p>
      </div>
    );
  }

  const stateCode = extractStateCode(form.company_gstin);
  const stateName = stateCode ? GST_STATE_CODES[stateCode] : null;

  // Sample calculations for live simulator
  const sampleIntra = calculateGSTSplit({
    subtotal: 100000,
    taxRate: Number(form.default_gst_rate) || 18,
    supplierGstin: form.company_gstin,
    recipientGstin: form.company_gstin, // Same state -> Intra
  });

  const sampleInter = calculateGSTSplit({
    subtotal: 100000,
    taxRate: Number(form.default_gst_rate) || 18,
    supplierGstin: form.company_gstin,
    recipientGstin: "27AABCB1234D1Z5", // Maharashtra -> Inter
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Indian GST & Statutory Taxation</h2>
                <p className="text-xs text-slate-500">
                  Configure GSTIN, Service Accounting Codes (SAC), Place of Supply rules, and LUT declarations.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Supplier Corporate GSTIN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={15}
                placeholder="e.g. 19AAGCK2934D1Z2"
                value={form.company_gstin}
                onChange={(e) => handleGSTINChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="mt-1.5 flex items-center gap-2">
                {stateCode ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    State Code: {stateCode} ({stateName})
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-600">Enter a valid 15-character GSTIN</span>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Company PAN (Income Tax) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="e.g. AAGCK2934D"
                value={form.company_pan}
                onChange={(e) => setForm({ ...form, company_pan: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">10-digit Permanent Account Number</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Default IT Services SAC Code <span className="text-red-500">*</span>
              </label>
              <select
                value={form.default_sac_code}
                onChange={(e) => setForm({ ...form, default_sac_code: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {STANDARD_IT_SAC_CODES.map((sac) => (
                  <option key={sac.code} value={sac.code}>
                    {sac.code} - {sac.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Applied automatically to newly generated line items on Quotes & Invoices
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Standard GST Rate (%) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {["18", "12", "5", "0"].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setForm({ ...form, default_gst_rate: rate })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      form.default_gst_rate === rate
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {rate}% {rate === "18" ? "(Standard IT)" : rate === "0" ? "(LUT/Exempt)" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                LUT (Letter of Undertaking) Number
              </label>
              <input
                type="text"
                placeholder="e.g. ARN-AD180226001924L"
                value={form.lut_number}
                onChange={(e) => setForm({ ...form, lut_number: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                For Zero-Rated foreign software exports without payment of IGST
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Reverse Charge Mechanism (RCM) Default
              </label>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600">Tax payable under RCM:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.reverse_charge_applicable === "true"}
                    onChange={(e) =>
                      setForm({ ...form, reverse_charge_applicable: e.target.checked ? "true" : "false" })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save GST Parameters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Statutory Tax Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calculator className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Statutory GST Breakdown Simulator (₹1,00,000 Base)</h3>
            <p className="text-[11px] text-slate-500">Live preview of how tax invoices will be generated based on recipient location</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Intra-State Card */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">Intra-State Supply (Within State)</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                CGST + SGST
              </span>
            </div>
            <p className="text-[11px] text-emerald-700">
              When client is in <strong>{stateName || "Same State"}</strong> ({stateCode || "19"}):
            </p>
            <div className="space-y-1 pt-2 font-mono text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>Taxable Value:</span>
                <span>₹1,00,000.00</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>CGST ({sampleIntra.cgstRate}%):</span>
                <span>+ ₹{sampleIntra.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>SGST ({sampleIntra.sgstRate}%):</span>
                <span>+ ₹{sampleIntra.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-emerald-200">
                <span>Total Invoice Value:</span>
                <span>₹{(100000 + sampleIntra.totalTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Inter-State Card */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900">Inter-State Supply (Other States)</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                IGST
              </span>
            </div>
            <p className="text-[11px] text-blue-700">
              When client is in another state (e.g. 27 Maharashtra, 07 Delhi):
            </p>
            <div className="space-y-1 pt-2 font-mono text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>Taxable Value:</span>
                <span>₹1,00,000.00</span>
              </div>
              <div className="flex justify-between text-blue-800 font-semibold">
                <span>IGST ({sampleInter.igstRate}%):</span>
                <span>+ ₹{sampleInter.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-blue-200">
                <span>Total Invoice Value:</span>
                <span>₹{(100000 + sampleInter.totalTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GSTSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-xs font-semibold text-slate-500">Loading GST settings...</p>
        </div>
      }
    >
      <GSTSettingsContent />
    </Suspense>
  );
}

