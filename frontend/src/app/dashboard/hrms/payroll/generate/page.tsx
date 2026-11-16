"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
  Calendar,
  Calculator,
} from "lucide-react";

export default function GeneratePayrollBatchPage() {
  const router = useRouter();
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-11"

  const [month, setMonth] = useState<string>(currentMonthStr);
  const [notes, setNotes] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calculation pre-flight preview state
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchPreflight = async (targetMonth: string) => {
    try {
      setLoadingPreview(true);
      const res = await api.hrms.payroll.calculate(targetMonth);
      setPreviewData(res);
    } catch (err: unknown) {
      console.error("Failed to calculate payroll preview:", err);
      toast.error("Failed to calculate pre-flight payroll.");
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreflight(month);
  }, [month]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData || !previewData.items || previewData.items.length === 0) {
      toast.error("No eligible employees with active salary structures found.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.hrms.payroll.generate({
        month,
        notes: notes.trim() || undefined,
      });

      toast.success(res.message || "Payroll batch generated successfully.");
      router.push(`/dashboard/hrms/payroll?month=${month}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate payroll batch.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/dashboard/hrms" className="hover:text-slate-700">Workspace</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/dashboard/hrms" className="hover:text-slate-700">HR &amp; Payroll</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/dashboard/hrms/payroll" className="hover:text-slate-700">Payroll</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Run Batch</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Run Monthly Payroll
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Generate itemized salary slips with automated Loss of Pay (LOP) and statutory deductions.
              </p>
            </div>
            <Link
              href="/dashboard/hrms/payroll"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Batches</span>
            </Link>
          </div>
        </div>

        {/* Month Selection Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Pay Period
              </div>
              <p className="text-[11px] text-slate-500">
                Salary generation month for calculation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs font-bold rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => fetchPreflight(month)}
              disabled={loadingPreview}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {loadingPreview ? "Refreshing..." : "Recompute"}
            </button>
          </div>
        </div>

        {/* Pre-flight Financial Summary */}
        {previewData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Working Days</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {previewData.working_days} Days
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {previewData.total_days_in_month} Calendar Days
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Gross Outlay</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                ₹{Number(previewData.total_gross || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {previewData.items?.length || 0} Staff Members
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">
              <div className="text-[11px] font-medium text-rose-600">LOP Wage Deductions</div>
              <div className="text-xl font-bold text-rose-600 mt-1">
                ₹{Number(previewData.total_lop_deductions || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unapproved absences</div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl shadow-sm">
              <div className="text-[11px] font-medium text-emerald-700">Net Disbursement</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                ₹{Number(previewData.total_net || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Total bank payout</div>
            </div>
          </div>
        )}

        {/* Pre-flight Itemized Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pre-Flight Salary Calculation Preview
            </h2>
            <span className="text-[11px] text-slate-500">
              Verified against Attendance Ledger &amp; Approved Leaves
            </span>
          </div>

          {loadingPreview ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Calculating salary figures...
            </div>
          ) : !previewData?.items || previewData.items.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No eligible employees found</p>
              <p className="text-xs text-slate-400 mt-1">
                Ensure employees have configured salary structures before generating payroll.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/hrms/salary-structures/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Configure Salary Structures
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4 text-center">Paid / Working Days</th>
                    <th className="py-2.5 px-4 text-right">Gross Salary</th>
                    <th className="py-2.5 px-4 text-right">LOP Deduction</th>
                    <th className="py-2.5 px-4 text-right">Statutory Deductions</th>
                    <th className="py-2.5 px-4 text-right font-bold">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {previewData.items.map((item: any) => (
                    <tr key={item.user_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.user_name}
                        <div className="text-[11px] font-normal text-slate-400">{item.department || "Staff"}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {item.paid_days} / {item.working_days}
                        {item.lop_days > 0 && (
                          <span className="text-[10px] text-rose-600 font-semibold block">
                            {item.lop_days} days LOP
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        ₹{Number(item.gross_monthly).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        {Number(item.lop_deduction) > 0 ? (
                          `-₹${Number(item.lop_deduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        ) : (
                          "₹0.00"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        ₹{Number(item.total_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        <div className="text-[10px] text-slate-400">
                          EPF: ₹{item.epf_employee} &bull; PT: ₹{item.professional_tax}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ₹{Number(item.net_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generation Notes & Trigger Form */}
        <form onSubmit={handleGenerate} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Batch Remarks / Audit Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard monthly salary run for corporate staff."
              className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Generating creates a <strong>Draft</strong> batch. You can review and lock before disbursement.
            </span>

            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard/hrms/payroll"
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !previewData?.items?.length}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Generating..." : "Generate Payroll"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
