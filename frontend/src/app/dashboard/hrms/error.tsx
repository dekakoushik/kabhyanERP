"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function HrmsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("HRMS Module error:", error);
  }, [error]);

  return (
    <div className="py-24 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto px-4">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Unable to Load HRMS Workspace
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error?.message && !error.message.includes("digest")
            ? error.message
            : "An unexpected error occurred while loading this HR & Payroll screen."}
        </p>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
        <Link
          href="/dashboard/hrms"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>HR Overview</span>
        </Link>
      </div>
    </div>
  );
}
