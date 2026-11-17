"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, ExpenseCategory, Project, Expense } from "@/lib/api";
import { validateGSTIN } from "@/lib/gst";
import { toast } from "sonner";
import {
  CreditCard,
  Building2,
  Calendar,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  Plus,
  FolderPlus,
  X,
  Trash2,
} from "lucide-react";

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const expenseId = resolvedParams.id;
  const router = useRouter();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Add Category State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3B82F6");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    expense_number: "",
    title: "",
    expense_category_id: "",
    project_id: "",
    vendor_name: "",
    vendor_gstin: "",
    expense_date: "",
    amount: "",
    gst_rate: "18",
    tax_amount: "0",
    currency: "INR",
    payment_method: "bank_transfer",
    transaction_reference: "",
    status: "paid",
    description: "",
    notes: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catsRes, projsRes, expRes] = await Promise.all([
          api.request("/expenses/categories").catch(() => ({ categories: [] })),
          api.request("/projects?per_page=100").catch(() => ({ projects: { data: [] } })),
          api.request(`/expenses/${expenseId}`).catch(() => null),
        ]);

        setCategories(catsRes.categories || []);
        setProjects(projsRes.projects?.data || []);

        const exp: Expense | null = expRes?.expense || expRes;
        if (!exp) {
          toast.error("Expense record not found");
          router.push("/dashboard/expenses");
          return;
        }

        const amt = parseFloat(String(exp.amount)) || 0;
        const tax = parseFloat(String(exp.tax_amount)) || 0;
        let matchedRate = "custom";
        if (amt > 0) {
          const ratio = (tax / amt) * 100;
          if (Math.abs(ratio - 18) < 0.1) matchedRate = "18";
          else if (Math.abs(ratio - 12) < 0.1) matchedRate = "12";
          else if (Math.abs(ratio - 5) < 0.1) matchedRate = "5";
          else if (Math.abs(ratio - 0) < 0.1) matchedRate = "0";
          else if (Math.abs(ratio - 28) < 0.1) matchedRate = "28";
        }

        setFormData({
          expense_number: exp.expense_number || "",
          title: exp.title || "",
          expense_category_id: String(exp.expense_category_id || ""),
          project_id: exp.project_id ? String(exp.project_id) : "",
          vendor_name: exp.vendor_name || "",
          vendor_gstin: exp.vendor_gstin || "",
          expense_date: typeof exp.expense_date === "string" ? exp.expense_date.slice(0, 10) : "",
          amount: String(exp.amount || ""),
          gst_rate: matchedRate,
          tax_amount: String(exp.tax_amount || "0"),
          currency: exp.currency || "INR",
          payment_method: exp.payment_method || "bank_transfer",
          transaction_reference: exp.transaction_reference || "",
          status: exp.status || "paid",
          description: exp.description || "",
          notes: exp.notes || "",
        });
      } catch (err) {
        console.error("Failed to load expense:", err);
        toast.error("Failed to load expense record");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [expenseId, router]);

  const gstAnalysis = useMemo(() => {
    return validateGSTIN(formData.vendor_gstin);
  }, [formData.vendor_gstin]);

  const calculatedTax = useMemo(() => {
    const amt = parseFloat(formData.amount) || 0;
    if (formData.gst_rate === "custom") {
      return parseFloat(formData.tax_amount) || 0;
    }
    const rate = parseFloat(formData.gst_rate) || 0;
    return parseFloat(((amt * rate) / 100).toFixed(2));
  }, [formData.amount, formData.gst_rate, formData.tax_amount]);

  const grossTotal = useMemo(() => {
    const amt = parseFloat(formData.amount) || 0;
    return amt + calculatedTax;
  }, [formData.amount, calculatedTax]);

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setCatSaving(true);
      const res = await api.request("/expenses/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCatName.trim(),
          color: newCatColor,
          description: newCatDescription.trim() || undefined,
        }),
      });
      toast.success("Category created successfully");
      const added = res.category;
      setCategories((prev) => [...prev, added]);
      setFormData((prev) => ({ ...prev, expense_category_id: String(added.id) }));
      setNewCatName("");
      setNewCatDescription("");
      setCategoryModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      toast.error(msg);
    } finally {
      setCatSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Expense title or scope is required.");
      return;
    }
    if (!formData.expense_category_id) {
      setFormError("Please select an expense category.");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError("Please enter a valid expense amount.");
      return;
    }
    if (!formData.expense_date) {
      setFormError("Please select the date of expense.");
      return;
    }

    try {
      setSaving(true);
      await api.request(`/expenses/${expenseId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: formData.title.trim(),
          expense_category_id: Number(formData.expense_category_id),
          project_id: formData.project_id ? Number(formData.project_id) : null,
          vendor_name: formData.vendor_name.trim() || null,
          vendor_gstin: formData.vendor_gstin.trim() || null,
          expense_date: formData.expense_date,
          amount: parseFloat(formData.amount),
          tax_amount: calculatedTax,
          currency: formData.currency,
          payment_method: formData.payment_method,
          transaction_reference: formData.transaction_reference.trim() || null,
          status: formData.status,
          description: formData.description.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      });

      toast.success("Expense updated successfully.");
      router.push("/dashboard/expenses");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update expense.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      setDeleting(true);
      await api.request(`/expenses/${expenseId}`, { method: "DELETE" });
      toast.success("Expense deleted successfully.");
      router.push("/dashboard/expenses");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete expense.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
                Workspace
              </Link>
              <span>/</span>
              <Link href="/dashboard/expenses" className="hover:text-slate-900 transition-colors">
                Expenses
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{formData.expense_number || `Expense #${expenseId}`}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Edit Operating Expense
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Modify vendor bill details, recalculate tax deductible inputs, and update payment status.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>
            <Link
              href="/dashboard/expenses"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Link>
            <button
              type="submit"
              form="expense-edit-form"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
            Loading expense data...
          </div>
        ) : (
          <form id="expense-edit-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Details Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                <span>Expense Classification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expense Title / Scope <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. AWS Cloud Infrastructure Hosting, Adobe Creative Suite License"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCategoryModalOpen(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>
                  <select
                    required
                    value={formData.expense_category_id}
                    onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Linked Project <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">General Overhead / Unlinked</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Ledger & Indian GST Calculation Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Financial Ledger &amp; GST Breakdown</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taxable Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Rate Applied
                  </label>
                  <select
                    value={formData.gst_rate}
                    onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">0% (Exempt / Nil)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard Services)</option>
                    <option value="28">28% GST</option>
                    <option value="custom">Custom Tax Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Input Tax (ITC) Amount (₹)
                  </label>
                  {formData.gst_rate === "custom" ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.tax_amount}
                      onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="w-full text-xs rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono font-semibold text-slate-700">
                      ₹{calculatedTax.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Gross Outlay Payable</div>
                  <div className="text-xs text-slate-400">Taxable Amount + Claimable Input Tax Credit</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    ₹{grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor & Statutory Compliance Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Vendor Details &amp; Payment Settlement</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor / Merchant Name
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    placeholder="e.g. Amazon Web Services India Pvt Ltd"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_gstin}
                    onChange={(e) => setFormData({ ...formData, vendor_gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g. 18AABCK1234F1Z5"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.vendor_gstin && (
                    <div className="mt-1">
                      {gstAnalysis.isValid ? (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified GSTIN ({gstAnalysis.stateName || "Registered"})
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Invalid Indian GSTIN structure
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Netbanking / Bank Transfer</option>
                    <option value="upi">UPI Corporate</option>
                    <option value="neft">NEFT / RTGS</option>
                    <option value="corporate_card">Company Debit / Credit Card</option>
                    <option value="cash">Petty Cash</option>
                    <option value="cheque">Company Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="paid">Paid &amp; Cleared</option>
                    <option value="pending">Pending Payment</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction / UTR Reference
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_reference}
                    onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                    placeholder="e.g. UTR-20261117-9872"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Notes / Audit Memo
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Approved under Q4 IT Infrastructure budget"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/dashboard/expenses"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Quick Add Category Modal */}
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  <span>Create Category</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAddCategory} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Cloud & Hosting, Travel"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Badge Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-slate-500">{newCatColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newCatDescription}
                    onChange={(e) => setNewCatDescription(e.target.value)}
                    placeholder="Brief description"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={catSaving}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    {catSaving ? "Saving..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
