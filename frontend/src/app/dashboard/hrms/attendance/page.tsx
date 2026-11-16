"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, MonthlyAttendanceLedgerItem } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckSquare,
  ChevronRight,
  Calendar,
  AlertCircle,
  Save,
  Users,
  Info,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function AttendanceLedgerPage() {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [ledger, setLedger] = useState<MonthlyAttendanceLedgerItem[]>([]);
  const [workingDays, setWorkingDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Local state for editable fields per user
  const [editState, setEditState] = useState<Record<number, { lop_days: number; notes: string }>>({});

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.hrms.attendance.get(selectedMonth);
      setWorkingDays(res.working_days || 0);
      const items: MonthlyAttendanceLedgerItem[] = res.ledger || [];
      setLedger(items);

      // Initialize edit state
      const initial: Record<number, { lop_days: number; notes: string }> = {};
      items.forEach((item) => {
        initial[item.user_id] = {
          lop_days: item.loss_of_pay_days || 0,
          notes: item.notes || "",
        };
      });
      setEditState(initial);
    } catch (err: unknown) {
      console.error("Failed to load attendance ledger:", err);
      toast.error("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  const handleLopChange = (userId: number, value: number) => {
    setEditState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        lop_days: Math.max(0, value),
      },
    }));
  };

  const handleNotesChange = (userId: number, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        notes: value,
      },
    }));
  };

  const handleSaveRow = async (item: MonthlyAttendanceLedgerItem) => {
    const current = editState[item.user_id];
    if (!current) return;

    try {
      setSavingId(item.user_id);
      await api.hrms.attendance.update({
        user_id: item.user_id,
        month: selectedMonth,
        loss_of_pay_days: current.lop_days,
        notes: current.notes,
      });

      toast.success(`Updated attendance for ${item.user?.name || "Employee"}.`);
      fetchAttendance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update attendance.";
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  };

  const totalStaff = ledger.length;
  const totalApprovedLeaves = ledger.reduce((acc, curr) => acc + (curr.approved_leaves_count || 0), 0);
  const totalLopDays = ledger.reduce((acc, curr) => {
    const currentLop = editState[curr.user_id]?.lop_days ?? curr.loss_of_pay_days;
    return acc + Number(currentLop || 0);
  }, 0);

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
              <span className="text-slate-900 font-semibold">Attendance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Monthly Attendance Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Exception-based attendance tracking: all staff are assumed present on working days unless on leave or Loss of Pay (LOP).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-500">Billing Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Link
              href="/dashboard/hrms/payroll/generate"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>Run Payroll</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Month Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Working Days in Month</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {loading ? "..." : `${workingDays} Days`}
            </div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Total Staff Tracked</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {loading ? "..." : `${totalStaff} Staff`}
            </div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-emerald-600">Approved Paid Leaves</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {loading ? "..." : `${totalApprovedLeaves} Days`}
            </div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-rose-600">Total Loss of Pay (LOP)</div>
            <div className="text-xl font-bold text-rose-600 mt-1">
              {loading ? "..." : `${totalLopDays} Days`}
            </div>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900 space-y-0.5">
            <span className="font-bold">Zero-Punch Clock Policy:</span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Staff members are not required to punch in or out daily. Working days automatically deduct weekend Saturdays/Sundays and Gazetted Company Holidays. If an employee has unapproved absences, specify their <strong>Loss of Pay (LOP)</strong> days below before generating payroll.
            </p>
          </div>
        </div>

        {/* Attendance Ledger Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Loading monthly attendance ledger...</div>
          ) : ledger.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No staff members found</p>
              <p className="text-xs text-slate-400 mt-1">Onboard staff in the Team Directory to track attendance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Working Days</th>
                    <th className="py-3 px-4 text-center">Approved Leaves</th>
                    <th className="py-3 px-4 text-center">Effective Present</th>
                    <th className="py-3 px-4 text-center">Loss of Pay (LOP)</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ledger.map((item) => {
                    const rowEdit = editState[item.user_id] || {
                      lop_days: item.loss_of_pay_days || 0,
                      notes: item.notes || "",
                    };
                    const effectivePresent = Math.max(
                      0,
                      workingDays - (item.approved_leaves_count || 0) - rowEdit.lop_days
                    );

                    return (
                      <tr key={item.user_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.user?.name}</div>
                          <div className="text-[11px] text-slate-400">{item.user?.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {item.user?.department || "General"}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {workingDays}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.approved_leaves_count} days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {effectivePresent}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max={workingDays}
                            step="0.5"
                            value={rowEdit.lop_days}
                            onChange={(e) => handleLopChange(item.user_id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-center font-bold text-xs rounded-lg border border-slate-200 py-1 px-2 text-rose-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={rowEdit.notes}
                            onChange={(e) => handleNotesChange(item.user_id, e.target.value)}
                            placeholder="Optional remark"
                            className="w-full text-xs rounded-lg border border-slate-200 py-1 px-2.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={savingId === item.user_id}
                            onClick={() => handleSaveRow(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
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
