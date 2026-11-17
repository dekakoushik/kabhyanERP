"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Client, Invoice, InvoiceItem, Project } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import DocumentItemsTable from "@/components/DocumentItemsTable";
import QuickAddProjectModal from "@/components/QuickAddProjectModal";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Save,
  Building,
  Receipt,
  Loader2,
  Sparkles,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const identifier = resolvedParams.id;
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    city: "Kolkata",
    state: "West Bengal",
    address: "",
  });

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
    tax_calculation_type: "exclusive" as "exclusive" | "inclusive",
    tax_rate: "18",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_rate: "0",
    discount_amount_input: "",
    round_off: 0,
    is_round_off: true,
    payment_terms: "",
    notes: "",
    terms_and_conditions: "",
    bank_details: "",
    items: [] as InvoiceItem[],
  });

  useEffect(() => {
    const loadAll = async () => {
      try {
        setInitialLoading(true);
        const [projRes, cliRes, invRes] = await Promise.all([
          api.request("/projects?per_page=100"),
          api.request("/clients?per_page=100"),
          api.request(`/invoices/${identifier}`),
        ]);

        const loadedProjects: Project[] = projRes.projects?.data || projRes.data || [];
        const loadedClients: Client[] = cliRes.clients?.data || cliRes.data || [];
        setProjects(loadedProjects);
        setClients(loadedClients);

        if (!invRes?.invoice) {
          throw new Error("Tax invoice not found.");
        }

        const inv = invRes.invoice as Invoice;
        setInvoice(inv);

        // Match or synthesize client
        const matched = loadedClients.find(
          (c) =>
            (inv.client_email && c.email?.toLowerCase() === inv.client_email.toLowerCase()) ||
            (inv.client_company && c.company_name?.toLowerCase() === inv.client_company.toLowerCase()) ||
            (c.name?.toLowerCase() === inv.client_name?.toLowerCase())
        );

        if (matched) {
          setSelectedClientId(matched.id);
        } else {
          const synthClient: Client = {
            id: -inv.id,
            client_code: `CLI-${inv.id}`,
            name: inv.client_name,
            company_name: inv.client_company || inv.client_name,
            email: inv.client_email || "",
            phone: inv.client_phone || "",
            address: inv.client_address || "",
            gstin: inv.client_gstin || "19AAECK4829K1ZX",
            city: "Kolkata",
            state: "West Bengal",
            portal_access_status: "active",
          };
          setClients((prev) => [synthClient, ...prev]);
          setSelectedClientId(synthClient.id);
        }

        setFormData({
          invoice_number: inv.invoice_number,
          project_id: inv.project_id ? String(inv.project_id) : "",
          client_name: inv.client_name,
          client_company: inv.client_company || "",
          client_gstin: inv.client_gstin || "19AAECK4829K1ZX",
          client_email: inv.client_email || "",
          client_phone: inv.client_phone || "",
          client_address: inv.client_address || "",
          invoice_date: inv.invoice_date ? inv.invoice_date.split("T")[0] : "",
          due_date: inv.due_date ? inv.due_date.split("T")[0] : "",
          status: inv.status || "unpaid",
          currency: inv.currency || "INR",
          tax_calculation_type: ((inv as any).tax_calculation_type as "exclusive" | "inclusive") || "exclusive",
          tax_rate: inv.tax_rate !== undefined ? String(inv.tax_rate) : "18",
          discount_type: ((inv as any).discount_type as "percentage" | "fixed") || "percentage",
          discount_rate: inv.discount_rate !== undefined ? String(inv.discount_rate) : "0",
          discount_amount_input: (inv as any).discount_amount !== undefined ? String((inv as any).discount_amount) : "",
          round_off: Number(inv.round_off) || 0,
          is_round_off: (Number(inv.round_off) || 0) !== 0 || true,
          payment_terms: inv.terms_and_conditions || "Payment due within 15 days of invoice date.",
          notes: inv.notes || "",
          terms_and_conditions: inv.terms_and_conditions || "",
          bank_details: inv.bank_details || "",
          items:
            inv.items && inv.items.length > 0
              ? inv.items.map((i) => ({
                  id: i.id,
                  item_name: i.item_name,
                  description: i.description || "",
                  sac_code: i.sac_code || "998314",
                  quantity: Number(i.quantity) || 1,
                  unit: i.unit || "hours",
                  unit_price: Number(i.unit_price) || 0,
                  amount: Number(i.amount) || 0,
                }))
              : [
                  {
                    item_name: "Enterprise Architecture & Engineering",
                    description: "",
                    quantity: 1,
                    unit: "units",
                    unit_price: 10000,
                    amount: 10000,
                  },
                ],
        });
      } catch (err: any) {
        console.error("Failed to load invoice details:", err);
        setLoadError(err.message || "Failed to load tax invoice.");
      } finally {
        setInitialLoading(false);
      }
    };

    loadAll();
  }, [identifier]);

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
      client_gstin: client.tax_number || client.gstin || "19AAECK4829K1ZX",
      client_email: client.email || "",
      client_phone: client.phone || "",
      client_address: addressParts.join(", "),
      currency: client.currency || prev.currency,
    }));
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

  // Line Item Handlers
  const handleItemChange = (index: number, field: string, value: any) => {
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

  const handleReorderItems = (startIndex: number, endIndex: number) => {
    setFormData((prev) => {
      const nextItems = Array.from(prev.items);
      const [moved] = nextItems.splice(startIndex, 1);
      nextItems.splice(endIndex, 0, moved);
      return { ...prev, items: nextItems };
    });
  };

  // Calculations
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

  const taxableAmount = isTaxInclusive
    ? (activeTaxRate > 0 ? Number((grossAfterDiscount / (1 + activeTaxRate / 100)).toFixed(2)) : grossAfterDiscount)
    : grossAfterDiscount;

  const taxAmount = isTaxInclusive
    ? Number((grossAfterDiscount - taxableAmount).toFixed(2))
    : Number(((taxableAmount * (activeTaxRate / 100))).toFixed(2));

  const rawTotal = isTaxInclusive ? grossAfterDiscount : taxableAmount + taxAmount;
  const grandTotal = formData.is_round_off ? Math.round(rawTotal) : rawTotal;
  const roundOffAmount = formData.is_round_off ? Number((grandTotal - rawTotal).toFixed(2)) : 0;

  // Submit Handler (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setFormError(null);
    setSaving(true);

    try {
      if (!formData.client_name || !formData.invoice_number) {
        throw new Error("Client name and invoice number are required");
      }

      await api.request(`/invoices/${invoice.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          tax_calculation_type: formData.tax_calculation_type,
          discount_type: formData.discount_type,
          discount_rate: effectiveDiscountRate,
          discount_amount: discountAmount,
          subtotal,
          tax_amount: taxAmount,
          round_off: roundOffAmount,
          total: grandTotal,
        }),
      });

      toast.success(`Tax Invoice ${formData.invoice_number} updated successfully!`);
      router.push(`/dashboard/invoices/${formData.invoice_number}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to update tax invoice");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading tax invoice details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (loadError || !invoice) {
    return (
      <AdminLayout>
        <div className="py-20 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Tax Invoice Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{loadError || "The requested tax invoice could not be found."}</p>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices List</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 font-sans">
        {/* Top Header & Breadcrumb */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
            <span>/</span>
            <Link href="/dashboard/invoices" className="hover:text-slate-800 transition">Tax Invoices</Link>
            <span>/</span>
            <Link href={`/dashboard/invoices/${invoice.invoice_number}`} className="hover:text-blue-700 font-mono font-semibold transition">
              {invoice.invoice_number}
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Edit</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/invoices/${invoice.invoice_number}`}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
                title="Cancel and return to document"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
                    <FileCheck className="w-5 h-5" />
                  </span>
                  <span>Edit Tax Invoice</span>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    {invoice.invoice_number}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Modify billable items, customer info, or payment terms.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/invoices/${invoice.invoice_number}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {formError}
          </div>
        )}

        {/* Two-Column Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Identification Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Invoice# <span className="text-red-500">*</span>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Link to Project</label>
                    <button
                      type="button"
                      onClick={() => setQuickAddProjectOpen(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Quick Add</span>
                    </button>
                  </div>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* 2. Customer / Bill To Card */}
            <ClientSnapshotCard
              clients={clients}
              selectedClient={clients.find((c) => c.id === selectedClientId) || null}
              onSelectClient={handleSelectClient}
              onOpenQuickAdd={() => setQuickAddOpen(true)}
              title="Bill To"
              subtitle="Select a customer or add a new one to auto-populate billing and tax details"
              required={true}
            />

            {/* 3. Deliverables & Items Table */}
            <DocumentItemsTable
              items={formData.items}
              currency={formData.currency}
              taxRate={formData.tax_rate}
              taxCalculationType={formData.tax_calculation_type}
              title="Item Table"
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onReorderItems={handleReorderItems}
            />

            {/* 4. Payment Terms & Customer Notes */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold">Payment Terms & Notes</CardTitle>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Notes</label>
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

          {/* Sticky Financial Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-blue-50/40 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Invoice Summary</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white uppercase font-bold">
                    {formData.currency}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {/* 1. Tax Treatment: Exclusive vs Inclusive */}
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tax Mode</span>
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {isTaxInclusive ? "GST Included" : "GST Added on Top"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tax_calculation_type: "exclusive" }))}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isTaxInclusive
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Inclusive (Incl. GST)
                    </button>
                  </div>
                </div>

                {/* 2. Sub Total */}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Sub Total {isTaxInclusive ? "(Gross)" : "(Net)"}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 3. Discount Controls (Percentage vs Fixed Amount) */}
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Discount</span>
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-2xs font-bold">
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
                          <span className="absolute right-1.5 text-2xs font-bold text-slate-400 select-none">%</span>
                        </div>
                      ) : (
                        <div className="relative inline-flex items-center">
                          <span className="absolute left-2 text-2xs font-bold text-slate-400 select-none">₹</span>
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
                        <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {effectiveDiscountRate}% off
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      -₹{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* 4. Taxable Turnover if Inclusive */}
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
                    GST ({formData.tax_rate}%)
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

                <div className="p-3 rounded-lg bg-blue-600 text-white flex justify-between items-center shadow-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Total ({formData.currency})
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
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-medium shadow-xs"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/invoices/${invoice.invoice_number}`)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Submit Bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-lg flex items-center justify-between gap-3 lg:hidden">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total ({formData.currency})
            </p>
            <p className="font-mono text-base sm:text-lg font-black text-slate-900 leading-tight">
              ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </Button>
        </div>
      </form>

      {/* Quick Add Project Modal */}
      <QuickAddProjectModal
        open={quickAddProjectOpen}
        onClose={() => setQuickAddProjectOpen(false)}
        clientId={selectedClientId}
        clientName={formData.client_name}
        onProjectCreated={(newProject) => {
          setProjects((prev) => [newProject, ...prev]);
          setFormData((prev) => ({ ...prev, project_id: String(newProject.id) }));
        }}
      />
    </AdminLayout>
  );
}
