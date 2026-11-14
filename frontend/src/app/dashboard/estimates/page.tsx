"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Estimate, EstimateItem, EstimateStats, Project } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { formatDate, getDueDateStatus } from "@/lib/date";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Send,
  XCircle,
  Clock,
  Loader2,
  X,
  DollarSign,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  FileCheck,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function EstimatesPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [stats, setStats] = useState<EstimateStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [previewEstimate, setPreviewEstimate] = useState<Estimate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Estimate | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    estimate_number: "",
    project_id: "",
    client_name: "",
    client_company: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    estimate_date: "",
    expiry_date: "",
    status: "draft",
    currency: "INR",
    tax_rate: "18",
    discount_rate: "0",
    round_off: 0,
    is_round_off: true,
    target_total: "",
    notes: "Payment due within 30 days of invoice date.",
    terms_and_conditions: "50% upfront payment required before commencement of development milestones. All intellectual property transfers upon receipt of final settlement.",
    items: [
      { item_name: "Cloud Architecture & Security Setup", description: "AWS ECS cluster, Redis cache & MariaDB deployment", quantity: 40, unit: "hours", unit_price: 2500, amount: 100000 },
      { item_name: "Next.js Executive Portal Frontend", description: "Responsive clean corporate layout & API integration", quantity: 80, unit: "hours", unit_price: 2000, amount: 160000 },
    ] as EstimateItem[],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const printRef = useRef<HTMLDivElement>(null);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.request(`/estimates?${params.toString()}`);
      setEstimates(res.estimates.data);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load estimates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.request("/projects?per_page=100");
      setProjects(res.projects.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  useEffect(() => {
    fetchEstimates();
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEstimates();
  };

  const openCreateModal = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      estimate_number: `EST-2026-${randomNum}`,
      project_id: projects[0]?.id ? projects[0].id.toString() : "",
      client_name: "",
      client_company: "",
      client_email: "",
      client_phone: "",
      client_address: "",
      estimate_date: new Date().toISOString().split("T")[0],
      expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "draft",
      currency: "INR",
      tax_rate: "18",
      discount_rate: "0",
      round_off: 0,
      is_round_off: true,
      target_total: "",
      notes: "Quotation valid for 30 calendar days. Ongoing technical support available at standard SLA hourly rates.",
      terms_and_conditions: "Milestone payments: 50% mobilization advance, 50% upon successful staging acceptance testing.",
      items: [
        { item_name: "Discovery & Enterprise System Architecture", description: "Requirements documentation and microservices design", quantity: 30, unit: "hours", unit_price: 2500, amount: 75000 },
        { item_name: "Web Application & API Development", description: "Laravel RESTful API with Redis session state", quantity: 70, unit: "hours", unit_price: 2000, amount: 140000 },
      ],
    });
    setFormError(null);
    setIsEditing(false);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (est: Estimate) => {
    setFormData({
      estimate_number: est.estimate_number,
      project_id: est.project_id ? est.project_id.toString() : "",
      client_name: est.client_name,
      client_company: est.client_company || "",
      client_email: est.client_email || "",
      client_phone: est.client_phone || "",
      client_address: est.client_address || "",
      estimate_date: est.estimate_date,
      expiry_date: est.expiry_date || "",
      status: est.status,
      currency: est.currency,
      tax_rate: est.tax_rate ? est.tax_rate.toString() : "0",
      discount_rate: est.discount_rate ? est.discount_rate.toString() : "0",
      round_off: Number(est.round_off) || 0,
      is_round_off: (Number(est.round_off) || 0) !== 0 || true,
      target_total: est.total_amount ? Number(est.total_amount).toFixed(2) : "",
      notes: est.notes || "",
      terms_and_conditions: est.terms_and_conditions || "",
      items: est.items && est.items.length > 0 ? est.items.map((i) => ({
        item_name: i.item_name,
        description: i.description || "",
        quantity: Number(i.quantity),
        unit: i.unit,
        unit_price: Number(i.unit_price),
        amount: Number(i.amount),
      })) : [
        { item_name: "Custom Software Development", description: "", quantity: 1, unit: "units", unit_price: 1000, amount: 1000 }
      ],
    });
    setFormError(null);
    setIsEditing(true);
    setEditingId(est.id);
    setModalOpen(true);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const q = field === "quantity" ? Number(value) : Number(updated[index].quantity);
      const p = field === "unit_price" ? Number(value) : Number(updated[index].unit_price);
      updated[index].amount = Number((q * p).toFixed(2));
    }
    setFormData({ ...formData, items: updated });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { item_name: "", description: "", quantity: 1, unit: "hours", unit_price: 80, amount: 80 },
      ],
    });
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== index),
    });
  };

  // Calculations for display in modal
  const calcSubtotal = formData.items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const calcDiscount = (calcSubtotal * (Number(formData.discount_rate) || 0)) / 100;
  const taxableAmount = Math.max(0, calcSubtotal - calcDiscount);
  const calcTax = (taxableAmount * (Number(formData.tax_rate) || 0)) / 100;
  const rawTotal = taxableAmount + calcTax;
  const calcRoundOff = formData.is_round_off ? Number((Math.round(rawTotal) - rawTotal).toFixed(2)) : 0;
  const calcTotal = rawTotal + calcRoundOff;

  // Reverse / Two-way calculation handler: Given a Target Final Amount, back-calculate unit price and line items
  const handleTargetTotalChange = (targetValStr: string) => {
    const targetVal = parseFloat(targetValStr);
    setFormData((prev) => {
      if (isNaN(targetVal) || targetVal <= 0 || prev.items.length === 0) {
        return { ...prev, target_total: targetValStr };
      }

      const taxRate = Number(prev.tax_rate) || 0;
      const discountRate = Number(prev.discount_rate) || 0;

      // targetVal = (subtotal * (1 - discountRate/100)) * (1 + taxRate/100) + roundOff
      // If round-off enabled, targetVal is already whole or user target; taxable amount = targetVal / (1 + taxRate/100)
      const targetTaxable = targetVal / (1 + taxRate / 100);
      const targetSubtotal = discountRate < 100 ? targetTaxable / (1 - discountRate / 100) : targetTaxable;

      // Distribute targetSubtotal across items (if 1 item, sets it completely; if multiple, scales proportionally)
      const currentSubtotal = prev.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const ratio = currentSubtotal > 0 ? targetSubtotal / currentSubtotal : 1 / prev.items.length;

      const updatedItems = prev.items.map((item, idx) => {
        const qty = Number(item.quantity) || 1;
        let itemAmount: number;
        if (currentSubtotal > 0) {
          itemAmount = Number(((Number(item.amount) || 0) * ratio).toFixed(2));
        } else {
          itemAmount = Number((targetSubtotal / prev.items.length).toFixed(2));
        }
        const unitPrice = Number((itemAmount / qty).toFixed(2));
        return {
          ...item,
          unit_price: unitPrice,
          amount: Number((qty * unitPrice).toFixed(2)),
        };
      });

      // Recalculate raw total to check round-off
      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      const newDiscount = (newSubtotal * discountRate) / 100;
      const newTaxable = Math.max(0, newSubtotal - newDiscount);
      const newTax = (newTaxable * taxRate) / 100;
      const newRawTotal = newTaxable + newTax;
      const newRoundOff = prev.is_round_off ? Number((targetVal - newRawTotal).toFixed(2)) : 0;

      return {
        ...prev,
        target_total: targetValStr,
        items: updatedItems,
        round_off: newRoundOff,
      };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const endpoint = isEditing ? `/estimates/${editingId}` : "/estimates";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        tax_rate: Number(formData.tax_rate) || 0,
        discount_rate: Number(formData.discount_rate) || 0,
        round_off: formData.is_round_off ? calcRoundOff : 0,
      };

      await api.request(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setModalOpen(false);
      startTransition(() => {
        fetchEstimates();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save estimate.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (est: Estimate, newStatus: string) => {
    try {
      await api.request(`/estimates/${est.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchEstimates();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleDeleteEstimate = async () => {
    if (!deleteConfirm) return;
    try {
      await api.request(`/estimates/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      setDeleteConfirm(null);
      fetchEstimates();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleConvertToProforma = async (est: Estimate) => {
    if (est.status !== "accepted") {
      alert("Only Accepted estimates can be converted to a Proforma Invoice.");
      return;
    }

    try {
      setConvertingId(est.id);
      const res = await api.request(`/estimates/${est.id}/convert-to-proforma`, {
        method: "POST",
      });
      router.push(`/dashboard/proforma?highlight=${res.proforma_invoice.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Failed to convert estimate to proforma invoice.");
      }
    } finally {
      setConvertingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split("T")[0];
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr.split("T")[0] || dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "sent":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "invoiced":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "declined":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AdminLayout>
      <div className={`space-y-6 ${previewEstimate ? "print:hidden" : ""}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Estimates & Proposals
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage client proposals, quotes, and 1-click conversion to Proforma Invoices.
            </p>
          </div>

          <Link
            href="/dashboard/estimates/create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Estimate</span>
          </Link>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Estimates
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {stats?.total_estimates ?? estimates.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Pipeline Value
            </span>
            <p className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
              ₹{Number(stats?.total_value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Accepted Value
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              ₹{Number(stats?.accepted_value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              Accepted / Sent
            </span>
            <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
              {stats?.accepted ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.sent ?? 0}</span>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by estimate #, client name, company, or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </form>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent to Client</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="invoiced">Invoiced</option>
              </select>
            </div>

            {(search || statusFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  fetchEstimates();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Estimates Table View */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">Loading client estimates...</p>
            </div>
          ) : estimates.length === 0 ? (
            <div className="py-16 text-center px-4">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No estimates found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Generate your first itemized IT proposal for prospective or current clients.
              </p>
              <Link
                href="/dashboard/estimates/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Proposal</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6 whitespace-nowrap min-w-[150px]">Estimate ID</th>
                    <th className="py-3.5 px-6 min-w-[180px]">Client / Company</th>
                    <th className="py-3.5 px-6 min-w-[180px]">Project Reference</th>
                    <th className="py-3.5 px-6 whitespace-nowrap min-w-[160px]">Date / Validity</th>
                    <th className="py-3.5 px-6 whitespace-nowrap min-w-[140px]">Amount</th>
                    <th className="py-3.5 px-6 whitespace-nowrap min-w-[130px]">Status</th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {estimates.map((est) => (
                    <tr key={est.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Link
                          href={`/dashboard/estimates/${est.estimate_number}`}
                          className="inline-block whitespace-nowrap font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 px-2.5 py-1 rounded-md border border-blue-100 transition"
                        >
                          {est.estimate_number}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 text-sm">{est.client_name}</p>
                        <p className="text-slate-500 text-[11px]">{est.client_company || "Direct Individual"}</p>
                      </td>
                      <td className="py-4 px-6">
                        {est.project ? (
                          <div>
                            <span className="font-mono text-[10px] text-slate-400">{est.project.code}</span>
                            <p className="font-medium text-slate-800 line-clamp-1">{est.project.name}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Standalone</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-medium text-slate-800">{formatDate(est.estimate_date)}</span>
                          {est.expiry_date && (
                            (() => {
                              const validity = getDueDateStatus(est.expiry_date);
                              return (
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${
                                  est.status === "accepted" || est.status === "invoiced"
                                    ? "bg-slate-50 text-slate-400 border-slate-100"
                                    : validity.badgeClass
                                }`}>
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{est.status === "accepted" ? "Accepted" : validity.label}</span>
                                </span>
                              );
                            })()
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 text-sm whitespace-nowrap tabular-nums">
                        {est.currency === "INR" ? "₹ " : `${est.currency} `}
                        {Number(est.total_amount).toLocaleString(est.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 items-start">
                          <select
                            value={est.status}
                            onChange={(e) => handleStatusChange(est, e.target.value)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border cursor-pointer focus:outline-none ${getStatusBadge(
                              est.status
                            )}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="accepted">Accepted</option>
                            <option value="declined">Declined</option>
                            <option value="invoiced">Invoiced</option>
                          </select>

                          {est.status === "accepted" && (
                            <button
                              onClick={() => handleConvertToProforma(est)}
                              disabled={convertingId === est.id}
                              title="Generate Proforma Invoice"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition cursor-pointer shadow-xs disabled:opacity-60 whitespace-nowrap"
                            >
                              {convertingId === est.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Receipt className="w-3 h-3" />
                              )}
                              <span>Convert to PI</span>
                            </button>
                          )}
                          {est.status === "invoiced" && (
                            <button
                              onClick={() => router.push("/dashboard/proforma")}
                              title="View Proforma Invoice"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold hover:bg-purple-100 transition cursor-pointer whitespace-nowrap"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>View PI</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/estimates/${est.estimate_number}`}
                            title="Open Document View"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(est)}
                            title="Edit Estimate"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(est)}
                            title="Delete Estimate"
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
      </div>

      {/* Modal: Create / Edit Estimate */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? "Modify Quotation" : "Generate Client Estimate"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Structured IT proposal with line items, tax, and terms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}

              {/* Estimate Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimate Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.estimate_number}
                    onChange={(e) => setFormData({ ...formData, estimate_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">No Project (Standalone)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Client Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Client Contact Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="e.g. David Vance"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={formData.client_company}
                      onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                      placeholder="e.g. Vanguard Logistics Corp"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      placeholder="client@company.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Office Address</label>
                    <input
                      type="text"
                      value={formData.client_address}
                      onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimate Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.estimate_date}
                    onChange={(e) => setFormData({ ...formData, estimate_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until / Expiry</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="invoiced">Invoiced</option>
                  </select>
                </div>
              </div>

              {/* Line Items Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Itemized Deliverables & Pricing
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-12 sm:col-span-5">
                          <input
                            type="text"
                            required
                            placeholder="Deliverable Name (e.g. API Development)"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            required
                            min="0.1"
                            step="any"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Unit (hrs)"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            placeholder="Rate"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={formData.items.length <= 1}
                            className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Scope description or milestone details..."
                          value={item.description || ""}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none"
                        />
                        <div className="shrink-0 font-mono text-xs font-bold text-slate-800">
                          = {formData.currency} {Number(item.amount || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 w-28">Tax Rate (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 w-28">Discount (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_rate}
                      onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Reverse Target Total Calculation */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-blue-700 w-28" title="Enter final budget to auto-calculate item rates backwards">
                        Target Total:
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {formData.currency === "INR" ? "₹" : formData.currency}
                        </span>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 280000"
                          value={formData.target_total}
                          onChange={(e) => handleTargetTotalChange(e.target.value)}
                          className="w-36 pl-6 pr-2 py-1 bg-blue-50/50 border border-blue-300 rounded text-xs text-blue-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Type final total to auto-derive taxable rate &amp; GST backwards.
                    </p>
                  </div>

                  {/* Round Off Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="est-round-off"
                      checked={formData.is_round_off}
                      onChange={(e) => setFormData({ ...formData, is_round_off: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <label htmlFor="est-round-off" className="text-xs text-slate-600 font-medium cursor-pointer">
                      Round Off to Nearest Rupee
                    </label>
                  </div>
                </div>

                <div className="text-right space-y-1 text-xs">
                  <div className="flex justify-between sm:justify-end gap-6 text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formData.currency === "INR" ? "₹" : formData.currency} {calcSubtotal.toLocaleString(formData.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {calcDiscount > 0 && (
                    <div className="flex justify-between sm:justify-end gap-6 text-emerald-600">
                      <span>Discount ({formData.discount_rate}%):</span>
                      <span className="font-mono font-semibold">
                        -{formData.currency === "INR" ? "₹" : formData.currency} {calcDiscount.toLocaleString(formData.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {calcTax > 0 && (
                    <div className="flex justify-between sm:justify-end gap-6 text-slate-500">
                      <span>Tax ({formData.tax_rate}%):</span>
                      <span className="font-mono font-semibold">
                        +{formData.currency === "INR" ? "₹" : formData.currency} {calcTax.toLocaleString(formData.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {formData.is_round_off && calcRoundOff !== 0 && (
                    <div className="flex justify-between sm:justify-end gap-6 text-amber-700">
                      <span>Round Off:</span>
                      <span className="font-mono font-semibold">
                        {calcRoundOff > 0 ? "+" : ""}{formData.currency === "INR" ? "₹" : formData.currency} {calcRoundOff.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between sm:justify-end gap-6 text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>Estimated Total:</span>
                    <span className="font-mono text-blue-700">
                      {formData.currency === "INR" ? "₹" : formData.currency} {calcTotal.toLocaleString(formData.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Update Estimate" : "Create & Send"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Corporate Print & PDF Preview */}
      {previewEstimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print-modal-overlay">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print-modal-container">
            {/* Top Toolbar */}
            <div className="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between shrink-0 print-modal-toolbar">
              <div className="flex items-center gap-2 text-xs font-medium">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Estimate Preview: <strong className="font-mono text-white">{previewEstimate.estimate_number}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                {previewEstimate.status === "accepted" && (
                  <button
                    onClick={() => {
                      const est = previewEstimate;
                      setPreviewEstimate(null);
                      handleConvertToProforma(est);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Make Proforma</span>
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewEstimate(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div ref={printRef} className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-900 print-document-body">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-200">
                <div>
                  <Image
                    src="/logo.png"
                    alt="Kabhyan Technologies"
                    width={220}
                    height={60}
                    className="h-12 w-auto object-contain"
                  />
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Kabhyan Technologies Private Limited
                  </p>
                  <p className="text-xs text-slate-500">
                    Enterprise IT & Software Engineering Solutions
                  </p>
                  <p className="text-xs text-slate-400">contact@kabhyan.com • www.kabhyan.com</p>
                </div>

                <div className="sm:text-right">
                  <span className="text-2xl font-black tracking-tight text-blue-900 uppercase block">
                    Estimate / Quote
                  </span>
                  <p className="font-mono font-bold text-sm text-slate-700 mt-1">
                    #{previewEstimate.estimate_number}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: <strong className="text-slate-800">{formatDate(previewEstimate.estimate_date)}</strong>
                  </p>
                  {previewEstimate.expiry_date && (
                    <p className="text-xs text-slate-500">
                      Valid Until: <strong className="text-slate-800">{formatDate(previewEstimate.expiry_date)}</strong>
                    </p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(previewEstimate.status)}`}>
                      {previewEstimate.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To / From Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Prepared For:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{previewEstimate.client_name}</p>
                  {previewEstimate.client_company && (
                    <p className="text-slate-700 font-medium">{previewEstimate.client_company}</p>
                  )}
                  {previewEstimate.client_email && (
                    <p className="text-slate-500">{previewEstimate.client_email}</p>
                  )}
                  {previewEstimate.client_phone && (
                    <p className="text-slate-500">{previewEstimate.client_phone}</p>
                  )}
                  {previewEstimate.client_address && (
                    <p className="text-slate-500 mt-0.5">{previewEstimate.client_address}</p>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Project Reference:
                  </span>
                  {previewEstimate.project ? (
                    <div>
                      <p className="font-bold text-slate-900">{previewEstimate.project.name}</p>
                      <p className="font-mono text-slate-500 font-medium">{previewEstimate.project.code}</p>
                    </div>
                  ) : (
                    <p className="text-slate-600 font-medium">Custom Project Deliverables</p>
                  )}
                  <p className="text-slate-400 mt-2">
                    Prepared By: <strong className="text-slate-700">Kabhyan Technologies</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="py-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {previewEstimate.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.item_name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700">
                          {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {previewEstimate.currency === "INR" ? "₹" : previewEstimate.currency}{" "}
                          {Number(item.unit_price).toLocaleString(previewEstimate.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {previewEstimate.currency === "INR" ? "₹" : previewEstimate.currency}{" "}
                          {Number(item.amount).toLocaleString(previewEstimate.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Strip */}
              <div className="flex justify-end pt-4 pr-3 border-t border-slate-200 print-avoid-break">
                <div className="w-full sm:w-80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">
                      {previewEstimate.currency === "INR" ? "₹" : previewEstimate.currency}{" "}
                      {Number(previewEstimate.subtotal).toLocaleString(previewEstimate.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {Number(previewEstimate.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({previewEstimate.discount_rate}%):</span>
                      <span className="font-mono font-semibold">
                        -{previewEstimate.currency === "INR" ? "₹" : previewEstimate.currency}{" "}
                        {Number(previewEstimate.discount_amount).toLocaleString(previewEstimate.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {Number(previewEstimate.tax_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax / GST ({previewEstimate.tax_rate}%):</span>
                      <span className="font-mono font-semibold">
                        +{previewEstimate.currency === "INR" ? "₹" : previewEstimate.currency}{" "}
                        {Number(previewEstimate.tax_amount).toLocaleString(previewEstimate.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {Number(previewEstimate.round_off ?? 0) !== 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Round Off:</span>
                      <span className="font-mono font-semibold">
                        {Number(previewEstimate.round_off) > 0 ? "+" : ""}{previewEstimate.currency === "INR" ? "₹" : previewEstimate.currency}{" "}
                        {Number(previewEstimate.round_off).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>Total Amount:</span>
                    <span className="font-mono text-blue-700">
                      {previewEstimate.currency === "INR" ? "₹" : previewEstimate.currency}{" "}
                      {Number(previewEstimate.total_amount).toLocaleString(previewEstimate.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms in Preview */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-500 print-avoid-break">
                {previewEstimate.notes && (
                  <div>
                    <span className="font-bold uppercase text-slate-700 block mb-1">Notes:</span>
                    <p className="leading-relaxed">{previewEstimate.notes}</p>
                  </div>
                )}
                {previewEstimate.terms_and_conditions && (
                  <div>
                    <span className="font-bold uppercase text-slate-700 block mb-1">Terms & Conditions:</span>
                    <p className="leading-relaxed">{previewEstimate.terms_and_conditions}</p>
                  </div>
                )}
              </div>

              {/* Footer Signature Block */}
              <div className="mt-12 pt-8 pr-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 print-avoid-break">
                <div>
                  <p>Kabhyan Technologies • Digital Workspace</p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="w-44 border-b border-slate-300 pb-1 mb-1 font-signature text-slate-700 font-semibold italic text-sm">
                    Kabhyan Tech Authority
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Authorized Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Quotation</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove estimate <strong className="text-slate-900">{deleteConfirm.estimate_number}</strong> for {deleteConfirm.client_name}?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEstimate}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Delete Estimate
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
