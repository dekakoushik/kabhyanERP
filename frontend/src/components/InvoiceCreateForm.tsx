"use client";

import { Suspense, useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Client, InvoiceItem, Project, ProformaInvoice } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ClientCombobox from "@/components/ClientCombobox";
import ClientSnapshotCard from "@/components/ClientSnapshotCard";
import DocumentItemsTable from "@/components/DocumentItemsTable";
import QuickAddProjectModal from "@/components/QuickAddProjectModal";
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
  CheckCircle2,
  Percent,
  X,
  ExternalLink,
  AlertTriangle,
  ListPlus,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function InvoiceCreateForm({
  proformaIdentifier,
}: {
  proformaIdentifier?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Proforma & Milestone Invoicing State
  const [linkedProforma, setLinkedProforma] = useState<ProformaInvoice | null>(null);
  const [loadingProforma, setLoadingProforma] = useState(false);

  // Custom Milestone & Calculation State
  const [customMode, setCustomMode] = useState<"amount" | "percent">("amount");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customAmountType, setCustomAmountType] = useState<"gross" | "taxable">("gross");
  const [customPercent, setCustomPercent] = useState<string>("100");
  const [customTitle, setCustomTitle] = useState<string>("Milestone Deliverable");
  const [customDesc, setCustomDesc] = useState<string>(
    "Milestone deliverable payment against agreed project scope."
  );

  // Instant Settlement / Payment Receipt State
  const [isPaidReceived, setIsPaidReceived] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

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
      let loadedClients: Client[] = [];
      try {
        const [projRes, cliRes] = await Promise.all([
          api.request("/projects?per_page=100"),
          api.request("/clients?per_page=100"),
        ]);
        setProjects(projRes.projects?.data || projRes.data || []);
        loadedClients = cliRes.clients?.data || cliRes.data || [];
        setClients(loadedClients);
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

      const activeProformaRef = proformaIdentifier || searchParams?.get("proforma_id");
      if (activeProformaRef) {
        try {
          setLoadingProforma(true);
          const res = await api.request(`/proforma-invoices/${activeProformaRef}`);
          if (res?.proforma_invoice) {
            const p = res.proforma_invoice as ProformaInvoice;
            setLinkedProforma(p);

            // Match or synthesize client
            const matched = loadedClients.find(
              (c) =>
                (p.client_email && c.email?.toLowerCase() === p.client_email?.toLowerCase()) ||
                (p.client_company && c.company_name?.toLowerCase() === p.client_company?.toLowerCase()) ||
                (c.name?.toLowerCase() === p.client_name?.toLowerCase())
            );

            const activeClient: Client = matched || {
              id: -p.id,
              client_code: `CLI-${p.id}`,
              name: p.client_name,
              company_name: p.client_company || p.client_name,
              email: p.client_email || "",
              phone: p.client_phone || "",
              address: p.client_address || "",
              gstin: p.client_gstin || "19AAECK4829K1ZX",
              tax_number: p.client_gstin || "19AAECK4829K1ZX",
              city: "Kolkata",
              state: "West Bengal",
              portal_access_status: "active",
            };

            if (!matched) {
              setClients((prev) => [activeClient, ...prev]);
            }

            setSelectedClientId(activeClient.id);

            const total = Number(p.total_amount);
            const invoiced = Number(p.invoiced_amount ?? 0);
            const remaining = Number(p.remaining_amount ?? Math.max(0, total - invoiced));
            const targetGross = remaining > 0 ? remaining : total;
            const taxRate = Number(p.tax_rate ?? 18);
            const taxable = Math.round((targetGross / (1 + taxRate / 100)) * 100) / 100;

            const initialPercent = total > 0 ? Math.round((targetGross / total) * 100) : 100;
            setCustomAmount(String(Math.round(targetGross)));
            setCustomPercent(String(initialPercent));
            setCustomTitle(
              remaining < total && remaining > 0
                ? "Milestone Settlement"
                : "Milestone Deliverable"
            );

            const fullAddress = [
              activeClient.address,
              activeClient.city,
              activeClient.state,
              activeClient.postal_code,
              activeClient.country,
            ]
              .filter(Boolean)
              .join(", ");

            setFormData((prev) => ({
              ...prev,
              client_name: activeClient.name,
              client_company: activeClient.company_name || "",
              client_email: activeClient.email || "",
              client_phone: activeClient.phone || "",
              client_address: fullAddress || activeClient.address || p.client_address || "",
              client_gstin: activeClient.tax_number || p.client_gstin || "19AAECK4829K1ZX",
              project_id: p.project_id ? String(p.project_id) : prev.project_id,
              tax_rate: String(taxRate),
              notes: `Milestone Tax Invoice issued against accepted Proforma ${p.proforma_number}`,
              items: [
                {
                  item_name:
                    remaining < total && remaining > 0
                      ? `Milestone Settlement against Proforma ${p.proforma_number}`
                      : `Milestone Deliverable against Proforma ${p.proforma_number}`,
                  description: `Milestone deliverable payment against agreed project scope.`,
                  quantity: 1,
                  unit: "mile",
                  unit_price: taxable,
                  amount: taxable,
                },
              ],
            }));
          }
        } catch (err: any) {
          console.error("Failed to load proforma invoice:", err);
          toast.error("Could not load proforma invoice details");
        } finally {
          setLoadingProforma(false);
        }
      }
    };

    initData();
  }, [proformaIdentifier]);



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

  // Proforma Contract & Milestone Calculations
  const contractTotal = linkedProforma ? Number(linkedProforma.total_amount) : 0;
  const invoicedTotal = linkedProforma ? Number(linkedProforma.invoiced_amount ?? 0) : 0;
  const remainingTotal = linkedProforma
    ? Number(linkedProforma.remaining_amount ?? Math.max(0, contractTotal - invoicedTotal))
    : 0;
  const activeTaxRate = Number(formData.tax_rate) || 18;

  let calcGross = 0;
  let calcTaxable = 0;
  let calcGst = 0;
  let calcEquivalentPct = 0;

  if (customMode === "amount") {
    const val = parseFloat(customAmount) || 0;
    if (customAmountType === "gross") {
      calcGross = val;
      calcTaxable = Math.round((val / (1 + activeTaxRate / 100)) * 100) / 100;
      calcGst = Math.round((calcGross - calcTaxable) * 100) / 100;
    } else {
      calcTaxable = val;
      calcGst = Math.round((calcTaxable * (activeTaxRate / 100)) * 100) / 100;
      calcGross = Math.round((calcTaxable + calcGst) * 100) / 100;
    }
    calcEquivalentPct = contractTotal > 0 ? Number(((calcGross / contractTotal) * 100).toFixed(1)) : 0;
  } else {
    const pct = parseFloat(customPercent) || 0;
    calcGross = Math.round((contractTotal * pct) / 100);
    calcTaxable = Math.round((calcGross / (1 + activeTaxRate / 100)) * 100) / 100;
    calcGst = Math.round((calcGross - calcTaxable) * 100) / 100;
    calcEquivalentPct = Number(pct.toFixed(1));
  }

  const isExceeding = calcGross > remainingTotal + 1;

  const priorPercent = contractTotal > 0 ? Number(((invoicedTotal / contractTotal) * 100).toFixed(1)) : 0;
  const currentPercent = contractTotal > 0 ? Number(((grandTotal / contractTotal) * 100).toFixed(1)) : 0;
  const remainingPercent = Math.max(0, Number((100 - priorPercent - currentPercent).toFixed(1)));
  const activeInvoicedPercent = Number((priorPercent + currentPercent).toFixed(1));

  const handleAmountChange = (valStr: string) => {
    setCustomAmount(valStr);
    const val = parseFloat(valStr) || 0;
    if (contractTotal > 0) {
      const grossVal = customAmountType === "gross" ? val : val * (1 + activeTaxRate / 100);
      const pct = (grossVal / contractTotal) * 100;
      setCustomPercent(pct.toFixed(1));
    }
  };

  const handlePercentChange = (valStr: string) => {
    setCustomPercent(valStr);
    const pct = parseFloat(valStr) || 0;
    if (contractTotal > 0) {
      const grossVal = Math.round((contractTotal * pct) / 100);
      setCustomAmount(customAmountType === "gross" ? String(grossVal) : String(Math.round(grossVal / (1 + activeTaxRate / 100))));
    }
  };

  const handlePresetClick = (pct: number) => {
    if (!linkedProforma) return;
    setCustomPercent(String(pct));
    const grossVal = Math.round((contractTotal * pct) / 100);
    setCustomAmount(customAmountType === "gross" ? String(grossVal) : String(Math.round(grossVal / (1 + activeTaxRate / 100))));
    setCustomTitle(`${pct}% Milestone Deliverable`);

    const taxable = Math.round((grossVal / (1 + activeTaxRate / 100)) * 100) / 100;
    setFormData((prev) => ({
      ...prev,
      items: [
        {
          item_name: `${pct}% Milestone Deliverable against ${linkedProforma.proforma_number}`,
          description: `Milestone deliverable payment against agreed project scope.`,
          quantity: 1,
          unit: "mile",
          unit_price: taxable,
          amount: taxable,
        },
      ],
      notes: `${pct}% Milestone Tax Invoice issued against accepted Proforma ${linkedProforma.proforma_number}`,
    }));
    toast.success(`Applied ${pct}% milestone: Gross ₹${grossVal.toLocaleString("en-IN")}`);
  };

  const handleFullRemainingClick = () => {
    if (!linkedProforma) return;
    const remainingGross = Math.max(0, remainingTotal);
    setCustomAmount(customAmountType === "gross" ? String(remainingGross) : String(Math.round(remainingGross / (1 + activeTaxRate / 100))));
    const pct = contractTotal > 0 ? Number(((remainingGross / contractTotal) * 100).toFixed(1)) : 100;
    setCustomPercent(String(pct));
    setCustomTitle("Balance Due Deliverable");

    const taxable = Math.round((remainingGross / (1 + activeTaxRate / 100)) * 100) / 100;
    setFormData((prev) => ({
      ...prev,
      items: [
        {
          item_name: `Balance Due against ${linkedProforma.proforma_number}`,
          description: `Final deliverable milestone payment against agreed project scope.`,
          quantity: 1,
          unit: "mile",
          unit_price: taxable,
          amount: taxable,
        },
      ],
      notes: `Final settlement Tax Invoice issued against accepted Proforma ${linkedProforma.proforma_number}`,
    }));
    toast.success(`Applied balance due: Gross ₹${remainingGross.toLocaleString("en-IN")}`);
  };

  const applyCustomMilestone = () => {
    if (!linkedProforma) return;
    if (calcTaxable <= 0) {
      toast.error("Please enter a valid milestone amount or percentage");
      return;
    }

    const title = customTitle.trim()
      ? `${customTitle.trim()} against ${linkedProforma.proforma_number}`
      : `Milestone Deliverable (${calcEquivalentPct}%) against ${linkedProforma.proforma_number}`;

    setFormData((prev) => ({
      ...prev,
      items: [
        {
          item_name: title,
          description: customDesc.trim() || `Milestone deliverable payment against agreed project scope.`,
          quantity: 1,
          unit: "mile",
          unit_price: calcTaxable,
          amount: calcTaxable,
        },
      ],
      notes: `Milestone Tax Invoice (${calcEquivalentPct}%) issued against accepted Proforma ${linkedProforma.proforma_number}`,
    }));

    toast.success(`Applied Milestone: Gross ₹${calcGross.toLocaleString("en-IN")} (Taxable ₹${calcTaxable.toLocaleString("en-IN")})`);
  };

  const importOriginalProformaItems = () => {
    if (!linkedProforma || !linkedProforma.items || linkedProforma.items.length === 0) {
      toast.error("No itemized deliverables found in the source Proforma.");
      return;
    }

    const proformaItems = linkedProforma.items || [];
    setFormData((prev) => ({
      ...prev,
      items: proformaItems.map((it) => ({
        item_name: it.item_name,
        description: it.description || "",
        quantity: Number(it.quantity) || 1,
        unit: it.unit || "units",
        unit_price: Number(it.unit_price) || 0,
        amount: Number(it.amount) || 0,
      })),
      notes: `Itemized Tax Invoice issued against Proforma ${linkedProforma.proforma_number}`,
    }));

    toast.success(`Loaded ${proformaItems.length} item(s) from Proforma ${linkedProforma.proforma_number}`);
  };

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

  const handleReorderItems = (startIndex: number, endIndex: number) => {
    setFormData((prev) => {
      const nextItems = Array.from(prev.items);
      const [moved] = nextItems.splice(startIndex, 1);
      nextItems.splice(endIndex, 0, moved);
      return { ...prev, items: nextItems };
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

      const payload = {
        invoice_number: formData.invoice_number || undefined,
        project_id: formData.project_id && String(formData.project_id).trim() !== "" ? Number(formData.project_id) : null,
        proforma_invoice_id: linkedProforma ? linkedProforma.id : null,
        estimate_id: (formData as any).estimate_id ? Number((formData as any).estimate_id) : null,
        client_name: formData.client_name,
        client_company: formData.client_company || null,
        client_email: formData.client_email && formData.client_email.trim() !== "" ? formData.client_email.trim() : null,
        client_phone: formData.client_phone || null,
        client_address: formData.client_address || null,
        client_gstin: formData.client_gstin || null,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        status: isPaidReceived ? "paid" : formData.status,
        currency: formData.currency || "INR",
        tax_rate: Number(formData.tax_rate) || 18,
        discount_rate: Number(formData.discount_rate) || 0,
        round_off: roundOffAmount,
        notes: formData.notes || null,
        terms_and_conditions: formData.payment_terms || null,
        items: formData.items.map((it) => ({
          item_name: it.item_name,
          hsn_sac: (it as any).hsn_sac || "998314",
          description: it.description || null,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || "hours",
          unit_price: Number(it.unit_price) || 0,
        })),
        payment_method: isPaidReceived ? paymentMethod : undefined,
        payment_reference: isPaidReceived ? (paymentReference || "Settled on issuance") : undefined,
        payment_date: isPaidReceived ? (paymentDate || formData.invoice_date) : undefined,
      };

      await api.request("/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (linkedProforma) {
        toast.success(`Milestone Tax Invoice created against ${linkedProforma.proforma_number}`);
        router.push(`/dashboard/proforma/${linkedProforma.proforma_number || linkedProforma.id}`);
      } else {
        toast.success("Tax Invoice created successfully");
        router.push("/dashboard/invoices");
      }
    } catch (err: any) {
      console.error("Invoice creation failure:", err);
      const msg = err.message || "Failed to create invoice";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 font-sans">
        {/* Top Header */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          {linkedProforma && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>/</span>
              <Link href="/dashboard/proforma" className="hover:text-slate-800 transition">Proforma Invoices</Link>
              <span>/</span>
              <Link href={`/dashboard/proforma/${linkedProforma.proforma_number}`} className="hover:text-purple-700 font-mono font-semibold transition">
                {linkedProforma.proforma_number}
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">New Milestone Invoice</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={linkedProforma ? `/dashboard/proforma/${linkedProforma.proforma_number}` : "/dashboard/invoices"}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
                title={linkedProforma ? "Back to Proforma" : "Back to Invoices"}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
                  <span className={`p-2 rounded-xl shadow-2xs ${linkedProforma ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    <FileCheck className="w-5 h-5" />
                  </span>
                  <span>{linkedProforma ? "New Milestone Invoice" : "New Tax Invoice"}</span>
                  {linkedProforma && (
                    <Link
                      href={`/dashboard/proforma/${linkedProforma.proforma_number}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-mono text-xs font-bold transition shadow-2xs"
                      title="View Source Proforma Agreement"
                    >
                      <span>{linkedProforma.proforma_number}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {linkedProforma
                    ? `Bill a milestone or partial payment against Proforma ${linkedProforma.proforma_number}.`
                    : "Generate an official GST-compliant tax invoice with automatic calculations."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(linkedProforma ? `/dashboard/proforma/${linkedProforma.proforma_number}` : "/dashboard/invoices")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`${linkedProforma ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"} text-white font-medium shadow-xs`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Invoice
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

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Proforma Milestone & Custom Amount Controller Card */}
            {linkedProforma && (
              <Card className="border-purple-200 bg-linear-to-br from-purple-50/40 via-white to-purple-50/20 shadow-xs overflow-hidden">
                <CardHeader className="pb-3 border-b border-purple-100/80 bg-purple-50/60 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-2xs">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span>Milestone & Part Payment</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
                          Proforma #{linkedProforma.proforma_number}
                        </span>
                      </CardTitle>
                      <p className="text-[11px] text-slate-500">
                        Set a custom milestone percentage or payment amount to record partial billing.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/proforma/${linkedProforma.proforma_number}`}
                    target="_blank"
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs shrink-0"
                  >
                    <span>View Proforma</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proforma Total</span>
                      <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                        ₹{contractTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-slate-400">100% Scope</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Billed</span>
                      <p className="text-base font-bold text-emerald-600 font-mono mt-0.5">
                        ₹{invoicedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {contractTotal > 0 ? ((invoicedTotal / contractTotal) * 100).toFixed(1) : 0}% Billed
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance Due</span>
                      <p className="text-base font-bold text-purple-700 font-mono mt-0.5">
                        ₹{remainingTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-purple-600 font-medium">
                        {contractTotal > 0 ? ((remainingTotal / contractTotal) * 100).toFixed(1) : 0}% Remaining
                      </span>
                    </div>
                  </div>

                  {/* Visual Contract Progress Bar */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-slate-700">Invoicing Progress</span>
                      <span className="font-mono text-slate-600 font-semibold">
                        {activeInvoicedPercent}% Billed with this invoice
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${Math.min(100, priorPercent)}%` }}
                        className="bg-emerald-500 transition-all duration-300"
                        title={`Previously Invoiced: ${priorPercent}%`}
                      />
                      <div
                        style={{ width: `${Math.min(100 - priorPercent, currentPercent)}%` }}
                        className="bg-purple-600 transition-all duration-300"
                        title={`This Invoice: ${currentPercent}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 flex-wrap gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>Previously Billed ({priorPercent}%)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                        <span className="font-semibold text-purple-800">This Invoice ({currentPercent}%)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                        <span>Balance Due ({remainingPercent}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Custom Milestone & Amount Form */}
                  <div className="p-4 rounded-xl bg-white border border-purple-200 shadow-2xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">Calculate by:</span>
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => setCustomMode("amount")}
                            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                              customMode === "amount" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            ₹ Amount
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomMode("percent")}
                            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                              customMode === "percent" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            % Percentage
                          </button>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                        {[10, 25, 30, 50].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handlePresetClick(p)}
                            className="px-2 py-0.5 rounded-md border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition cursor-pointer"
                          >
                            {p === 30 ? "30% Deposit" : `${p}%`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handleFullRemainingClick}
                          className="px-2.5 py-0.5 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition cursor-pointer"
                        >
                          Balance Due
                        </button>
                      </div>
                    </div>

                    {/* Inputs Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5">
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Milestone Name
                        </label>
                        <Input
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="e.g. Phase 1: Mobilization & System Engineering"
                          className="h-9 text-xs"
                        />
                      </div>

                      {customMode === "amount" ? (
                        <div className="sm:col-span-4">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">Amount (₹)</label>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setCustomAmountType("gross")}
                                className={`font-semibold cursor-pointer ${customAmountType === "gross" ? "text-purple-700 underline" : "text-slate-400"}`}
                              >
                                Incl. Tax
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setCustomAmountType("taxable")}
                                className={`font-semibold cursor-pointer ${customAmountType === "taxable" ? "text-purple-700 underline" : "text-slate-400"}`}
                              >
                                Excl. Tax
                              </button>
                            </div>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={customAmount}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              placeholder="e.g. 50000"
                              className="h-9 pl-7 font-mono text-xs font-bold text-slate-900"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="sm:col-span-4">
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Percentage (%)
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={customPercent}
                              onChange={(e) => handlePercentChange(e.target.value)}
                              placeholder="e.g. 30"
                              className="h-9 pr-7 font-mono text-xs font-bold text-slate-900"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">%</span>
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-3">
                        <Button
                          type="button"
                          onClick={applyCustomMilestone}
                          className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply to Item Table</span>
                        </Button>
                      </div>
                    </div>

                    {/* Live Real-Time Tax & GST Breakdown Preview */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-lg">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-slate-500">
                          Sub Total: <strong className="text-slate-900 font-mono">₹{calcTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          GST ({activeTaxRate}%): <strong className="text-purple-700 font-mono">+₹{calcGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          Invoice Total: <strong className="text-emerald-700 font-mono">₹{calcGross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-600">
                        Equivalent: <span className="text-purple-700 font-bold">{calcEquivalentPct}%</span> of Proforma
                      </div>
                    </div>

                    {/* Exceeding Warning if user enters more than remaining */}
                    {isExceeding && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Notice:</strong> This milestone amount (₹{calcGross.toLocaleString("en-IN")}) exceeds the remaining balance of ₹{remainingTotal.toLocaleString("en-IN")} on the proforma.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Switch to full proforma itemized items if required */}
                  <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                    <span className="text-slate-400 text-[11px]">
                      Need line-by-line deliverables from the original Proforma agreement instead?
                    </span>
                    <button
                      type="button"
                      onClick={importOriginalProformaItems}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Import Original Proforma Line Items</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

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
              selectedClient={
                clients.find((c) => c.id === selectedClientId) ||
                (formData.client_name
                  ? ({
                      id: selectedClientId || -1,
                      client_code: "CLI-AUTO",
                      name: formData.client_name,
                      company_name: formData.client_company || formData.client_name,
                      email: formData.client_email || "",
                      phone: formData.client_phone || "",
                      address: formData.client_address || "",
                      gstin: formData.client_gstin || "19AAECK4829K1ZX",
                      tax_number: formData.client_gstin || "19AAECK4829K1ZX",
                      portal_access_status: "active",
                    } as Client)
                  : null)
              }
              onSelectClient={handleSelectClient}
              onOpenQuickAdd={() => setQuickAddOpen(true)}
              title="Bill To"
              subtitle="Select a customer or add a new one to auto-populate billing and tax details"
              required={true}
            />

            {/* 3. Line Items & Billable Deliverables Ledger Table */}
            <DocumentItemsTable
              items={formData.items}
              currency={formData.currency}
              taxRate={formData.tax_rate}
              title="Item Table"
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onReorderItems={handleReorderItems}
            />

            {/* 4. Payment Terms & Notes */}
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Customer Notes
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

            {/* 5. Instant Payment Settlement & Receipt */}
            <Card className="border-emerald-200/80 bg-linear-to-br from-emerald-50/30 to-white shadow-xs">
              <CardHeader className="pb-3 border-b border-emerald-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Payment Received
                    </CardTitle>
                    <p className="text-[11px] text-slate-500">
                      Record payment and generate receipt voucher upon saving
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaidReceived}
                    onChange={(e) => {
                      setIsPaidReceived(e.target.checked);
                      if (e.target.checked && !paymentDate) {
                        setPaymentDate(formData.invoice_date || new Date().toISOString().split("T")[0]);
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      I have already received payment for this invoice
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Records payment in the financial ledger, issues a receipt voucher, and marks this invoice as Paid.
                    </p>
                  </div>
                </label>

                {isPaidReceived && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Payment Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="bank_transfer">Bank Transfer (IMPS / Direct)</option>
                        <option value="neft">NEFT Transfer</option>
                        <option value="rtgs">RTGS Transfer</option>
                        <option value="upi">UPI / QR Code</option>
                        <option value="cheque">Cheque</option>
                        <option value="card">Corporate Card</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Reference / UTR #
                      </label>
                      <Input
                        placeholder="e.g. UTR1938472910"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Payment Date
                      </label>
                      <Input
                        type="date"
                        value={paymentDate || formData.invoice_date}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sticky Summary Card (4 Columns) */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            {/* Proforma Summary */}
            {linkedProforma && (
              <Card className="border-purple-200 shadow-xs bg-linear-to-br from-purple-50/60 via-white to-purple-50/30 overflow-hidden">
                <CardHeader className="pb-2.5 border-b border-purple-100 bg-purple-50/50 rounded-t-xl">
                  <CardTitle className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-purple-900">
                      <Receipt className="w-3.5 h-3.5 text-purple-600" />
                      <span>Proforma Summary</span>
                    </span>
                    <span className="font-mono text-[10px] text-purple-700 bg-purple-100/90 border border-purple-200 px-2 py-0.5 rounded-md font-bold">
                      {linkedProforma.proforma_number}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Proforma Total:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{contractTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Amount Billed So Far:</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      ₹{invoicedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-purple-950 pt-2 border-t border-purple-100">
                    <span className="font-bold">This Invoice:</span>
                    <span className="font-mono font-black text-purple-700 text-sm">
                      ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-purple-100">
                    <span>Balance Due on Proforma:</span>
                    <span className="font-mono font-bold text-slate-700">
                      ₹{Math.max(0, remainingTotal - grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-blue-200/80 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-blue-50/40 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Invoice Summary</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white uppercase font-bold">
                    {formData.currency}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Sub Total</span>
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
                    GST ({formData.tax_rate}%)
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

                <div className={`p-3 rounded-lg text-white flex justify-between items-center ${linkedProforma ? "bg-purple-600" : "bg-blue-600"}`}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-100">
                      Total ({formData.currency})
                    </p>
                    <p className="text-xl font-mono font-black mt-0.5">
                      ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Sparkles className="w-6 h-6 text-purple-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className={`w-full ${linkedProforma ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"} text-white py-2.5 font-medium shadow-xs`}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Invoice
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(linkedProforma ? `/dashboard/proforma/${linkedProforma.proforma_number}` : "/dashboard/invoices")}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Quick Submit Bar */}
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
            disabled={loading}
            className={`${linkedProforma ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"} text-white font-semibold text-xs sm:text-sm px-5 py-2.5 shadow-md flex items-center gap-1.5 cursor-pointer`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Invoice</span>
          </Button>
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

