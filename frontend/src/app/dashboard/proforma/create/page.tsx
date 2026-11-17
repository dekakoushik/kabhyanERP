"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Client, ProformaInvoiceItem, Project } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import DocumentItemsTable, { DELIVERABLE_PRESETS } from "@/components/DocumentItemsTable";
import QuickAddProjectModal from "@/components/QuickAddProjectModal";
import TermsPresetsChips from "@/components/TermsPresetsChips";
import DocumentPreviewDrawer from "@/components/DocumentPreviewDrawer";
import MobileCalculationDrawer from "@/components/MobileCalculationDrawer";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Building,
  Receipt,
  Calculator,
  Loader2,
  Sparkles,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CreateProformaPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Live Preview & Mobile Drawer States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);

  // Quick Add Client Modal State
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  // Quick Add Project Modal State
  const [quickAddProjectOpen, setQuickAddProjectOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    city: "Guwahati",
    state: "Assam",
    address: "",
  });

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
    tax_calculation_type: "exclusive" as "exclusive" | "inclusive",
    tax_rate: "18",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_rate: "0",
    discount_amount_input: "",
    round_off: 0,
    is_round_off: true,
    payment_terms: "100% advance payment requested prior to milestone sprint release.",
    notes: "Proforma Invoice issued for advance commercial processing and mobilization.",
    items: [
      {
        item_name: "",
        description: "",
        quantity: 1,
        unit: "phase",
        unit_price: 0,
        amount: 0,
      },
    ] as ProformaInvoiceItem[],
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
        console.error("Failed to fetch projects/clients:", err);
      }

      try {
        const numRes = await api.request("/settings/next-document-numbers");
        if (numRes?.numbers?.proforma) {
          setFormData((prev) => ({
            ...prev,
            proforma_number: numRes.numbers.proforma,
          }));
        }
      } catch (err) {
        setFormData((prev) => ({
          ...prev,
          proforma_number: `PI-${now.getFullYear()}-001`,
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
        city: "Guwahati",
        state: "Assam",
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

  // Recalculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const isFixedDiscount = formData.discount_type === "fixed";
  const rawDiscountInput = isFixedDiscount ? Number(formData.discount_amount_input) || 0 : Number(formData.discount_rate) || 0;

  const discountAmount = isFixedDiscount
    ? Math.min(rawDiscountInput, subtotal)
    : Number(((subtotal * Math.min(100, Math.max(0, rawDiscountInput))) / 100).toFixed(2));

  const effectiveDiscountRate = subtotal > 0
    ? Number(((discountAmount / subtotal) * 100).toFixed(2))
    : 0;

  const grossAfterDiscount = Math.max(0, subtotal - discountAmount);
  const activeTaxRate = Number(formData.tax_rate) || 0;
  const isTaxInclusive = formData.tax_calculation_type === "inclusive";

  // Multi-rate statutory GST calculation per item
  let computedTaxable = 0;
  let computedTax = 0;

  formData.items.forEach((item) => {
    const itemSubtotal = Number(item.amount) || 0;
    const lineDiscount = subtotal > 0 ? (itemSubtotal / subtotal) * discountAmount : 0;
    const lineAfterDiscount = Math.max(0, itemSubtotal - lineDiscount);
    const lineTaxRate =
      item.tax_rate !== undefined && item.tax_rate !== null && item.tax_rate !== ""
        ? Number(item.tax_rate)
        : activeTaxRate;

    if (isTaxInclusive) {
      const lineTaxable =
        lineTaxRate > 0
          ? Number((lineAfterDiscount / (1 + lineTaxRate / 100)).toFixed(2))
          : lineAfterDiscount;
      const lineTax = Number((lineAfterDiscount - lineTaxable).toFixed(2));
      computedTaxable += lineTaxable;
      computedTax += lineTax;
    } else {
      const lineTaxable = lineAfterDiscount;
      const lineTax = Number(((lineTaxable * lineTaxRate) / 100).toFixed(2));
      computedTaxable += lineTaxable;
      computedTax += lineTax;
    }
  });

  const taxableAmount = Number(computedTaxable.toFixed(2));
  const taxAmount = Number(computedTax.toFixed(2));

  const rawTotal = isTaxInclusive ? grossAfterDiscount : taxableAmount + taxAmount;
  const grandTotal = formData.is_round_off ? Math.round(rawTotal) : rawTotal;
  const roundOffAmount = formData.is_round_off ? Number((grandTotal - rawTotal).toFixed(2)) : 0;

  const handleItemChange = (index: number, field: keyof ProformaInvoiceItem, value: any) => {
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
          unit: "phase",
          unit_price: 0,
          amount: 0,
        },
      ],
    });
  };

  const duplicateItem = (index: number) => {
    const itemToCopy = formData.items[index];
    if (!itemToCopy) return;
    const newItems = [...formData.items];
    newItems.splice(index + 1, 0, { ...itemToCopy });
    setFormData({ ...formData, items: newItems });
    toast.success("Line item duplicated");
  };

  const addPresetItem = (preset: typeof DELIVERABLE_PRESETS[0]) => {
    const lastIndex = formData.items.length - 1;
    const lastItem = formData.items[lastIndex];
    const isBlank = lastItem && !lastItem.item_name && (!lastItem.unit_price || Number(lastItem.unit_price) === 0);

    const newItem: ProformaInvoiceItem = {
      item_name: preset.name,
      description: preset.description,
      quantity: preset.quantity,
      unit: preset.unit,
      unit_price: preset.unit_price,
      amount: preset.quantity * preset.unit_price,
    };

    if (isBlank) {
      const updated = [...formData.items];
      updated[lastIndex] = newItem;
      setFormData({ ...formData, items: updated });
    } else {
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }
    toast.success(`Inserted preset: ${preset.name}`);
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleReorderItems = (startIndex: number, endIndex: number) => {
    setFormData((prev) => {
      const nextItems = Array.from(prev.items);
      const [moved] = nextItems.splice(startIndex, 1);
      nextItems.splice(endIndex, 0, moved);
      return { ...prev, items: nextItems };
    });
  };

  const handleAppendTerm = (termText: string) => {
    setFormData((prev) => ({
      ...prev,
      payment_terms: prev.payment_terms
        ? `${prev.payment_terms.trim()}\n\n${termText}`
        : termText,
    }));
    toast.success("Appended advance terms clause");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      if (!selectedClientId || !formData.client_name) {
        throw new Error("Please select a client from the directory or quick-register one");
      }
      if (!formData.proforma_number) {
        throw new Error("Proforma invoice number is required");
      }
      if (!formData.items || formData.items.length === 0 || !formData.items.some((it) => it.item_name?.trim())) {
        throw new Error("Please add at least one line item with a title");
      }

      const payload = {
        proforma_number: formData.proforma_number?.trim() || null,
        estimate_id: (formData as any).estimate_id ? Number((formData as any).estimate_id) : null,
        project_id: formData.project_id && String(formData.project_id).trim() !== "" ? Number(formData.project_id) : null,
        client_name: formData.client_name,
        client_company: formData.client_company || null,
        client_email: formData.client_email && formData.client_email.trim() !== "" ? formData.client_email.trim() : null,
        client_phone: formData.client_phone || null,
        client_address: formData.client_address || null,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        status: formData.status || "unpaid",
        currency: formData.currency || "INR",
        tax_calculation_type: formData.tax_calculation_type || "exclusive",
        tax_rate: Number(formData.tax_rate) || 0,
        discount_type: formData.discount_type || "percentage",
        discount_rate: effectiveDiscountRate,
        discount_amount: discountAmount,
        round_off: roundOffAmount,
        paid_amount: Number((formData as any).paid_amount) || 0,
        notes: formData.notes || null,
        terms_and_conditions: formData.payment_terms || null,
        bank_details: (formData as any).bank_details || null,
        items: formData.items
          .filter((it) => it.item_name && it.item_name.trim() !== "")
          .map((it) => ({
            item_name: it.item_name.trim(),
            description: it.description?.trim() || null,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || "hours",
            unit_price: Number(it.unit_price) || 0,
            tax_rate: it.tax_rate !== undefined && it.tax_rate !== null && it.tax_rate !== "" ? Number(it.tax_rate) : null,
          })),
      };

      await api.request("/proforma-invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Proforma Invoice saved successfully!");
      router.push("/dashboard/proforma");
    } catch (err: any) {
      const msg = err.message || "Failed to create proforma invoice";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-12 font-sans">
        {/* Top Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/proforma"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Generate Proforma Invoice
                </h1>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {formData.proforma_number || "PI-DRAFT"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Draft an advance commercial invoice for project retainers, phase deposits, and mobilization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Preview Sheet</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/proforma")}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Proforma
                </>
              )}
            </Button>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium animate-in fade-in">
            {formError}
          </div>
        )}

        {/* Two-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form Fields (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Client & Commercial Entity (Primary Focus) */}
            <ClientSnapshotCard
              clients={clients}
              selectedClient={clients.find((c) => c.id === selectedClientId) || null}
              onSelectClient={handleSelectClient}
              onOpenQuickAdd={() => setQuickAddOpen(true)}
              title="Client & Commercial Entity"
              subtitle="Select an existing client to auto-load billing coordinates, GSTIN, and tax residency"
              required={true}
            />

            {/* 2. Secondary Document Metadata Toolbar (Collapsible / Compact) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setMetadataExpanded(!metadataExpanded)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Proforma Document Parameters & Project Linkage
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    ({formData.proforma_number} • {formData.currency} • {formData.status.toUpperCase()})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                  <span>{metadataExpanded ? "Collapse" : "Edit Details"}</span>
                  {metadataExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {metadataExpanded && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs animate-in fade-in duration-150">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Proforma Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.proforma_number}
                      onChange={(e) => setFormData({ ...formData, proforma_number: e.target.value })}
                      required
                      className="h-9 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        Link to Project
                      </label>
                      <button
                        type="button"
                        onClick={() => setQuickAddProjectOpen(true)}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Quick Add</span>
                      </button>
                    </div>
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
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
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      required
                      className="h-9 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                      className="h-9 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                      Initial Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="unpaid">Unpaid (Awaiting Advance)</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 3. High-Velocity Deliverables Ledger 2.0 */}
            <DocumentItemsTable
              items={formData.items}
              currency={formData.currency}
              taxRate={formData.tax_rate}
              taxCalculationType={formData.tax_calculation_type}
              title="Deliverables & Services Ledger"
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onDuplicateItem={duplicateItem}
              onAddPresetItem={addPresetItem}
              onRemoveItem={removeItem}
              onReorderItems={handleReorderItems}
            />

            {/* 4. Terms of Engagement & Client Notes */}
            <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Advance Payment Terms & Notes</span>
                  <span className="text-2xs text-slate-400 font-normal">Appears on Proforma PDF</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Notes for Client
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Advance commercial note, bank transfer instructions, or reference details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-2xs font-bold uppercase tracking-wider text-slate-600">
                      Payment Terms & Bank Coordinates
                    </label>
                  </div>

                  {/* Standard Proforma Terms Preset Chips */}
                  <TermsPresetsChips
                    documentType="proforma"
                    onSelectTerm={handleAppendTerm}
                  />

                  <textarea
                    rows={3}
                    placeholder="Advance payment requirements, NEFT/RTGS bank coordinates, milestone releases..."
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky 4-Tier Commercial Settlement Console (4 Columns) */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <Card className="rounded-2xl border-blue-200/90 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-blue-50/50">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span>Commercial Summary</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase font-semibold">
                    {formData.currency}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {/* 1. Tax Treatment: Exclusive vs Inclusive */}
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tax Mode</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {isTaxInclusive ? "GST Included" : "GST Added on Top"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tax_calculation_type: "exclusive" }))}
                      className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        !isTaxInclusive
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Exclusive (+GST)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tax_calculation_type: "inclusive" }))}
                      className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        isTaxInclusive
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Inclusive (Incl. GST)
                    </button>
                  </div>
                </div>

                {/* 2. Subtotal */}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Deliverables Turnover {isTaxInclusive ? "(Gross)" : "(Net)"}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 3. Discount Controls */}
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Discount</span>
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, discount_type: "percentage" }))}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                          !isFixedDiscount ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        % Percent
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, discount_type: "fixed" }))}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                          isFixedDiscount ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        ₹ Flat
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {!isFixedDiscount ? (
                        <div className="relative inline-flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="0"
                            value={formData.discount_rate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, discount_rate: e.target.value }))}
                            className="w-16 h-7 text-right pr-5 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="absolute right-1.5 text-xs font-medium text-slate-400 select-none">%</span>
                        </div>
                      ) : (
                        <div className="relative inline-flex items-center">
                          <span className="absolute left-2 text-xs font-medium text-slate-400 select-none">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={formData.discount_amount_input}
                            onChange={(e) => setFormData((prev) => ({ ...prev, discount_amount_input: e.target.value }))}
                            className="w-24 h-7 text-right pl-5 pr-2 text-xs font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      {discountAmount > 0 && isFixedDiscount && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {effectiveDiscountRate}% off
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      -₹{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* 4. Taxable Base if Inclusive */}
                {isTaxInclusive && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-500">Taxable Turnover</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* 5. GST Rate & Amount */}
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    GST Rate (%)
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tax_rate: e.target.value }))}
                      className="w-12 h-6 text-center text-xs border border-slate-200 rounded px-1 font-bold"
                    />
                  </span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {isTaxInclusive ? "Incl. " : "+"}₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 6. Round Off Adjustment */}
                <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_round_off}
                      onChange={(e) => setFormData((prev) => ({ ...prev, is_round_off: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Round Off Adjustment</span>
                  </label>
                  <span className="font-mono text-slate-500">
                    {roundOffAmount >= 0 ? `+₹${roundOffAmount}` : `-₹${Math.abs(roundOffAmount)}`}
                  </span>
                </div>

                {/* 7. Total Payable Amount */}
                <div className="p-3.5 rounded-xl bg-blue-600 text-white flex justify-between items-center shadow-md">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                      Total Advance Payable
                    </p>
                    <p className="text-lg font-mono font-bold mt-0.5">
                      ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Sparkles className="w-6 h-6 text-blue-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-semibold shadow-xs cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Proforma Invoice
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-2 text-slate-500" />
                Preview Proforma Sheet
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Action Bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-3 lg:hidden pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div
            onClick={() => setMobileDrawerOpen(true)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Total ({formData.currency})</span>
              <span className="text-blue-600 font-bold underline text-2xs">Breakdown ^</span>
            </div>
            <p className="font-mono text-base font-black text-slate-900 leading-tight">
              ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="h-11 px-3 text-xs border-slate-200 font-semibold"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Proforma</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Live Document Preview Drawer */}
      <DocumentPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentType="Proforma Invoice"
        documentNumber={formData.proforma_number}
        issueDate={formData.invoice_date}
        dueDate={formData.due_date}
        clientName={formData.client_name}
        clientCompany={formData.client_company}
        clientEmail={formData.client_email}
        clientPhone={formData.client_phone}
        clientAddress={formData.client_address}
        currency={formData.currency}
        items={formData.items}
        subtotal={subtotal}
        discountType={formData.discount_type}
        discountAmount={discountAmount}
        discountRate={effectiveDiscountRate}
        taxCalculationType={formData.tax_calculation_type}
        taxRate={activeTaxRate}
        taxAmount={taxAmount}
        roundOff={roundOffAmount}
        grandTotal={grandTotal}
        notes={formData.notes}
        termsAndConditions={formData.payment_terms}
        onConfirmSave={handleSubmit}
      />

      {/* Mobile Swipe-Up Financial Settlement Drawer */}
      <MobileCalculationDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currency={formData.currency}
        subtotal={subtotal}
        discountType={formData.discount_type}
        discountAmount={discountAmount}
        discountRate={effectiveDiscountRate}
        effectiveDiscountRate={effectiveDiscountRate}
        discountAmountInput={formData.discount_amount_input}
        onChangeDiscountType={(t) => setFormData((prev) => ({ ...prev, discount_type: t }))}
        onChangeDiscountRate={(r) => setFormData((prev) => ({ ...prev, discount_rate: r }))}
        onChangeDiscountAmountInput={(a) => setFormData((prev) => ({ ...prev, discount_amount_input: a }))}
        taxCalculationType={formData.tax_calculation_type}
        onChangeTaxMode={(m) => setFormData((prev) => ({ ...prev, tax_calculation_type: m }))}
        taxRate={formData.tax_rate}
        onChangeTaxRate={(r) => setFormData((prev) => ({ ...prev, tax_rate: r }))}
        taxableAmount={taxableAmount}
        taxAmount={taxAmount}
        isRoundOff={formData.is_round_off}
        onChangeRoundOff={(c) => setFormData((prev) => ({ ...prev, is_round_off: c }))}
        roundOffAmount={roundOffAmount}
        grandTotal={grandTotal}
      />

      {/* QUICK ADD CLIENT MODAL */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Quick Register Corporate Client
                  </h3>
                  <p className="text-2xs text-slate-400">
                    Creates profile and links it to this proforma invoice immediately
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddClient} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Company / Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech Innovations Pvt Ltd"
                  value={quickAddData.company_name}
                  onChange={(e) => setQuickAddData({ ...quickAddData, company_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajat Sharma"
                  value={quickAddData.name}
                  onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@acme.com"
                    value={quickAddData.email}
                    onChange={(e) => setQuickAddData({ ...quickAddData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none font-medium"
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Guwahati"
                    value={quickAddData.city}
                    onChange={(e) => setQuickAddData({ ...quickAddData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Assam"
                    value={quickAddData.state}
                    onChange={(e) => setQuickAddData({ ...quickAddData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none font-medium"
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none font-medium"
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

      {/* Quick Add Project Modal */}
      <QuickAddProjectModal
        open={quickAddProjectOpen}
        onClose={() => setQuickAddProjectOpen(false)}
        clientId={selectedClientId}
        clientName={formData.client_company || formData.client_name || undefined}
        defaultBudget={grandTotal > 0 ? grandTotal : undefined}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setFormData((prev) => ({ ...prev, project_id: String(newProj.id) }));
        }}
      />
    </AdminLayout>
  );
}
