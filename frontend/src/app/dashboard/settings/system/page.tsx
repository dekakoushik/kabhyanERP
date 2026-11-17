"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Cpu,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Clock,
  AlertOctagon,
  Trash2,
} from "lucide-react";

function SystemHealthContent() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [password, setPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res: SettingsResponse = await api.request("/settings");
      setData(res);
    } catch (err: any) {
      toast.error("Failed to load infrastructure diagnostics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleFlushCache = async () => {
    try {
      setFlushing(true);
      const res = await api.request("/settings/flush-cache", { method: "POST" });
      toast.success(res?.message || "Cache flushed successfully");
      fetchHealth();
    } catch (err: any) {
      toast.error(err.message || "Failed to flush cache");
    } finally {
      setFlushing(false);
    }
  };

  const handleResetDatabase = async () => {
    if (confirmationText !== "RESET DATABASE") {
      toast.error('You must type "RESET DATABASE" exactly.');
      return;
    }
    if (!password) {
      toast.error("Please enter your SuperAdmin password.");
      return;
    }

    try {
      setResetting(true);
      const res = await api.settings.resetDatabase({
        confirmation: confirmationText,
        password,
      });
      toast.success(res?.message || "Factory database reset completed successfully.");
      setShowResetModal(false);
      setConfirmationText("");
      setPassword("");
      fetchHealth();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset database");
    } finally {
      setResetting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500">Loading infrastructure diagnostics...</p>
      </div>
    );
  }

  const { environment } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">System Health & Diagnostics</h2>
              <p className="text-xs text-slate-500">
                Real-time status of PostgreSQL database, cache, and server runtime.
              </p>
            </div>
          </div>

          <button
            onClick={handleFlushCache}
            disabled={flushing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${flushing ? "animate-spin" : ""}`} />
            <span>{flushing ? "Clearing..." : "Clear Cache"}</span>
          </button>
        </div>

        {/* Live Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PostgreSQL Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                PostgreSQL Relational Database
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  environment.database_status === "connected"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {environment.database_status}
              </span>
            </div>
            <p className="text-xs text-slate-500">Engine: PostgreSQL (Port 5432 / pdo_pgsql)</p>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Query Latency:</span>
              <span className="font-bold text-emerald-700">{environment.database_ping || "0.5 ms"}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Database Driver:</span>
              <span className="text-slate-700 font-semibold">{environment.database_driver || "pgsql"}</span>
            </div>
          </div>

          {/* Database Cache & Queue Storage Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Database Cache & Queue Storage
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500">Pure PostgreSQL storage tables: cache, jobs, sessions</p>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Cache Driver:</span>
              <span className="font-bold text-slate-700">{environment.cache_driver || "database"}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Queue Driver:</span>
              <span className="text-emerald-700 font-semibold">{environment.queue_driver || "database"}</span>
            </div>
          </div>
        </div>

        {/* Runtime Environment Details */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <span className="font-bold text-slate-800 text-xs block">Server Runtime Environment</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Framework</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">Laravel {environment.laravel_version}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">PHP Runtime</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">PHP {environment.php_version}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Environment</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5 uppercase">{environment.app_env}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Server Clock</span>
              <p className="font-mono text-slate-700 mt-0.5 text-[11px] truncate">{environment.server_time}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Factory Database Reset */}
      <div className="bg-white rounded-2xl border border-red-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Factory Database Reset</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  Danger Zone
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently purge all operational records and commercial documents to start fresh for live launch.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Database</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-red-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            What will happen when you reset the database:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>All Estimates, Quotations & Deliverables will be deleted</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>All Proforma & Tax Invoices with payment records deleted</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>All Clients, Projects, Tasks & Support Tickets deleted</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>All other staff accounts deleted (your SuperAdmin account stays active)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>Document numbering counters reset to 001 (e.g. EST-2026-001)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>Auto-increment sequences restart from 1 for clean live onboarding</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Are you absolutely sure?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This action is <strong className="text-red-600">irreversible</strong>. It will permanently purge all clients, estimates, invoices, projects, and non-admin staff records. Your current SuperAdmin account will remain active.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type <span className="font-mono text-red-600 font-bold select-all">RESET DATABASE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="RESET DATABASE"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter your SuperAdmin Password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your current login password"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={resetting}
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmationText("");
                  setPassword("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmationText !== "RESET DATABASE" || !password || resetting}
                onClick={handleResetDatabase}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{resetting ? "Resetting Database..." : "Permanently Reset Database"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SystemHealthPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">Loading infrastructure diagnostics...</p>
        </div>
      }
    >
      <SystemHealthContent />
    </Suspense>
  );
}

