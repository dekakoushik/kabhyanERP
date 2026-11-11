"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  KeyRound,
  Save,
  Loader2,
  ShieldCheck,
  Clock,
  Bell,
} from "lucide-react";

function SecuritySettingsContent() {
  const [form, setForm] = useState({
    client_portal_enabled: "true",
    auto_notify_client_on_reply: "true",
    session_timeout_minutes: "120",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSec = async () => {
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
          client_portal_enabled: flat["client_portal_enabled"] || "true",
          auto_notify_client_on_reply: flat["auto_notify_client_on_reply"] || "true",
          session_timeout_minutes: flat["session_timeout_minutes"] || "120",
        });
      } catch (err: any) {
        toast.error("Failed to load security policies");
      } finally {
        setLoading(false);
      }
    };
    fetchSec();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "security_policy",
      }));

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });
      toast.success("Security & portal access policies updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to save security settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <p className="text-xs font-semibold text-slate-500">Loading security policies...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Security & Client Portal Access Policies</h2>
              <p className="text-xs text-slate-500">
                Self-service customer portal permissions, session timeouts, and auto-notification rules.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-bold text-slate-900">Enable Client Self-Service Portal (/portal)</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Allow customers to log in, review project sprints, check invoices, and submit support tickets.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.client_portal_enabled === "true"}
                onChange={(e) =>
                  setForm({ ...form, client_portal_enabled: e.target.checked ? "true" : "false" })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-bold text-slate-900">Auto-Notify Clients on Ticket Updates</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Automatically trigger email dispatch when internal staff replies to customer ticket threads.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.auto_notify_client_on_reply === "true"}
                onChange={(e) =>
                  setForm({ ...form, auto_notify_client_on_reply: e.target.checked ? "true" : "false" })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Sanctum / Redis Session Inactivity Lifetime (Minutes)
            </label>
            <input
              type="number"
              value={form.session_timeout_minutes}
              onChange={(e) => setForm({ ...form, session_timeout_minutes: e.target.value })}
              className="w-48 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Automatic logout threshold after idle period</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Security Policies</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <p className="text-xs font-semibold text-slate-500">Loading security policies...</p>
        </div>
      }
    >
      <SecuritySettingsContent />
    </Suspense>
  );
}

