"use client";

import { useEffect } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ProjectWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project workspace error:", error);
  }, [error]);

  return (
    <AdminLayout>
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto px-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Workspace Failed to Load
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error?.message || "An unexpected error occurred while rendering the project workspace."}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Projects</span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
