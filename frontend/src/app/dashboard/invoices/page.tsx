"use client";

import { useEffect, useState, useTransition, useRef, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Invoice, InvoiceItem, InvoicePayment, InvoiceStats, Project } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDate, getDueDateStatus } from "@/lib/date";
import {
  FileCheck,
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
  CreditCard,
  Building2,
  ArrowUpRight,
  IndianRupee,
  AlertCircle,
  Receipt,
  CheckCircle,
} from "lucide-react";

function InvoicesContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);

  // Invoice Form State
  const [formData, setFormData] = useState({
    invoice_number: "",
    project_id: "",
    client_name: "",
    client_company: "",
    client_gstin: "",
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
    notes: "Thank you for your business. Please make the payment before the due date.",
    terms_and_conditions: "1. Goods/Services once invoiced are subject to contractual terms.\n2. Payment is due strictly as per agreed payment milestone terms.\n3. Delayed payments shall attract interest @ 18% per annum from due date.\n4. Subject to Kolkata, West Bengal jurisdiction.",
    bank_details: "Bank Name: HDFC Bank Limited\nAccount Name: Kabhyan Technologies Private Limited\nAccount Number: 50200084729184\nIFSC Code: HDFC0001234\nBranch: Salt Lake Sector V, Kolkata, West Bengal\nUPI ID: kabhyan@hdfcbank",
    items: [
      {
        item_name: "Enterprise Cloud Application Development & Consulting",
        description: "Full stack engineering, API microservices and secure deployment",
        sac_code: "998314",
        quantity: 1,
        unit: "milestone",
        unit_price: 150000,
        amount: 150000,
      },
    ] as InvoiceItem[],
  });

  // Payment Recording State
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_date: "",
    payment_method: "bank_transfer",
    transaction_reference: "",
    notes: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [, startTransition] = useTransition();

  const printRef = useRef<HTMLDivElement>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.request(`/invoices?${params.toString()}`);
      setInvoices(res.invoices.data);
      if (res.stats) {
        setStats(res.stats);
      }

      // Check if highlight was requested
      if (highlightId) {
        const found = res.invoices.data.find((i: Invoice) => i.id === Number(highlightId));
        if (found) {
          setPreviewInvoice(found);
        }
      }
    } catch (err) {
      console.error("Failed to load tax invoices:", err);
    } finally {
      setLoading(false);
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
    fetchInvoices();
    fetchProjects();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    const due = new Date();
    due.setDate(due.getDate() + 15);
    const dueDateStr = due.toISOString().split("T")[0];

    setIsEditing(false);
    setEditingId(null);
    setFormData({
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      project_id: "",
      client_name: "",
      client_company: "",
      client_gstin: "",
      client_email: "",
      client_phone: "",
      client_address: "",
      invoice_date: today,
      due_date: dueDateStr,
      status: "unpaid",
      currency: "INR",
      tax_rate: "18",
      discount_rate: "0",
      round_off: 0,
      is_round_off: true,
      target_total: "",
      notes: "Thank you for your business. Please make the payment before the due date.",
      terms_and_conditions: "1. Goods/Services once invoiced are subject to contractual terms.\n2. Payment is due strictly as per agreed payment milestone terms.\n3. Delayed payments shall attract interest @ 18% per annum from due date.\n4. Subject to Kolkata, West Bengal jurisdiction.",
      bank_details: "Bank Name: HDFC Bank Limited\nAccount Name: Kabhyan Technologies Private Limited\nAccount Number: 50200084729184\nIFSC Code: HDFC0001234\nBranch: Salt Lake Sector V, Kolkata, West Bengal\nUPI ID: kabhyan@hdfcbank",
      items: [
        {
          item_name: "Enterprise Cloud Application Development & Consulting",
          description: "Full stack engineering, API microservices and secure deployment",
          sac_code: "998314",
          quantity: 1,
          unit: "milestone",
          unit_price: 150000,
          amount: 150000,
        },
      ],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (inv: Invoice) => {
    setFormData({
      invoice_number: inv.invoice_number,
      project_id: inv.project_id ? inv.project_id.toString() : "",
      client_name: inv.client_name,
      client_company: inv.client_company || "",
      client_gstin: inv.client_gstin || "",
      client_email: inv.client_email || "",
      client_phone: inv.client_phone || "",
      client_address: inv.client_address || "",
      invoice_date: inv.invoice_date || "",
      due_date: inv.due_date || "",
      status: inv.status,
      currency: inv.currency,
      tax_rate: inv.tax_rate ? inv.tax_rate.toString() : "0",
      discount_rate: inv.discount_rate ? inv.discount_rate.toString() : "0",
      round_off: Number(inv.round_off) || 0,
      is_round_off: (Number(inv.round_off) || 0) !== 0 || true,
      target_total: inv.total_amount ? Number(inv.total_amount).toFixed(2) : "",
      notes: inv.notes || "",
      terms_and_conditions: inv.terms_and_conditions || "",
      bank_details: inv.bank_details || "",
      items: inv.items && inv.items.length > 0 ? inv.items.map((i) => ({
        item_name: i.item_name,
        description: i.description || "",
        sac_code: i.sac_code || "998314",
        quantity: Number(i.quantity),
        unit: i.unit,
        unit_price: Number(i.unit_price),
        amount: Number(i.amount),
      })) : [
        { item_name: "Software Consulting & Implementation", description: "", sac_code: "998314", quantity: 1, unit: "units", unit_price: 10000, amount: 10000 }
      ],
    });
    setFormError(null);
    setIsEditing(true);
    setEditingId(inv.id);
    setModalOpen(true);
  };

  const openRecordPaymentModal = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    const remaining = Number(inv.due_amount || 0);
    setPaymentData({
      amount: remaining > 0 ? remaining.toString() : (inv.total_amount || 0).toString(),
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "bank_transfer",
      transaction_reference: "",
      notes: "Bank transfer reference / NEFT / UTR confirmation.",
    });
    setPaymentError(null);
    setPaymentModalOpen(true);
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
        { item_name: "", description: "", sac_code: "998314", quantity: 1, unit: "hours", unit_price: 2500, amount: 2500 },
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
      const endpoint = isEditing ? `/invoices/${editingId}` : "/invoices";
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
        fetchInvoices();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save tax invoice.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    setPaymentError(null);
    setRecordingPayment(true);

    try {
      const payload = {
        amount: Number(paymentData.amount),
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        transaction_reference: paymentData.transaction_reference,
        notes: paymentData.notes,
      };

      const res = await api.request(`/invoices/${selectedInvoiceForPayment.id}/payments`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setPaymentModalOpen(false);
      setSelectedInvoiceForPayment(null);
      fetchInvoices();

      // If user had preview open for this invoice, update preview
      if (previewInvoice && previewInvoice.id === selectedInvoiceForPayment.id) {
        setPreviewInvoice(res.invoice);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPaymentError(err.message);
      } else {
        setPaymentError("Failed to record payment transaction.");
      }
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleStatusChange = async (inv: Invoice, newStatus: string) => {
    try {
      await api.request(`/invoices/${inv.id}/status`, {
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
      await api.request(`/invoices/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
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
      case "unpaid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200";
      case "cancelled":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className={`space-y-6 ${previewInvoice ? "print:hidden" : ""}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FileCheck className="w-6 h-6" />
            </span>
            Tax Invoices & Revenue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official GST-compliant tax invoices, payment records, and revenue tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/invoices/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tax Invoice</span>
          </Link>
        </div>
      </div>

      {/* Financial KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
              <p className="text-xl font-mono font-black text-slate-900 mt-1">
                ₹{Number(stats.total_invoiced_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stats.total_invoices} total invoices</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Collected</p>
              <p className="text-xl font-mono font-black text-emerald-700 mt-1">
                ₹{Number(stats.total_collected_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">{stats.paid} fully settled</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Outstanding Due</p>
              <p className="text-xl font-mono font-black text-amber-700 mt-1">
                ₹{Number(stats.total_outstanding_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">{stats.unpaid + stats.partially_paid} pending payments</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Overdue Alerts</p>
              <p className="text-xl font-black text-purple-900 mt-1">{stats.overdue || 0}</p>
              <p className="text-[11px] text-purple-600/80 mt-0.5">Exceeded due date</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
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
            placeholder="Search invoice number, client, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Tax Invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Tax Invoices Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Create your first GST invoice or convert an accepted proforma invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6 whitespace-nowrap min-w-[150px]">Invoice ID</th>
                  <th className="py-3.5 px-6 min-w-[180px]">Client / Company</th>
                  <th className="py-3.5 px-6 whitespace-nowrap min-w-[140px]">PI Reference</th>
                  <th className="py-3.5 px-6 whitespace-nowrap min-w-[160px]">Date / Due</th>
                  <th className="py-3.5 px-6 whitespace-nowrap min-w-[140px]">Total / Paid</th>
                  <th className="py-3.5 px-6 whitespace-nowrap min-w-[130px]">Due Balance</th>
                  <th className="py-3.5 px-6 whitespace-nowrap min-w-[130px]">Status</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-block whitespace-nowrap font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 text-sm">{inv.client_name}</p>
                      <p className="text-slate-500 text-[11px]">{inv.client_company || "Direct Client"}</p>
                      {inv.client_gstin && (
                        <p className="text-slate-400 font-mono text-[10px] whitespace-nowrap">GSTIN: {inv.client_gstin}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {inv.proforma_invoice ? (
                        <span className="inline-block whitespace-nowrap font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {inv.proforma_invoice.proforma_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Direct Invoice</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-medium text-slate-800">{formatDate(inv.invoice_date)}</span>
                        {inv.due_date && (
                          (() => {
                            const due = getDueDateStatus(inv.due_date);
                            return (
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${
                                inv.status === "paid" 
                                  ? "bg-slate-50 text-slate-400 border-slate-100" 
                                  : due.badgeClass
                              }`}>
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                <span>{inv.status === "paid" ? `Due was ${formatDate(inv.due_date)}` : due.label}</span>
                              </span>
                            );
                          })()
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        ₹{Number(inv.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="font-mono text-[11px] text-emerald-600">
                        Paid: ₹{Number(inv.paid_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-amber-700 text-sm">
                      ₹{Number(inv.due_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv, e.target.value)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border cursor-pointer focus:outline-none ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openRecordPaymentModal(inv)}
                          title="Record Client Payment"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-semibold text-[11px] cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Pay</span>
                        </button>
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          title="Preview & Print Document"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(inv)}
                          title="Edit Tax Invoice"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(inv)}
                          title="Delete Invoice"
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

      {/* Modal: Create / Edit Tax Invoice */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isEditing ? "Edit Tax Invoice" : "Generate Tax Invoice"}
                  </h2>
                  <p className="text-xs text-slate-500">GST-compliant tax invoice generation</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {formError}
                </div>
              )}

              {/* Basic Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="INV-2026-001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Client & Project Info */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client & Project Association
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Client Contact Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client Company / Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Infoway Technologies"
                      value={formData.client_company}
                      onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client GSTIN</label>
                    <input
                      type="text"
                      placeholder="e.g. 19AAACK1234F1Z8"
                      value={formData.client_gstin}
                      onChange={(e) => setFormData({ ...formData, client_gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client Email</label>
                    <input
                      type="email"
                      placeholder="client@company.com"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Billing Address</label>
                    <input
                      type="text"
                      placeholder="Office address, City, State, PIN"
                      value={formData.client_address}
                      onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Link with Project</label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">No Project Assigned</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name} ({proj.client_name || "Direct"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Itemized Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Tax Invoice Items (SAC 998314 - IT Consulting & Software Development)
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Item name / service"
                          value={item.item_name}
                          onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Optional description"
                          value={item.description || ""}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-100 rounded text-[11px] text-slate-500 mt-1 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="text"
                          placeholder="SAC"
                          value={item.sac_code || "998314"}
                          onChange={(e) => handleItemChange(idx, "sac_code", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          placeholder="Unit Rate"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-2 text-right">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={formData.items.length <= 1}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Total Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Discount Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_rate}
                      onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST Rate (%)</label>
                    <select
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                      className="w-48 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="18">18% (Standard IT Services)</option>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="0">0% (Exempt)</option>
                    </select>
                  </div>

                  {/* Reverse Target Total Calculation */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-blue-700 mb-1" title="Enter final budget to auto-calculate item rates backwards">
                      Target Final Amount (Inclusive):
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 280000"
                        value={formData.target_total}
                        onChange={(e) => handleTargetTotalChange(e.target.value)}
                        className="w-48 pl-6 pr-2 py-1.5 bg-blue-50/50 border border-blue-300 rounded-lg text-xs text-blue-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Type desired final total to auto-derive taxable rate &amp; GST backwards.
                    </p>
                  </div>

                  {/* Round Off Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="invoice-round-off"
                      checked={formData.is_round_off}
                      onChange={(e) => setFormData({ ...formData, is_round_off: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <label htmlFor="invoice-round-off" className="text-xs text-slate-600 font-medium cursor-pointer">
                      Round Off to Nearest Rupee
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{calcSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {Number(formData.discount_rate) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({formData.discount_rate}%):</span>
                      <span className="font-mono">-₹{calcDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({formData.tax_rate}%):</span>
                    <span className="font-mono">₹{calcTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {formData.is_round_off && calcRoundOff !== 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Round Off:</span>
                      <span className="font-mono font-semibold">
                        {calcRoundOff > 0 ? "+" : ""}₹{calcRoundOff.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                    <span>Total Tax Invoice Value:</span>
                    <span className="font-mono text-blue-700">₹{calcTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes & Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company Bank Details</label>
                  <textarea
                    rows={2}
                    value={formData.bank_details}
                    onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
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
                    <span>{isEditing ? "Update Invoice" : "Generate Tax Invoice"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Client Payment */}
      {paymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice #{selectedInvoiceForPayment.invoice_number}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-xs">
              {paymentError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600">
                  {paymentError}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Invoiced</span>
                  <p className="font-mono font-bold text-slate-800">
                    ₹{Number(selectedInvoiceForPayment.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining Due</span>
                  <p className="font-mono font-bold text-amber-700">
                    ₹{Number(selectedInvoiceForPayment.due_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Method</label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Corporate Card</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / UTR No.</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC12938192 / UTR2026110900"
                  value={paymentData.transaction_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Notes or milestone remarks"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {recordingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Corporate GST Tax Invoice Print & PDF Preview */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print-modal-overlay">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print-modal-container">
            {/* Top Toolbar */}
            <div className="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between shrink-0 print-modal-toolbar">
              <div className="flex items-center gap-2 text-xs font-medium">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>GST Tax Invoice: <strong className="font-mono text-white">{previewInvoice.invoice_number}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openRecordPaymentModal(previewInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
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
                  <p className="text-xs text-slate-400">
                    GSTIN: <strong className="text-slate-700 font-mono">19AABCK9876Q1Z2</strong>
                  </p>
                  <p className="text-xs text-slate-400">billing@kabhyan.com • www.kabhyan.com</p>
                </div>

                <div className="sm:text-right">
                  <span className="text-2xl font-black tracking-tight text-blue-900 uppercase block">
                    Tax Invoice
                  </span>
                  <p className="font-mono font-bold text-sm text-slate-700 mt-1">
                    #{previewInvoice.invoice_number}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: <strong className="text-slate-800">{formatDate(previewInvoice.invoice_date)}</strong>
                  </p>
                  {previewInvoice.due_date && (
                    <p className="text-xs text-slate-500">
                      Payment Due: <strong className="text-slate-800">{formatDate(previewInvoice.due_date)}</strong>
                    </p>
                  )}
                  {previewInvoice.proforma_invoice && (
                    <p className="text-xs text-purple-700 font-medium mt-0.5">
                      Proforma Ref: <span className="font-mono">{previewInvoice.proforma_invoice.proforma_number}</span>
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
                  {previewInvoice.client_gstin && (
                    <p className="text-slate-600 font-mono mt-0.5">
                      GSTIN: <strong>{previewInvoice.client_gstin}</strong>
                    </p>
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

                <div className="sm:text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Issued By:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">Kabhyan Technologies Private Limited</p>
                  <p className="text-slate-500">Salt Lake Sector V, Bidhannagar</p>
                  <p className="text-slate-500">Kolkata, West Bengal 700091, India</p>
                  <p className="text-slate-500 font-mono">State Code: 19 (West Bengal)</p>
                  <p className="text-slate-500 font-mono">PAN: AABCK9876Q</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5">#</th>
                      <th className="py-2.5">Description of Services</th>
                      <th className="py-2.5 text-center">SAC Code</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Rate</th>
                      <th className="py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3">
                          <p className="font-bold text-slate-800">{item.item_name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3 text-center font-mono text-slate-600">{item.sac_code || "998314"}</td>
                        <td className="py-3 text-center text-slate-700">
                          {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-700">
                          ₹{Number(item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-900">
                          ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Breakdown & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 pr-3 border-t border-slate-200 print-avoid-break">
                <div className="space-y-4 text-xs">
                  {previewInvoice.bank_details && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Bank Wire / Transfer Details
                      </span>
                      <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                        {previewInvoice.bank_details}
                      </pre>
                    </div>
                  )}

                  {/* Payment History Log */}
                  {previewInvoice.payments && previewInvoice.payments.length > 0 && (
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-2">
                        Payment Realization History
                      </span>
                      <div className="space-y-2">
                        {previewInvoice.payments.map((p) => (
                          <div key={p.id} className="flex justify-between items-center text-[11px] border-b border-emerald-100/60 pb-1">
                            <div>
                              <p className="font-semibold text-emerald-900 capitalize">{p.payment_method.replace("_", " ")}</p>
                              {p.transaction_reference && (
                                <p className="font-mono text-[10px] text-emerald-700">{p.transaction_reference}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-emerald-900">
                                ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-emerald-600">{p.payment_date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value (Subtotal):</span>
                    <span className="font-mono">
                      ₹{Number(previewInvoice.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {Number(previewInvoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({Number(previewInvoice.discount_rate)}%):</span>
                      <span className="font-mono">
                        -₹{Number(previewInvoice.discount_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {Number(previewInvoice.cgst_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>CGST ({Number(previewInvoice.cgst_rate)}%):</span>
                      <span className="font-mono">
                        ₹{Number(previewInvoice.cgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {Number(previewInvoice.sgst_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>SGST ({Number(previewInvoice.sgst_rate)}%):</span>
                      <span className="font-mono">
                        ₹{Number(previewInvoice.sgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {Number(previewInvoice.igst_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST ({Number(previewInvoice.igst_rate)}%):</span>
                      <span className="font-mono">
                        ₹{Number(previewInvoice.igst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {Number(previewInvoice.round_off ?? 0) !== 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Round Off:</span>
                      <span className="font-mono font-semibold">
                        {Number(previewInvoice.round_off) > 0 ? "+" : ""}₹{Number(previewInvoice.round_off).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-900 border-t-2 border-slate-900 pt-2 text-base">
                    <span>Total Tax Invoice:</span>
                    <span className="font-mono text-blue-900">
                      ₹{Number(previewInvoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Total Amount Received:</span>
                    <span className="font-mono">
                      ₹{Number(previewInvoice.paid_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-amber-700 font-bold border-t border-slate-100 pt-1">
                    <span>Balance Due:</span>
                    <span className="font-mono">
                      ₹{Number(previewInvoice.due_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Signatures */}
              <div className="pt-6 pr-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-500 print-avoid-break">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Terms & Conditions
                  </span>
                  <pre className="text-[11px] whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">
                    {previewInvoice.terms_and_conditions || "Standard corporate IT service terms apply."}
                  </pre>
                </div>

                <div className="flex flex-col justify-end items-start sm:items-end pt-6 sm:pt-0">
                  <div className="w-48 border-b border-slate-300 pb-1 mb-1 font-signature text-slate-700 font-semibold italic text-sm text-center">
                    Kabhyan Accounts Dept
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    For Kabhyan Technologies Pvt. Ltd. (Authorized Signatory)
                  </span>
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
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Tax Invoice</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <strong className="text-slate-900">{deleteConfirm.invoice_number}</strong>?
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

export default function InvoicesPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Invoices Workspace...</p>
          </div>
        }
      >
        <InvoicesContent />
      </Suspense>
    </AdminLayout>
  );
}

