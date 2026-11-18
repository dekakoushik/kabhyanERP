"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, BusinessAssociate } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Handshake,
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  Percent,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";

export default function EditBusinessAssociatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    associate_code: "",
    name: "",
    email: "",
    phone: "",
    emergency_contact: "",
    address: "",
    city: "Guwahati",
    state: "Assam",
    pincode: "",
    pan_number: "",
    gstin: "",
    engagement_model: "commission" as "salary" | "commission" | "hybrid",
    base_salary: "0",
    commission_rate: "0",
    commission_basis: "taxable_turnover" as "taxable_turnover" | "gross_amount",
    commission_scope: "recurring" as "one_time" | "recurring",
    status: "active" as "active" | "probation" | "inactive" | "terminated",
    joining_date: "",
    contract_end_date: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_upi_id: "",
    notes: "",
  });

  useEffect(() => {
    const fetchAssociate = async () => {
      try {
        setLoading(true);
        const res = await api.request(`/business-associates/${resolvedParams.id}`);
        if (res?.associate) {
          const ba: BusinessAssociate = res.associate;
          setFormData({
            associate_code: ba.associate_code,
            name: ba.name,
            email: ba.email || "",
            phone: ba.phone,
            emergency_contact: ba.emergency_contact || "",
            address: ba.address || "",
            city: ba.city || "Guwahati",
            state: ba.state || "Assam",
            pincode: ba.pincode || "",
            pan_number: ba.pan_number || "",
            gstin: ba.gstin || "",
            engagement_model: ba.engagement_model,
            base_salary: String(ba.base_salary || "0"),
            commission_rate: String(ba.commission_rate || "0"),
            commission_basis: ba.commission_basis || "taxable_turnover",
            commission_scope: ba.commission_scope || "recurring",
            status: ba.status,
            joining_date: ba.joining_date ? ba.joining_date.substring(0, 10) : "",
            contract_end_date: ba.contract_end_date ? ba.contract_end_date.substring(0, 10) : "",
            bank_name: ba.bank_name || "",
            bank_account_name: ba.bank_account_name || "",
            bank_account_number: ba.bank_account_number || "",
            bank_ifsc: ba.bank_ifsc || "",
            bank_upi_id: ba.bank_upi_id || "",
            notes: ba.notes || "",
          });
        }
      } catch (err: any) {
        toast.error("Failed to load associate details");
        router.push("/dashboard/business-associates");
      } finally {
        setLoading(false);
      }
    };

    fetchAssociate();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : null,
        phone: formData.phone.trim(),
        emergency_contact: formData.emergency_contact.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || "Assam",
        pincode: formData.pincode.trim() || null,
        pan_number: formData.pan_number.trim() ? formData.pan_number.trim().toUpperCase() : null,
        gstin: formData.gstin.trim() ? formData.gstin.trim().toUpperCase() : null,
        engagement_model: formData.engagement_model,
        status: formData.status,
        joining_date: formData.joining_date,
        contract_end_date: formData.contract_end_date || null,
        bank_name: formData.bank_name.trim() || null,
        bank_account_name: formData.bank_account_name.trim() || null,
        bank_account_number: formData.bank_account_number.trim() || null,
        bank_ifsc: formData.bank_ifsc.trim() ? formData.bank_ifsc.trim().toUpperCase() : null,
        bank_upi_id: formData.bank_upi_id.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (formData.engagement_model === "salary" || formData.engagement_model === "hybrid") {
        payload.base_salary = Number(formData.base_salary) || 0;
      } else {
        payload.base_salary = 0;
      }

      if (formData.engagement_model === "commission" || formData.engagement_model === "hybrid") {
        payload.commission_rate = Number(formData.commission_rate) || 0;
        payload.commission_basis = formData.commission_basis;
        payload.commission_scope = formData.commission_scope;
      } else {
        payload.commission_rate = 0;
      }

      await api.request(`/business-associates/${resolvedParams.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      toast.success("Business Associate terms updated successfully");
      router.push(`/dashboard/business-associates/${resolvedParams.id}`);
    } catch (err: any) {
      console.error("Failed to update associate:", err);
      setError(err.message || "Failed to update business associate.");
      toast.error(err.message || "Failed to update associate");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading associate terms...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-20">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>/</span>
              <Link href="/dashboard/business-associates" className="hover:text-slate-800 transition">Business Associates</Link>
              <span>/</span>
              <Link href={`/dashboard/business-associates/${resolvedParams.id}`} className="hover:text-slate-800 transition">
                {formData.name}
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-800">Edit Terms</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Handshake className="w-5 h-5" />
              </span>
              Edit Associate: {formData.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Update associate profile, adjust compensation model, or update banking coordinates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/business-associates/${resolvedParams.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Personal & Contact */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-blue-600" />
              Personal & Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="associate@example.com (Optional)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Emergency Phone / Alternate
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Operational Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  City / State
                </label>
                <input
                  type="text"
                  value={`${formData.city}, ${formData.state}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(",");
                    setFormData({
                      ...formData,
                      city: parts[0]?.trim() || "",
                      state: parts[1]?.trim() || formData.state,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Compensation Model Switcher */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Wallet className="w-4 h-4 text-blue-600" />
                Compensation Model & Payout Terms
              </h2>
            </div>

            {/* Model Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setFormData({ ...formData, engagement_model: "salary" })}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                  formData.engagement_model === "salary"
                    ? "border-emerald-500 bg-emerald-50/40 text-emerald-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Wallet className="w-5 h-5" />
                  </span>
                  {formData.engagement_model === "salary" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <h3 className="text-sm font-bold">Salary-Based</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fixed monthly stipend / retainer.
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, engagement_model: "commission" })}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                  formData.engagement_model === "commission"
                    ? "border-blue-500 bg-blue-50/40 text-blue-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <Percent className="w-5 h-5" />
                  </span>
                  {formData.engagement_model === "commission" && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <h3 className="text-sm font-bold">Commission-Based</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Percentage fee per deal / invoice.
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, engagement_model: "hybrid" })}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                  formData.engagement_model === "hybrid"
                    ? "border-purple-500 bg-purple-50/40 text-purple-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  {formData.engagement_model === "hybrid" && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <h3 className="text-sm font-bold">Hybrid Model</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Base monthly retainer + commission.
                </p>
              </div>
            </div>

            {/* Dynamic Inputs according to model */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(formData.engagement_model === "salary" || formData.engagement_model === "hybrid") && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Monthly Base Salary / Retainer (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        required
                        value={formData.base_salary}
                        onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {(formData.engagement_model === "commission" || formData.engagement_model === "hybrid") && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Commission Rate (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        required
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                        className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                )}
              </div>

              {(formData.engagement_model === "commission" || formData.engagement_model === "hybrid") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Commission Calculation Basis
                    </label>
                    <select
                      value={formData.commission_basis}
                      onChange={(e) => setFormData({ ...formData, commission_basis: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="taxable_turnover">Taxable Turnover (Excl. 18% GST)</option>
                      <option value="gross_amount">Gross Invoice Total</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Commission Scope
                    </label>
                    <select
                      value={formData.commission_scope}
                      onChange={(e) => setFormData({ ...formData, commission_scope: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="recurring">All Invoices (Recurring)</option>
                      <option value="one_time">First Invoice Only</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Legal & Banking Coordinates */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Legal Compliance & Bank Account Coordinates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Income Tax PAN
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  GSTIN
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Beneficiary Name
                </label>
                <input
                  type="text"
                  value={formData.bank_account_name}
                  onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={formData.bank_ifsc}
                  onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.bank_upi_id}
                  onChange={(e) => setFormData({ ...formData, bank_upi_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Tenure & Status */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              Partnership Dates & Account Status
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Onboarding / Joining Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contract Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Internal Remarks & Scope Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
            <Link
              href={`/dashboard/business-associates/${resolvedParams.id}`}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
