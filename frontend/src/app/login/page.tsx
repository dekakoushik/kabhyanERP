"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Sparkles,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("superadmin@kabhyan.com");
  const [password, setPassword] = useState("Kabhyan@2026");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login(res.token, res.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuick = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Kabhyan@2026");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-3">
          <Image
            src="/logo.png"
            alt="Kabhyan Technologies"
            width={240}
            height={70}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          Enterprise ERP Portal
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Internal Operations & Workspace Management Suite
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Sign in to your account</h3>
            <p className="text-xs text-slate-500 mt-1">
              Authorized personnel only. Sessions are monitored and secured with Redis.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Corporate Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kabhyan.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Autofill Pills */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Login (Demo Accounts):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => fillQuick("superadmin@kabhyan.com")}
                className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition cursor-pointer"
              >
                SuperAdmin
              </button>
              <button
                type="button"
                onClick={() => fillQuick("admin@kabhyan.com")}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuick("hr@kabhyan.com")}
                className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition cursor-pointer"
              >
                HR
              </button>
              <button
                type="button"
                onClick={() => fillQuick("dev@kabhyan.com")}
                className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition cursor-pointer"
              >
                Employee
              </button>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-3">
              <KeyRound className="w-3 h-3" />
              <span>Default password for all demo accounts: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">Kabhyan@2026</code></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          © 2026 Kabhyan Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
}
