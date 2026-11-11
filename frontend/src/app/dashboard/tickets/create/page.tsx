"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, Client, Project, User } from "@/lib/api";
import {
  LifeBuoy,
  Building,
  FolderKanban,
  User as UserIcon,
  AlertCircle,
  ArrowLeft,
  Save,
  Loader2,
  Tag,
  Flag,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

export default function CreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    client_id: "",
    project_id: "",
    assigned_to: "",
    subject: "",
    type: "issue" as "issue" | "change_request" | "improvement" | "query" | "billing",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsRes, projectsRes, staffRes] = await Promise.all([
          api.request("/clients"),
          api.request("/projects"),
          api.request("/users"),
        ]);

        const loadedClients = clientsRes.clients?.data || [];
        setClients(loadedClients);
        setProjects(projectsRes.projects?.data || []);
        setStaffUsers(staffRes.users || []);

        if (loadedClients.length > 0) {
          setFormData((prev) => ({
            ...prev,
            client_id: prev.client_id || loadedClients[0].id.toString(),
          }));
        }
      } catch (err) {
        console.error("Failed to load ticket dependency data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.client_id) {
      setFormError("Please select a client.");
      return;
    }
    if (!formData.subject.trim()) {
      setFormError("Ticket Subject/Title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Ticket description details are required.");
      return;
    }

    try {
      setSaving(true);
      await api.request("/tickets", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      router.push("/dashboard/tickets");
    } catch (err: any) {
      setFormError(err.message || "Failed to create ticket.");
      setSaving(false);
    }
  };

  const selectedClient = clients.find((c) => c.id.toString() === formData.client_id);
  const selectedProject = projects.find((p) => p.id.toString() === formData.project_id);
  const selectedStaff = staffUsers.find((u) => u.id.toString() === formData.assigned_to);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/tickets"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  New Support Request
                </span>
                <span className="text-xs text-slate-400">Client Service Desk</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Create Support Ticket / Change Request
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/tickets"
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Creating Ticket..." : "Open Ticket"}</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Core Classification Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Ticket Classification & Assignment
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Client Organization *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        required
                        value={formData.client_id}
                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      >
                        <option value="">Select client...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.company_name} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Linked Project (Optional)
                    </label>
                    <div className="relative">
                      <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      >
                        <option value="">No specific project link</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.code}] {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ticket Category
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      >
                        <option value="issue">Bug / System Defect</option>
                        <option value="change_request">Scope Change Request</option>
                        <option value="improvement">Feature Enhancement</option>
                        <option value="query">Technical / General Query</option>
                        <option value="billing">Invoicing & Billing Query</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      SLA Urgency / Priority
                    </label>
                    <div className="relative">
                      <Flag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      >
                        <option value="low">Low (Standard Backlog)</option>
                        <option value="medium">Medium (Within SLA)</option>
                        <option value="high">High (Priority Attention)</option>
                        <option value="critical">Critical (Immediate Production Blocker)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Assigned Lead Developer / PM
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      >
                        <option value="">Unassigned (Queue)</option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({typeof u.role === 'object' && u.role !== null ? (u.role as any).name : (u.role || "Staff")})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Issue Statement & Reproduction Steps
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subject / Title Summary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Payment gateway timeout on checkout step 3"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Detailed Description, Logs & Expected Outcomes *
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Describe what occurred, steps to reproduce, browser/device environment, expected behavior, and error trace if available..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Clear reproduction steps help engineers diagnose and resolve tickets rapidly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Column (4 cols) */}
          <div className="lg:col-span-4 sticky top-6 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ticket Routing Summary
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                  Ready to Dispatch
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Client</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {selectedClient ? selectedClient.company_name : "Select a client"}
                  </p>
                  {selectedClient && (
                    <p className="text-[11px] text-slate-500">Contact: {selectedClient.name}</p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Project</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedProject ? `[${selectedProject.code}] ${selectedProject.name}` : "General (No project)"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Classification:</span>
                    <span className="capitalize font-bold text-slate-800">
                      {formData.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Priority Level:</span>
                    <span className="uppercase text-[11px] font-black px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {formData.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assignee:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedStaff ? selectedStaff.name : "Unassigned Queue"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Open & Dispatch Ticket</span>
                </button>
                <Link
                  href="/dashboard/tickets"
                  className="w-full flex items-center justify-center py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                >
                  Discard & Return
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Real-Time Client Notification
              </p>
              <p className="text-purple-700/90 leading-relaxed text-[11px]">
                Upon creation, an email notification with a direct portal ticket tracking link is dispatched to both the client contact and assigned staff member.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

