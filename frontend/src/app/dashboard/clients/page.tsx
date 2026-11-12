"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Client, ClientStats } from "@/lib/api";
import Link from "next/link";
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
} from "lucide-react";

function ClientsContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    create_portal_account: true,
    portal_password: "Client@2026",
    reset_portal_password: "",
    portal_access_status: "active" as "active" | "inactive",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingInviteId, setSendingInviteId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const handleResendInvite = async (client: Client) => {
    try {
      setSendingInviteId(client.id);
      await api.request(`/clients/${client.id}/send-invite`, {
        method: "POST",
      });
      alert(`Invitation link successfully sent to ${client.email}`);
    } catch (err: any) {
      alert(err.message || "Failed to send invitation link.");
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

      const res = await api.request(`/clients?${params.toString()}`);
      setClients(res.clients.data);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
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
      create_portal_account: true,
      portal_password: "Client@2026",
      reset_portal_password: "",
      portal_access_status: "active",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setIsEditing(true);
    setEditingId(client.id);
    setFormData({
      name: client.name,
      company_name: client.company_name,
      email: client.email,
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
      create_portal_account: false,
      portal_password: "",
      reset_portal_password: "",
      portal_access_status: client.portal_access_status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const endpoint = isEditing ? `/clients/${editingId}` : "/clients";
      const method = isEditing ? "PUT" : "POST";

      await api.request(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      setModalOpen(false);
      startTransition(() => {
        fetchClients();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save client.");
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
      setDeleteConfirm(null);
      fetchClients();
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
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Building className="w-6 h-6" />
            </span>
            Client Accounts & Portals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage corporate client accounts, project assignments, and self-service Client Portal credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client Account</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Corporate Clients</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_clients}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Active enterprise accounts</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Portal Logins</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active_portal_users}</p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Enabled self-service access</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Clients With Projects</p>
              <p className="text-2xl font-black text-purple-700 mt-1">{stats.total_active_projects}</p>
              <p className="text-[11px] text-purple-600/80 mt-0.5">Live software deliverables</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <FolderKanban className="w-5 h-5" />
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
            placeholder="Search company, contact person, email, code..."
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
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Portal Statuses</option>
            <option value="active">Active Portal</option>
            <option value="inactive">Inactive Portal</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Client Profiles...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Clients Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add your first client profile to associate projects and grant access to the Client Portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Client Code</th>
                  <th className="py-3.5 px-6">Company / Primary Contact</th>
                  <th className="py-3.5 px-6">Contact Details</th>
                  <th className="py-3.5 px-6">GSTIN / City</th>
                  <th className="py-3.5 px-6">Projects</th>
                  <th className="py-3.5 px-6">Tickets</th>
                  <th className="py-3.5 px-6">Portal Access</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {clients.map((cli) => (
                  <tr key={cli.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        {cli.client_code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 text-sm">{cli.company_name}</p>
                      <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{cli.name}</span>
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {cli.email}
                        </span>
                        {cli.phone && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cli.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-slate-700 font-medium">
                          {cli.gstin || "Unregistered"}
                        </span>
                        <span className="text-[11px] text-slate-400">{cli.city || "Kolkata"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/dashboard/projects?search=${encodeURIComponent(cli.company_name)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"
                      >
                        <FolderKanban className="w-3 h-3" />
                        <span>{cli.projects_count ?? cli.projects?.length ?? 0}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/dashboard/tickets?client_id=${cli.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition"
                      >
                        <LifeBuoy className="w-3 h-3" />
                        <span>{cli.tickets_count ?? 0}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          cli.portal_access_status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {cli.portal_access_status === "active" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Enabled</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Disabled</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleResendInvite(cli)}
                          disabled={sendingInviteId === cli.id}
                          title="Send / Resend Mobile App Activation Link"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer disabled:opacity-50 transition"
                        >
                          {sendingInviteId === cli.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(cli)}
                          title="Edit Client"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cli)}
                          title="Delete Client"
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

      {/* Modal: Create / Edit Client */}
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
                    {isEditing ? "Edit Client Profile" : "Register New Client"}
                  </h2>
                  <p className="text-xs text-slate-500">Corporate profile and Client Portal provisioning</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization Name <span className="text-red-500">*</span>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Contact Person <span className="text-red-500">*</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Portal Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98310 98765"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 19AAECK4829K1ZX"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Portal Status</label>
                  <select
                    value={formData.portal_access_status}
                    onChange={(e) => setFormData({ ...formData, portal_access_status: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="inactive">Suspended / Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Billing Address</label>
                <input
                  type="text"
                  placeholder="Office suite, Tech park, Sector V, Salt Lake, Kolkata 700091"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
              </div>

              {/* Mobile App Access Block */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-blue-900 text-xs">Client Mobile App Access</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Passwordless Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  For confidentiality and compliance, passwords are never stored or managed by administrators. Clients set their own private password via the email invitation link for the Mobile App.
                </p>
                {isEditing && (
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
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contractual remarks or billing SLA preferences"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
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
                    <span>{isEditing ? "Update Client" : "Register Client"}</span>
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
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <strong className="text-slate-900">{deleteConfirm.company_name}</strong>?
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

