"use client";

import { useState } from "react";
import { WifiOff, RefreshCw, Home, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  const [checking, setChecking] = useState(false);

  const handleRetry = () => {
    setChecking(true);
    if (typeof window !== "undefined") {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setTimeout(() => {
          setChecking(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            K
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            Kabhyan ERP
          </span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
          Offline Mode
        </span>
      </div>

      {/* Center Offline Card */}
      <div className="max-w-md w-full mx-auto bg-white border border-slate-200/80 rounded-2xl shadow-lg p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-sm">
          <WifiOff className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            No Internet Connection
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            You appear to be offline. Kabhyan ERP has preserved your local session safely.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-left border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Automatic Sync Protection</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Any unsubmitted forms or financial actions are paused until a secure connection is re-established.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking..." : "Retry Connection"}</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Cached Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 py-4">
        Kabhyan Technologies &bull; Progressive Web App
      </div>
    </div>
  );
}
