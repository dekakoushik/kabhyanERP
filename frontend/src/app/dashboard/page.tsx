"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
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
  CreditCard,
  Crown,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Aggregated Stats State
  const [userStats, setUserStats] = useState<any>(null);
  const [invoiceStats, setInvoiceStats] = useState<any>(null);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [ticketStats, setTicketStats] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [urgentTickets, setUrgentTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchCockpitData = async () => {
      try {
        setLoading(true);
        const [usersRes, invoicesRes, projectsRes, ticketsRes] = await Promise.allSettled([
          api.request("/users?per_page=1"),
          api.request("/invoices?per_page=5"),
          api.request("/projects?per_page=5"),
          api.request("/tickets?per_page=5&priority=critical"),
        ]);

        if (usersRes.status === "fulfilled") {
          setUserStats(usersRes.value.stats || null);
        }
        if (invoicesRes.status === "fulfilled") {
          setInvoiceStats(invoicesRes.value.stats || null);
          setRecentInvoices(invoicesRes.value.invoices?.data || []);
        }
        if (projectsRes.status === "fulfilled") {
          setProjectStats(projectsRes.value.stats || null);
          setRecentProjects(projectsRes.value.projects?.data || []);
        }
        if (ticketsRes.status === "fulfilled") {
          setTicketStats(ticketsRes.value.stats || null);
          setUrgentTickets(ticketsRes.value.tickets?.data || []);
        }
      } catch (err) {
        console.error("Failed to load cockpit metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCockpitData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Executive Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider text-blue-200">
              <Crown className="w-3.5 h-3.5 text-blue-300" />
              <span>Executive Command Cockpit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Good day, {user?.name || "Administrator"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Real-time enterprise overview of client revenue, project milestones, accounts receivable, and operational support.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm transition backdrop-blur-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          </div>
        </div>

        {/* Global KPI Strip (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Outstanding Invoices / Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Invoiced Revenue
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {loading
                  ? "..."
                  : `₹${Number(invoiceStats?.total_amount ?? 0).toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{invoiceStats?.paid_count ?? 0} Settled Invoices</span>
              <Link href="/dashboard/invoices" className="text-blue-600 hover:underline flex items-center">
                View Invoices <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Projects
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {loading ? "..." : (projectStats?.active_projects ?? projectStats?.total_projects ?? 0)}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                In Progress
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Total: {projectStats?.total_projects ?? 0} deliverables</span>
              <Link href="/dashboard/projects" className="text-blue-600 hover:underline flex items-center">
                Portfolio <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Support SLA Tickets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Support & Requests
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <LifeBuoy className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {loading ? "..." : (ticketStats?.open_tickets ?? ticketStats?.total_tickets ?? 0)}
              </span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Active Queue
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{ticketStats?.resolved_tickets ?? 0} Resolved</span>
              <Link href="/dashboard/tickets" className="text-purple-600 hover:underline flex items-center">
                Tickets <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Team Personnel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Personnel
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {loading ? "..." : (userStats?.active_users ?? userStats?.total_users ?? 0)}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Engaged
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{userStats?.total_users ?? 0} Total Staff</span>
              <Link href="/dashboard/users" className="text-indigo-600 hover:underline flex items-center">
                Directory <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Financial Activity & Projects */}
          <div className="lg:col-span-8 space-y-6">
            {/* Recent Tax Invoices Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Recent Billing & Tax Invoices
                  </h2>
                </div>
                <Link
                  href="/dashboard/invoices"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View All Invoices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Invoice #</th>
                      <th className="py-3 px-6">Client Entity</th>
                      <th className="py-3 px-6">Total (INR)</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {recentInvoices.length > 0 ? (
                      recentInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                            {inv.invoice_number}
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="font-semibold text-slate-900 block">
                              {inv.client?.company_name || inv.client?.name || "Corporate Client"}
                            </span>
                            <span className="text-[11px] text-slate-400">{inv.project?.name || "General Service"}</span>
                          </td>
                          <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                            ₹{Number(inv.grand_total || inv.total_amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-6">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
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
                          <td className="py-3.5 px-6 text-right">
                            <Link
                              href="/dashboard/invoices"
                              className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No recent invoices found.{" "}
                          <Link href="/dashboard/invoices/create" className="text-blue-600 underline">
                            Create your first invoice
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Projects Portfolio */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Key Client Projects
                  </h2>
                </div>
                <Link
                  href="/dashboard/projects"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Project Portfolio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 space-y-4">
                {recentProjects.length > 0 ? (
                  recentProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {p.code}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Client: <span className="font-medium text-slate-700">{p.client?.company_name || p.client?.name || "Enterprise"}</span> • Budget: <span className="font-mono font-semibold">₹{Number(p.budget || 0).toLocaleString("en-IN")}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {p.status?.replace("_", " ") || "In Progress"}
                        </span>
                        <Link
                          href="/dashboard/projects"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-4">No active projects loaded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Quick Launch & SLA Alerts */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Direct Actions & Short-cuts
              </span>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <Link
                  href="/dashboard/estimates/create"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Draft Estimate</p>
                      <p className="text-[11px] text-slate-400">Client proposal with deliverables</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                </Link>

                <Link
                  href="/dashboard/clients/create"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Add Corporate Client</p>
                      <p className="text-[11px] text-slate-400">New company & GSTIN profile</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </Link>

                <Link
                  href="/dashboard/tickets/create"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                      <LifeBuoy className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Dispatch Support Ticket</p>
                      <p className="text-[11px] text-slate-400">Client issue or change request</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
                </Link>
              </div>
            </div>

            {/* Support Desk Alerts */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Critical SLA Radar
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                  Live Queue
                </span>
              </div>

              {urgentTickets.length > 0 ? (
                <div className="space-y-2.5">
                  {urgentTickets.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate max-w-[180px]">
                          {t.subject}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-red-100 text-red-700">
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Critical Breaches</p>
                  <p className="text-[11px] text-slate-400">All client tickets are running within SLA bounds.</p>
                </div>
              )}

              <Link
                href="/dashboard/tickets"
                className="w-full flex items-center justify-center py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
              >
                Open Support Hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
