"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, CompanyHoliday } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  ChevronRight,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

function formatHolidayDate(rawDate?: string) {
  if (!rawDate) return { month: "---", day: "--", fullDate: "N/A", dayName: "" };
  const clean = rawDate.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    return {
      month: dateObj.toLocaleString("en-US", { month: "short" }),
      day: String(d),
      fullDate: clean,
      dayName: dateObj.toLocaleString("en-US", { weekday: "long" }),
    };
  }
  return { month: "---", day: "--", fullDate: rawDate, dayName: "" };
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // New Holiday Form State
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"national" | "festival" | "company">("festival");
  const [description, setDescription] = useState("");

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.hrms.holidays.list(selectedYear);
      setHolidays(res.holidays || []);
    } catch (err: unknown) {
      console.error("Failed to load holidays:", err);
      toast.error("Failed to load company holidays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      toast.error("Please provide holiday name and date.");
      return;
    }

    try {
      setAdding(true);
      await api.hrms.holidays.create({
        title: name.trim(),
        name: name.trim(),
        holiday_date: date,
        date: date,
        type,
        description: description.trim() || undefined,
      });

      toast.success("Holiday added to company calendar.");
      setName("");
      setDate("");
      setDescription("");
      fetchHolidays();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add holiday.";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remove this holiday from the company calendar?")) return;
    try {
      setActionLoading(id);
      await api.hrms.holidays.delete(id);
      toast.success("Holiday removed.");
      fetchHolidays();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete holiday.";
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
              <span className="text-slate-900 font-semibold">Holidays</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Company Holiday Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Official gazetted national and festival holidays observed by Kabhyan Technologies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        {/* Content Layout: Holiday List (2 Cols) + Add Holiday Form (1 Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holiday List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {selectedYear} Calendar ({holidays.length} Days)
                  </h2>
                  <p className="text-xs text-slate-500">Holidays are automatically excluded from working day calculations</p>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-xs text-slate-400">Loading holiday schedule...</div>
              ) : holidays.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No holidays scheduled for {selectedYear}</p>
                  <p className="text-xs text-slate-400 mt-1">Add holidays using the form on the right.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {holidays.map((h) => {
                    const holidayTitle = h.title || h.name || "Company Holiday";
                    const dateInfo = formatHolidayDate(h.holiday_date || h.date);
                    const dayOfWeek = h.day_of_week || dateInfo.dayName;
                    const holidayType = h.type || (h.is_optional ? "optional" : "company");

                    return (
                      <div
                        key={h.id}
                        className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-blue-700 flex-shrink-0">
                            <span className="text-[10px] font-bold uppercase leading-none">
                              {dateInfo.month}
                            </span>
                            <span className="text-base font-extrabold leading-none mt-0.5">
                              {dateInfo.day}
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              {holidayTitle}
                              <span className={`text-[10px] px-2 py-0.2 rounded font-medium ${
                                holidayType === "national"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : holidayType === "festival"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                                {holidayType}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {dayOfWeek} &bull; {dateInfo.fullDate}
                              {h.description && ` • ${h.description}`}
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={actionLoading === h.id}
                          onClick={() => handleDelete(h.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete holiday"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add Holiday Form (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 uppercase tracking-wider">
                <Plus className="w-4 h-4 text-blue-600" />
                Add Company Holiday
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Holiday Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Diwali, Independence Day"
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="national">National Holiday</option>
                    <option value="festival">Festival Holiday</option>
                    <option value="company">Company Specific</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief holiday note"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={adding}
                    className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
                  >
                    {adding ? "Saving..." : "Add Holiday"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Working Days Calculation
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Working days in each month are dynamically derived by taking calendar days minus Saturday/Sunday weekends minus the holidays listed above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
