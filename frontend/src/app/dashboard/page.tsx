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
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-medium uppercase tracking-wider text-blue-200">
              <Crown className="w-3 h-3 text-blue-300" />
              <span>Workspace Overview</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Good day, {user?.name || "Administrator"}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Here is what is happening across your business today.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Invoice</span>
            </Link>
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition backdrop-blur-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Project</span>
            </Link>
          </div>
        </div>

        {/* Global KPI Strip (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Outstanding Invoices / Revenue */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Billed
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                {loading
                  ? "..."
                  : `₹${Number(invoiceStats?.total_amount ?? 0).toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{invoiceStats?.paid_count ?? 0} Paid Invoices</span>
              <Link href="/dashboard/invoices" className="text-blue-600 hover:underline flex items-center text-[11px] font-medium">
                View Invoices <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Active Projects
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {loading ? "..." : (projectStats?.active_projects ?? projectStats?.total_projects ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 uppercase tracking-wider">
                In Progress
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Total: {projectStats?.total_projects ?? 0} projects</span>
              <Link href="/dashboard/projects" className="text-blue-600 hover:underline flex items-center text-[11px] font-medium">
                Projects <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Support SLA Tickets */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Support Tickets
              </span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <LifeBuoy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {loading ? "..." : (ticketStats?.open_tickets ?? ticketStats?.total_tickets ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 uppercase tracking-wider">
                Open
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{ticketStats?.resolved_tickets ?? 0} Resolved</span>
              <Link href="/dashboard/tickets" className="text-purple-600 hover:underline flex items-center text-[11px] font-medium">
                Tickets <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Team Personnel */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Team Members
              </span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {loading ? "..." : (userStats?.active_users ?? userStats?.total_users ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{userStats?.total_users ?? 0} Total Staff</span>
              <Link href="/dashboard/users" className="text-indigo-600 hover:underline flex items-center text-[11px] font-medium">
                Team <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Financial Activity & Projects */}
          <div className="lg:col-span-8 space-y-6">
            {/* Recent Tax Invoices Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Recent Invoices
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
                            {inv.invoice_number}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900 block text-xs">
                              {inv.client?.company_name || inv.client?.name || "Client"}
                            </span>
                            <span className="text-[11px] text-slate-400">{inv.project?.name || "General Service"}</span>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-xs text-slate-900">
                            ₹{Number(inv.grand_total || inv.total_amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider capitalize ${
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
                              href="/dashboard/invoices"
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
                          <Link href="/dashboard/invoices/create" className="text-blue-600 underline">
                            Create an invoice
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Projects Portfolio */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Active Projects
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
                          <span className="font-semibold text-slate-900 text-xs">{p.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Client: <span className="font-medium text-slate-700">{p.client?.company_name || p.client?.name || "Client"}</span> • Budget: <span className="font-mono font-medium">₹{Number(p.budget || 0).toLocaleString("en-IN")}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {p.status?.replace("_", " ") || "In Progress"}
                        </span>
                        <Link
                          href="/dashboard/projects"
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
          </div>

          {/* Right Column (4 cols): Quick Launch & Alerts */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quick Actions
              </span>

              <div className="grid grid-cols-1 gap-2 pt-0.5">
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
                      <p className="text-[11px] text-slate-400">Quotes and proposals</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                </Link>

                <Link
                  href="/dashboard/clients/create"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
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

                <Link
                  href="/dashboard/tickets/create"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
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
              </div>
            </div>

            {/* Support Desk Alerts */}
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
