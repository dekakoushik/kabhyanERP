"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Payslip } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Printer,
  ChevronRight,
  ArrowLeft,
  Building,
  CreditCard,
  FileCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function PayslipDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        setLoading(true);
        const res = await api.hrms.payroll.payslip(id);
        setPayslip(res.payslip);
      } catch (err: unknown) {
        console.error("Failed to load payslip:", err);
        toast.error("Failed to load payslip record.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayslip();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Print Actions (Hidden in Print) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Link href="/dashboard/hrms" className="hover:text-slate-700">Workspace</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/dashboard/hrms" className="hover:text-slate-700">HR &amp; Payroll</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/dashboard/hrms/payroll" className="hover:text-slate-700">Payroll</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-semibold">{payslip?.payslip_number || "Payslip"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Employee Salary Slip
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/hrms/payroll"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Payslip</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
            Loading payslip document...
          </div>
        ) : !payslip ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
            Payslip not found.
          </div>
        ) : (
          /* High-Fidelity Printable Document */
          <div className="bg-white border border-slate-300 rounded-xl shadow-md p-8 sm:p-10 space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header: Company Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-900 pb-5 gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                  Kabhyan Technologies Private Limited
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enterprise Software, Cloud Architecture &amp; Digital Solutions<br />
                  CIN: U72900WB2023PTC261890 &bull; GSTIN: 19AAECK4812N1Z4
                </p>
                <p className="text-xs text-slate-500">
                  Email: accounts@kabhyan.com &bull; Website: www.kabhyan.com
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded">
                  Payslip &bull; {payslip.month}
                </div>
                <div className="text-xs font-mono text-slate-600 font-semibold mt-2">
                  Slip No: {payslip.payslip_number}
                </div>
                <div className="text-[11px] text-slate-400">
                  Status: <span className="uppercase font-bold text-slate-700">{payslip.status}</span>
                </div>
              </div>
            </div>

            {/* Employee Coordinates & Attendance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/75 p-4 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Employee Name:</span>
                  <span className="col-span-2 font-bold text-slate-900">{payslip.user?.name}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Department:</span>
                  <span className="col-span-2 font-medium text-slate-800">{payslip.user?.department || "General"}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Email:</span>
                  <span className="col-span-2 text-slate-700">{payslip.user?.email}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Date of Joining:</span>
                  <span className="col-span-2 text-slate-700">{payslip.user?.date_of_joining || "N/A"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="col-span-2 font-medium text-slate-800">{payslip.salary_snapshot?.bank_name || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Bank Account:</span>
                  <span className="col-span-2 font-mono text-slate-700">{payslip.salary_snapshot?.account_number || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="col-span-2 font-mono text-slate-700">{payslip.salary_snapshot?.ifsc_code || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">PAN Number:</span>
                  <span className="col-span-2 font-mono text-slate-700">{payslip.salary_snapshot?.pan_number || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Attendance Roster Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 border-y border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Working Days</span>
                <span className="font-bold text-slate-900 text-sm">{payslip.working_days}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Paid Days</span>
                <span className="font-bold text-emerald-700 text-sm">{payslip.paid_days}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Loss of Pay (LOP)</span>
                <span className="font-bold text-rose-600 text-sm">{payslip.lop_days}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Billing Period</span>
                <span className="font-bold text-slate-800 text-sm">{payslip.month}</span>
              </div>
            </div>

            {/* Itemized Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Earnings Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-900 uppercase tracking-wider flex justify-between">
                  <span>Earnings Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 p-1">
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(payslip.basic_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(payslip.hra).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(payslip.special_allowance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-slate-600">Conveyance Allowance</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(payslip.conveyance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 flex justify-between font-bold text-slate-900">
                  <span>Gross Earnings</span>
                  <span>₹{Number(payslip.total_earnings).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-900 uppercase tracking-wider flex justify-between">
                  <span>Deduction Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 p-1">
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-rose-700">Loss of Pay (LOP) Deduction</span>
                    <span className="font-semibold text-rose-700">
                      ₹{Number(payslip.lop_deduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-slate-600">Employees' Provident Fund (EPF)</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(payslip.epf_deduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-slate-600">Professional Tax (PT)</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(payslip.professional_tax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5">
                    <span className="text-slate-600">TDS / Income Tax Withholding</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(payslip.tds_deduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 flex justify-between font-bold text-rose-700">
                  <span>Total Deductions</span>
                  <span>₹{Number(payslip.total_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight Box */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-900">
                  Net Salary Payable (Take-Home)
                </span>
                <div className="text-2xl font-extrabold text-emerald-800 mt-0.5">
                  ₹{Number(payslip.net_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {payslip.payment_mode && (
                <div className="text-left sm:text-right text-xs text-slate-600">
                  <div className="font-semibold text-slate-800">Mode: {payslip.payment_mode}</div>
                  {payslip.transaction_reference && (
                    <div className="text-[11px] font-mono text-slate-500">Ref: {payslip.transaction_reference}</div>
                  )}
                  {payslip.disbursed_at && (
                    <div className="text-[10px] text-slate-400">Date: {payslip.disbursed_at.slice(0, 10)}</div>
                  )}
                </div>
              )}
            </div>

            {/* Signatures & Legal Disclaimer */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-slate-500">
              <div className="space-y-1">
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <div className="font-semibold text-slate-800">Employee Signature</div>
                <div className="text-[10px] text-slate-400">Acknowledged receipt of salary</div>
              </div>

              <div className="space-y-1 text-right">
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <div className="font-semibold text-slate-800">For Kabhyan Technologies Private Limited</div>
                <div className="text-[10px] text-slate-400">Authorized Signatory / HR Operations</div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
              This is a computer-generated salary slip and does not require a physical signature if electronically verified.
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
