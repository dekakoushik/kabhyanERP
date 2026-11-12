"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Smartphone,
  Sparkles,
} from "lucide-react";

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brand } = useBrand();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ name?: string; email?: string } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !emailParam) {
      setVerifying(false);
      setVerifyError("Invalid activation link. Missing token or email parameter.");
      return;
    }

    const verify = async () => {
      try {
        setVerifying(true);
        const res = await api.request(
          `/auth/verify-invitation?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`
        );
        if (res.valid) {
          setTokenValid(true);
          setClientInfo({ name: res.name, email: res.email });
        } else {
          setVerifyError(res.message || "Invitation link is invalid or has expired.");
        }
      } catch (err: any) {
        setVerifyError(err.message || "Failed to verify invitation link. It may have expired.");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, emailParam]);

  // Password Strength Evaluation
  const strength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await api.request("/auth/activate-account", {
        method: "POST",
        body: JSON.stringify({
          email: emailParam,
          token,
          password,
          password_confirmation: confirmPassword,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to activate account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Verifying Security Link...</h2>
          <p className="text-xs text-slate-500">Checking your client activation token with the security gateway.</p>
        </div>
      </div>
    );
  }

  if (verifyError || !tokenValid) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Activation Link Expired or Invalid</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {verifyError || "This activation link is no longer valid. Links automatically expire after 48 hours for security."}
          </p>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Please contact your Kabhyan Technologies account manager or email{" "}
              <a href={`mailto:${brand.companyEmail || "contact@kabhyan.com"}`} className="text-blue-600 font-semibold underline">
                {brand.companyEmail || "contact@kabhyan.com"}
              </a>{" "}
              to receive a fresh invitation link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-3">
          <Image
            src={brand.logoPrimary || "/logo.png"}
            alt={brand.companyName || "Kabhyan Technologies"}
            width={220}
            height={60}
            priority
            unoptimized
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          Client Mobile App Access
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Create Your Private Password
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Welcome {clientInfo?.name ? <strong className="text-slate-800">{clientInfo.name}</strong> : "to Kabhyan"}! Set a confidential password to access your projects and deliverables.
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Account Activated Successfully!</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Your confidential password has been established. You will use this password to sign into the{" "}
                  <strong className="text-slate-900">Kabhyan Client Mobile Application</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Registered Email:</span>
                  <span className="font-semibold text-slate-800">{emailParam}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Access Status:</span>
                  <span className="font-bold text-emerald-600">Active & Ready</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-[11px] text-left">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Mobile App Rollout
                </p>
                <p className="text-blue-700/90 leading-relaxed">
                  When our Mobile App is published on the Google Play Store and Apple App Store, download it and sign in with your email and this newly chosen password.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Account Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={emailParam}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    New Private Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Enter at least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="grid grid-cols-4 gap-1">
                      <div className={`h-1 rounded-full ${strength >= 1 ? (strength === 1 ? "bg-red-500" : strength === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200"}`} />
                      <div className={`h-1 rounded-full ${strength >= 2 ? (strength === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200"}`} />
                      <div className={`h-1 rounded-full ${strength >= 3 ? "bg-emerald-500" : "bg-slate-200"}`} />
                      <div className={`h-1 rounded-full ${strength >= 4 ? "bg-emerald-600" : "bg-slate-200"}`} />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {strength <= 1 ? "Weak password" : strength <= 3 ? "Good password" : "Very strong password"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-[11px] text-slate-500">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Confidentiality Guarantee
                </p>
                <p className="leading-relaxed">
                  Your password is encrypted with cryptographic bcrypt hashing. Kabhyan Technologies staff and developers cannot view your chosen password.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{submitting ? "Activating Account..." : "Save Password & Activate"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}

