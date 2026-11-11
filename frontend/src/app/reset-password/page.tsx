"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Lock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !emailParam) {
      setError("This reset link is missing critical security parameters. Please request a new reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setSubmitting(true);

    try {
      await api.request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: emailParam,
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      setResetSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reset password. The link may have expired.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Set New Password</h3>
        <p className="text-xs text-slate-500 mt-1">
          {emailParam ? (
            <>
              Resetting credentials for <span className="font-semibold text-slate-700">{emailParam}</span>
            </>
          ) : (
            "Enter your new secure password below."
          )}
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 font-medium">{error}</div>
        </div>
      )}

      {resetSuccess ? (
        <div className="space-y-5 text-center">
          <div className="rounded-xl bg-emerald-50 p-6 border border-emerald-200/80">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-emerald-900 mb-1">
              Password Reset Successfully!
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your account password has been updated. You can now use your new password to access Kabhyan ERP.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Redirecting to sign-in page shortly...
          </p>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              New Password
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Re-enter password"
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Confirm & Save Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel and return to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
          Enterprise Security Service
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Kabhyan IT Operations & Management Suite
        </p>
      </div>

      {/* Main Card wrapped in Suspense for searchParams */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense
          fallback={
            <div className="bg-white py-12 px-6 rounded-2xl text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-xs text-slate-500">Verifying security token...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

