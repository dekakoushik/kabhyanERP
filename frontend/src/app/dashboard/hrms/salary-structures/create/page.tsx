"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, User, SalaryStructure } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Receipt,
  ChevronRight,
  ArrowLeft,
  Building,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
} from "lucide-react";

export default function ConfigureSalaryStructurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get("user_id");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [userId, setUserId] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [ctcAnnual, setCtcAnnual] = useState<string>("600000");

  // Earnings
  const [basicMonthly, setBasicMonthly] = useState<string>("25000");
  const [hraMonthly, setHraMonthly] = useState<string>("12500");
  const [specialAllowance, setSpecialAllowance] = useState<string>("10900");
  const [conveyanceMonthly, setConveyanceMonthly] = useState<string>("1600");
  const [grossMonthly, setGrossMonthly] = useState<string>("50000");

  // Deductions
  const [epfEmployee, setEpfEmployee] = useState<string>("1800");
  const [epfEmployer, setEpfEmployer] = useState<string>("1800");
  const [professionalTax, setProfessionalTax] = useState<string>("200");
  const [tdsMonthly, setTdsMonthly] = useState<string>("0");
  const [netMonthly, setNetMonthly] = useState<string>("48000");

  // Bank & Tax
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [panNumber, setPanNumber] = useState<string>("");
  const [uanNumber, setUanNumber] = useState<string>("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const usersRes = await api.users.list({ limit: 100 });
        const staff = (usersRes.users?.data || []).filter((u: User) => u.role !== "client");
        setUsers(staff);

        const targetId = queryUserId || (staff.length > 0 ? String(staff[0].id) : "");
        if (targetId) {
          setUserId(targetId);
          loadExistingStructure(targetId);
        }
      } catch (err: unknown) {
        console.error("Failed to load staff list:", err);
        toast.error("Failed to load staff directory.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [queryUserId]);

  const loadExistingStructure = async (uid: string) => {
    try {
      const res = await api.hrms.salaryStructures.get(uid);
      if (res?.salary_structure) {
        const s: SalaryStructure = res.salary_structure;
        setEffectiveFrom(s.effective_from || new Date().toISOString().slice(0, 10));
        setCtcAnnual(String(s.ctc_annual || ""));
        setBasicMonthly(String(s.basic_monthly || ""));
        setHraMonthly(String(s.hra_monthly || ""));
        setSpecialAllowance(String(s.special_allowance_monthly || ""));
        setConveyanceMonthly(String(s.conveyance_monthly || ""));
        setGrossMonthly(String(s.gross_monthly || ""));
        setEpfEmployee(String(s.epf_employee || ""));
        setEpfEmployer(String(s.epf_employer || ""));
        setProfessionalTax(String(s.professional_tax || ""));
        setTdsMonthly(String(s.tds_monthly || ""));
        setNetMonthly(String(s.net_monthly || ""));
        setBankName(s.bank_name || "");
        setAccountNumber(s.account_number || "");
        setIfscCode(s.ifsc_code || "");
        setPanNumber(s.pan_number || "");
        setUanNumber(s.uan_number || "");
      }
    } catch {
      // No existing structure yet, default values remain
    }
  };

  const handleUserChange = (newUid: string) => {
    setUserId(newUid);
    loadExistingStructure(newUid);
  };

  const calculateBreakdown = (ctcVal: number) => {
    const monthlyGross = Math.round(ctcVal / 12);
    const basic = Math.round(monthlyGross * 0.5); // 50% Basic
    const hra = Math.round(monthlyGross * 0.25); // 25% HRA
    const conveyance = 1600; // Conveyance
    const special = Math.max(0, monthlyGross - basic - hra - conveyance);

    // EPF: 12% of basic capped at 1800 for statutory ceiling, or custom
    const epf = Math.min(1800, Math.round(basic * 0.12));
    const pt = 200; // Professional tax
    const tds = 0; // TDS default 0 unless specified
    const net = Math.max(0, monthlyGross - epf - pt - tds);

    setGrossMonthly(String(monthlyGross));
    setBasicMonthly(String(basic));
    setHraMonthly(String(hra));
    setSpecialAllowance(String(special));
    setConveyanceMonthly(String(conveyance));
    setEpfEmployee(String(epf));
    setEpfEmployer(String(epf));
    setProfessionalTax(String(pt));
    setTdsMonthly(String(tds));
    setNetMonthly(String(net));
  };

  const handleCtcChange = (val: string) => {
    setCtcAnnual(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      calculateBreakdown(num);
    }
  };

  const recomputeNet = () => {
    const gross = (parseFloat(basicMonthly) || 0) +
      (parseFloat(hraMonthly) || 0) +
      (parseFloat(specialAllowance) || 0) +
      (parseFloat(conveyanceMonthly) || 0);

    const deductions = (parseFloat(epfEmployee) || 0) +
      (parseFloat(professionalTax) || 0) +
      (parseFloat(tdsMonthly) || 0);

    const net = Math.max(0, gross - deductions);
    setGrossMonthly(String(gross));
    setNetMonthly(String(net));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please select an employee.");
      return;
    }

    try {
      setSubmitting(true);
      await api.hrms.salaryStructures.save({
        user_id: Number(userId),
        effective_from: effectiveFrom,
        ctc_annual: parseFloat(ctcAnnual) || 0,
        basic_monthly: parseFloat(basicMonthly) || 0,
        hra_monthly: parseFloat(hraMonthly) || 0,
        special_allowance_monthly: parseFloat(specialAllowance) || 0,
        conveyance_monthly: parseFloat(conveyanceMonthly) || 0,
        gross_monthly: parseFloat(grossMonthly) || 0,
        epf_employee: parseFloat(epfEmployee) || 0,
        epf_employer: parseFloat(epfEmployer) || 0,
        professional_tax: parseFloat(professionalTax) || 0,
        tds_monthly: parseFloat(tdsMonthly) || 0,
        net_monthly: parseFloat(netMonthly) || 0,
        bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        ifsc_code: ifscCode.trim() || undefined,
        pan_number: panNumber.trim().toUpperCase() || undefined,
        uan_number: uanNumber.trim() || undefined,
      });

      toast.success("Salary structure saved successfully.");
      router.push("/dashboard/hrms/salary-structures");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save salary structure.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
            <Link href="/dashboard/hrms/salary-structures" className="hover:text-slate-700">Salary Setup</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Configure</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Configure Salary Structure
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Indian statutory compensation structure with automated component breakdown.
              </p>
            </div>
            <Link
              href="/dashboard/hrms/salary-structures"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Salary List</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
            Loading salary configuration...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Baseline Details */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Member
                </label>
                <select
                  value={userId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department || "Staff"} &bull; {u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Effective From
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual Cost to Company (CTC)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    step="1000"
                    value={ctcAnnual}
                    onChange={(e) => handleCtcChange(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-2 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Two-Column Salary Components Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings (Gross Components) */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Earnings Breakdown (Monthly)
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Gross: ₹{Number(grossMonthly).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Basic Pay (50%)</span>
                      <span className="text-slate-400 text-[11px]">Core component</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={basicMonthly}
                        onChange={(e) => setBasicMonthly(e.target.value)}
                        onBlur={recomputeNet}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>House Rent Allowance (HRA - 25%)</span>
                      <span className="text-slate-400 text-[11px]">50% of Basic</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={hraMonthly}
                        onChange={(e) => setHraMonthly(e.target.value)}
                        onBlur={recomputeNet}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Special Allowance</span>
                      <span className="text-slate-400 text-[11px]">Balancing component</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={specialAllowance}
                        onChange={(e) => setSpecialAllowance(e.target.value)}
                        onBlur={recomputeNet}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Conveyance Allowance</span>
                      <span className="text-slate-400 text-[11px]">Standard rate</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={conveyanceMonthly}
                        onChange={(e) => setConveyanceMonthly(e.target.value)}
                        onBlur={recomputeNet}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions (EPF, PT, TDS) */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Deductions &amp; Statutory Withholdings
                  </div>
                  <span className="text-[11px] font-bold text-rose-700">
                    Total: ₹{(Number(epfEmployee) + Number(professionalTax) + Number(tdsMonthly)).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>EPF Employee (12% of Basic)</span>
                      <span className="text-slate-400 text-[11px]">Statutory Provident Fund</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={epfEmployee}
                        onChange={(e) => setEpfEmployee(e.target.value)}
                        onBlur={recomputeNet}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Professional Tax (PT)</span>
                      <span className="text-slate-400 text-[11px]">Standard state tax</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={professionalTax}
                        onChange={(e) => setProfessionalTax(e.target.value)}
                        onBlur={recomputeNet}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>TDS / Income Tax Withholding</span>
                      <span className="text-slate-400 text-[11px]">Monthly estimated</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={tdsMonthly}
                        onChange={(e) => setTdsMonthly(e.target.value)}
                        onBlur={recomputeNet}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 bg-emerald-50/70 rounded-lg p-3 border border-emerald-200/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-900">Estimated Net In-Hand Salary:</span>
                      <span className="text-base font-extrabold text-emerald-800">
                        ₹{Number(netMonthly).toLocaleString("en-IN", { minimumFractionDigits: 2 })} / mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Banking & Statutory Identifiers */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Bank Disbursement &amp; Statutory Accounts
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">EPFO UAN Number (Optional)</label>
                  <input
                    type="text"
                    value={uanNumber}
                    onChange={(e) => setUanNumber(e.target.value)}
                    placeholder="12-digit UAN"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions (Rule 5: Concise 1-3 words) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/dashboard/hrms/salary-structures"
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Structure"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
