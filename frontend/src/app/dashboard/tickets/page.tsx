"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Ticket, TicketStats, Client, Project, User } from "@/lib/api";
import Link from "next/link";
import {
  LifeBuoy,
  Search,
  Filter,
  Plus,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Building,
  FolderKanban,
  User as UserIcon,
  Loader2,
  X,
  FileCheck,
  CheckCircle,
} from "lucide-react";

function TicketsContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Modals / Thread Drawer
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    project_id: "",
    assigned_to: "",
    subject: "",
    type: "issue" as "issue" | "change_request" | "improvement" | "query" | "billing",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    description: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (priorityFilter) params.append("priority", priorityFilter);

      const res = await api.request(`/tickets?${params.toString()}`);
      setTickets(res.tickets.data);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [cliRes, projRes, userRes] = await Promise.all([
        api.request("/clients?per_page=100"),
        api.request("/projects?per_page=100"),
        api.request("/users?per_page=100"),
      ]);
      setClients(cliRes.clients.data || []);
      setProjects(projRes.projects.data || []);
      setStaffUsers(userRes.users?.data || userRes.users || []);
    } catch (err) {
      console.error("Failed to load supporting data:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    fetchSupportData();
  }, []);

  const openTicketDrawer = async (ticket: Ticket) => {
    try {
      const res = await api.request(`/tickets/${ticket.id}`);
      setSelectedTicket(res.ticket);
      setReplyStatus(res.ticket.status);
      setReplyMessage("");
    } catch (err) {
      console.error("Failed to load ticket details:", err);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const res = await api.request(`/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          message: replyMessage,
          status: replyStatus,
        }),
      });

      setSelectedTicket(res.ticket);
      setReplyMessage("");
      fetchTickets();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (ticketId: number, status: string) => {
    try {
      const res = await api.request(`/tickets/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(res.ticket);
      }
      fetchTickets();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleAssigneeChange = async (ticketId: number, assigned_to: string) => {
    try {
      const res = await api.request(`/tickets/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ assigned_to: assigned_to ? Number(assigned_to) : null }),
      });
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(res.ticket);
      }
      fetchTickets();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const payload = {
        ...formData,
        client_id: Number(formData.client_id),
        project_id: formData.project_id ? Number(formData.project_id) : null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      };

      await api.request("/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setModalOpen(false);
      startTransition(() => {
        fetchTickets();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create ticket.");
      }
    } finally {
      setSaving(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "issue":
        return "bg-red-50 text-red-700 border-red-200";
      case "change_request":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "improvement":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "query":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "billing":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 font-bold";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "awaiting_client_reply":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "closed":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <LifeBuoy className="w-6 h-6" />
            </span>
            Client Support & Change Request Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resolve customer reported bugs, change requests, feature enhancements, and milestone queries.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              client_id: clients[0]?.id ? clients[0].id.toString() : "",
              project_id: "",
              assigned_to: "",
              subject: "",
              type: "issue",
              priority: "medium",
              description: "",
            });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_tickets}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all client projects</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Open & Unassigned</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{stats.open_tickets}</p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Needs staff response</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{stats.in_progress}</p>
              <p className="text-[11px] text-blue-600/80 mt-0.5">Engineering actively investigating</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Resolved</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{stats.resolved}</p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Delivered to client satisfaction</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
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
            placeholder="Search ticket number, subject, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="issue">Issue / Bug</option>
            <option value="change_request">Change Request</option>
            <option value="improvement">Improvement</option>
            <option value="query">Technical Query</option>
            <option value="billing">Billing / Scope</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_client_reply">Awaiting Client Reply</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Support Tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Tickets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              There are currently no tickets matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Ticket #</th>
                  <th className="py-3.5 px-6">Client / Project</th>
                  <th className="py-3.5 px-6">Subject & Classification</th>
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Assigned Engineer</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Discussion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                        {t.ticket_number}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 text-sm">
                        {t.client?.company_name || "Direct Client"}
                      </p>
                      {t.project ? (
                        <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                          <FolderKanban className="w-3 h-3" />
                          <span>{t.project.name}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">General Inquiry</p>
                      )}
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-bold text-slate-900 line-clamp-1">{t.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getTypeBadge(
                            t.type
                          )}`}
                        >
                          {t.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getPriorityBadge(
                          t.priority
                        )}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={t.assigned_to || ""}
                        onChange={(e) => handleAssigneeChange(t.id, e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border cursor-pointer focus:outline-none ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="awaiting_client_reply">Awaiting Client Reply</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openTicketDrawer(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-2xs transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Thread ({t.replies_count ?? 0})</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Discussion Thread Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                  {selectedTicket.ticket_number}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{selectedTicket.subject}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedTicket.client?.company_name} • {selectedTicket.project?.name || "General Scope"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content & Thread */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Meta & Description */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getTypeBadge(selectedTicket.type)}`}>
                    {selectedTicket.type.replace("_", " ")}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority} Priority
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedTicket.status)}`}>
                    Status: {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed pt-1 font-medium">
                  {selectedTicket.description}
                </p>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  Raised by client on {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>

              {/* Replies History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Discussion Conversation ({selectedTicket.replies?.length ?? 0})</span>
                </h4>

                {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                  selectedTicket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-xl border leading-relaxed ${
                        reply.is_staff_reply
                          ? "bg-blue-50/70 border-blue-200/80 ml-4 sm:ml-8"
                          : "bg-slate-50 border-slate-200 mr-4 sm:mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/60">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {reply.is_staff_reply ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              <span className="text-blue-900 font-bold">
                                {reply.staff?.name || "Kabhyan Engineering"} (Staff)
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <span className="text-slate-800 font-bold">
                                {selectedTicket.client?.name} (Client)
                              </span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-xs py-2">No replies yet. Post a response below.</p>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostReply} className="pt-4 border-t border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Send Staff Reply to Client
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Type technical update, resolution status or clarification question..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">Update Status To:</span>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="awaiting_client_reply">Awaiting Client Reply</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReply}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Post Reply</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Ticket */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Support Ticket</h2>
                  <p className="text-xs text-slate-500">Log bug, change request, or improvement task</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Associated Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">General (No Project)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ticket Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Webhook signature mismatch / Excel report export request"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classification Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="issue">Issue / Bug</option>
                    <option value="change_request">Change Request</option>
                    <option value="improvement">Improvement</option>
                    <option value="query">Technical Query</option>
                    <option value="billing">Billing Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign Engineer</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Reproduction Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide comprehensive details, error logs, and context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    <span>Create Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Support Tickets...</p>
          </div>
        }
      >
        <TicketsContent />
      </Suspense>
    </AdminLayout>
  );
}

