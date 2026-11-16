"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, LeaveRequest, LeaveType } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Users,
} from "lucide-react";

export default function LeavesManagementPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.leave_type_id = typeFilter;

      const [leavesRes, typesRes] = await Promise.all([
        api.hrms.leaves.list(params).catch((err) => {
          console.error("api.hrms.leaves.list error:", err);
          return { leaves: [] };
        }),
        api.hrms.leaves.types().catch(() => ({ leave_types: [] })),
      ]);

      const rawLeaves = leavesRes?.leaves ?? leavesRes?.data ?? leavesRes;
      const leavesList: LeaveRequest[] = Array.isArray(rawLeaves)
        ? rawLeaves
        : Array.isArray(rawLeaves?.data)
        ? rawLeaves.data
        : [];

      const rawTypes = typesRes?.leave_types ?? typesRes?.data ?? typesRes;
      const typesList: LeaveType[] = Array.isArray(rawTypes)
        ? rawTypes
        : Array.isArray(rawTypes?.data)
        ? rawTypes.data
        : [];

      setLeaves(leavesList);
      setLeaveTypes(typesList);
    } catch (err: unknown) {
      console.error("Failed to load leaves:", err);
      toast.error("Failed to load leave records.");
      setLeaves([]);
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter]);

  const handleUpdateStatus = async (id: number, status: "approved" | "rejected") => {
    const promptNote = status === "rejected" ? window.prompt("Reason for rejection (optional):") : null;
    try {
      setActionLoading(id);
      await api.hrms.leaves.updateStatus(id, {
        status,
        admin_notes: promptNote || undefined,
      });
      toast.success(`Leave request ${status} successfully.`);
      fetchLeaves();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update leave request.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const safeLeaves = Array.isArray(leaves) ? leaves : [];
  const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];

  const pendingCount = safeLeaves.filter((l) => l?.status === "pending").length;
  const approvedCount = safeLeaves.filter((l) => l?.status === "approved").length;
  const rejectedCount = safeLeaves.filter((l) => l?.status === "rejected").length;

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
              <span className="text-slate-900 font-semibold">Leaves</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Leave Requests &amp; Entitlements
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review and approve staff time-off requests, balances, and leaves history.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/hrms/leaves/apply"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply Leave</span>
            </Link>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Total Applications</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{safeLeaves.length}</div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-amber-600">Pending Review</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-emerald-600">Approved</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{approvedCount}</div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Rejected</div>
            <div className="text-xl font-bold text-slate-600 mt-1">{rejectedCount}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Leave Types</option>
              {safeLeaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            Showing {safeLeaves.length} requests
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Loading leave requests...</div>
          ) : safeLeaves.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No leave requests found</p>
              <p className="text-xs text-slate-400 mt-1">There are no leave requests matching your current filter.</p>
              <div className="mt-4">
                <Link
                  href="/dashboard/hrms/leaves/apply"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply Leave</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {safeLeaves.map((l) => {
                    const days = Number(l.total_days ?? l.days_count ?? 1);
                    const typeName = l.leave_type?.name ?? (l as any).leaveType?.name ?? "General Leave";
                    const isPaid = l.leave_type?.is_paid ?? (l as any).leaveType?.is_paid ?? true;
                    const userName = l.user?.name || "Employee";
                    const userEmail = l.user?.email || "";

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {userName}
                          {userEmail && <div className="text-[11px] font-normal text-slate-400">{userEmail}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{typeName}</span>
                          <span className="text-[10px] text-slate-400 block">{isPaid ? "Paid Leave" : "Loss of Pay"}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          <div>{l.start_date}</div>
                          <div className="text-[11px] text-slate-400">to {l.end_date}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {days} {days === 1 ? "day" : "days"}
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={l.reason}>
                          {l.reason}
                          {l.admin_notes && (
                            <div className="text-[10px] text-amber-600 mt-0.5">Note: {l.admin_notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            l.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : l.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {l.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                disabled={actionLoading === l.id}
                                onClick={() => handleUpdateStatus(l.id, "approved")}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                disabled={actionLoading === l.id}
                                onClick={() => handleUpdateStatus(l.id, "rejected")}
                                className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-[11px] transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No action needed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
