"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBrand } from "@/context/BrandContext";
import { api, PortalDashboardData, Ticket, Project } from "@/lib/api";
import {
  Building2,
  FolderKanban,
  LifeBuoy,
  Receipt,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  LogOut,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

function PortalContent() {
  const router = useRouter();
  const { brand } = useBrand();
  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tickets">("overview");

  // Ticket creation modal
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    project_id: "",
    subject: "",
    type: "issue" as "issue" | "change_request" | "improvement" | "query" | "billing",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    description: "",
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // Active Ticket Drawer for Thread Viewing & Replying
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.request("/portal/dashboard");
      setData(res);
    } catch (err: unknown) {
      console.error("Portal fetch error:", err);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleLogout = () => {
    api.removeToken();
    router.push("/login");
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTicketSubmitting(true);
      const payload = {
        ...ticketForm,
        project_id: ticketForm.project_id ? Number(ticketForm.project_id) : null,
      };
      await api.request("/portal/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreateTicketOpen(false);
      setTicketForm({
        project_id: "",
        subject: "",
        type: "issue",
        priority: "medium",
        description: "",
      });
      fetchPortalData();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setTicketSubmitting(false);
    }
  };

  const openTicketModal = async (ticket: Ticket) => {
    try {
      const res = await api.request(`/portal/tickets/${ticket.id}`);
      setSelectedTicket(res.ticket);
      setReplyMessage("");
    } catch (err) {
      console.error("Failed to load ticket details:", err);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setReplySubmitting(true);
      const res = await api.request(`/portal/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: replyMessage }),
      });
      setSelectedTicket(res.ticket);
      setReplyMessage("");
      fetchPortalData();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setReplySubmitting(false);
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
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading Kabhyan Client Portal...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Portal Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {errorMessage || "Please log in with your client account credentials to access your projects and tickets."}
          </p>
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-[11px] mb-6 text-left border border-blue-100">
            <p className="font-bold mb-1">Demo Client Credentials:</p>
            <p>Email: <code className="font-mono font-bold">client@kolkatafintech.in</code></p>
            <p>Password: <code className="font-mono font-bold">Client@2026</code></p>
          </div>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const { client, projects, recent_tickets, stats } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Corporate Portal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={brand.logoPrimary || "/logo.png"}
              alt={brand.companyName || "Kabhyan Technologies"}
              width={160}
              height={44}
              unoptimized
              className="h-9 w-auto object-contain"
            />
            <span className="hidden sm:inline-block h-5 w-px bg-slate-200 mx-1" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hidden sm:inline-block">
              Client Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{client.company_name}</p>
              <p className="text-[11px] text-slate-500">{client.name}</p>
            </div>

            <button
              onClick={() => {
                setTicketForm({
                  project_id: projects[0]?.id ? projects[0].id.toString() : "",
                  subject: "",
                  type: "issue",
                  priority: "medium",
                  description: "",
                });
                setCreateTicketOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise Ticket</span>
            </button>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Bar */}
      <div className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 border-b-2 transition cursor-pointer ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`py-3.5 border-b-2 transition cursor-pointer ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            My Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`py-3.5 border-b-2 transition cursor-pointer ${
              activeTab === "tickets"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Tickets & Support ({recent_tickets.length})
          </button>
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {activeTab === "overview" && (
          <>
            {/* Greeting Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-300">
                  Welcome to Kabhyan Project Space
                </span>
                <h1 className="text-2xl font-black tracking-tight mt-1">
                  Hello, {client.name}
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Track live engineering milestone progress, view deliverable tasks, submit change requests, and communicate directly with your dedicated development team.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCreateTicketOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-xs transition cursor-pointer"
                >
                  Raise New Request
                </button>
              </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Projects</span>
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">{stats.active_projects}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{stats.total_projects} total commissioned</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Tickets</span>
                  <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-purple-700 mt-2">{stats.open_tickets}</p>
                <p className="text-[11px] text-purple-600/80 mt-0.5">Issues & Change Requests</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Projects</span>
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-700 mt-2">{stats.completed_projects}</p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">Delivered to production</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Reference</span>
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-lg font-mono font-bold text-slate-900 mt-2">{client.client_code}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">GSTIN: {client.gstin || "N/A"}</p>
              </div>
            </div>

            {/* Active Projects List */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Your Engineering Projects</h3>
                  <p className="text-xs text-slate-500">Live development status and milestones.</p>
                </div>
                <button
                  onClick={() => setActiveTab("projects")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {proj.code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{proj.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {proj.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{proj.description}</p>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Milestone Progress</span>
                        <span className="font-mono">{proj.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${proj.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>Deadline: <strong className="text-slate-800">{proj.deadline || "TBD"}</strong></span>
                      <span>Tasks: <strong className="text-slate-800">{proj.tasks?.length ?? 0} items</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Tickets Activity */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Support & Change Requests</h3>
                  <p className="text-xs text-slate-500">Track issues, feature requests, and engineering replies.</p>
                </div>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Tickets</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {recent_tickets.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No open tickets. Everything is running smoothly!</p>
                ) : (
                  recent_tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => openTicketModal(t)}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100">
                          {t.ticket_number}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{t.subject}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {t.project ? t.project.name : "General Scope"} • {new Date(t.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getTypeBadge(t.type)}`}>
                          {t.type.replace("_", " ")}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(t.status)}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Tab: Projects Detail */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Commissioned Projects Portfolio</h2>
              <p className="text-xs text-slate-500 mt-0.5">Full task breakdown and sprint completion.</p>
            </div>

            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {proj.code}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{proj.name}</h3>
                      <p className="text-xs text-slate-500">{proj.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {proj.status.replace("_", " ")}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">Deadline: {proj.deadline || "TBD"}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Milestone Progress Completion</span>
                      <span className="font-mono text-blue-700">{proj.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {proj.tasks && proj.tasks.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Deliverable Tasks & Sprint Backlog
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {proj.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-800 line-clamp-1">{task.title}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                task.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Tickets Support */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Support & Change Requests</h2>
                <p className="text-xs text-slate-500 mt-0.5">Communicate directly with engineering and account managers.</p>
              </div>
              <button
                onClick={() => setCreateTicketOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Raise Ticket</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {recent_tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openTicketModal(t)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                          {t.ticket_number}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getTypeBadge(t.type)}`}>
                          {t.type.replace("_", " ")}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(t.status)}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>View Discussion</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Client Raises Ticket */}
      {createTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs print:hidden">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Raise Support or Change Request</h2>
                  <p className="text-xs text-slate-500">Submit an issue, change, or inquiry to Kabhyan</p>
                </div>
              </div>
              <button
                onClick={() => setCreateTicketOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commissioned Project</label>
                <select
                  value={ticketForm.project_id}
                  onChange={(e) => setTicketForm({ ...ticketForm, project_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">General (No Specific Project)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need Excel export in invoice module / Webhook timeout error"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classification Type</label>
                  <select
                    value={ticketForm.type}
                    onChange={(e) => setTicketForm({ ...ticketForm, type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="issue">Issue / Bug</option>
                    <option value="change_request">Change Request</option>
                    <option value="improvement">Improvement Proposal</option>
                    <option value="query">Technical Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency / Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (System Blocker)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comprehensive Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe what happened, expected behavior, or change specifications..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateTicketOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {ticketSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Client Views Thread & Replies */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                  {selectedTicket.ticket_number}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{selectedTicket.subject}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedTicket.project?.name || "General Inquiry"}
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getTypeBadge(selectedTicket.type)}`}>
                    {selectedTicket.type.replace("_", " ")}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium pt-1">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Thread History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Engineering Conversation</span>
                </h4>

                {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                  selectedTicket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-xl border leading-relaxed ${
                        reply.is_staff_reply
                          ? "bg-blue-50/70 border-blue-200/80 mr-4 sm:mr-8"
                          : "bg-slate-50 border-slate-200 ml-4 sm:ml-8"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/60">
                        <span className="font-bold text-slate-900">
                          {reply.is_staff_reply ? "Kabhyan Engineering Team" : "You (Client)"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-xs py-2">
                    Our engineering team has received your ticket and is reviewing it.
                  </p>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostReply} className="pt-4 border-t border-slate-200 space-y-3">
                <textarea
                  rows={3}
                  required
                  placeholder="Reply with more context or feedback..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={replySubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {replySubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading Portal...</p>
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}

