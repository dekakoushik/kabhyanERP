"use client";

import { useEffect, useState, useTransition, Suspense, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Client, ClientStats } from "@/lib/api";
import Link from "next/link";
import { validateGSTIN } from "@/lib/gst";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  LifeBuoy,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
  User,
  Send,
  Smartphone,
  Copy,
  Receipt,
  CreditCard,
  Globe,
  AlertCircle,
} from "lucide-react";

const STANDARD_CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "SGD", label: "SGD (S$) - Singapore Dollar" },
  { code: "CAD", label: "CAD (C$) - Canadian Dollar" },
  { code: "AUD", label: "AUD (A$) - Australian Dollar" },
];

const STANDARD_PAYMENT_TERMS = [
  { value: "Due Upon Receipt", label: "Due Upon Receipt (Immediate Payment)" },
  { value: "Net 15", label: "Net 15 (Payment within 15 days)" },
  { value: "Net 30", label: "Net 30 (Payment within 30 days - Standard)" },
  { value: "Net 45", label: "Net 45 (Payment within 45 days)" },
  { value: "Net 60", label: "Net 60 (Payment within 60 days)" },
  { value: "50% Advance / 50% Delivery", label: "50% Advance / 50% On Milestone Delivery" },
];

function ClientsContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    gstin: "",
    pan: "",
    address: "",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    postal_code: "",
    currency: "INR",
    payment_terms: "Net 30",
    notes: "",
    grant_mobile_access: true,
    portal_access_status: "active" as "active" | "inactive",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingInviteId, setSendingInviteId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Real-time GST validation in edit modal
  const gstAnalysis = useMemo(() => {
    return validateGSTIN(formData.gstin);
  }, [formData.gstin]);

  const handleGstinChange = (value: string) => {
    const uppercaseVal = value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    const analysis = validateGSTIN(uppercaseVal);

    setFormData((prev) => {
      const updated = { ...prev, gstin: uppercaseVal };
      if (analysis.stateName) {
        updated.state = analysis.stateName;
      }
      if (analysis.pan) {
        updated.pan = analysis.pan;
      }
      return updated;
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied client code ${code} to clipboard`);
  };

  const handleResendInvite = async (client: Client) => {
    if (!client.email) {
      toast.error("Cannot send invitation link without an email address.");
      return;
    }
    try {
      setSendingInviteId(client.id);
      await api.request(`/clients/${client.id}/send-invite`, {
        method: "POST",
      });
      toast.success(`Mobile App activation link sent to ${client.email}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation link.";
      toast.error(msg);
    } finally {
      setSendingInviteId(null);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.request(`/clients?${params.toString()}`) as {
        clients: { data: Client[] };
        stats?: ClientStats;
      };
      setClients(res.clients.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error("Failed to load clients:", err);
      toast.error("Could not fetch client directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter]);

  const openEditModal = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name || "",
      company_name: client.company_name || "",
      email: client.email || "",
      phone: client.phone || "",
      gstin: client.gstin || "",
      pan: client.pan || "",
      address: client.address || "",
      city: client.city || "Kolkata",
      state: client.state || "West Bengal",
      country: client.country || "India",
      postal_code: client.postal_code || "",
      currency: client.currency || "INR",
      payment_terms: client.payment_terms || "Net 30",
      notes: client.notes || "",
      grant_mobile_access: client.portal_access_status === "active",
      portal_access_status: client.portal_access_status || "active",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      await api.request(`/clients/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      toast.success("Client profile updated successfully");
      setModalOpen(false);
      startTransition(() => {
        fetchClients();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        setFormError("Failed to update client.");
        toast.error("Failed to update client.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.request(`/clients/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      toast.success(`Client ${deleteConfirm.company_name} deleted`);
      setDeleteConfirm(null);
      fetchClients();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete client.";
      toast.error(msg);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Building className="w-6 h-6" />
              </span>
              Client Accounts & Portals
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage corporate client accounts, project assignments, and mobile app invitation credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/portal"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide shadow-2xs transition"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>Open Client Portal</span>
            </Link>

            <Link
              href="/dashboard/clients/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client Account</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Corporate Clients
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_clients}</p>
                <p className="text-2xs text-slate-500 mt-0.5">Active enterprise accounts</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-2xs font-bold text-emerald-600 uppercase tracking-wider">
                  Active Portal Logins
                </p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active_portal_users}</p>
                <p className="text-2xs text-emerald-600/80 mt-0.5">Enabled self-service access</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-2xs font-bold text-purple-600 uppercase tracking-wider">
                  Clients With Projects
                </p>
                <p className="text-2xl font-black text-purple-700 mt-1">{stats.total_active_projects}</p>
                <p className="text-2xs text-purple-600/80 mt-0.5">Live software deliverables</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, contact person, email, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="">All Portal Statuses</option>
              <option value="active">Active Portal</option>
              <option value="inactive">Inactive Portal</option>
            </select>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">Loading Client Profiles...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                <Building className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Clients Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Add your first client profile to associate projects and grant access to the Client Portal.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/clients/create"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Client</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-2xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 w-[150px] whitespace-nowrap">Client Code</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Company / Contact</th>
                    <th className="py-3.5 px-4 min-w-[210px]">Contact Details</th>
                    <th className="py-3.5 px-4 min-w-[170px]">GSTIN / Location</th>
                    <th className="py-3.5 px-4 w-[90px] text-center">Projects</th>
                    <th className="py-3.5 px-4 w-[90px] text-center">Tickets</th>
                    <th className="py-3.5 px-4 w-[130px] text-center">Mobile Access</th>
                    <th className="py-3.5 px-4 w-[130px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {clients.map((cli) => {
                    const hasEmail = Boolean(cli.email && cli.email.trim() !== "");
                    const hasPhone = Boolean(cli.phone && cli.phone.trim() !== "");

                    return (
                      <tr key={cli.id} className="hover:bg-slate-50/60 transition group">
                        {/* CLIENT CODE - STRICTLY NON-BREAKING */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                          <button
                            onClick={() => handleCopyCode(cli.client_code)}
                            title="Click to copy client code"
                            className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200/70 transition shadow-2xs group/btn cursor-pointer"
                          >
                            <span>{cli.client_code}</span>
                            <Copy className="w-3 h-3 text-blue-400 group-hover/btn:text-blue-700 transition" />
                          </button>
                        </td>

                        {/* COMPANY / PRIMARY CONTACT */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
                              {cli.company_name}
                            </p>
                            <p className="text-slate-500 text-2xs flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{cli.name}</span>
                            </p>
                          </div>
                        </td>

                        {/* CONTACT DETAILS - CLEAN CONDITIONAL RENDERING */}
                        <td className="py-3.5 px-4 text-slate-600 align-middle">
                          <div className="flex flex-col gap-1">
                            {hasEmail ? (
                              <a
                                href={`mailto:${cli.email}`}
                                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-600 font-medium transition truncate max-w-[220px]"
                              >
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{cli.email}</span>
                              </a>
                            ) : (
                              <span className="text-2xs italic text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span>No email provided</span>
                              </span>
                            )}

                            {hasPhone ? (
                              <a
                                href={`tel:${cli.phone}`}
                                className="flex items-center gap-1.5 text-2xs text-slate-500 hover:text-blue-600 transition"
                              >
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{cli.phone}</span>
                              </a>
                            ) : null}
                          </div>
                        </td>

                        {/* GSTIN / LOCATION */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex flex-col gap-0.5">
                            {cli.gstin ? (
                              <span className="font-mono text-xs font-semibold text-slate-800 tracking-wider">
                                {cli.gstin}
                              </span>
                            ) : (
                              <span className="text-2xs font-semibold text-slate-400">
                                Unregistered / Non-GST
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-2xs text-slate-400">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cli.city || "Kolkata"}, {cli.state || "West Bengal"}</span>
                            </div>
                          </div>
                        </td>

                        {/* PROJECTS */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          <Link
                            href={`/dashboard/projects?search=${encodeURIComponent(cli.company_name)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 hover:scale-105 transition shadow-2xs"
                          >
                            <FolderKanban className="w-3 h-3" />
                            <span>{cli.projects_count ?? cli.projects?.length ?? 0}</span>
                          </Link>
                        </td>

                        {/* TICKETS */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          <Link
                            href={`/dashboard/tickets?client_id=${cli.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 hover:scale-105 transition shadow-2xs"
                          >
                            <LifeBuoy className="w-3 h-3" />
                            <span>{cli.tickets_count ?? 0}</span>
                          </Link>
                        </td>

                        {/* PORTAL / MOBILE ACCESS BADGE */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          {!hasEmail ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              No Login
                            </span>
                          ) : cli.portal_access_status === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Mobile Ready</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>

                        {/* ACTIONS GROUP WITH SHADCN RADIX TOOLTIPS */}
                        <td className="py-3.5 px-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleResendInvite(cli)}
                                  disabled={sendingInviteId === cli.id || !hasEmail}
                                  className={`p-1.5 rounded-lg transition ${
                                    !hasEmail
                                      ? "text-slate-300 cursor-not-allowed"
                                      : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer disabled:opacity-50"
                                  }`}
                                >
                                  {sendingInviteId === cli.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {hasEmail
                                  ? "Send / Resend Mobile App Activation Link"
                                  : "Cannot invite client without email"}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => openEditModal(cli)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Edit Profile</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setDeleteConfirm(cli)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Delete Client</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Edit Client Profile */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Edit Client Profile
                    </h2>
                    <p className="text-xs text-slate-500">Corporate master records and mobile app provisioning</p>
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
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Company / Organization Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kolkata FinTech Innovations Pvt Ltd"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Primary Contact Person <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Sen"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="client@company.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-3xs text-slate-400 mt-1">
                      Required if client requires access to the Mobile App.
                    </p>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98310 98765"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Indian GSTIN & PAN Intelligence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      GSTIN (15-Digit Indian GST)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 19AAECK4829K1ZX"
                      value={formData.gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none"
                    />
                    {formData.gstin && (
                      <p className={`text-3xs mt-1 font-semibold ${gstAnalysis.isValid ? "text-emerald-600" : "text-amber-600"}`}>
                        {gstAnalysis.isValid
                          ? `Valid GSTIN: Registered in ${gstAnalysis.stateName || "India"}`
                          : (gstAnalysis.errorMessage || "Invalid GSTIN format")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Permanent Account Number (PAN)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. AAECK4829K"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().slice(0, 10) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address & Geo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value.replace(/[^0-9]/g, "").slice(0, 6) })}
                      placeholder="e.g. 700091"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Billing Address</label>
                  <input
                    type="text"
                    placeholder="Office suite, Tech park, Sector V, Salt Lake, Kolkata 700091"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                {/* Commercial Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                    >
                      {STANDARD_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">Payment Terms</label>
                    <select
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none cursor-pointer"
                    >
                      {STANDARD_PAYMENT_TERMS.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile App Access Block */}
                {Boolean(formData.email && formData.email.trim()) ? (
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-700" />
                        <span className="font-bold text-blue-900 text-xs">Client Mobile App Access</span>
                      </div>
                      <span className="text-3xs font-extrabold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        Passwordless Admin
                      </span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-relaxed">
                      For zero-knowledge security, passwords are never stored or managed by administrators. Clients create their own password securely via email for the Mobile App.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const target = clients.find((c) => c.id === editingId);
                          if (target) handleResendInvite(target);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send New Activation Link via Email</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-2xs text-slate-400 text-center">
                    Provide an email address above to enable Client Mobile App invitations.
                  </div>
                )}

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Contractual remarks or billing SLA preferences"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Update Client</span>
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
              <h3 className="text-base font-bold text-slate-900 mb-2">Delete Client Profile</h3>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900">{deleteConfirm.company_name}</strong>?
                All associated invoices, tickets, and mobile portal links will be archived.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default function ClientsPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Clients...</p>
          </div>
        }
      >
        <ClientsContent />
      </Suspense>
    </AdminLayout>
  );
}
