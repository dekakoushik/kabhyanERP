"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Expense, ExpenseCategory, Project } from "@/lib/api";
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  Loader2,
  X,
  FileCheck,
  TrendingDown,
  Building,
  CheckCircle,
  Clock,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";

function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<{
    total_expenses_value: number;
    total_tax_deductible: number;
    total_count: number;
    pending_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);

  // Form
  const [formData, setFormData] = useState({
    expense_category_id: "",
    project_id: "",
    title: "",
    description: "",
    vendor_name: "",
    vendor_gstin: "",
    expense_date: "",
    amount: "",
    tax_amount: "0",
    currency: "INR",
    payment_method: "bank_transfer",
    transaction_reference: "",
    status: "paid",
    notes: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category_id", categoryFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.request(`/expenses?${params.toString()}`);
      setExpenses(res.expenses.data);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.request("/expenses/categories");
      setCategories(res.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.request("/projects?per_page=100");
      setProjects(res.projects.data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchCategories();
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      expense_category_id: categories[0]?.id ? categories[0].id.toString() : "",
      project_id: "",
      title: "",
      description: "",
      vendor_name: "",
      vendor_gstin: "",
      expense_date: new Date().toISOString().split("T")[0],
      amount: "",
      tax_amount: "0",
      currency: "INR",
      payment_method: "bank_transfer",
      transaction_reference: "",
      status: "paid",
      notes: "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setIsEditing(true);
    setEditingId(exp.id);
    setFormData({
      expense_category_id: exp.expense_category_id.toString(),
      project_id: exp.project_id ? exp.project_id.toString() : "",
      title: exp.title,
      description: exp.description || "",
      vendor_name: exp.vendor_name || "",
      vendor_gstin: exp.vendor_gstin || "",
      expense_date: typeof exp.expense_date === "string" ? exp.expense_date.split("T")[0] : "",
      amount: exp.amount.toString(),
      tax_amount: exp.tax_amount ? exp.tax_amount.toString() : "0",
      currency: exp.currency,
      payment_method: exp.payment_method,
      transaction_reference: exp.transaction_reference || "",
      status: exp.status,
      notes: exp.notes || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const endpoint = isEditing ? `/expenses/${editingId}` : "/expenses";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        expense_category_id: Number(formData.expense_category_id),
        project_id: formData.project_id ? Number(formData.project_id) : null,
        amount: Number(formData.amount),
        tax_amount: Number(formData.tax_amount) || 0,
      };

      await api.request(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setModalOpen(false);
      startTransition(() => {
        fetchExpenses();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save expense.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.request(`/expenses/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      setDeleteConfirm(null);
      fetchExpenses();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-red-100 text-red-700 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </span>
            Corporate Expense Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Record company disbursements, cloud infra bills, salaries, GST input claims, and vendor payouts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses Paid</p>
              <p className="text-xl font-mono font-black text-red-600 mt-1">
                ₹{Number(stats.total_expenses_value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stats.total_count} logged vouchers</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">GST Input Tax Credit</p>
              <p className="text-xl font-mono font-black text-emerald-700 mt-1">
                ₹{Number(stats.total_tax_deductible).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Claimable against GST output</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-xl font-black text-amber-700 mt-1">{stats.pending_count}</p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting disbursement</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Active Categories</p>
              <p className="text-xl font-black text-purple-700 mt-1">{categories.length}</p>
              <p className="text-[11px] text-purple-600/80 mt-0.5">Cloud, Rent, Payroll, Tools</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search voucher, title, vendor, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Expense Vouchers...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Expenses Recorded</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Click &quot;Record Expense&quot; above to log vendor payouts or operational bills.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Voucher #</th>
                  <th className="py-3.5 px-6">Expense Title / Vendor</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Date / Method</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Input GST</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {exp.expense_number}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 text-sm line-clamp-1">{exp.title}</p>
                      <p className="text-slate-500 text-[11px]">{exp.vendor_name || "Direct Vendor"}</p>
                      {exp.vendor_gstin && (
                        <p className="text-[10px] text-slate-400 font-mono">GSTIN: {exp.vendor_gstin}</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {exp.category ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                          style={{
                            borderColor: `${exp.category.color}40`,
                            backgroundColor: `${exp.category.color}15`,
                            color: exp.category.color,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: exp.category.color }} />
                          {exp.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Uncategorized</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex flex-col">
                        <span>{typeof exp.expense_date === "string" ? exp.expense_date.split("T")[0] : ""}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {exp.payment_method.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 text-sm">
                      ₹{Number(exp.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 font-mono text-emerald-600 font-semibold text-xs">
                      {Number(exp.tax_amount) > 0 ? (
                        `₹${Number(exp.tax_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          exp.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : exp.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          title="Edit Voucher"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(exp)}
                          title="Delete Voucher"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Expense */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100 text-red-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isEditing ? "Edit Expense Voucher" : "Record Corporate Expense"}
                  </h2>
                  <p className="text-xs text-slate-500">Log business disbursement and GST input tax</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expense Title / Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Production Infrastructure / Figma Team Subscription"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.expense_category_id}
                    onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Assignment</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">General Corporate (No Project)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services India Pvt Ltd"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor GSTIN (For ITC Claim)</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAECF5398P1ZI"
                    value={formData.vendor_gstin}
                    onChange={(e) => setFormData({ ...formData, vendor_gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expense Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="corporate_card">Corporate Card</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UTR / Transaction Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-HDFC-991823"
                    value={formData.transaction_reference}
                    onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Specific purpose, approvals or comments"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
              </div>

              {/* Total Calculation Preview */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Disbursement Value:</span>
                <span className="font-mono font-bold text-base text-red-600">
                  ₹{(Number(formData.amount || 0) + Number(formData.tax_amount || 0)).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Update Voucher" : "Save Expense"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Expense Voucher</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <strong className="text-slate-900">{deleteConfirm.expense_number}</strong> ({deleteConfirm.title})?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Expenses...</p>
          </div>
        }
      >
        <ExpensesContent />
      </Suspense>
    </AdminLayout>
  );
}

