"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Client, InvoiceItem, Project } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientCombobox from "@/components/ClientCombobox";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Building,
  User,
  Mail,
  Phone,
  FileCheck,
  Calculator,
  Loader2,
  Sparkles,
  Receipt,
  ShieldCheck,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CreateInvoicePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Add Client Modal State
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    tax_number: "",
    city: "Kolkata",
    state: "West Bengal",
    address: "",
  });

  const [formData, setFormData] = useState({
    invoice_number: "INV-2026-001",
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
    payment_terms: "Payment due within 15 days of invoice date.",
    notes: "Thank you for your business. Please quote the invoice number when making payment.",
    items: [
      {
        item_name: "Enterprise Architecture & Microservices Implementation",
        description: "Core backend architecture, Sanctum tokens & PostgreSQL database design",
        quantity: 50,
        unit: "hours",
        unit_price: 2500,
        amount: 125000,
      },
      {
        item_name: "Corporate Portal Frontend with Next.js",
        description: "Full-page administrative views, ShadCN components, Google Sans typography",
        quantity: 75,
        unit: "hours",
        unit_price: 2000,
        amount: 150000,
      },
    ] as InvoiceItem[],
  });

  useEffect(() => {
    const now = new Date();
    const due = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      invoice_date: now.toISOString().split("T")[0],
      due_date: due.toISOString().split("T")[0],
    }));

    const initData = async () => {
      try {
        const [projRes, cliRes] = await Promise.all([
          api.request("/projects?per_page=100"),
          api.request("/clients?per_page=100"),
        ]);
        setProjects(projRes.projects?.data || projRes.data || []);
        setClients(cliRes.clients?.data || cliRes.data || []);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }

      try {
        const numRes = await api.request("/settings/next-document-numbers");
        if (numRes?.numbers?.invoice) {
          setFormData((prev) => ({
            ...prev,
            invoice_number: numRes.numbers.invoice,
          }));
        }
      } catch (err) {
        setFormData((prev) => ({
          ...prev,
          invoice_number: `INV-${now.getFullYear()}-001`,
        }));
      }
    };
    initData();
  }, []);

  // Client Selection Handler
  const handleSelectClient = (client: Client | null) => {
    if (!client) {
      setSelectedClientId(null);
      setFormData((prev) => ({
        ...prev,
        client_name: "",
        client_company: "",
        client_gstin: "",
        client_email: "",
        client_phone: "",
        client_address: "",
      }));
      return;
    }

    setSelectedClientId(client.id);

    const addressParts = [
      client.address,
      client.city,
      client.state,
      client.postal_code,
      client.country,
    ].filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      client_name: client.name || client.company_name,
      client_company: client.company_name || "",
      client_gstin: client.gstin || "",
      client_email: client.email || "",
      client_phone: client.phone || "",
      client_address: addressParts.join(", "),
      currency: client.currency || prev.currency,
    }));

    toast.success(`Loaded details for ${client.company_name}`);
  };

  // Quick Client Registration
  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddData.company_name.trim() || !quickAddData.name.trim()) {
      toast.error("Please provide company name and contact person");
      return;
    }

    try {
      setQuickAddSaving(true);
      const res = await api.request("/clients", {
        method: "POST",
        body: JSON.stringify({
          ...quickAddData,
          currency: formData.currency || "INR",
          portal_access_status: "active",
        }),
      });

      const newClient: Client = res.client;
      setClients((prev) => [newClient, ...prev]);
      handleSelectClient(newClient);
      setQuickAddOpen(false);
      setQuickAddData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        tax_number: "",
        city: "Kolkata",
        state: "West Bengal",
        address: "",
      });
      toast.success(`Client ${newClient.company_name} registered successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register client";
      toast.error(msg);
    } finally {
      setQuickAddSaving(false);
    }
  };

  // Calculations
  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const discountAmount = subtotal * (Number(formData.discount_rate) / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (Number(formData.tax_rate) / 100);
  const rawTotal = taxableAmount + taxAmount;
  const grandTotal = formData.is_round_off ? Math.round(rawTotal) : rawTotal;
  const roundOffAmount = formData.is_round_off ? Number((grandTotal - rawTotal).toFixed(2)) : 0;

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...formData.items];
    const item = { ...updated[index], [field]: value };

    if (field === "quantity" || field === "unit_price") {
      const q = field === "quantity" ? Number(value) : Number(item.quantity);
      const p = field === "unit_price" ? Number(value) : Number(item.unit_price);
      item.amount = (q || 0) * (p || 0);
    }

    updated[index] = item;
    setFormData({ ...formData, items: updated });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_name: "",
          description: "",
          quantity: 1,
          unit: "hours",
          unit_price: 0,
          amount: 0,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      if (!formData.client_name || !formData.invoice_number) {
        throw new Error("Client name and invoice number are required");
      }

      await api.request("/invoices", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          round_off: roundOffAmount,
          total: grandTotal,
        }),
      });

      router.push("/dashboard/invoices");
    } catch (err: any) {
      setFormError(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/invoices"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Issue Tax Invoice
              </h1>
              <p className="text-xs text-slate-500">
                Generate an official GST-compliant tax invoice with automatic tax calculations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/invoices")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save & Issue Invoice
                </>
              )}
            </Button>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {formError}
          </div>
        )}

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Identification Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Tax Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Link to Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- No Direct Project Link --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Payment Due Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* 2. Client & GST Details (Replaced with Auto-Fetch ClientSnapshotCard) */}
            <ClientSnapshotCard
              clients={clients}
              selectedClient={clients.find((c) => c.id === selectedClientId) || null}
              onSelectClient={handleSelectClient}
              onOpenQuickAdd={() => setQuickAddOpen(true)}
              title="Client & GST Information"
              subtitle="Select an existing client to auto-populate company, billing, and GST details"
              required={true}
            />

            {/* 3. Items Table */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  Line Items & Billable Deliverables
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Line Item
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {/* Column Headings for Large Screens */}
                <div className="hidden lg:grid grid-cols-12 gap-3 px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <div className="col-span-5">Service / Line Item Description</div>
                  <div className="col-span-2 text-center">Qty & Units</div>
                  <div className="col-span-2 text-right">Unit Rate ({formData.currency})</div>
                  <div className="col-span-3 text-right">Taxable & GST ({formData.tax_rate}%)</div>
                </div>

                {formData.items.map((item, idx) => {
                  const itemTaxable = Number(item.amount) || 0;
                  const itemGst = itemTaxable * (Number(formData.tax_rate) / 100);
                  const itemGross = itemTaxable + itemGst;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                        {/* Title */}
                        <div className="lg:col-span-5">
                          <label className="block lg:hidden text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Service / Item Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="Description / Service Name"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                            required
                            className="bg-white"
                          />
                        </div>

                        {/* Qty & Unit */}
                        <div className="lg:col-span-2">
                          <label className="block lg:hidden text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Quantity & Unit
                          </label>
                          <div className="flex gap-1.5">
                            <Input
                              type="number"
                              placeholder="Qty"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                              required
                              className="bg-white text-center font-mono"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                              className="w-20 h-9 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-600"
                            >
                              <option value="hours">hrs</option>
                              <option value="days">days</option>
                              <option value="units">units</option>
                              <option value="milestone">mile</option>
                              <option value="months">mos</option>
                            </select>
                          </div>
                        </div>

                        {/* Rate */}
                        <div className="lg:col-span-2">
                          <label className="block lg:hidden text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Unit Rate
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="Rate"
                              min="0"
                              step="any"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                              required
                              className="bg-white font-mono text-right pr-2"
                            />
                          </div>
                        </div>

                        {/* Taxable & Per-Item GST Breakdown */}
                        <div className="lg:col-span-3 flex items-center justify-between gap-3 bg-white/80 p-2 rounded-lg border border-slate-200/70">
                          <div className="text-right flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-slate-500 font-medium">Taxable:</span>
                              <span className="font-mono font-semibold text-slate-800">
                                ₹{itemTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1 text-[10px] text-blue-600">
                              <span className="font-medium">+ GST ({formData.tax_rate}%):</span>
                              <span className="font-mono font-bold">
                                ₹{itemGst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1 text-[11px] pt-1 mt-0.5 border-t border-slate-100 font-bold text-slate-900">
                              <span className="text-[10px] text-slate-600 uppercase">Total:</span>
                              <span className="font-mono text-emerald-700">
                                ₹{itemGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scope Description */}
                      <div>
                        <Input
                          placeholder="Detailed deliverables scope..."
                          value={item.description || ""}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="text-xs text-slate-600 bg-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 4. Payment Terms & Notes */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold">Payment Terms & Instructions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Payment Terms
                  </label>
                  <textarea
                    rows={2}
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Notes to Recipient
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Summary Card (4 Columns) */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <Card className="border-blue-200/80 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-blue-50/40 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Invoice Total & GST</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white uppercase font-bold">
                    {formData.currency}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Taxable Subtotal</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    Discount (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_rate}
                      onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                      className="w-12 h-6 text-center text-xs border border-slate-200 rounded px-1"
                    />
                  </span>
                  <span className="font-mono text-red-600">
                    -₹{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    GST Rate (%)
                    <input
                      type="number"
                      min="0"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                      className="w-12 h-6 text-center text-xs border border-slate-200 rounded px-1"
                    />
                  </span>
                  <span className="font-mono text-slate-900 font-semibold">
                    +₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_round_off}
                      onChange={(e) => setFormData({ ...formData, is_round_off: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Round Off</span>
                  </label>
                  <span className="font-mono text-slate-500">
                    {roundOffAmount >= 0 ? `+₹${roundOffAmount}` : `-₹${Math.abs(roundOffAmount)}`}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-blue-600 text-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Total Invoice Amount
                    </p>
                    <p className="text-xl font-mono font-black mt-0.5">
                      ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Sparkles className="w-6 h-6 text-blue-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-medium shadow-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Issue Invoice
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/invoices")}
                className="w-full"
              >
                Return to Invoices
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Add Client Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add New Enterprise Client</h3>
                  <p className="text-2xs text-slate-500">Quick-register client & auto-populate into this invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddClient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Innovations Corp"
                    value={quickAddData.company_name}
                    onChange={(e) => setQuickAddData({ ...quickAddData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Vance"
                    value={quickAddData.name}
                    onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="finance@acme.com"
                    value={quickAddData.email}
                    onChange={(e) => setQuickAddData({ ...quickAddData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={quickAddData.phone}
                    onChange={(e) => setQuickAddData({ ...quickAddData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="18AABCU9603R1ZM"
                    value={quickAddData.tax_number}
                    onChange={(e) => setQuickAddData({ ...quickAddData, tax_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Kolkata"
                    value={quickAddData.city}
                    onChange={(e) => setQuickAddData({ ...quickAddData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="West Bengal"
                    value={quickAddData.state}
                    onChange={(e) => setQuickAddData({ ...quickAddData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  placeholder="Street / Tech Park / Suite"
                  value={quickAddData.address}
                  onChange={(e) => setQuickAddData({ ...quickAddData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {quickAddSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register & Auto-Fill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

