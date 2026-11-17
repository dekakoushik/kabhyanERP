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
  ShieldCheck,
  Percent,
  MapPin,
  Check,
  ShieldAlert,
  Scale,
  DollarSign,
  FileText,
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
  const [cityTier, setCityTier] = useState<"non_metro" | "metro">("non_metro");

  // Earnings & Allowances
  const [basicMonthly, setBasicMonthly] = useState<string>("25000");
  const [hasHra, setHasHra] = useState<boolean>(true);
  const [hraMonthly, setHraMonthly] = useState<string>("10000");
  const [hasConveyance, setHasConveyance] = useState<boolean>(true);
  const [conveyanceMonthly, setConveyanceMonthly] = useState<string>("1600");
  const [hasSpecialAllowance, setHasSpecialAllowance] = useState<boolean>(true);
  const [specialAllowance, setSpecialAllowance] = useState<string>("13400");
  const [grossMonthly, setGrossMonthly] = useState<string>("50000");

  // Deductions & Statutory Toggles
  const [hasEpf, setHasEpf] = useState<boolean>(true);
  const [epfMode, setEpfMode] = useState<"statutory_capped" | "actual" | "exempt">("statutory_capped");
  const [epfEmployee, setEpfEmployee] = useState<string>("1800");
  const [epfEmployer, setEpfEmployer] = useState<string>("1800");

  const [hasEsi, setHasEsi] = useState<boolean>(false);
  const [esiEmployee, setEsiEmployee] = useState<string>("0");
  const [esiEmployer, setEsiEmployer] = useState<string>("0");

  const [hasPt, setHasPt] = useState<boolean>(true);
  const [ptState, setPtState] = useState<string>("Assam");
  const [professionalTax, setProfessionalTax] = useState<string>("208");

  const [hasGratuity, setHasGratuity] = useState<boolean>(true);
  const [gratuityMonthly, setGratuityMonthly] = useState<string>("1202");

  const [hasTds, setHasTds] = useState<boolean>(false);
  const [tdsMonthly, setTdsMonthly] = useState<string>("0");
  const [taxRegime, setTaxRegime] = useState<"new" | "old">("new");

  const [netMonthly, setNetMonthly] = useState<string>("47992");
  const [totalEmployerCost, setTotalEmployerCost] = useState<string>("53002");

  // Bank & Statutory KYC
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [panNumber, setPanNumber] = useState<string>("");
  const [uanNumber, setUanNumber] = useState<string>("");
  const [esicNumber, setEsicNumber] = useState<string>("");

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
        setCityTier(s.city_tier || "non_metro");

        setBasicMonthly(String(s.basic_monthly || ""));
        setHasHra(s.has_hra ?? true);
        setHraMonthly(String(s.hra_monthly || ""));
        setHasConveyance(s.has_conveyance ?? true);
        setConveyanceMonthly(String(s.conveyance_monthly || ""));
        setHasSpecialAllowance(s.has_special_allowance ?? true);
        setSpecialAllowance(String(s.special_allowance_monthly || ""));
        setGrossMonthly(String(s.gross_monthly || ""));

        setHasEpf(s.has_epf ?? true);
        setEpfMode(s.epf_mode || "statutory_capped");
        setEpfEmployee(String(s.epf_employee || ""));
        setEpfEmployer(String(s.epf_employer || s.epf_employee || ""));

        setHasEsi(s.has_esi ?? false);
        setEsiEmployee(String(s.esi_employee || "0"));
        setEsiEmployer(String(s.esi_employer || "0"));

        setHasPt(s.has_professional_tax ?? true);
        setPtState(s.pt_state || "Assam");
        setProfessionalTax(String(s.professional_tax || "208"));

        setHasGratuity(s.has_gratuity ?? true);
        setGratuityMonthly(String(s.gratuity_monthly || ""));

        setHasTds(s.has_tds ?? false);
        setTdsMonthly(String(s.tds_monthly || "0"));
        setTaxRegime(s.tax_regime || "new");

        setNetMonthly(String(s.net_monthly || ""));
        setTotalEmployerCost(String(s.total_employer_cost || ""));

        setBankName(s.bank_name || "");
        setAccountNumber(s.account_number || "");
        setIfscCode(s.ifsc_code || "");
        setPanNumber(s.pan_number || "");
        setUanNumber(s.uan_number || "");
        setEsicNumber(s.esic_number || "");
      }
    } catch {
      // Keep defaults
    }
  };

  const handleUserChange = (newUid: string) => {
    setUserId(newUid);
    loadExistingStructure(newUid);
  };

  // Indian Statutory Slab Calculator for Assam & other states
  const computePtAmount = (grossVal: number, state: string, enabled: boolean) => {
    if (!enabled) return 0;
    if (state === "Delhi") return 0; // No PT in Delhi
    if (state === "Maharashtra") return 200;
    if (state === "Karnataka") return 200;

    // Assam State Slabs (The Assam Professions, Trades, Callings and Employments Taxation Act)
    if (grossVal <= 10000) return 0;
    if (grossVal <= 15000) return 150;
    if (grossVal <= 25000) return 180;
    return 208; // ₹2,500/year ceiling
  };

  // Full Statutory Breakdown Engine
  const calculateBreakdown = (
    ctcVal: number,
    tier: "non_metro" | "metro",
    optHra: boolean,
    optConv: boolean,
    optSpec: boolean,
    optEpf: boolean,
    modeEpf: "statutory_capped" | "actual" | "exempt",
    optEsi: boolean,
    optPt: boolean,
    statePt: string,
    optGratuity: boolean,
    optTds: boolean,
    tdsVal: number
  ) => {
    const monthlyGross = Math.round(ctcVal / 12);

    // 1. Basic Pay: 50% Rule (Code on Wages 2019)
    const basic = Math.round(monthlyGross * 0.50);

    // 2. HRA: Non-Metro (40% - Assam) or Metro (50%)
    const hraRate = tier === "metro" ? 0.50 : 0.40;
    const hra = optHra ? Math.round(basic * hraRate) : 0;

    // 3. Conveyance
    const conveyance = optConv ? 1600 : 0;

    // 4. Special Allowance: Balancing component
    const special = optSpec ? Math.max(0, monthlyGross - basic - hra - conveyance) : 0;
    const actualGross = basic + hra + conveyance + special;

    // 5. EPF Calculation
    let epf = 0;
    if (optEpf && modeEpf !== "exempt") {
      if (modeEpf === "statutory_capped") {
        epf = Math.min(1800, Math.round(basic * 0.12));
      } else {
        epf = Math.round(basic * 0.12);
      }
    }

    // 6. ESI Calculation (₹21,000 gross statutory limit)
    let esiEmp = 0;
    let esiEmpr = 0;
    const isEsiApplicable = optEsi && actualGross <= 21000;
    if (isEsiApplicable) {
      esiEmp = Math.round(actualGross * 0.0075);
      esiEmpr = Math.round(actualGross * 0.0325);
    }

    // 7. Professional Tax
    const pt = computePtAmount(actualGross, statePt, optPt);

    // 8. Gratuity (4.81% of Basic)
    const gratuity = optGratuity ? Math.round((15 / 26) * (basic / 12)) : 0;

    // 9. TDS
    const tds = optTds ? tdsVal : 0;

    // Deductions & Totals
    const totalDeductions = epf + esiEmp + pt + tds;
    const net = Math.max(0, actualGross - totalDeductions);
    const totalCost = actualGross + epf + esiEmpr + gratuity;

    setGrossMonthly(String(actualGross));
    setBasicMonthly(String(basic));
    setHraMonthly(String(hra));
    setConveyanceMonthly(String(conveyance));
    setSpecialAllowance(String(special));

    setEpfEmployee(String(epf));
    setEpfEmployer(String(epf));
    setEsiEmployee(String(esiEmp));
    setEsiEmployer(String(esiEmpr));
    setProfessionalTax(String(pt));
    setGratuityMonthly(String(gratuity));
    setTdsMonthly(String(tds));

    setNetMonthly(String(net));
    setTotalEmployerCost(String(totalCost));
  };

  const handleCtcChange = (val: string) => {
    setCtcAnnual(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      calculateBreakdown(
        num,
        cityTier,
        hasHra,
        hasConveyance,
        hasSpecialAllowance,
        hasEpf,
        epfMode,
        hasEsi,
        hasPt,
        ptState,
        hasGratuity,
        hasTds,
        parseFloat(tdsMonthly) || 0
      );
    }
  };

  const handleCityTierChange = (tier: "non_metro" | "metro") => {
    setCityTier(tier);
    const num = parseFloat(ctcAnnual) || 0;
    if (num > 0) {
      calculateBreakdown(
        num,
        tier,
        hasHra,
        hasConveyance,
        hasSpecialAllowance,
        hasEpf,
        epfMode,
        hasEsi,
        hasPt,
        ptState,
        hasGratuity,
        hasTds,
        parseFloat(tdsMonthly) || 0
      );
    }
  };

  // 1-Click Code on Wages (50% Basic) Balancer
  const handleBalanceTo50Percent = () => {
    const gross = (parseFloat(basicMonthly) || 0) +
      (hasHra ? parseFloat(hraMonthly) || 0 : 0) +
      (hasSpecialAllowance ? parseFloat(specialAllowance) || 0 : 0) +
      (hasConveyance ? parseFloat(conveyanceMonthly) || 0 : 0);

    const half = Math.round(gross * 0.50);
    const hraVal = hasHra ? Math.round(half * (cityTier === "metro" ? 0.50 : 0.40)) : 0;
    const convVal = hasConveyance ? 1600 : 0;
    const specialVal = hasSpecialAllowance ? Math.max(0, gross - half - hraVal - convVal) : 0;

    setBasicMonthly(String(half));
    setHraMonthly(String(hraVal));
    setSpecialAllowance(String(specialVal));
    setConveyanceMonthly(String(convVal));

    recomputeNet(half, hraVal, specialVal, convVal);
    toast.success("Balanced Basic Pay to 50% as per Code on Wages 2019.");
  };

  const recomputeNet = (
    bVal = parseFloat(basicMonthly) || 0,
    hVal = hasHra ? parseFloat(hraMonthly) || 0 : 0,
    sVal = hasSpecialAllowance ? parseFloat(specialAllowance) || 0 : 0,
    cVal = hasConveyance ? parseFloat(conveyanceMonthly) || 0 : 0
  ) => {
    const gross = bVal + hVal + sVal + cVal;

    let epf = 0;
    if (hasEpf && epfMode !== "exempt") {
      epf = epfMode === "statutory_capped" ? Math.min(1800, Math.round(bVal * 0.12)) : Math.round(bVal * 0.12);
    }

    let esiEmp = 0;
    let esiEmpr = 0;
    if (hasEsi && gross <= 21000) {
      esiEmp = Math.round(gross * 0.0075);
      esiEmpr = Math.round(gross * 0.0325);
    }

    const pt = computePtAmount(gross, ptState, hasPt);
    const gratuity = hasGratuity ? Math.round((15 / 26) * (bVal / 12)) : 0;
    const tds = hasTds ? parseFloat(tdsMonthly) || 0 : 0;

    const totalDeductions = epf + esiEmp + pt + tds;
    const net = Math.max(0, gross - totalDeductions);
    const totalCost = gross + epf + esiEmpr + gratuity;

    setGrossMonthly(String(gross));
    setEpfEmployee(String(epf));
    setEpfEmployer(String(epf));
    setEsiEmployee(String(esiEmp));
    setEsiEmployer(String(esiEmpr));
    setProfessionalTax(String(pt));
    setGratuityMonthly(String(gratuity));
    setNetMonthly(String(net));
    setTotalEmployerCost(String(totalCost));
  };

  // Validation checks
  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase());
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase());
  const basicRatio = Number(grossMonthly) > 0 ? Math.round((Number(basicMonthly) / Number(grossMonthly)) * 100) : 0;
  const isWageCodeCompliant = basicRatio >= 50;
  const isEsiApplicable = Number(grossMonthly) <= 21000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please select an employee.");
      return;
    }

    if (panNumber.trim() && !panValid) {
      toast.error("Invalid PAN format. Standard format: ABCDE1234F.");
      return;
    }

    if (ifscCode.trim() && !ifscValid) {
      toast.error("Invalid IFSC code format. Standard format: HDFC0001234.");
      return;
    }

    try {
      setSubmitting(true);
      await api.hrms.salaryStructures.save({
        user_id: Number(userId),
        effective_from: effectiveFrom,
        ctc_annual: parseFloat(ctcAnnual) || 0,
        city_tier: cityTier,
        basic_monthly: parseFloat(basicMonthly) || 0,
        has_hra: hasHra,
        hra_monthly: hasHra ? parseFloat(hraMonthly) || 0 : 0,
        has_special_allowance: hasSpecialAllowance,
        special_allowance_monthly: hasSpecialAllowance ? parseFloat(specialAllowance) || 0 : 0,
        has_conveyance: hasConveyance,
        conveyance_monthly: hasConveyance ? parseFloat(conveyanceMonthly) || 0 : 0,
        gross_monthly: parseFloat(grossMonthly) || 0,
        has_epf: hasEpf,
        epf_mode: epfMode,
        epf_employee: hasEpf ? parseFloat(epfEmployee) || 0 : 0,
        epf_employer: hasEpf ? parseFloat(epfEmployer) || 0 : 0,
        has_esi: hasEsi,
        esi_employee: hasEsi ? parseFloat(esiEmployee) || 0 : 0,
        esi_employer: hasEsi ? parseFloat(esiEmployer) || 0 : 0,
        has_professional_tax: hasPt,
        professional_tax: hasPt ? parseFloat(professionalTax) || 0 : 0,
        pt_state: ptState,
        has_gratuity: hasGratuity,
        gratuity_monthly: hasGratuity ? parseFloat(gratuityMonthly) || 0 : 0,
        has_tds: hasTds,
        tds_monthly: hasTds ? parseFloat(tdsMonthly) || 0 : 0,
        tax_regime: taxRegime,
        net_monthly: parseFloat(netMonthly) || 0,
        bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        ifsc_code: ifscCode.trim().toUpperCase() || undefined,
        pan_number: panNumber.trim().toUpperCase() || undefined,
        uan_number: uanNumber.trim() || undefined,
        esic_number: esicNumber.trim() || undefined,
      });

      toast.success("Salary structure saved with Indian statutory compliance.");
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
                Indian statutory compensation structure compliant with Code on Wages 2019, EPFO, ESIC, and Assam PT.
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
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
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
                  Annual CTC
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

            {/* Code on Wages 2019 (50% Basic Rule) Compliance Bar */}
            <div className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isWageCodeCompliant
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}>
              <div className="flex items-center gap-2.5">
                <Scale className={`w-5 h-5 flex-shrink-0 ${isWageCodeCompliant ? "text-emerald-700" : "text-amber-700"}`} />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>The Code on Wages, 2019 Compliance</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      isWageCodeCompliant ? "bg-emerald-200/80 text-emerald-900" : "bg-amber-200/80 text-amber-900"
                    }`}>
                      Basic: {basicRatio}% of Gross
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    {isWageCodeCompliant
                      ? "Basic salary satisfies the statutory 50% threshold. Allowances do not exceed 50% of gross remuneration."
                      : "Basic pay is under 50% of gross pay. Excess allowances attract statutory EPF and Gratuity obligations."}
                  </p>
                </div>
              </div>

              {!isWageCodeCompliant && (
                <button
                  type="button"
                  onClick={handleBalanceTo50Percent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fix to 50% Basic</span>
                </button>
              )}
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

                {/* City Tier Selector */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold block">City Tier (HRA Slabs)</span>
                    <span className="text-[10px] text-slate-400">Section 10(13A) IT Act</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleCityTierChange("non_metro")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        cityTier === "non_metro" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Non-Metro (40%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCityTierChange("metro")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        cityTier === "metro" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Metro (50%)
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* Basic Pay (Mandatory) */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>Basic Pay (Core Wage)</span>
                      <span className="text-slate-400 text-[10px]">Statutory Anchor</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={basicMonthly}
                        onChange={(e) => setBasicMonthly(e.target.value)}
                        onBlur={() => recomputeNet()}
                        className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* HRA (Toggleable) */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasHra ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-800">
                          House Rent Allowance (HRA)
                        </label>
                        <span className="text-[10px] text-slate-400">
                          ({cityTier === "metro" ? "50%" : "40%"} of Basic)
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasHra}
                          onChange={(e) => {
                            setHasHra(e.target.checked);
                            recomputeNet(parseFloat(basicMonthly), e.target.checked ? parseFloat(hraMonthly) : 0);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {hasHra && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={hraMonthly}
                          onChange={(e) => setHraMonthly(e.target.value)}
                          onBlur={() => recomputeNet()}
                          className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Conveyance Allowance (Toggleable) */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasConveyance ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-800">
                          Conveyance Allowance
                        </label>
                        <span className="text-[10px] text-slate-400">Transport</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasConveyance}
                          onChange={(e) => {
                            setHasConveyance(e.target.checked);
                            recomputeNet(parseFloat(basicMonthly), parseFloat(hraMonthly), parseFloat(specialAllowance), e.target.checked ? parseFloat(conveyanceMonthly) : 0);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {hasConveyance && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={conveyanceMonthly}
                          onChange={(e) => setConveyanceMonthly(e.target.value)}
                          onBlur={() => recomputeNet()}
                          className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Special Allowance (Toggleable) */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasSpecialAllowance ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-800">
                          Special Allowance
                        </label>
                        <span className="text-[10px] text-slate-400">Balancing residual</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasSpecialAllowance}
                          onChange={(e) => {
                            setHasSpecialAllowance(e.target.checked);
                            recomputeNet(parseFloat(basicMonthly), parseFloat(hraMonthly), e.target.checked ? parseFloat(specialAllowance) : 0);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {hasSpecialAllowance && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={specialAllowance}
                          onChange={(e) => setSpecialAllowance(e.target.value)}
                          onBlur={() => recomputeNet()}
                          className="w-full text-xs rounded-lg border border-slate-200 pl-7 pr-3 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deductions & Statutory Toggles */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Statutory Deductions (Monthly)
                  </div>
                  <span className="text-[11px] font-bold text-rose-700">
                    Total: ₹{(
                      (hasEpf ? Number(epfEmployee) : 0) +
                      (hasEsi ? Number(esiEmployee) : 0) +
                      (hasPt ? Number(professionalTax) : 0) +
                      (hasTds ? Number(tdsMonthly) : 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* EPF / PF Deduction */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasEpf ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Employee Provident Fund (EPF)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          EPF Act 1952 (12% of Basic)
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasEpf}
                          onChange={(e) => {
                            setHasEpf(e.target.checked);
                            recomputeNet();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {hasEpf && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <select
                            value={epfMode}
                            onChange={(e) => {
                              const mode = e.target.value as any;
                              setEpfMode(mode);
                              const b = parseFloat(basicMonthly) || 0;
                              const val = mode === "statutory_capped" ? Math.min(1800, Math.round(b * 0.12)) : Math.round(b * 0.12);
                              setEpfEmployee(String(val));
                              setEpfEmployer(String(val));
                              recomputeNet();
                            }}
                            className="text-[11px] rounded border border-slate-200 px-2 py-1 bg-white text-slate-700 font-medium"
                          >
                            <option value="statutory_capped">Statutory Capped (₹1,800/mo max on ₹15,000)</option>
                            <option value="actual">Actual 12% on full Basic</option>
                            <option value="exempt">Exempt (Excluded Employee under Form 11)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500">Employee Share (12%)</span>
                            <div className="font-bold text-slate-900 mt-0.5">₹{epfEmployee}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Employer Share (12%)</span>
                            <div className="font-bold text-slate-900 mt-0.5">₹{epfEmployer}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ESIC Coverage */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasEsi ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Employees&apos; State Insurance (ESIC)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isEsiApplicable ? "Gross <= ₹21,000: 0.75% Emp + 3.25% Empr" : "Gross > ₹21,000 statutory limit: Exempt"}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasEsi}
                          onChange={(e) => {
                            setHasEsi(e.target.checked);
                            recomputeNet();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {hasEsi && isEsiApplicable && (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500">Employee (0.75%)</span>
                          <div className="font-bold text-slate-900 mt-0.5">₹{esiEmployee}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">Employer (3.25%)</span>
                          <div className="font-bold text-slate-900 mt-0.5">₹{esiEmployer}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Professional Tax (Assam Slabs) */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasPt ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Professional Tax (PT)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          The Assam Professions, Trades &amp; Employments Taxation Act
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasPt}
                          onChange={(e) => {
                            setHasPt(e.target.checked);
                            recomputeNet();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {hasPt && (
                      <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-100">
                        <select
                          value={ptState}
                          onChange={(e) => {
                            setPtState(e.target.value);
                            const amt = computePtAmount(parseFloat(grossMonthly) || 0, e.target.value, hasPt);
                            setProfessionalTax(String(amt));
                            recomputeNet();
                          }}
                          className="text-xs rounded border border-slate-200 px-2 py-1 bg-white text-slate-700 font-medium"
                        >
                          <option value="Assam">Assam (Headquarters)</option>
                          <option value="Maharashtra">Maharashtra (₹200/mo)</option>
                          <option value="Karnataka">Karnataka (₹200/mo)</option>
                          <option value="Delhi">Delhi (Nil - ₹0)</option>
                        </select>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Computed PT</span>
                          <span className="font-bold text-xs text-slate-900">₹{professionalTax} / mo</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gratuity Provision (Employer Cost) */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasGratuity ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Gratuity Accrual in CTC
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Payment of Gratuity Act 1972 (4.81% of Basic)
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasGratuity}
                          onChange={(e) => {
                            setHasGratuity(e.target.checked);
                            recomputeNet();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {hasGratuity && (
                      <div className="text-right mt-1.5 text-xs text-slate-600 font-medium">
                        Monthly Accrual: <span className="font-bold text-slate-900">₹{gratuityMonthly}</span>
                      </div>
                    )}
                  </div>

                  {/* TDS / Income Tax Withholding */}
                  <div className={`p-3 rounded-xl border transition-colors ${hasTds ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200/50 opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          TDS / Income Tax Withholding
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Section 115BAC Monthly Deduction
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasTds}
                          onChange={(e) => {
                            setHasTds(e.target.checked);
                            recomputeNet();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {hasTds && (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Tax Regime</label>
                          <select
                            value={taxRegime}
                            onChange={(e) => setTaxRegime(e.target.value as any)}
                            className="w-full text-xs rounded border border-slate-200 px-2 py-1 bg-white text-slate-700"
                          >
                            <option value="new">New Regime (115BAC)</option>
                            <option value="old">Old Regime</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Monthly TDS (₹)</label>
                          <input
                            type="number"
                            value={tdsMonthly}
                            onChange={(e) => setTdsMonthly(e.target.value)}
                            onBlur={() => recomputeNet()}
                            className="w-full text-xs rounded border border-slate-200 px-2 py-1 bg-white text-slate-900 font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual 3-Way Summary Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Monthly Gross Earnings (A)
                </span>
                <div className="text-xl font-extrabold mt-1">
                  ₹{Number(grossMonthly).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Sum of active earnings</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                  Employee Deductions (B)
                </span>
                <div className="text-xl font-extrabold mt-1 text-rose-300">
                  -₹{(
                    (hasEpf ? Number(epfEmployee) : 0) +
                    (hasEsi ? Number(esiEmployee) : 0) +
                    (hasPt ? Number(professionalTax) : 0) +
                    (hasTds ? Number(tdsMonthly) : 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-rose-400/80 mt-0.5 block">EPF + ESIC + PT + TDS</span>
              </div>

              <div className="sm:border-l sm:border-slate-700/80 sm:pl-4">
                <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
                  Net In-Hand Take-Home (A - B)
                </span>
                <div className="text-2xl font-black mt-1 text-emerald-300">
                  ₹{Number(netMonthly).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Direct bank payout</span>
              </div>

              <div className="sm:border-l sm:border-slate-700/80 sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  Total Monthly CTC
                </span>
                <div className="text-xl font-extrabold mt-1 text-blue-200">
                  ₹{Number(totalEmployerCost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-blue-300/80 mt-0.5 block">Gross + Empr PF/ESI/Gratuity</span>
              </div>
            </div>

            {/* Banking & Statutory Identifiers */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Statutory Identifiers &amp; Banking KYC</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI, ICICI Bank"
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">IFSC Code</label>
                    {ifscCode.trim() && (
                      <span className={`text-[10px] font-bold ${ifscValid ? "text-emerald-600" : "text-rose-600"}`}>
                        {ifscValid ? "Valid IFSC" : "Invalid Format"}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">PAN Card Number</label>
                    {panNumber.trim() && (
                      <span className={`text-[10px] font-bold ${panValid ? "text-emerald-600" : "text-rose-600"}`}>
                        {panValid ? "Valid PAN" : "Invalid Format"}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">EPFO UAN (12 Digits)</label>
                  <input
                    type="text"
                    value={uanNumber}
                    onChange={(e) => setUanNumber(e.target.value)}
                    placeholder="12-digit Universal Account No."
                    maxLength={12}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ESIC Insurance IP (17 Digits)</label>
                  <input
                    type="text"
                    value={esicNumber}
                    onChange={(e) => setEsicNumber(e.target.value)}
                    placeholder="17-digit Insurance IP No."
                    maxLength={17}
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
