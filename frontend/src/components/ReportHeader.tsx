"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Clock,
  Users,
  Briefcase,
  Download,
  Printer,
  Calendar,
  Filter,
} from "lucide-react";

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  exportType?: string;
  fy?: string;
  setFy?: (fy: string) => void;
  quarter?: string;
  setQuarter?: (q: string) => void;
  showQuarterFilter?: boolean;
  onRefresh?: () => void;
}

export default function ReportHeader({
  title,
  subtitle,
  icon,
  exportType,
  fy = "2026-2027",
  setFy,
  quarter = "",
  setQuarter,
  showQuarterFilter = true,
}: ReportHeaderProps) {
  const pathname = usePathname();

  const tabs = [
    { name: "Executive Overview", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Revenue & P&L", href: "/dashboard/reports/revenue", icon: TrendingUp },
    { name: "Statutory GST", href: "/dashboard/reports/gst", icon: Receipt },
    { name: "Receivables Aging", href: "/dashboard/reports/receivables", icon: Clock },
    { name: "Client Portfolio", href: "/dashboard/reports/clients", icon: Users },
    { name: "Project Margins", href: "/dashboard/reports/projects", icon: Briefcase },
  ];

  const handleExportCsv = () => {
    if (!exportType) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/reports/export/${exportType}?fy=${fy}${quarter ? `&quarter=${quarter}` : ""}`;
    
    // Trigger download with auth token in query if needed, or via direct fetch blob
    fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/csv",
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Kabhyan_${exportType}_${fy}${quarter ? `_${quarter}` : ""}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Export failed:", err);
      });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Title & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            {icon && (
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 shadow-2xs">
                {icon}
              </span>
            )}
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Filters & Export Toolbar (hidden during window.print()) */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Fiscal Year Picker */}
          {setFy && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="2026-2027">FY 2026–27</option>
                <option value="2025-2026">FY 2025–26</option>
                <option value="2024-2025">FY 2024–25</option>
              </select>
            </div>
          )}

          {/* Quarter Preset Chips */}
          {showQuarterFilter && setQuarter && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              {[
                { label: "All Year", val: "" },
                { label: "Q1", val: "Q1" },
                { label: "Q2", val: "Q2" },
                { label: "Q3", val: "Q3" },
                { label: "Q4", val: "Q4" },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setQuarter(chip.val)}
                  className={`px-2 py-1 rounded-md transition text-xs font-semibold cursor-pointer ${
                    quarter === chip.val
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Export CSV Button */}
          {exportType && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs tracking-wide shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          )}

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs tracking-wide shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            Print Report
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-px no-scrollbar print:hidden">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white text-blue-600 border-b-2 border-blue-600 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
