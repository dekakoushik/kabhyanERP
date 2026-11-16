"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, LeaveType, User } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Clock,
  User as UserIcon,
  CheckCircle2,
} from "lucide-react";

export default function ApplyLeavePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [userId, setUserId] = useState<string>("");
  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [usersRes, typesRes] = await Promise.all([
          api.users.list({ limit: 100 }).catch(() => ({ users: { data: [] } })),
          api.hrms.leaves.types().catch(() => ({ leave_types: [] })),
        ]);

        const rawUsers = usersRes?.users?.data ?? usersRes?.users ?? usersRes?.data ?? [];
        const usersList: User[] = Array.isArray(rawUsers) ? rawUsers : [];
        const staffUsers = usersList.filter((u: User) => u.role !== "client");
        setUsers(staffUsers);
        if (staffUsers.length > 0) setUserId(String(staffUsers[0].id));

        const rawTypes = typesRes?.leave_types ?? typesRes?.data ?? [];
        const types: LeaveType[] = Array.isArray(rawTypes) ? rawTypes : [];
        setLeaveTypes(types);
        if (types.length > 0) setLeaveTypeId(String(types[0].id));

        // Default start & end date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dStr = tomorrow.toISOString().split("T")[0];
        setStartDate(dStr);
        setEndDate(dStr);
      } catch (err: unknown) {
        console.error("Failed to load leave form data:", err);
        toast.error("Failed to load leave settings.");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please pick both start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot precede start date.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please specify a reason for leave.");
      return;
    }

    try {
      setSubmitting(true);
      await api.hrms.leaves.apply({
        user_id: userId ? Number(userId) : undefined,
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      toast.success("Leave request submitted successfully.");
      router.push("/dashboard/hrms/leaves");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply for leave.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const daysCount = calculateDays();
  const selectedType = leaveTypes.find((t) => String(t.id) === leaveTypeId);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/dashboard/hrms" className="hover:text-slate-700">Workspace</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/dashboard/hrms" className="hover:text-slate-700">HR &amp; Payroll</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/dashboard/hrms/leaves" className="hover:text-slate-700">Leaves</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Apply</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Apply for Leave
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Submit an absence request for managerial approval.
              </p>
            </div>
            <Link
              href="/dashboard/hrms/leaves"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Leaves</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
            Loading leave options...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Fields (2 Cols) */}
            <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm space-y-5">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Member
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department || "General Staff"} &bull; {u.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Select the employee requesting this leave.</p>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Leave Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {leaveTypes.map((t) => (
                    <label
                      key={t.id}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        leaveTypeId === String(t.id)
                          ? "border-blue-600 bg-blue-50/40 text-blue-900"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="leaveType"
                        value={t.id}
                        checked={leaveTypeId === String(t.id)}
                        onChange={(e) => setLeaveTypeId(e.target.value)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          {t.name}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                            {t.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.is_paid ? `Paid • ${t.days_per_year} days/yr` : "Loss of Pay deduction"}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Calculated Duration Banner */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Calculated Calendar Days:</span>
                <span className="font-bold text-slate-900">
                  {daysCount} {daysCount === 1 ? "Day" : "Days"}
                </span>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Absence
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide brief context for this leave..."
                  required
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Form Action Buttons (Rule 5: Concise 1-3 words) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Link
                  href="/dashboard/hrms/leaves"
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Leave"}
                </button>
              </div>
            </div>

            {/* Sidebar Guidelines (1 Col) */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  Leave Policies
                </div>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-900 block mb-0.5">Casual Leave (CL)</span>
                    Intended for personal events, rest, and urgent private matters.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-900 block mb-0.5">Sick Leave (SL)</span>
                    For medical conditions and sickness recovery.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-900 block mb-0.5">Loss of Pay (LOP)</span>
                    Absences taken beyond annual entitlements result in proportional daily wage deduction during payroll.
                  </div>
                </div>
              </div>

              {selectedType && (
                <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4 text-xs text-blue-900 space-y-1">
                  <div className="font-bold">Selected: {selectedType.name}</div>
                  <p className="text-[11px] text-blue-800">
                    {selectedType.description || "Official company leave allotment."}
                  </p>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
