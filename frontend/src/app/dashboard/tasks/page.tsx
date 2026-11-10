"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Project, Task, User } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  User as UserIcon,
  Briefcase,
  AlertCircle,
  Loader2,
  X,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

function TasksContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project_id") || "";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedProject, setSelectedProject] = useState(initialProjectId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [summary, setSummary] = useState<Record<string, number>>({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    description: "",
    assigned_to: "",
    status: "todo",
    priority: "medium",
    estimated_hours: "8",
    logged_hours: "0",
    due_date: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProject) params.append("project_id", selectedProject);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);

      const res = await api.request(`/tasks?${params.toString()}`);
      setTasks(res.tasks.data);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err: unknown) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.request("/projects?per_page=100"),
        api.request("/users?per_page=100"),
      ]);
      setProjects(projRes.projects.data);
      setUsers(usersRes.users.data);
    } catch (err) {
      console.error("Auxiliary data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const openCreateModal = (defaultStatus = "todo") => {
    setFormData({
      project_id: selectedProject || (projects[0]?.id ? projects[0].id.toString() : ""),
      title: "",
      description: "",
      assigned_to: users[0]?.id ? users[0].id.toString() : "",
      status: defaultStatus,
      priority: "medium",
      estimated_hours: "8",
      logged_hours: "0",
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    });
    setFormError(null);
    setIsEditing(false);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setFormData({
      project_id: t.project_id.toString(),
      title: t.title,
      description: t.description || "",
      assigned_to: t.assigned_to ? t.assigned_to.toString() : "",
      status: t.status,
      priority: t.priority,
      estimated_hours: t.estimated_hours ? t.estimated_hours.toString() : "0",
      logged_hours: t.logged_hours ? t.logged_hours.toString() : "0",
      due_date: t.due_date || "",
    });
    setFormError(null);
    setIsEditing(true);
    setEditingId(t.id);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const endpoint = isEditing ? `/tasks/${editingId}` : "/tasks";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        project_id: Number(formData.project_id),
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        estimated_hours: Number(formData.estimated_hours) || 0,
        logged_hours: Number(formData.logged_hours) || 0,
      };

      await api.request(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setModalOpen(false);
      startTransition(() => {
        fetchTasks();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save task.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await api.request(`/tasks/${task.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirmTask) return;
    try {
      await api.request(`/tasks/${deleteConfirmTask.id}`, {
        method: "DELETE",
      });
      setDeleteConfirmTask(null);
      fetchTasks();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const kanbanColumns = [
    { id: "todo", title: "To Do", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-200 text-slate-700" },
    { id: "in_progress", title: "In Progress", bg: "bg-blue-50/50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800" },
    { id: "in_review", title: "In Review", bg: "bg-purple-50/50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800" },
    { id: "completed", title: "Done", bg: "bg-emerald-50/50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800" },
    { id: "blocked", title: "Blocked", bg: "bg-red-50/50", border: "border-red-200", badge: "bg-red-100 text-red-800" },
  ];

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tasks & Agile Kanban Board
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Track engineering sprints, task statuses, hours, and team workload.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "kanban" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {kanbanColumns.map((col) => (
          <div key={col.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {col.title}
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {summary[col.id] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task title or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </form>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {(selectedProject || search || priorityFilter) && (
            <button
              onClick={() => {
                setSelectedProject("");
                setSearch("");
                setPriorityFilter("");
                fetchTasks();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Board View: Kanban or List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Updating tasks board...</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      {col.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreateModal(col.id)}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[75vh] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition space-y-2.5"
                      >
                        {/* Project Code & Priority */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {t.project?.code || "KAB"}
                          </span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full uppercase border ${getPriorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {t.title}
                        </h4>

                        {t.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {t.description}
                          </p>
                        )}

                        {/* Footer: Due Date & Assignee */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {t.due_date ? t.due_date : "No date"}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              {t.assignee?.name?.slice(0, 2).toUpperCase() || "NA"}
                            </div>
                          </div>
                        </div>

                        {/* Quick Status Stepper */}
                        <div className="pt-1 flex items-center justify-between gap-1 border-t border-slate-50 text-[10px]">
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t, e.target.value)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Done</option>
                            <option value="blocked">Blocked</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmTask(t)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Task Title & Project</th>
                <th className="py-3 px-6">Assignee</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Priority</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-6">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.title}</p>
                      <span className="font-mono text-[10px] text-blue-600 font-semibold">
                        {t.project?.code} • {t.project?.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="font-medium text-slate-800">
                      {t.assignee?.name || "Unassigned"}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t, e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getPriorityBadge(
                        t.priority
                      )}`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">{t.due_date || "—"}</td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTask(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create / Edit Task */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? "Modify Task" : "Assign New Task"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set deliverable objectives, estimates, and assign engineers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Project <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Implement OAuth2 Refresh Token Strategy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Description / Acceptance Criteria
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details or links for testing criteria..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated (Hrs)
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    placeholder="8"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
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
                    <span>{isEditing ? "Save Task" : "Create Task"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Task</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete task <strong className="text-slate-900">{deleteConfirmTask.title}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmTask(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
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

export default function TasksPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading Kanban Workspace...</p>
          </div>
        }
      >
        <TasksContent />
      </Suspense>
    </AdminLayout>
  );
}

