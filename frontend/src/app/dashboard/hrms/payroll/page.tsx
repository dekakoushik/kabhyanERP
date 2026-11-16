"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, PayrollBatch, Payslip } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  CreditCard,
  ChevronRight,
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Lock,
  Send,
  Eye,
  Calendar,
} from "lucide-react";

export default function PayrollBatchesPage() {
  const searchParams = useSearchParams();
  const queryMonth = searchParams.get("month");

  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<PayrollBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Disbursement modal/prompt state
  const [paymentMode, setPaymentMode] = useState<string>("NEFT / Bank Transfer");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await api.hrms.payroll.overview();
      const list: PayrollBatch[] = res.batches || [];
      setBatches(list);

      if (queryMonth) {
        const found = list.find((b) => b.month === queryMonth);
        if (found) setSelectedBatch(found);
      } else if (list.length > 0 && !selectedBatch) {
        setSelectedBatch(list[0]);
      }
    } catch (err: unknown) {
      console.error("Failed to load payroll batches:", err);
      toast.error("Failed to load payroll records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [queryMonth]);

  const handleFinalize = async (batchId: number) => {
    if (!window.confirm("Finalize this payroll batch? Calculations will be locked.")) return;
    try {
      setActionLoading(true);
      await api.hrms.payroll.finalize(batchId);
      toast.success("Payroll batch finalized successfully.");
      fetchPayroll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to finalize payroll.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburse = async () => {
    if (!selectedBatch) return;
    try {
      setActionLoading(true);
      await api.hrms.payroll.disburse(selectedBatch.id, {
        payment_mode: paymentMode,
        transaction_reference: transactionRef.trim() || undefined,
      });
      toast.success("Salaries marked as disbursed.");
      setShowDisburseDialog(false);
      fetchPayroll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disburse payroll.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
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
              <span className="text-slate-900 font-semibold">Payroll Batches</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Monthly Payroll Batches
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review computed salary runs, finalize deductions, and record bank disbursements.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/hrms/payroll/generate"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Run Payroll</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
            Loading payroll batches...
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No payroll batches generated yet</p>
            <p className="text-xs text-slate-400 mt-1">Run your first monthly payroll batch to compute salaries and print payslips.</p>
            <div className="mt-4">
              <Link
                href="/dashboard/hrms/payroll/generate"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Run Payroll</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Batch Selector Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">Select Batch:</span>
              {batches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatch(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    selectedBatch?.id === b.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{b.month}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    b.status === "disbursed"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : b.status === "finalized"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {b.status}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Batch Details */}
            {selectedBatch && (
              <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden space-y-6 p-6">
                {/* Batch Top Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">
                        Payroll Batch: {selectedBatch.month}
                      </h2>
                      <span className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded ${
                        selectedBatch.status === "disbursed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : selectedBatch.status === "finalized"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {selectedBatch.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedBatch.payslips_count ?? selectedBatch.payslips?.length ?? 0} staff payslips generated in this batch.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedBatch.status === "draft" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleFinalize(selectedBatch.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Finalize Batch</span>
                      </button>
                    )}

                    {selectedBatch.status === "finalized" && (
                      <button
                        disabled={actionLoading}
                        onClick={() => setShowDisburseDialog(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Record Disbursement</span>
                      </button>
                    )}

                    {selectedBatch.status === "disbursed" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Disbursed on {selectedBatch.disbursed_at?.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-medium text-slate-500">Gross Outlay</div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      ₹{Number(selectedBatch.total_gross).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-medium text-rose-600">LOP Wage Deductions</div>
                    <div className="text-base sm:text-lg font-bold text-rose-600 mt-0.5">
                      ₹{Number(selectedBatch.total_lop_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-medium text-slate-500">Statutory Deductions</div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      ₹{Number(selectedBatch.total_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                    <div className="text-[11px] font-medium text-emerald-700">Net Disbursement</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-800 mt-0.5">
                      ₹{Number(selectedBatch.total_net).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Payslips Table */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Itemized Employee Payslips ({selectedBatch.payslips?.length || 0})
                  </div>

                  {!selectedBatch.payslips || selectedBatch.payslips.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No itemized payslips found for this batch.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px]">
                            <th className="py-2.5 px-4">Slip #</th>
                            <th className="py-2.5 px-4">Employee</th>
                            <th className="py-2.5 px-4 text-center">Paid / Working Days</th>
                            <th className="py-2.5 px-4 text-right">Gross</th>
                            <th className="py-2.5 px-4 text-right">LOP Deduction</th>
                            <th className="py-2.5 px-4 text-right">Deductions</th>
                            <th className="py-2.5 px-4 text-right font-bold">Net Salary</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {selectedBatch.payslips.map((slip) => (
                            <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                                {slip.payslip_number}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {slip.user?.name}
                                <div className="text-[11px] font-normal text-slate-400">{slip.user?.department || "Staff"}</div>
                              </td>
                              <td className="py-3 px-4 text-center text-slate-600">
                                {slip.paid_days} / {slip.working_days}
                                {slip.lop_days > 0 && (
                                  <span className="text-[10px] text-rose-600 block">({slip.lop_days} LOP)</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-slate-700">
                                ₹{Number(slip.gross_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-right text-rose-600">
                                {Number(slip.lop_deduction) > 0 ? (
                                  `-₹${Number(slip.lop_deduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                ) : (
                                  "₹0.00"
                                )}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500">
                                ₹{Number(slip.total_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                ₹{Number(slip.net_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href={`/dashboard/hrms/payslips/${slip.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-[11px] font-medium transition-colors"
                                >
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span>View Payslip</span>
                                </Link>
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
        )}

        {/* Disbursement Recording Dialog */}
        {showDisburseDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Record Salary Disbursement</h3>
                <button
                  onClick={() => setShowDisburseDialog(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Disbursement Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NEFT / Bank Transfer">NEFT / Bank Transfer</option>
                    <option value="RTGS">RTGS</option>
                    <option value="IMPS">IMPS</option>
                    <option value="UPI Batch">UPI Corporate Batch</option>
                    <option value="Cheque">Company Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction / UTR Reference</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UTR12938475829"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowDisburseDialog(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleDisburse}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  {actionLoading ? "Processing..." : "Confirm Disbursement"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
