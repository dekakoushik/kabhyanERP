"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { api, ReportOverviewResponse, ReportRevenueResponse, ReportReceivablesResponse } from "@/lib/api";
import { getCurrentFiscalYear, getFiscalYearOptions, formatFiscalYearLabel } from "@/lib/fiscalYear";
import Link from "next/link";
import {
  Users,
  Briefcase,
  TrendingUp,
  Receipt,
  FileCheck,
  FileText,
  LifeBuoy,
  Building,
  ArrowRight,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Crown,
  BarChart3,
  Percent,
  CheckSquare,
  ShieldCheck,
  Layers,
  Activity,
  DollarSign,
  AlertTriangle,
  FolderKanban,
  FileSpreadsheet,
  PieChart,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good day");
  const [fy, setFy] = useState(getCurrentFiscalYear());
  const [quarter, setQuarter] = useState("");

  // Determine Time-of-day Greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  // Permission Gate Helpers
  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role === "superadmin" || user.role === "admin") return true;
    return Array.isArray(user.permissions) && user.permissions.includes(perm);
  };

  const isExecutive = user?.role === "superadmin" || user?.role === "admin";
  const canViewFinance =
    isExecutive ||
    hasPermission("accounts.view") ||
    hasPermission("invoices.view") ||
    hasPermission("reports.view");
  const canViewProjects = isExecutive || hasPermission("projects.view");
  const canViewTasks = isExecutive || hasPermission("tasks.view");
  const canViewTickets = isExecutive || hasPermission("tickets.view");
  const canViewStaff = isExecutive || hasPermission("staff.view");

  const canCreateInvoice = isExecutive || hasPermission("invoices.create");
  const canCreateProforma = isExecutive || hasPermission("proforma.create");
  const canCreateProject = isExecutive || hasPermission("projects.create");
  const canCreateEstimate = isExecutive || hasPermission("estimates.create");
  const canCreateClient = isExecutive || hasPermission("clients.create");
  const canCreateTicket = isExecutive || hasPermission("tickets.create");
  const canRecordExpense = isExecutive || hasPermission("expenses.create");

  // Data States
  const [overviewData, setOverviewData] = useState<ReportOverviewResponse | null>(null);
  const [revenueData, setRevenueData] = useState<ReportRevenueResponse | null>(null);
  const [receivablesData, setReceivablesData] = useState<ReportReceivablesResponse | null>(null);

  const [recentProformas, setRecentProformas] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [urgentTickets, setUrgentTickets] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [projectStats, setProjectStats] = useState<any>(null);

  // Fetch Cockpit Data based on Effective Permissions
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const promises: Promise<any>[] = [];
        const keys: string[] = [];

        // 1. Financial Intelligence (Only for authorized roles)
        if (canViewFinance) {
          const qParam = quarter ? `&quarter=${quarter}` : "";
          promises.push(api.request<ReportOverviewResponse>(`/reports/overview?fy=${fy}${qParam}`));
          keys.push("overview");

          promises.push(api.request<ReportRevenueResponse>(`/reports/revenue?fy=${fy}${qParam}`));
          keys.push("revenue");

          promises.push(api.request<ReportReceivablesResponse>(`/reports/receivables`));
          keys.push("receivables");

          promises.push(api.request(`/proforma-invoices?per_page=5`));
          keys.push("proformas");

          promises.push(api.request(`/invoices?per_page=5`));
          keys.push("invoices");
        }

        // 2. Project Portfolio
        if (canViewProjects) {
          promises.push(api.request(`/projects?per_page=5`));
          keys.push("projects");
        }

        // 3. Tasks & Deliverables
        if (canViewTasks) {
          promises.push(api.request(`/tasks?per_page=8`));
          keys.push("tasks");
        }

        // 4. Support Desk & Tickets
        if (canViewTickets) {
          promises.push(api.request(`/tickets?per_page=5&priority=critical`));
          keys.push("tickets");
        }

        // 5. Staff Directory
        if (canViewStaff) {
          promises.push(api.request(`/users?per_page=1`));
          keys.push("users");
        }

        const results = await Promise.allSettled(promises);

        results.forEach((res, index) => {
          if (res.status === "fulfilled") {
            const key = keys[index];
            const val = res.value;

            if (key === "overview") setOverviewData(val);
            if (key === "revenue") setRevenueData(val);
            if (key === "receivables") setReceivablesData(val);
            if (key === "proformas") setRecentProformas(val?.invoices?.data || val?.data || []);
            if (key === "invoices") setRecentInvoices(val?.invoices?.data || val?.data || []);
            if (key === "projects") {
              setRecentProjects(val?.projects?.data || val?.data || []);
              setProjectStats(val?.stats || null);
            }
            if (key === "tasks") {
              setTaskSummary(val?.summary || null);
              setMyTasks(val?.tasks?.data || []);
            }
            if (key === "tickets") setUrgentTickets(val?.tickets?.data || val?.data || []);
            if (key === "users") setUserStats(val?.stats || null);
          }
        });
      } catch (err) {
        console.error("Failed to load dashboard cockpit:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, fy, quarter, canViewFinance, canViewProjects, canViewTasks, canViewTickets, canViewStaff]);

  // Currency Formatter
  const formatCurrency = (amt: number | string | undefined | null) => {
    const num = Number(amt) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Max value for monthly revenue chart scaling
  const maxMonthlyVal = revenueData
    ? Math.max(
        ...revenueData.monthly.map((m) => Math.max(Number(m.total_inflow || 0), Number(m.expense || 0))),
        50000
      )
    : 100000;

  // Realization rate calculation
  const totalBilledVal = Number(overviewData?.kpis?.invoiced_gross || 0);
  const totalInflowVal = Number(overviewData?.kpis?.total_inflow || 0);
  const realizationPct = totalBilledVal > 0 ? Math.min(100, Math.round((totalInflowVal / totalBilledVal) * 100)) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Executive Hero Banner & Dynamic Role Greeting */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-medium uppercase tracking-wider text-blue-200">
                <Crown className="w-3 h-3 text-blue-300" />
                <span>
                  {user?.custom_role?.name ||
                    (user?.role === "superadmin"
                      ? "Super Administrator"
                      : user?.role === "admin"
                      ? "Corporate Executive"
                      : user?.role?.toUpperCase() || "Workspace Member")}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                {greeting}, {user?.name || "Administrator"}
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Real-time operational command, financial realization, and project deliverables.
              </p>
            </div>

            {/* Dynamic CTA Buttons based on Permissions */}
            <div className="flex flex-wrap items-center gap-2">
              {canCreateInvoice && (
                <Link
                  href="/dashboard/invoices/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Invoice</span>
                </Link>
              )}

              {canCreateProforma && (
                <Link
                  href="/dashboard/proforma/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-2xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Proforma</span>
                </Link>
              )}

              {canCreateProject && (
                <Link
                  href="/dashboard/projects/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition backdrop-blur-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </Link>
              )}
            </div>
          </div>

          {/* Dedicated Financial Intelligence Horizon Toolbar (Uncropped & Auto-Updating) */}
          {canViewFinance && (
            <div className="pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Active Horizon: <strong className="text-white font-semibold">{formatFiscalYearLabel(fy)}</strong>
                  {quarter ? ` (${quarter})` : " (All Quarters)"} • Live Realization
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Auto-updating Dynamic Fiscal Year Picker */}
                <div className="flex items-center bg-slate-900/90 border border-white/20 rounded-lg px-2.5 py-1 text-xs shadow-inner">
                  <Calendar className="w-3.5 h-3.5 text-blue-300 mr-1.5" />
                  <select
                    value={fy}
                    onChange={(e) => setFy(e.target.value)}
                    className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                  >
                    {getFiscalYearOptions().map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900 text-white py-1">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quarter Presets */}
                <div className="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/15 text-xs font-medium">
                  {[
                    { label: "All Year", val: "" },
                    { label: "Q1", val: "Q1" },
                    { label: "Q2", val: "Q2" },
                    { label: "Q3", val: "Q3" },
                    { label: "Q4", val: "Q4" },
                  ].map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setQuarter(q.val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        quarter === q.val
                          ? "bg-blue-600 text-white shadow-2xs font-bold"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* KPI METRIC STRIP 1: FINANCIAL COCKPIT (For Executive / Finance Personnel) */}
        {/* ========================================================================= */}
        {canViewFinance ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Invoiced Turnover */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Turnover
                </span>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                  {loading ? "..." : formatCurrency(overviewData?.kpis?.invoiced_gross || 0)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Taxable: {formatCurrency(overviewData?.kpis?.invoiced_taxable || 0)}</span>
                <Link href="/dashboard/invoices" className="text-blue-600 hover:underline text-[11px] font-medium flex items-center">
                  Invoices <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Realized Cash Inflow */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Realized Inflow
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-emerald-600 tracking-tight font-mono">
                  {loading ? "..." : formatCurrency(overviewData?.kpis?.total_inflow || 0)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                  {overviewData?.kpis?.realization_rate ?? realizationPct}% Realized
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Advances: {formatCurrency(overviewData?.kpis?.advances_received || 0)}</span>
                <Link href="/dashboard/receipt-vouchers" className="text-emerald-600 hover:underline text-[11px] font-medium flex items-center">
                  Vouchers <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Operating Expenses */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Operating Expenses
                </span>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                  {loading ? "..." : formatCurrency(overviewData?.kpis?.expenses_paid || 0)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Input ITC: {formatCurrency(overviewData?.kpis?.input_gst || 0)}</span>
                <Link href="/dashboard/expenses" className="text-rose-600 hover:underline text-[11px] font-medium flex items-center">
                  Expenses <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 4: Net Cash Profit & Operating Margin */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Net Operating Margin
                </span>
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className={`text-xl font-bold tracking-tight font-mono ${
                  Number(overviewData?.kpis?.net_profit || 0) >= 0 ? "text-slate-900" : "text-rose-600"
                }`}>
                  {loading ? "..." : formatCurrency(overviewData?.kpis?.net_profit || 0)}
                </span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">
                  {overviewData?.kpis?.net_margin_pct ?? 0}% Margin
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Net Cash Gain</span>
                <Link href="/dashboard/reports/revenue" className="text-purple-600 hover:underline text-[11px] font-medium flex items-center">
                  P&L Report <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 5: Outstanding Receivables */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Receivables Due
                </span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-amber-600 tracking-tight font-mono">
                  {loading ? "..." : formatCurrency(overviewData?.kpis?.outstanding_due || 0)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>DSO: {receivablesData?.summary?.dso_days ?? 0} Days</span>
                <Link href="/dashboard/reports/receivables" className="text-amber-600 hover:underline text-[11px] font-medium flex items-center">
                  Aging <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* KPI METRIC STRIP 2: OPERATIONAL & PROJECT COCKPIT (For Project/Team Leads) */
          /* ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Projects */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Active Projects
                </span>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {loading ? "..." : (projectStats?.in_progress ?? projectStats?.total_projects ?? 0)}
                </span>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 uppercase tracking-wider">
                  In Progress
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Total: {projectStats?.total_projects ?? 0} Projects</span>
                <Link href="/dashboard/projects" className="text-blue-600 hover:underline flex items-center text-[11px] font-medium">
                  Projects <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Sprint Tasks */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Sprint Tasks
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {loading ? "..." : (taskSummary?.in_progress ?? 0)}
                </span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
                  Active Sprint
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{taskSummary?.completed ?? 0} Completed</span>
                <Link href="/dashboard/tasks" className="text-emerald-600 hover:underline flex items-center text-[11px] font-medium">
                  Task Board <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Support SLA Tickets */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Support Tickets
                </span>
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <LifeBuoy className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {loading ? "..." : (urgentTickets?.length ?? 0)}
                </span>
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 uppercase tracking-wider">
                  Open Queue
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Critical SLA</span>
                <Link href="/dashboard/tickets" className="text-purple-600 hover:underline flex items-center text-[11px] font-medium">
                  Tickets <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Card 4: Staff Directory */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Team Members
                </span>
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {loading ? "..." : (userStats?.active_users ?? userStats?.total_users ?? 1)}
                </span>
                <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{userStats?.total_users ?? 1} Registered Staff</span>
                <Link href="/dashboard/users" className="text-indigo-600 hover:underline flex items-center text-[11px] font-medium">
                  Team <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ANALYTICAL GRAPHS SUITE (Interactive SVG & Pure CSS Charts)              */}
        {/* ========================================================================= */}
        {canViewFinance && revenueData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Graph 1: Monthly Financial Momentum Chart (8 Cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Monthly Financial Momentum & Cash Flow
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Month-by-month cash inflow (payments & advance vouchers) compared against operating expenses.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                    <span className="text-slate-700">Cash Inflow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-rose-400" />
                    <span className="text-slate-700">Expenses</span>
                  </div>
                </div>
              </div>

              {/* Responsive Bar Graphic Container */}
              <div className="h-60 flex items-end justify-between gap-1 sm:gap-2.5 pt-6 border-b border-slate-200">
                {revenueData.monthly.map((m, idx) => {
                  const inflowHeight = (Number(m.total_inflow || 0) / maxMonthlyVal) * 100;
                  const expenseHeight = (Number(m.expense || 0) / maxMonthlyVal) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none bg-slate-900 text-white p-1.5 rounded shadow-lg text-[10px] whitespace-nowrap">
                        <span className="font-bold">{m.month}</span>
                        <span>Inflow: {formatCurrency(m.total_inflow)}</span>
                        <span>Expense: {formatCurrency(m.expense)}</span>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                        {/* Cash Inflow Bar */}
                        <div
                          style={{ height: `${Math.max(inflowHeight, 4)}%` }}
                          className="w-1/2 max-w-[18px] bg-emerald-500 group-hover:bg-emerald-600 rounded-t-sm transition-all"
                        />
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                          className="w-1/2 max-w-[18px] bg-rose-400 group-hover:bg-rose-500 rounded-t-sm transition-all"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-2 truncate">
                        {m.short_month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary Bottom Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2">
                <div className="flex items-center gap-3">
                  <span>
                    Gross Inflow:{" "}
                    <strong className="text-emerald-700 font-mono">
                      {formatCurrency(overviewData?.kpis?.total_inflow || 0)}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Expenses:{" "}
                    <strong className="text-rose-700 font-mono">
                      {formatCurrency(overviewData?.kpis?.expenses_paid || 0)}
                    </strong>
                  </span>
                </div>
                <Link
                  href="/dashboard/reports/revenue"
                  className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1"
                >
                  Full P&L Breakdown <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Graph 2: Revenue Realization & GST Compliance Gauge (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Capital Realization Gauge */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-purple-600" />
                    Revenue Realization
                  </h2>
                  <span className="text-xs font-bold text-emerald-600">
                    {realizationPct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${realizationPct}%` }}
                      className="bg-emerald-500 rounded-l-full transition-all"
                    />
                    <div
                      style={{ width: `${100 - realizationPct}%` }}
                      className="bg-amber-400 rounded-r-full transition-all"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Realized: {formatCurrency(totalInflowVal)}</span>
                    <span>Due: {formatCurrency(overviewData?.kpis?.outstanding_due || 0)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Collections Realized
                    </span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(overviewData?.kpis?.collections_cash || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Advances Received (Rule 50)
                    </span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(overviewData?.kpis?.advances_received || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Pending Capital Due
                    </span>
                    <span className="font-mono font-semibold text-amber-700">
                      {formatCurrency(overviewData?.kpis?.outstanding_due || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statutory GST Compliance Card */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Statutory GST Compliance
                  </span>
                  <Link href="/dashboard/reports/gst" className="text-blue-600 hover:underline text-[11px] font-medium">
                    GSTR-3B
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Output GST Liability</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {formatCurrency(overviewData?.kpis?.output_gst || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Input ITC Claimed</span>
                    <span className="font-mono font-bold text-emerald-600 text-xs">
                      {formatCurrency(overviewData?.kpis?.input_gst || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-slate-600 font-medium">Net GST Payable:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(overviewData?.kpis?.net_gst_payable || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GRAPH 3: RECEIVABLES AGING & DEBTORS EXPOSURE                             */}
        {/* ========================================================================= */}
        {canViewFinance && receivablesData && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Receivables Aging Horizon & Debtors Exposure
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time overdue aging buckets, Days Sales Outstanding (DSO), and capital risk distribution.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-600">
                Total Debtors: <strong className="text-slate-900">{receivablesData.summary.debtors_count}</strong> • Total Due:{" "}
                <strong className="text-amber-700 font-mono">{formatCurrency(receivablesData.summary.total_receivables)}</strong>
              </div>
            </div>

            {/* 4-Tier Horizontal Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* 0-30 Days */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Current (0–30 Days)</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {formatCurrency(receivablesData.aging_buckets.current_0_30)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        receivablesData.summary.total_receivables > 0
                          ? Math.min(100, (receivablesData.aging_buckets.current_0_30 / receivablesData.summary.total_receivables) * 100)
                          : 0
                      }%`,
                    }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">Within standard credit terms</span>
              </div>

              {/* 31-60 Days */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Overdue (31–60 Days)</span>
                  <span className="font-bold text-amber-600 font-mono">
                    {formatCurrency(receivablesData.aging_buckets.overdue_31_60)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        receivablesData.summary.total_receivables > 0
                          ? Math.min(100, (receivablesData.aging_buckets.overdue_31_60 / receivablesData.summary.total_receivables) * 100)
                          : 0
                      }%`,
                    }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">Follow-up reminder due</span>
              </div>

              {/* 61-90 Days */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Critical (61–90 Days)</span>
                  <span className="font-bold text-orange-600 font-mono">
                    {formatCurrency(receivablesData.aging_buckets.overdue_61_90)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        receivablesData.summary.total_receivables > 0
                          ? Math.min(100, (receivablesData.aging_buckets.overdue_61_90 / receivablesData.summary.total_receivables) * 100)
                          : 0
                      }%`,
                    }}
                    className="h-full bg-orange-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">Escalation required</span>
              </div>

              {/* 90+ Days */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Impaired (90+ Days)</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {formatCurrency(receivablesData.aging_buckets.overdue_90_plus)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        receivablesData.summary.total_receivables > 0
                          ? Math.min(100, (receivablesData.aging_buckets.overdue_90_plus / receivablesData.summary.total_receivables) * 100)
                          : 0
                      }%`,
                    }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">High collection risk</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GRAPH 4: TASK SPRINT & PROJECT HEALTH (For Project & Engineering Leads)   */}
        {/* ========================================================================= */}
        {canViewTasks && taskSummary && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                  Sprint Deliverables & Task Progress Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live task distribution across sprint phases and completion velocity.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Total Tasks: <strong className="text-slate-900">{taskSummary.total || 0}</strong>
                </span>
                <Link
                  href="/dashboard/tasks"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Open Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Segmented Distribution Bar */}
            <div className="space-y-3 pt-1">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                <div
                  style={{ width: `${taskSummary.total > 0 ? (taskSummary.completed / taskSummary.total) * 100 : 0}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Completed: ${taskSummary.completed}`}
                />
                <div
                  style={{ width: `${taskSummary.total > 0 ? (taskSummary.in_progress / taskSummary.total) * 100 : 0}%` }}
                  className="bg-blue-500 transition-all"
                  title={`In Progress: ${taskSummary.in_progress}`}
                />
                <div
                  style={{ width: `${taskSummary.total > 0 ? (taskSummary.in_review / taskSummary.total) * 100 : 0}%` }}
                  className="bg-purple-500 transition-all"
                  title={`In Review: ${taskSummary.in_review}`}
                />
                <div
                  style={{ width: `${taskSummary.total > 0 ? (taskSummary.todo / taskSummary.total) * 100 : 0}%` }}
                  className="bg-slate-300 transition-all"
                  title={`To Do: ${taskSummary.todo}`}
                />
                <div
                  style={{ width: `${taskSummary.total > 0 ? (taskSummary.blocked / taskSummary.total) * 100 : 0}%` }}
                  className="bg-rose-500 transition-all"
                  title={`Blocked: ${taskSummary.blocked}`}
                />
              </div>

              {/* Legends & Exact Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Completed</span>
                    <span className="font-bold text-slate-800">{taskSummary.completed || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">In Progress</span>
                    <span className="font-bold text-slate-800">{taskSummary.in_progress || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">In Review</span>
                    <span className="font-bold text-slate-800">{taskSummary.in_review || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">To Do</span>
                    <span className="font-bold text-slate-800">{taskSummary.todo || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Blocked</span>
                    <span className="font-bold text-slate-800">{taskSummary.blocked || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OPERATIONAL PULSE & LEDGER (2-Column Responsive Operational Grid)         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Commercial Pipeline & Project Activity */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Milestone Pipeline (Proforma Invoices & Realization) */}
            {canViewFinance && (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Active Milestone Proformas
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/proforma"
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <span>View Proformas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Proforma #</th>
                        <th className="py-2.5 px-4">Client / Company</th>
                        <th className="py-2.5 px-4">Total Amount</th>
                        <th className="py-2.5 px-4">Realization Progress</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {recentProformas.length > 0 ? (
                        recentProformas.map((p) => {
                          const total = Number(p.total_amount || 0);
                          const paid = Number(p.paid_amount || 0);
                          const due = Math.max(0, total - paid);

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-4 font-mono font-medium text-xs text-slate-800">
                                <Link href={`/dashboard/proforma/${p.id}`} className="text-purple-600 hover:underline">
                                  {p.proforma_number}
                                </Link>
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="font-semibold text-slate-900 block text-xs">
                                  {p.client?.company_name || p.client?.name || p.client_name || "Client"}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {p.estimate?.estimate_number ? `Via ${p.estimate.estimate_number}` : "Milestone Advance"}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono font-semibold text-xs text-slate-900">
                                {formatCurrency(total)}
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-emerald-700 font-medium">Paid: {formatCurrency(paid)}</span>
                                    <span className="text-slate-500">Due: {formatCurrency(due)}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${total > 0 ? Math.min(100, (paid / total) * 100) : 0}%` }}
                                      className="h-full bg-emerald-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                                    p.status === "paid"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : p.status === "partially_paid"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-purple-50 text-purple-700 border border-purple-200"
                                  }`}
                                >
                                  {p.status?.replace("_", " ") || "Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            No active proforma invoices.{" "}
                            {canCreateProforma && (
                              <Link href="/dashboard/proforma/create" className="text-purple-600 underline">
                                Create a proforma invoice
                              </Link>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Tax Invoices Table */}
            {canViewFinance && (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Recent Tax Invoices
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/invoices"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Invoice #</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {recentInvoices.length > 0 ? (
                        recentInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-4 font-mono font-medium text-xs text-slate-800">
                              <Link href={`/dashboard/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                                {inv.invoice_number}
                              </Link>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-slate-900 block text-xs">
                                {inv.client?.company_name || inv.client?.name || inv.client_name || "Client"}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {inv.project?.name || "Deliverable Invoiced"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold text-xs text-slate-900">
                              {formatCurrency(inv.grand_total || inv.total_amount || 0)}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                                  inv.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : inv.status === "overdue"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {inv.status || "Issued"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <Link
                                href={`/dashboard/invoices/${inv.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            No recent invoices found.{" "}
                            {canCreateInvoice && (
                              <Link href="/dashboard/invoices/create" className="text-blue-600 underline">
                                Create an invoice
                              </Link>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Active Projects Portfolio */}
            {canViewProjects && (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Active Projects Portfolio
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/projects"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View Projects</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  {recentProjects.length > 0 ? (
                    recentProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 sm:p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {p.code}
                            </span>
                            <Link href={`/dashboard/projects/${p.id}`} className="font-semibold text-slate-900 text-xs hover:text-blue-600">
                              {p.name}
                            </Link>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Client:{" "}
                            <span className="font-medium text-slate-700">
                              {p.client?.company_name || p.client?.name || "Client"}
                            </span>{" "}
                            • Budget:{" "}
                            <span className="font-mono font-medium">
                              {formatCurrency(p.budget || 0)}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {p.status?.replace("_", " ") || "In Progress"}
                          </span>
                          <Link
                            href={`/dashboard/projects/${p.id}`}
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-3">No active projects found.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Quick Launch & Support Desk Alerts */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            {/* Quick Actions Launchpad (Conforming to Rule 1: Dedicated Page CTAs) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quick Actions
              </span>

              <div className="grid grid-cols-1 gap-2 pt-0.5">
                {canCreateEstimate && (
                  <Link
                    href="/dashboard/estimates/create"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">New Estimate</p>
                        <p className="text-[11px] text-slate-400">Quotes and commercial proposals</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                  </Link>
                )}

                {canCreateProforma && (
                  <Link
                    href="/dashboard/proforma/create"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">New Proforma</p>
                        <p className="text-[11px] text-slate-400">Milestone advance invoice</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition" />
                  </Link>
                )}

                {canCreateClient && (
                  <Link
                    href="/dashboard/clients/create"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Add Client</p>
                        <p className="text-[11px] text-slate-400">Company & billing info</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                  </Link>
                )}

                {canRecordExpense && (
                  <Link
                    href="/dashboard/expenses/create"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/50 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Record Expense</p>
                        <p className="text-[11px] text-slate-400">Vendor spend & operations</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition" />
                  </Link>
                )}

                {canCreateTicket && (
                  <Link
                    href="/dashboard/tickets/create"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                        <LifeBuoy className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">New Ticket</p>
                        <p className="text-[11px] text-slate-400">Client request or issue</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition" />
                  </Link>
                )}
              </div>
            </div>

            {/* Support Desk Alerts */}
            {canViewTickets && (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Urgent Tickets
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    Live Queue
                  </span>
                </div>

                {urgentTickets.length > 0 ? (
                  <div className="space-y-2">
                    {urgentTickets.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                            {t.subject}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase bg-red-100 text-red-700">
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {t.client?.company_name || "Client"} • Assignee: {t.assignee?.name || "Unassigned"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No Urgent Tickets</p>
                    <p className="text-[11px] text-slate-400">All client tickets are running on schedule.</p>
                  </div>
                )}

                <Link
                  href="/dashboard/tickets"
                  className="w-full flex items-center justify-center py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                >
                  View Tickets
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
