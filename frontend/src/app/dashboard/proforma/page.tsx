"use client";

import { useEffect, useState, useTransition, useRef, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, ProformaInvoice, ProformaInvoiceItem, ProformaInvoiceStats, Project } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Building,
  User,
  Mail,
  Phone,
  Eye,
  FileCheck,
  CreditCard,
  Building2,
  ArrowRight,
} from "lucide-react";

function ProformaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [invoices, setInvoices] = useState<ProformaInvoice[]>([]);
  const [stats, setStats] = useState<ProformaInvoiceStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<ProformaInvoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProformaInvoice | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    proforma_number: "",
    project_id: "",
    client_name: "",
    client_company: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    invoice_date: "",
    due_date: "",
    status: "unpaid",
    currency: "INR",
    tax_rate: "18",
    discount_rate: "0",
    round_off: 0,
    is_round_off: true,
    target_total: "",
    paid_amount: "0",
    notes: "Proforma invoice generated for mobilization advance facilitation.",
    terms_and_conditions: "1. Payment terms: 50% mobilization advance, 50% on milestone delivery.\n2. Please mention the Proforma Number in payment transaction remarks.\n3. Tax invoices will be issued upon realization of funds.",
    bank_details: "Bank Name: HDFC Bank Limited\nAccount Name: Kabhyan Technologies Private Limited\nAccount Number: 50200084729184\nIFSC Code: HDFC0001234\nBranch: Salt Lake Sector V, Kolkata, West Bengal\nUPI ID: kabhyan@hdfcbank",
    items: [
      { item_name: "Cloud Architecture & Security Setup", description: "AWS ECS cluster, Redis cache & MariaDB deployment", quantity: 40, unit: "hours", unit_price: 2500, amount: 100000 },
    ] as ProformaInvoiceItem[],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const printRef = useRef<HTMLDivElement>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.request(`/proforma-invoices?${params.toString()}`);
      setInvoices(res.proforma_invoices.data);
      if (res.stats) {
        setStats(res.stats);
      }

      // Check if highlight was passed
      if (highlightId) {
        const found = res.proforma_invoices.data.find((i: ProformaInvoice) => i.id === Number(highlightId));
        if (found) {
          setPreviewInvoice(found);
        }
      }
    } catch (err) {
      console.error("Failed to load proforma invoices:", err);
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
    fetchInvoices();
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const openCreateModal = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      proforma_number: `PI-2026-${randomNum}`,
      project_id: projects[0]?.id ? projects[0].id.toString() : "",
      client_name: "",
      client_company: "",
      client_email: "",
      client_phone: "",
      client_address: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      status: "unpaid",
      currency: "INR",
      tax_rate: "18",
      discount_rate: "0",
      round_off: 0,
      is_round_off: true,
      target_total: "",
      paid_amount: "0",
      notes: "Mobilization advance for scheduled project phases.",
      terms_and_conditions: "1. Advance payment is required prior to project kick-off.\n2. Invoices are settled upon bank credit confirmation.\n3. Mention PI number in transaction reference.",
      bank_details: "Bank Name: HDFC Bank Limited\nAccount Name: Kabhyan Technologies Private Limited\nAccount Number: 50200084729184\nIFSC Code: HDFC0001234\nBranch: Salt Lake Sector V, Kolkata, West Bengal\nUPI ID: kabhyan@hdfcbank",
      items: [
        { item_name: "Phase 1: Mobilization & System Engineering", description: "Backend infrastructure, DB migrations, Sanctum auth & Redis", quantity: 50, unit: "hours", unit_price: 2400, amount: 120000 },
      ],
    });
    setFormError(null);
    setIsEditing(false);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (pi: ProformaInvoice) => {
    setFormData({
      proforma_number: pi.proforma_number,
      project_id: pi.project_id ? pi.project_id.toString() : "",
      client_name: pi.client_name,
      client_company: pi.client_company || "",
      client_email: pi.client_email || "",
      client_phone: pi.client_phone || "",
      client_address: pi.client_address || "",
      invoice_date: pi.invoice_date,
      due_date: pi.due_date || "",
      status: pi.status,
      currency: pi.currency,
      tax_rate: pi.tax_rate ? pi.tax_rate.toString() : "0",
      discount_rate: pi.discount_rate ? pi.discount_rate.toString() : "0",
      round_off: Number(pi.round_off) || 0,
      is_round_off: (Number(pi.round_off) || 0) !== 0 || true,
      target_total: pi.total_amount ? Number(pi.total_amount).toFixed(2) : "",
      paid_amount: pi.paid_amount ? pi.paid_amount.toString() : "0",
      notes: pi.notes || "",
      terms_and_conditions: pi.terms_and_conditions || "",
      bank_details: pi.bank_details || "",
      items: pi.items && pi.items.length > 0 ? pi.items.map((i) => ({
        item_name: i.item_name,
        description: i.description || "",
        quantity: Number(i.quantity),
        unit: i.unit,
        unit_price: Number(i.unit_price),
        amount: Number(i.amount),
      })) : [
        { item_name: "Consulting & Engineering", description: "", quantity: 1, unit: "units", unit_price: 10000, amount: 10000 }
      ],
    });
    setFormError(null);
    setIsEditing(true);
    setEditingId(pi.id);
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
        { item_name: "", description: "", quantity: 1, unit: "hours", unit_price: 2000, amount: 2000 },
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

  // Calculations
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

      const targetTaxable = targetVal / (1 + taxRate / 100);
      const targetSubtotal = discountRate < 100 ? targetTaxable / (1 - discountRate / 100) : targetTaxable;

      const currentSubtotal = prev.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const ratio = currentSubtotal > 0 ? targetSubtotal / currentSubtotal : 1 / prev.items.length;

      const updatedItems = prev.items.map((item) => {
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
      const endpoint = isEditing ? `/proforma-invoices/${editingId}` : "/proforma-invoices";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        tax_rate: Number(formData.tax_rate) || 0,
        discount_rate: Number(formData.discount_rate) || 0,
        round_off: formData.is_round_off ? calcRoundOff : 0,
        paid_amount: Number(formData.paid_amount) || 0,
      };

      await api.request(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setModalOpen(false);
      startTransition(() => {
        fetchInvoices();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save proforma invoice.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (pi: ProformaInvoice, newStatus: string) => {
    try {
      await api.request(`/proforma-invoices/${pi.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchInvoices();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.request(`/proforma-invoices/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleConvertToInvoice = async (pi: ProformaInvoice) => {
    try {
      setConvertingId(pi.id);
      const res = await api.request(`/proforma-invoices/${pi.id}/convert-to-invoice`, {
        method: "POST",
      });
      if (res.invoice?.id) {
        router.push(`/dashboard/invoices?highlight=${res.invoice.id}`);
      } else {
        router.push("/dashboard/invoices");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Failed to convert Proforma to Tax Invoice.");
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
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partially_paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className={`space-y-6 ${previewInvoice ? "print:hidden" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Proforma Invoices (PI)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate formal advance invoices from accepted estimates for client payment initiation.
          </p>
        </div>

        <Link
          href="/dashboard/proforma/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Proforma Invoice</span>
        </Link>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Proformas
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {stats?.total_invoices ?? invoices.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            Unpaid / Pending
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
            ₹{Number(stats?.unpaid_value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Paid / Realized
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            ₹{Number(stats?.paid_value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
            Paid / Total Count
          </span>
          <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
            {stats?.paid ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.total_invoices ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PI #, client name, company, or email..."
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
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                fetchInvoices();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading proforma invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800">No Proforma Invoices</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Accepted client estimates can be converted into Proforma Invoices with 1-click.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Proforma ID</th>
                  <th className="py-3.5 px-6">Client / Company</th>
                  <th className="py-3.5 px-6">Estimate Reference</th>
                  <th className="py-3.5 px-6">Date / Due</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((pi) => (
                  <tr key={pi.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                        {pi.proforma_number}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 text-sm">{pi.client_name}</p>
                      <p className="text-slate-500 text-[11px]">{pi.client_company || "Direct"}</p>
                    </td>
                    <td className="py-4 px-6">
                      {pi.estimate ? (
                        <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {pi.estimate.estimate_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Direct PI</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex flex-col">
                        <span>{formatDate(pi.invoice_date)}</span>
                        {pi.due_date && (
                          <span className="text-[10px] text-slate-400">Due: {formatDate(pi.due_date)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 text-sm">
                      {pi.currency === "INR" ? "₹" : pi.currency}{" "}
                      {Number(pi.total_amount).toLocaleString(pi.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={pi.status}
                        onChange={(e) => handleStatusChange(pi, e.target.value)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border cursor-pointer focus:outline-none ${getStatusBadge(
                          pi.status
                        )}`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleConvertToInvoice(pi)}
                          disabled={convertingId === pi.id}
                          title="Generate Official GST Tax Invoice"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px] cursor-pointer disabled:opacity-50"
                        >
                          {convertingId === pi.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileCheck className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Make Tax Invoice</span>
                        </button>
                        <button
                          onClick={() => setPreviewInvoice(pi)}
                          title="Preview & Print Document"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(pi)}
                          title="Edit Proforma"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(pi)}
                          title="Delete Proforma"
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

      {/* Modal: Create / Edit Proforma Invoice */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? "Modify Proforma Invoice" : "Generate Proforma Invoice"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Advance billing invoice with bank wire details.
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proforma Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.proforma_number}
                    onChange={(e) => setFormData({ ...formData, proforma_number: e.target.value })}
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
                    <option value="">No Project</option>
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
                  Billed To (Client Information)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.client_company}
                      onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.client_address}
                      onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Proforma Line Items
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
                            placeholder="Deliverable Description"
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
                            placeholder="Unit"
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
                          placeholder="Details or milestone reference..."
                          value={item.description || ""}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none"
                        />
                        <div className="shrink-0 font-mono text-xs font-bold text-slate-800">
                          = {formData.currency === "INR" ? "₹" : formData.currency} {Number(item.amount || 0).toLocaleString(formData.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Discount Strip */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 w-28">GST / Tax (%):</label>
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
                      id="proforma-round-off"
                      checked={formData.is_round_off}
                      onChange={(e) => setFormData({ ...formData, is_round_off: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <label htmlFor="proforma-round-off" className="text-xs text-slate-600 font-medium cursor-pointer">
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
                      <span>GST ({formData.tax_rate}%):</span>
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
                    <span>Payable Total:</span>
                    <span className="font-mono text-blue-700">
                      {formData.currency === "INR" ? "₹" : formData.currency} {calcTotal.toLocaleString(formData.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Payment Wire Details</label>
                  <textarea
                    rows={4}
                    value={formData.bank_details}
                    onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={4}
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                    <span>{isEditing ? "Update Proforma" : "Create Proforma"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Corporate Print & PDF Preview */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print-modal-overlay">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print-modal-container">
            {/* Top Toolbar */}
            <div className="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between shrink-0 print-modal-toolbar">
              <div className="flex items-center gap-2 text-xs font-medium">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Proforma Document: <strong className="font-mono text-white">{previewInvoice.proforma_number}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConvertToInvoice(previewInvoice)}
                  disabled={convertingId === previewInvoice.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                >
                  {convertingId === previewInvoice.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Convert to Tax Invoice</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
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
                  <p className="text-xs text-slate-400">billing@kabhyan.com • www.kabhyan.com</p>
                </div>

                <div className="sm:text-right">
                  <span className="text-2xl font-black tracking-tight text-blue-900 uppercase block">
                    Proforma Invoice
                  </span>
                  <p className="font-mono font-bold text-sm text-slate-700 mt-1">
                    #{previewInvoice.proforma_number}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: <strong className="text-slate-800">{formatDate(previewInvoice.invoice_date)}</strong>
                  </p>
                  {previewInvoice.due_date && (
                    <p className="text-xs text-slate-500">
                      Payment Due: <strong className="text-slate-800">{formatDate(previewInvoice.due_date)}</strong>
                    </p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(previewInvoice.status)}`}>
                      {previewInvoice.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To / From */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Billed To:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{previewInvoice.client_name}</p>
                  {previewInvoice.client_company && (
                    <p className="text-slate-700 font-medium">{previewInvoice.client_company}</p>
                  )}
                  {previewInvoice.client_email && (
                    <p className="text-slate-500">{previewInvoice.client_email}</p>
                  )}
                  {previewInvoice.client_phone && (
                    <p className="text-slate-500">{previewInvoice.client_phone}</p>
                  )}
                  {previewInvoice.client_address && (
                    <p className="text-slate-500 mt-0.5">{previewInvoice.client_address}</p>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    References:
                  </span>
                  {previewInvoice.estimate && (
                    <p className="text-slate-700">
                      Accepted Estimate: <strong className="font-mono text-purple-700">{previewInvoice.estimate.estimate_number}</strong>
                    </p>
                  )}
                  {previewInvoice.project && (
                    <p className="text-slate-700 mt-0.5">
                      Project: <strong className="text-slate-900">{previewInvoice.project.name}</strong> ({previewInvoice.project.code})
                    </p>
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
                    {previewInvoice.items?.map((item, idx) => (
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
                          {previewInvoice.currency === "INR" ? "₹" : previewInvoice.currency}{" "}
                          {Number(item.unit_price).toLocaleString(previewInvoice.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {previewInvoice.currency === "INR" ? "₹" : previewInvoice.currency}{" "}
                          {Number(item.amount).toLocaleString(previewInvoice.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      {previewInvoice.currency === "INR" ? "₹" : previewInvoice.currency}{" "}
                      {Number(previewInvoice.subtotal).toLocaleString(previewInvoice.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {Number(previewInvoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({previewInvoice.discount_rate}%):</span>
                      <span className="font-mono font-semibold">
                        -{previewInvoice.currency === "INR" ? "₹" : previewInvoice.currency}{" "}
                        {Number(previewInvoice.discount_amount).toLocaleString(previewInvoice.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {Number(previewInvoice.tax_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax / GST ({previewInvoice.tax_rate}%):</span>
                      <span className="font-mono font-semibold">
                        +{previewInvoice.currency === "INR" ? "₹" : previewInvoice.currency}{" "}
                        {Number(previewInvoice.tax_amount).toLocaleString(previewInvoice.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {Number(previewInvoice.round_off ?? 0) !== 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Round Off:</span>
                      <span className="font-mono font-semibold">
                        {Number(previewInvoice.round_off) > 0 ? "+" : ""}{previewInvoice.currency === "INR" ? "₹" : previewInvoice.currency}{" "}
                        {Number(previewInvoice.round_off).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>Payable Total:</span>
                    <span className="font-mono text-blue-700">
                      {previewInvoice.currency === "INR" ? "₹" : previewInvoice.currency}{" "}
                      {Number(previewInvoice.total_amount).toLocaleString(previewInvoice.currency === "INR" ? "en-IN" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details Strip */}
              {previewInvoice.bank_details && (
                <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs print-avoid-break">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-slate-800 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Beneficiary Bank Remittance Information:</span>
                  </div>
                  <pre className="whitespace-pre-line font-mono text-[11px] text-slate-700 leading-relaxed">
                    {previewInvoice.bank_details}
                  </pre>
                </div>
              )}

              {/* Notes & Terms */}
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-500 print-avoid-break">
                {previewInvoice.notes && (
                  <div>
                    <span className="font-bold uppercase text-slate-700 block mb-1">Notes:</span>
                    <p className="leading-relaxed">{previewInvoice.notes}</p>
                  </div>
                )}
                {previewInvoice.terms_and_conditions && (
                  <div>
                    <span className="font-bold uppercase text-slate-700 block mb-1">Terms:</span>
                    <p className="whitespace-pre-line leading-relaxed">{previewInvoice.terms_and_conditions}</p>
                  </div>
                )}
              </div>

              {/* Footer Signature */}
              <div className="mt-12 pt-8 pr-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 print-avoid-break">
                <div>
                  <p>Kabhyan Technologies Private Limited</p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="w-44 border-b border-slate-300 pb-1 mb-1 font-signature text-slate-700 font-semibold italic text-sm">
                    Kabhyan Accounts Dept
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Authorized Signatory</span>
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
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Proforma Invoice</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <strong className="text-slate-900">{deleteConfirm.proforma_number}</strong>?
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

export default function ProformaPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Proforma Workspace...</p>
          </div>
        }
      >
        <ProformaContent />
      </Suspense>
    </AdminLayout>
  );
}

