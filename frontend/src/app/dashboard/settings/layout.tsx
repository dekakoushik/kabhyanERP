"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Settings,
  Building,
  Receipt,
  Building2,
  Globe,
  KeyRound,
  Mail,
  Cpu,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [flushing, setFlushing] = useState(false);

  const navItems = [
    { label: "Overview", href: "/dashboard/settings", icon: LayoutGrid, exact: true },
    { label: "Company Profile", href: "/dashboard/settings/company", icon: Building },
    { label: "GST & Taxation", href: "/dashboard/settings/gst", icon: Receipt },
    { label: "Banking & Wire", href: "/dashboard/settings/banking", icon: Building2 },
    { label: "Localization", href: "/dashboard/settings/localization", icon: Globe },
    { label: "Security & Portal", href: "/dashboard/settings/security", icon: KeyRound },
    { label: "SMTP Email", href: "/dashboard/settings/email", icon: Mail },
    { label: "System Health", href: "/dashboard/settings/system", icon: Cpu },
  ];

  const handleFlushCache = async () => {
    try {
      setFlushing(true);
      const res = await api.request("/settings/flush-cache", { method: "POST" });
      toast.success(res?.message || "Application & Redis cache cleared successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to flush application cache");
    } finally {
      setFlushing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Header & Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Administration</span>
              <span>/</span>
              <span className="text-blue-600">Enterprise Settings</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Settings className="w-5 h-5" />
              </span>
              System Configuration & Controls
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage corporate legal entity, Indian GST compliance, banking coordinates, and Redis cache.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFlushCache}
              disabled={flushing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Clear Laravel config cache and Redis keys"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${flushing ? "animate-spin" : ""}`} />
              <span>{flushing ? "Flushing..." : "Flush Cache"}</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-Navigation Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-white border border-slate-200/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Page Content Body */}
        <div>{children}</div>
      </div>
    </AdminLayout>
  );
}

