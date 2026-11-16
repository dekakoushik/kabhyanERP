"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, CompanyHoliday } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  Sparkles,
  Info,
  RotateCw,
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

function getHolidayCategoryInfo(h: CompanyHoliday) {
  const desc = (h.description || "").toLowerCase();
  const title = (h.title || h.name || "").toLowerCase();

  const isAssam =
    desc.includes("assam") ||
    title.includes("bihu") ||
    title.includes("chilarai") ||
    title.includes("me-dam-me-phi") ||
    title.includes("sankardeva") ||
    title.includes("madhabdeva") ||
    title.includes("ali-aye-ligang") ||
    title.includes("sukapha") ||
    title.includes("asom divas") ||
    title.includes("bathou");

  if (isAssam) {
    return {
      label: "Assam State",
      emoji: "🦏",
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      key: "assam",
    };
  }

  const isNational =
    desc.includes("national") ||
    title.includes("republic") ||
    title.includes("independence") ||
    title.includes("gandhi") ||
    title.includes("labour") ||
    title.includes("may day") ||
    title.includes("buddha") ||
    title.includes("id-ul") ||
    title.includes("muharram") ||
    title.includes("christmas");

  if (isNational) {
    return {
      label: "National",
      emoji: "🇮🇳",
      badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      key: "national",
    };
  }

  return {
    label: "Festival",
    emoji: "🎉",
    badgeClass: "bg-purple-50 text-purple-700 border border-purple-200",
    key: "festival",
  };
}

export default function HolidaysPage() {
  const currentYear = new Date().getFullYear();
  // Rolling dynamic auto-incrementing years: past 2 years up to future 6 years
  const startYear = Math.min(2024, currentYear - 2);
  const endYear = currentYear + 6;
  const availableYears = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // New Holiday Form State
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<string>("assam");
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

  const handleSyncGovernmentHolidays = async () => {
    try {
      setSyncing(true);
      const res = await api.hrms.holidays.sync({ year: selectedYear, region: "all" });
      toast.success(res.message || `Government & Assam holidays synced for ${selectedYear}.`);
      fetchHolidays();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync government holidays.";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      toast.error("Please provide holiday name and date.");
      return;
    }

    try {
      setAdding(true);
      const categoryDesc = type === "assam" ? "Govt of Assam Gazetted Holiday" : type === "national" ? "National Gazetted Day" : "Festival Holiday";
      const fullDesc = description.trim() ? `${categoryDesc} - ${description.trim()}` : categoryDesc;

      await api.hrms.holidays.create({
        title: name.trim(),
        name: name.trim(),
        holiday_date: date,
        date: date,
        type,
        description: fullDesc,
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

  const filteredHolidays = holidays.filter((h) => {
    if (activeFilter === "all") return true;
    const cat = getHolidayCategoryInfo(h);
    return cat.key === activeFilter;
  });

  const assamCount = holidays.filter((h) => getHolidayCategoryInfo(h).key === "assam").length;
  const nationalCount = holidays.filter((h) => getHolidayCategoryInfo(h).key === "national").length;

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
              Official gazetted national and Assam State government holidays for Kabhyan Technologies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedYear((prev) => prev - 1)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Previous Year"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-slate-500 pl-1">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer pr-1"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedYear((prev) => prev + 1)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Next Year"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              disabled={syncing}
              onClick={handleSyncGovernmentHolidays}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Govt & Assam Holidays"}</span>
            </button>
          </div>
        </div>

        {/* Region Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            All Holidays ({holidays.length})
          </button>
          <button
            onClick={() => setActiveFilter("assam")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === "assam"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50/50"
            }`}
          >
            <span>🦏 Assam State Gazetted</span>
            <span className="text-[10px] opacity-80">({assamCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter("national")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === "national"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50/50"
            }`}
          >
            <span>🇮🇳 National Gazetted</span>
            <span className="text-[10px] opacity-80">({nationalCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter("festival")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === "festival"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-purple-50/50"
            }`}
          >
            <span>🎉 Festivals</span>
          </button>
        </div>

        {/* Content Layout: Holiday List (2 Cols) + Add Holiday Form (1 Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holiday List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {selectedYear} Calendar ({filteredHolidays.length} Days)
                  </h2>
                  <p className="text-xs text-slate-500">
                    All listed days are automatically excluded from monthly working days calculation
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-xs text-slate-400">Loading holiday schedule...</div>
              ) : filteredHolidays.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No holidays found for {selectedYear}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click <strong>&quot;Sync Govt &amp; Assam Holidays&quot;</strong> above to auto-fetch official Assam &amp; National holidays.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={handleSyncGovernmentHolidays}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Auto-Sync Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredHolidays.map((h) => {
                    const holidayTitle = h.title || h.name || "Company Holiday";
                    const dateInfo = formatHolidayDate(h.holiday_date || h.date);
                    const dayOfWeek = h.day_of_week || dateInfo.dayName;
                    const catInfo = getHolidayCategoryInfo(h);

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
                              <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${catInfo.badgeClass}`}>
                                <span>{catInfo.emoji}</span>
                                <span>{catInfo.label}</span>
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

          {/* Add Custom Holiday Form (1 Col) */}
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
                    placeholder="e.g. Rongali Bihu, Bir Chilarai Divas"
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
                  <label className="block font-semibold text-slate-700 mb-1">Jurisdiction / Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="assam">🦏 Assam State Gazetted</option>
                    <option value="national">🇮🇳 National Gazetted</option>
                    <option value="festival">🎉 Festival Holiday</option>
                    <option value="company">🏢 Company Specific</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional holiday notes"
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

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Assam State &amp; National Gazettes
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pre-configured for <strong>2025, 2026, 2027, and 2028</strong> including Magh Bihu, Rongali Bihu (3 days), Kati Bihu, Bir Chilarai Divas, Me-Dam-Me-Phi, Tithi of Srimanta Sankardeva, Tithi of Madhabdeva, Durga Puja, and Central National Holidays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
