"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Kabhyan ERP - System Notice</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4 font-sans antialiased selection:bg-blue-600 selection:text-white">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Workspace Temporarily Unavailable
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {error?.message && !error.message.includes("digest")
                ? error.message
                : "A transient client or rendering issue occurred. Reloading usually resolves this immediately."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                } else {
                  reset();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </a>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Kabhyan Technologies &bull; Enterprise ERP
          </div>
        </div>
      </body>
    </html>
  );
}
