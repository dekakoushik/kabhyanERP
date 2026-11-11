"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSentSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to process password reset request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
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
          Enterprise Security Service
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Kabhyan IT Operations & Management Suite
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Forgot Password?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your corporate email address to receive a secure password reset link.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 font-medium">{error}</div>
            </div>
          )}

          {sentSuccess ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-emerald-50 p-5 border border-emerald-200/80 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-emerald-900 mb-1">
                  Reset Link Dispatched
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  If an active account exists for <strong>{email}</strong>, we have sent a secure password reset link to your email inbox. The link will expire in 60 minutes.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-500 text-center">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSentSuccess(false)}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  try again
                </button>
              </div>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Corporate / Registered Email
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
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

