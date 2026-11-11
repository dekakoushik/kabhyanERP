"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import Link from "next/link";
import {
  Building,
  Receipt,
  Building2,
  Globe,
  KeyRound,
  Mail,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Database,
  Server,
  ShieldCheck,
  Send,
} from "lucide-react";

function SettingsOverviewContent() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res: SettingsResponse = await api.request("/settings");
        setData(res);
      } catch (err) {
        console.error("Failed to fetch settings overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading system overview...</p>
      </div>
    );
  }

  const { settings, environment } = data;
  const flat: Record<string, string> = {};
  if (settings && typeof settings === "object") {
    Object.values(settings).forEach((items) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          flat[item.key] = item.value || "";
        });
      }
    });
  }

  const cards = [
    {
      title: "Corporate Identity",
      href: "/dashboard/settings/company",
      icon: Building,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      description: flat["company_name"] || "Kabhyan Technologies Private Limited",
      badge: flat["company_gstin"] ? "Registered" : "Incomplete",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      details: [
        { label: "Tagline", val: flat["company_legal_tagline"] || "Enterprise IT & Software Engineering" },
        { label: "Official Email", val: flat["company_email"] || "support@kabhyan.com" },
        { label: "HQ Phone", val: flat["company_phone"] || "+91 98200 12345" },
      ],
    },
    {
      title: "Indian GST Statutory",
      href: "/dashboard/settings/gst",
      icon: Receipt,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      description: "CGST/SGST & IGST Tax Architecture",
      badge: flat["company_gstin"] || "18AAGCK2934D1Z2",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200 font-mono",
      details: [
        { label: "State Code", val: "19 - West Bengal (or 18 Assam)" },
        { label: "Default SAC", val: flat["default_sac_code"] || "998314 (IT Dev)" },
        { label: "Standard GST", val: `${flat["default_gst_rate"] || "18"}%` },
      ],
    },
    {
      title: "Bank & Wire Settlement",
      href: "/dashboard/settings/banking",
      icon: Building2,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      description: flat["bank_name"] || "HDFC Bank Ltd",
      badge: flat["bank_ifsc_code"] ? "Active" : "Not Set",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      details: [
        { label: "Beneficiary", val: flat["bank_beneficiary_name"] || "Kabhyan Technologies Pvt Ltd" },
        { label: "IFSC Code", val: flat["bank_ifsc_code"] || "HDFC0001234" },
        { label: "Account No", val: flat["bank_account_number"] ? `•••• ${flat["bank_account_number"].slice(-4)}` : "5020••••" },
      ],
    },
    {
      title: "Localization & Formats",
      href: "/dashboard/settings/localization",
      icon: Globe,
      color: "bg-amber-50 text-amber-600 border-amber-200",
      description: "Currency, Date & Timezone",
      badge: flat["currency_code"] || "INR (₹)",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      details: [
        { label: "Currency Symbol", val: flat["currency_symbol"] || "₹" },
        { label: "Date Format", val: flat["date_format"] || "DD MMM YYYY" },
        { label: "Timezone", val: flat["time_zone"] || "Asia/Kolkata (IST)" },
      ],
    },
    {
      title: "Security & Portal",
      href: "/dashboard/settings/security",
      icon: KeyRound,
      color: "bg-rose-50 text-rose-600 border-rose-200",
      description: "Client Access & Sessions",
      badge: flat["client_portal_enabled"] === "true" ? "Portal Live" : "Portal Disabled",
      badgeColor: flat["client_portal_enabled"] === "true" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200",
      details: [
        { label: "Self-Service Portal", val: "/portal" },
        { label: "Session Inactivity", val: `${flat["session_timeout_minutes"] || "120"} mins` },
        { label: "Client Auto-Alerts", val: flat["auto_notify_client_on_reply"] === "true" ? "Enabled" : "Disabled" },
      ],
    },
    {
      title: "SMTP Mail Dispatcher",
      href: "/dashboard/settings/email",
      icon: Mail,
      color: "bg-cyan-50 text-cyan-600 border-cyan-200",
      description: flat["mail_host"] || "smtp.gmail.com",
      badge: flat["mail_mailer"] ? "Configured" : "Unset",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      details: [
        { label: "Port & Security", val: `${flat["mail_port"] || "587"} (${(flat["mail_encryption"] || "tls").toUpperCase()})` },
        { label: "Sender Email", val: flat["mail_from_address"] || "support@kabhyan.com" },
        { label: "Interactive Test", val: "Available in Sub-page" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Infrastructure Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Infrastructure Health: Operational</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                {environment.redis_status === "connected" ? "Redis Live" : "Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              PHP {environment.php_version} • Laravel {environment.laravel_version} • MariaDB Connected • Redis Ping {environment.redis_ping}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/settings/system"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
        >
          <span>View Diagnostics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Sub-Page Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between cursor-pointer space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${c.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition mt-3">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  {c.details.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-400 text-[11px]">{d.label}:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[170px]">{d.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Configure settings</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading settings...</p>
        </div>
      }
    >
      <SettingsOverviewContent />
    </Suspense>
  );
}
