"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, SalaryStructure } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  Receipt,
  ChevronRight,
  Plus,
  Edit2,
  Users,
  Search,
  Filter,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

function formatCurrency(val: any) {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function SalaryStructuresListPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await api.hrms.salaryStructures.list();
      setStructures(res.salary_structures || []);
    } catch (err: unknown) {
      console.error("Failed to load salary structures:", err);
      toast.error("Failed to load salary structures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const filtered = structures.filter((s) => {
    const term = search.toLowerCase();
    const name = (s.user?.name || s.name || "").toLowerCase();
    const email = (s.user?.email || s.email || "").toLowerCase();
    const dept = (s.user?.department || s.department || "").toLowerCase();
    return name.includes(term) || email.includes(term) || dept.includes(term);
  });

  const configuredCount = structures.filter((s) => s.is_configured).length;
  const totalPayrollOutlay = structures.reduce((sum, s) => {
    const val = Number(s.gross_monthly);
    return sum + (isNaN(val) ? 0 : val);
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
              <span className="text-slate-900 font-semibold">Salary Setup</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Salary Structures &amp; CTC Plans
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Statutory compensation configurations, monthly components, and banking details.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/hrms/salary-structures/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configure Salary</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Configured Plans</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {configuredCount} / {structures.length} Employees
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {structures.length - configuredCount} pending configuration
            </div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-emerald-600">Monthly Gross Outlay</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {formatCurrency(totalPayrollOutlay)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active staff monthly budget</div>
          </div>
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="text-[11px] font-medium text-blue-600">Annualized Outlay</div>
            <div className="text-xl font-bold text-blue-600 mt-1">
              {formatCurrency(totalPayrollOutlay * 12)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total annual payroll expenditure</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department..."
              className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing {filtered.length} staff plans
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Loading salary structures...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No salary structures found</p>
              <p className="text-xs text-slate-400 mt-1">Configure compensation plans for staff members to automate payroll.</p>
              <div className="mt-4">
                <Link
                  href="/dashboard/hrms/salary-structures/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Configure Salary
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Annual CTC</th>
                    <th className="py-3 px-4">Gross Monthly</th>
                    <th className="py-3 px-4">Basic Pay</th>
                    <th className="py-3 px-4">EPF + PT</th>
                    <th className="py-3 px-4">Net Take-Home</th>
                    <th className="py-3 px-4">Bank / PAN</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((s) => {
                    const isConfigured = Boolean(s.is_configured);
                    const staffName = s.user?.name || s.name || "Employee";
                    const staffEmail = s.user?.email || s.email || "";
                    const staffDept = s.user?.department || s.department || "General Staff";
                    const staffId = s.user_id || s.id;

                    return (
                      <tr key={s.id || staffId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{staffName}</span>
                            {isConfigured ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                Active
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                Pending Setup
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400">
                            {staffDept} &bull; {staffEmail}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isConfigured ? (
                            <span className="font-bold text-slate-800">{formatCurrency(s.ctc_annual)}</span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isConfigured ? (
                            <span className="font-semibold text-slate-700">{formatCurrency(s.gross_monthly)}</span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isConfigured ? (
                            <span className="text-slate-600">{formatCurrency(s.basic_monthly)}</span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[11px]">
                          {isConfigured ? (
                            <span className="text-slate-500">
                              EPF: {formatCurrency(s.epf_employee)} &bull; PT: {formatCurrency(s.professional_tax)}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-bold">
                          {isConfigured ? (
                            <span className="text-emerald-700">{formatCurrency(s.net_monthly)}</span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-slate-500">
                          {s.bank_name ? (
                            <span>
                              {s.bank_name} &bull; {s.account_number ? `...${s.account_number.slice(-4)}` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No bank setup</span>
                          )}
                          {s.pan_number && <div className="text-slate-400">PAN: {s.pan_number}</div>}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isConfigured ? (
                            <Link
                              href={`/dashboard/hrms/salary-structures/create?user_id=${staffId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/hrms/salary-structures/create?user_id=${staffId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium shadow-2xs transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Setup CTC</span>
                            </Link>
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
