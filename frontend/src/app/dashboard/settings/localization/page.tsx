"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Globe,
  Save,
  Loader2,
  Calendar,
  Clock,
  IndianRupee,
} from "lucide-react";

function LocalizationSettingsContent() {
  const [form, setForm] = useState({
    currency_code: "INR",
    currency_symbol: "₹",
    date_format: "DD MMM YYYY",
    time_zone: "Asia/Kolkata",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLoc = async () => {
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
          currency_code: flat["currency_code"] || "INR",
          currency_symbol: flat["currency_symbol"] || "₹",
          date_format: flat["date_format"] || "DD MMM YYYY",
          time_zone: flat["time_zone"] || "Asia/Kolkata",
        });
      } catch (err: any) {
        toast.error("Failed to load localization parameters");
      } finally {
        setLoading(false);
      }
    };
    fetchLoc();
  }, []);

  const handleCurrencySelect = (code: string, symbol: string) => {
    setForm({
      ...form,
      currency_code: code,
      currency_symbol: symbol,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "localization",
      }));

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });
      toast.success("Localization & Regional formats updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-xs font-semibold text-slate-500">Loading localization settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Localization & Regional Formats</h2>
              <p className="text-xs text-slate-500">
                Operating currency, date formatting conventions, and local Indian Standard Time (IST).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Corporate Accounting Currency</label>
            <div className="flex items-center gap-2">
              {[
                { code: "INR", symbol: "₹", label: "INR (₹) Indian Rupee" },
                { code: "USD", symbol: "$", label: "USD ($) US Dollar" },
                { code: "EUR", symbol: "€", label: "EUR (€) Euro" },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCurrencySelect(c.code, c.symbol)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    form.currency_code === c.code
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {c.code} ({c.symbol})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Currency Symbol Override</label>
            <input
              type="text"
              value={form.currency_symbol}
              onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Global Date Format</label>
            <select
              value={form.date_format}
              onChange={(e) => setForm({ ...form, date_format: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="DD MMM YYYY">DD MMM YYYY (e.g. 11 Nov 2026) - Recommended</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 11/11/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format - 2026-11-11)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Timezone Alignment</label>
            <select
              value={form.time_zone}
              onChange={(e) => setForm({ ...form, time_zone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30) - Primary</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Localization</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LocalizationSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-xs font-semibold text-slate-500">Loading localization settings...</p>
        </div>
      }
    >
      <LocalizationSettingsContent />
    </Suspense>
  );
}

