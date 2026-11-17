"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PortalDashboardData, Invoice } from "@/lib/api";
import { toast } from "sonner";
import {
  CreditCard,
  FileText,
  Briefcase,
  LifeBuoy,
  Plus,
  ArrowRight,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  Receipt,
  Building,
} from "lucide-react";

export default function ClientPortalDashboard() {
  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.portal.dashboard();
      setData(res);
    } catch (err: unknown) {
      console.error("Failed to load client portal dashboard:", err);
      toast.error("Failed to load portal information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      setPayingInvoiceId(invoiceId);
      const res = await api.portal.invoicePaymentLink(invoiceId);
      if (res.success && res.payment_link?.link_url) {
        toast.info("Opening Cashfree Secure Gateway...");
        window.location.href = res.payment_link.link_url;
      } else {
        toast.error("Could not generate payment link. Please contact support.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate payment.";
      toast.error(msg);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading your client workspace...</p>
      </div>
    );
  }

  const client = data?.client;
  const stats = data?.stats;
  const recentInvoices = data?.recent_invoices || [];
  const projects = data?.projects || [];
  const recentTickets = data?.recent_tickets || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Verified Partner
            </span>
            {client?.gstin && (
              <span className="text-[11px] font-mono text-slate-500">
                GSTIN: {client.gstin}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {client?.company_name || client?.name || "Client Partner"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track deliverables, review project milestones, manage tax invoices, and pay online securely via Cashfree.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/portal/tickets/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Support Ticket</span>
          </Link>
        </div>
      </div>

      {/* KPI Financial & Project Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
          <div className="text-[11px] font-medium text-rose-600">Outstanding Balance</div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            ₹{Number(stats?.total_due || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pending settlement via Cashfree</div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Total Invoiced</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{Number(stats?.total_invoiced || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cumulative lifetime billing</div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
          <div className="text-[11px] font-medium text-blue-600">Active Projects</div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            {stats?.active_projects || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">In sprint development</div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
          <div className="text-[11px] font-medium text-amber-600">Open Tickets</div>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {stats?.open_tickets || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Under engineering review</div>
        </div>
      </div>

      {/* Dual Section: Recent Invoices & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Invoices &amp; Billing</h2>
            </div>
            <Link
              href="/portal/invoices"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices recorded yet.
              </div>
            ) : (
              recentInvoices.map((inv) => {
                const isPaid = inv.status === "paid";
                const isPartiallyPaid = inv.status === "partially_paid";
                const due = Number(inv.due_amount || inv.total_amount);

                return (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/portal/invoices/${inv.id}`}
                          className="text-xs font-bold font-mono text-slate-900 hover:text-blue-600"
                        >
                          {inv.invoice_number}
                        </Link>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPartiallyPaid
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Dated {inv.invoice_date?.slice(0, 10)} &bull; Total ₹{Number(inv.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPaid && due > 0 ? (
                        <button
                          disabled={payingInvoiceId === inv.id}
                          onClick={() => handlePayInvoice(inv.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                        >
                          {payingInvoiceId === inv.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CreditCard className="w-3 h-3" />
                          )}
                          <span>Pay ₹{due.toLocaleString("en-IN")}</span>
                        </button>
                      ) : (
                        <Link
                          href={`/portal/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                        >
                          <span>Receipt</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Sprint Projects &amp; Deliverables</h2>
            </div>
            <Link
              href="/portal/projects"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active projects assigned yet.
              </div>
            ) : (
              projects.map((proj) => {
                const totalTasks = proj.tasks?.length || 0;
                const completedTasks = proj.tasks?.filter((t: any) => t.status === "completed").length || 0;
                const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <div key={proj.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/portal/projects/${proj.id}`}
                        className="text-xs font-bold text-slate-900 hover:text-blue-600"
                      >
                        {proj.name}
                      </Link>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        {proj.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Milestone Progress</span>
                        <span>{progressPct}% ({completedTasks}/{totalTasks} tasks)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Support Tickets Overview */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Recent Support &amp; Change Requests</h2>
          </div>
          <Link
            href="/portal/tickets"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>All Tickets</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No support tickets logged. If you need any assistance, click "Raise Support Ticket" above.
            </div>
          ) : (
            recentTickets.map((tik) => (
              <div key={tik.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/portal/tickets/${tik.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600"
                    >
                      {tik.subject}
                    </Link>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tik.ticket_number}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {tik.type.replace("_", " ")} &bull; Priority: {tik.priority} &bull; Created {tik.created_at?.slice(0, 10)}
                  </div>
                </div>

                <div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    tik.status === "resolved" || tik.status === "closed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : tik.status === "in_progress"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {tik.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
