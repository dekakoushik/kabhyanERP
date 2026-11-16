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
  CheckCheck,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Smartphone,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function AttendanceLedgerPage() {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const todayStr = new Date().toISOString().slice(0, 10); // e.g. "2026-11-17"

  const [activeTab, setActiveTab] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [ledger, setLedger] = useState<MonthlyAttendanceLedgerItem[]>([]);
  const [dailyRoster, setDailyRoster] = useState<any[]>([]);
  const [workingDays, setWorkingDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [quickFilling, setQuickFilling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Local state for editable fields per user
  const [editState, setEditState] = useState<Record<number, { lop_days: number; notes: string }>>({});

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.hrms.attendance.get(selectedMonth);
      setWorkingDays(res.working_days || res.standard_working_days || 0);
      const items: MonthlyAttendanceLedgerItem[] = res.ledger || [];
      setLedger(items);

      // Initialize edit state
      const initial: Record<number, { lop_days: number; notes: string }> = {};
      items.forEach((item) => {
        initial[item.user_id] = {
          lop_days: Number(item.loss_of_pay_days ?? item.lop_days ?? 0),
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

  const fetchDailyAttendance = async () => {
    try {
      setLoadingDaily(true);
      const res = await api.hrms.attendance.daily(selectedDate);
      setDailyRoster(res.roster || []);
    } catch (err: unknown) {
      console.error("Failed to load daily attendance:", err);
      toast.error("Failed to load daily roster.");
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (activeTab === "monthly") {
      fetchAttendance();
    } else {
      fetchDailyAttendance();
    }
  }, [selectedMonth, selectedDate, activeTab]);

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

      const staffName = item.user?.name || item.name || "Employee";
      toast.success(`Updated attendance for ${staffName}.`);
      fetchAttendance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update attendance.";
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  };

  const handleQuickFill = async (action: "mark_all_present" | "reset_to_leaves") => {
    try {
      setQuickFilling(true);
      await api.hrms.attendance.quickFill({ month: selectedMonth, action });
      toast.success(
        action === "mark_all_present"
          ? "All staff members marked 100% present (0 LOP)."
          : "Attendance synchronized with approved leaves."
      );
      fetchAttendance();
    } catch (err: unknown) {
      toast.error("Failed to update attendance.");
    } finally {
      setQuickFilling(false);
    }
  };

  const handleUpdateDailyStatus = async (userId: number, status: string) => {
    try {
      await api.hrms.attendance.updateDaily({
        user_id: userId,
        date: selectedDate,
        status,
        notes: "Marked by Admin in Attendance Register",
      });
      toast.success("Updated daily attendance status.");
      fetchDailyAttendance();
    } catch (err: unknown) {
      toast.error("Failed to update daily attendance.");
    }
  };

  // Filtered lists
  const filteredLedger = ledger.filter((item) => {
    const q = searchQuery.toLowerCase();
    const name = (item.user?.name || item.name || "").toLowerCase();
    const dept = (item.user?.department || item.department || "").toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  const filteredDaily = dailyRoster.filter((item) => {
    const q = searchQuery.toLowerCase();
    const name = (item.name || "").toLowerCase();
    const dept = (item.department || "").toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  const totalStaff = ledger.length;
  const totalApprovedLeaves = ledger.reduce((acc, curr) => acc + (curr.approved_leaves_count || curr.approved_leaves || 0), 0);
  const totalLopDays = ledger.reduce((acc, curr) => {
    const currentLop = editState[curr.user_id]?.lop_days ?? curr.loss_of_pay_days ?? curr.lop_days;
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
              Company Attendance Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review monthly working days and Loss of Pay (LOP) for payroll, or inspect daily punch logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === "monthly" ? (
              <>
                <span className="text-xs font-semibold text-slate-500">Pay Period:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </>
            ) : (
              <>
                <span className="text-xs font-semibold text-slate-500">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </>
            )}

            <Link
              href="/dashboard/hrms/payroll/generate"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>Run Payroll</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "monthly"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Ledger (Payroll)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "daily"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Daily Punch Register (Mobile Ready)</span>
            </button>
          </div>

          <div className="relative w-64 pb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search staff or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {activeTab === "monthly" && (
          <>
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

            {/* Quick Actions & Policy Toolbar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  All staff are assumed present on working days unless on approved leave or Loss of Pay (LOP).
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickFill("mark_all_present")}
                  disabled={quickFilling || loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All 100% Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("reset_to_leaves")}
                  disabled={quickFilling || loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sync Leaves</span>
                </button>
              </div>
            </div>

            {/* Monthly Attendance Ledger Table */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-xs text-slate-400">Loading monthly attendance ledger...</div>
              ) : filteredLedger.length === 0 ? (
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
                      {filteredLedger.map((item) => {
                        const rowEdit = editState[item.user_id] || {
                          lop_days: Number(item.loss_of_pay_days ?? item.lop_days ?? 0),
                          notes: item.notes || "",
                        };
                        const staffName = item.user?.name || item.name || "Employee";
                        const staffEmail = item.user?.email || "";
                        const staffDept = item.user?.department || item.department || "General Staff";
                        const effectivePresent = Math.max(
                          0,
                          workingDays - (item.approved_leaves_count || item.approved_leaves || 0) - rowEdit.lop_days
                        );

                        return (
                          <tr key={item.user_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{staffName}</div>
                              {staffEmail && <div className="text-[11px] text-slate-400">{staffEmail}</div>}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {staffDept}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-slate-700">
                              {workingDays}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.approved_leaves_count || item.approved_leaves || 0} days
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
                                <span>{savingId === item.user_id ? "Saving..." : "Save"}</span>
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
          </>
        )}

        {activeTab === "daily" && (
          <div className="space-y-4">
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Mobile Attendance System &amp; Daily Punch Log
                  </h3>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Records incoming mobile punches with GPS coordinates and timestamps. Admins can manually override status for any day.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5" />
                <span>Geofence: Guwahati HQ (150m)</span>
              </div>
            </div>

            {/* Daily Roster Table */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              {loadingDaily ? (
                <div className="p-10 text-center text-xs text-slate-400">Loading daily punch records...</div>
              ) : filteredDaily.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No records found for {selectedDate}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Punch In</th>
                        <th className="py-3 px-4">Punch Out</th>
                        <th className="py-3 px-4">Work Hours</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Quick Mark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredDaily.map((row) => (
                        <tr key={row.user_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {row.name}
                            <div className="text-[10px] font-normal text-slate-400">{row.employee_code || "Staff"}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{row.department}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {row.punch_in ? new Date(row.punch_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {row.punch_out ? new Date(row.punch_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {row.work_minutes > 0 ? `${Math.floor(row.work_minutes / 60)}h ${row.work_minutes % 60}m` : "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            <span className="capitalize">{row.source.replace("_", " ")}</span>
                            {row.is_overridden && (
                              <span className="text-[10px] text-amber-600 block">Admin Override</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                row.status === "present"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : row.status === "absent"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : row.status === "half_day"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {row.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <select
                              value={row.status}
                              onChange={(e) => handleUpdateDailyStatus(row.user_id, e.target.value)}
                              className="text-xs rounded-md border border-slate-200 px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="half_day">Half Day</option>
                              <option value="wfh">Work from Home</option>
                              <option value="on_leave">On Leave</option>
                              <option value="holiday">Holiday</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
