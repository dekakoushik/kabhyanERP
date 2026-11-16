"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, HrmsDashboardData } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  CalendarDays,
  CreditCard,
  Receipt,
  CheckSquare,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  ChevronRight,
  ShieldCheck,
  FileText,
  BadgeIndianRupee,
} from "lucide-react";

function formatHolidayDate(rawDate?: string) {
  if (!rawDate) return { fullDate: "N/A", dayName: "" };
  const clean = rawDate.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    return {
      fullDate: clean,
      dayName: dateObj.toLocaleString("en-US", { weekday: "short" }),
    };
  }
  return { fullDate: rawDate, dayName: "" };
}

export default function HrmsDashboardPage() {
  const [data, setData] = useState<HrmsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.hrms.dashboard();
      setData(res);
    } catch (err: unknown) {
      console.error("Failed to load HR dashboard:", err);
      toast.error("Failed to load HR dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLeaveStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      setActionLoading(id);
      await api.hrms.leaves.updateStatus(id, { status });
      toast.success(`Leave request ${status} successfully.`);
      fetchDashboard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update leave request.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <span>Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span>HR &amp; Payroll</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-semibold">Overview</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              HR &amp; Payroll
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Employee compensation, leave approvals, attendance, and monthly payroll batches.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/hrms/leaves/apply"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              <span>Apply Leave</span>
            </Link>
            <Link
              href="/dashboard/hrms/payroll/generate"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Run Payroll</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Staff</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {loading ? "..." : data?.stats?.total_staff ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Eligible employees in company
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Configured CTC Plans</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {loading ? "..." : data?.stats?.active_salary_structures ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Staff with active salary structures
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Leaves</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                (data?.stats?.pending_leaves ?? 0) > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-50 text-slate-600"
              }`}>
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {loading ? "..." : data?.stats?.pending_leaves ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Awaiting managerial approval
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Current Month Payroll</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                {loading ? (
                  "..."
                ) : data?.stats?.current_month_batch ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                    data.stats.current_month_batch.status === "disbursed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : data.stats.current_month_batch.status === "finalized"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {data.stats.current_month_batch.status}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Not Generated</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Batch: {data?.stats?.current_month || "Current"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Modules Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/dashboard/hrms/leaves"
            className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Leaves</div>
              <div className="text-[11px] text-slate-500">Balances &amp; requests</div>
            </div>
          </Link>

          <Link
            href="/dashboard/hrms/attendance"
            className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Attendance</div>
              <div className="text-[11px] text-slate-500">Monthly working ledger</div>
            </div>
          </Link>

          <Link
            href="/dashboard/hrms/payroll"
            className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Payroll</div>
              <div className="text-[11px] text-slate-500">Batches &amp; slips</div>
            </div>
          </Link>

          <Link
            href="/dashboard/hrms/salary-structures"
            className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Salary Setup</div>
              <div className="text-[11px] text-slate-500">CTC &amp; components</div>
            </div>
          </Link>

          <Link
            href="/dashboard/hrms/holidays"
            className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Holidays</div>
              <div className="text-[11px] text-slate-500">Company calendar</div>
            </div>
          </Link>

          <Link
            href="/dashboard/users"
            className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Team Directory</div>
              <div className="text-[11px] text-slate-500">Staff records</div>
            </div>
          </Link>
        </div>

        {/* Two-Column Workspace Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending & Recent Leave Applications */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Recent Leave Requests</h2>
                  <p className="text-xs text-slate-500">Applications submitted by employees</p>
                </div>
                <Link
                  href="/dashboard/hrms/leaves"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading leave requests...</div>
              ) : !data?.recent_leaves || data.recent_leaves.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No recent leave requests</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Employees have not submitted any active leave requests.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.recent_leaves.map((req) => (
                    <div key={req.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{req.user?.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {req.leave_type?.name} ({req.total_days} {req.total_days === 1 ? "day" : "days"})
                          </span>
                          <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                            req.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : req.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {req.start_date} to {req.end_date} &bull; <span className="italic">{req.reason}</span>
                        </div>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => handleLeaveStatus(req.id, "approved")}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => handleLeaveStatus(req.id, "rejected")}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Payroll Batches */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Recent Payroll Batches</h2>
                  <p className="text-xs text-slate-500">Monthly disbursements and finalized salaries</p>
                </div>
                <Link
                  href="/dashboard/hrms/payroll"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading payroll history...</div>
              ) : !data?.latest_batches || data.latest_batches.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No payroll runs recorded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Execute your first monthly payroll batch to see disbursements here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.latest_batches.map((batch) => (
                    <div key={batch.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Month: {batch.month}</span>
                          <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                            batch.status === "disbursed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : batch.status === "finalized"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {batch.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {batch.payslips_count ?? 0} payslips &bull; Total Net: ₹{Number(batch.total_net).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/hrms/payroll?month=${batch.month}`}
                        className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Inspect
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* Upcoming Company Holidays */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Upcoming Holidays</h2>
                  <p className="text-[11px] text-slate-500">Paid company gazetted days</p>
                </div>
                <Link
                  href="/dashboard/hrms/holidays"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Manage
                </Link>
              </div>

              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading holidays...</div>
              ) : !data?.upcoming_holidays || data.upcoming_holidays.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500">No upcoming holidays scheduled</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.upcoming_holidays.map((h) => {
                    const title = h.title || h.name || "Company Holiday";
                    const dateInfo = formatHolidayDate(h.holiday_date || h.date);
                    const dayOfWeek = h.day_of_week || dateInfo.dayName;
                    const type = h.type || (h.is_optional ? "optional" : "company");

                    return (
                      <div key={h.id} className="p-3 hover:bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{title}</div>
                          <div className="text-[11px] text-slate-500">{dayOfWeek} &bull; {type}</div>
                        </div>
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {dateInfo.fullDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attendance & Policy Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>Exception-Based Attendance</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                All staff are considered present on standard working days. Monthly working days automatically exclude weekends and gazetted company holidays.
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Only unapproved absences or excessive leaves require Loss of Pay (LOP) adjustments in the monthly attendance ledger prior to running payroll.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/hrms/attendance"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  Review Attendance Ledger
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
