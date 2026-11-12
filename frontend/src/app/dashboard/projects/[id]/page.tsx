"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, Project, Task, User } from "@/lib/api";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  LayoutGrid,
  ListFilter,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const COLUMNS: { id: Task["status"]; label: string; color: string; bg: string; badge: string }[] = [
  { id: "todo", label: "To Do", color: "border-slate-300 text-slate-700", bg: "bg-slate-50/70", badge: "bg-slate-100 text-slate-700" },
  { id: "in_progress", label: "In Progress", color: "border-blue-400 text-blue-700", bg: "bg-blue-50/40", badge: "bg-blue-100 text-blue-700" },
  { id: "in_review", label: "In Review", color: "border-purple-400 text-purple-700", bg: "bg-purple-50/40", badge: "bg-purple-100 text-purple-700" },
  { id: "completed", label: "Completed", color: "border-emerald-400 text-emerald-700", bg: "bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" },
  { id: "blocked", label: "Blocked", color: "border-rose-400 text-rose-700", bg: "bg-rose-50/40", badge: "bg-rose-100 text-rose-700" },
];

const PRIORITIES: { id: Task["priority"]; label: string; badge: string }[] = [
  { id: "low", label: "Low", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  { id: "medium", label: "Medium", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "high", label: "High", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "urgent", label: "Urgent", badge: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function ProjectWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = params?.id as string;
  const initialTab = (searchParams.get("tab") as "kanban" | "list" | "overview") || "kanban";

  const [activeTab, setActiveTab] = useState<"kanban" | "list" | "overview">(initialTab);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  // Create / Edit Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    assigned_to: "",
    estimated_hours: "",
    due_date: "",
  });

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const res = await api.request(`/projects/${projectId}`) as { project: Project };
      setProject(res.project);
      setTasks(res.project.tasks || []);

      // Load team users for assignment
      try {
        const usersRes = await api.request("/users?status=active") as { users: User[] };
        setTeamUsers(usersRes.users || []);
      } catch (e) {
        console.error("Failed to load users for assignment", e);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load project";
      toast.error(msg);
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Sync tab with URL
  const switchTab = (tab: "kanban" | "list" | "overview") => {
    setActiveTab(tab);
    router.replace(`/dashboard/projects/${projectId}?tab=${tab}`, { scroll: false });
  };

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as Task["status"];

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.request(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
    } catch (error) {
      setTasks(previousTasks);
      toast.error("Failed to update task status");
    }
  };

  const openCreateModal = (defaultStatus: Task["status"] = "todo") => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      assigned_to: "",
      estimated_hours: "",
      due_date: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to ? task.assigned_to.toString() : "",
      estimated_hours: task.estimated_hours ? task.estimated_hours.toString() : "",
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      setSavingTask(true);
      const payload: Record<string, unknown> = {
        project_id: project?.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        due_date: formData.due_date || null,
      };

      if (editingTask) {
        await api.request(`/tasks/${editingTask.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Task updated successfully");
      } else {
        await api.request("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Task created successfully");
      }

      setIsModalOpen(false);
      // Reload project and tasks
      await loadProjectData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save task";
      toast.error(msg);
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.request(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task removed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete task";
      toast.error(msg);
    }
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority =
        filterPriority === "all" || task.priority === filterPriority;

      const matchesAssignee =
        filterAssignee === "all" ||
        (filterAssignee === "unassigned" && !task.assigned_to) ||
        (task.assigned_to && task.assigned_to.toString() === filterAssignee);

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, blocked, progress };
  }, [tasks]);

  if (loading || !project) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading project workspace...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* TOP BREADCRUMB & HEADER */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/dashboard/projects"
              className="hover:text-blue-600 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects Portfolio</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">{project.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider border border-blue-100">
                  {project.code}
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {project.name}
                </h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    project.status === "in_progress"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : project.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : project.status === "on_hold"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                {project.description || "Agile project workspace for sprint deliverables, engineering tasks, and team tracking."}
              </p>
              {project.client_name && (
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium pt-1">
                  <span className="text-slate-400">Client:</span>
                  <span className="font-semibold text-slate-800">{project.client_name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => openCreateModal("todo")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">Total Tasks</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-blue-600">In Progress</p>
            <p className="text-xl font-black text-blue-700 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-emerald-600">Completed</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-2xs font-bold uppercase tracking-wider text-rose-600">Blocked</p>
            <p className="text-xl font-black text-rose-700 mt-1">{stats.blocked}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">Progress</p>
              <span className="text-xs font-black text-slate-900">{stats.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* TAB CONTROLS & SEARCH / FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          {/* TABS */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit">
            <button
              onClick={() => switchTab("kanban")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "kanban"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Sprint Kanban</span>
            </button>
            <button
              onClick={() => switchTab("list")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "list"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Task List</span>
            </button>
            <button
              onClick={() => switchTab("overview")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "overview"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Overview & Team</span>
            </button>
          </div>

          {/* SEARCH & FILTERS (Only in kanban and list tabs) */}
          {activeTab !== "overview" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {teamUsers.map((u) => (
                  <option key={u.id} value={u.id.toString()}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: KANBAN BOARD */}
        {activeTab === "kanban" && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
              {COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className={`rounded-2xl border border-slate-200/80 ${col.bg} p-3 flex flex-col min-h-[500px] shadow-2xs`}
                  >
                    {/* COLUMN HEADER */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 tracking-tight">
                          {col.label}
                        </span>
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                          {colTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => openCreateModal(col.id)}
                        className="text-slate-400 hover:text-blue-600 transition p-1 rounded-md hover:bg-white"
                        title="Add task to this column"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* DROPPABLE AREA */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 space-y-2.5 transition-colors rounded-xl p-1 ${
                            snapshot.isDraggingOver ? "bg-blue-100/40 ring-2 ring-blue-400/40" : ""
                          }`}
                        >
                          {colTasks.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id.toString()}
                              index={index}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={`bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition group cursor-grab active:cursor-grabbing ${
                                    dragSnapshot.isDragging ? "shadow-lg ring-2 ring-blue-500 rotate-1" : ""
                                  }`}
                                >
                                  {/* Task Priority & Actions */}
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                      className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                                        PRIORITIES.find((p) => p.id === task.priority)?.badge ||
                                        "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(task);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTask(task.id);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Task Title */}
                                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                    {task.title}
                                  </h4>

                                  {/* Task Description Snippet */}
                                  {task.description && (
                                    <p className="text-2xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Task Footer / Assignee / Due date */}
                                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-3xs text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-3xs shrink-0">
                                        {task.assignee ? task.assignee.name.charAt(0) : "?"}
                                      </div>
                                      <span className="truncate">
                                        {task.assignee ? task.assignee.name : "Unassigned"}
                                      </span>
                                    </div>

                                    {task.due_date && (
                                      <div className="flex items-center gap-1 text-slate-400 shrink-0">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(task.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {colTasks.length === 0 && (
                            <div className="py-8 text-center border-2 border-dashed border-slate-200/80 rounded-xl">
                              <p className="text-3xs font-semibold text-slate-400">
                                No tasks
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* TAB 2: TASK LIST TABLE */}
        {activeTab === "list" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-2xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Est. Hours</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                        No tasks match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-md">
                          <div>
                            <span className="hover:text-blue-600 transition cursor-pointer" onClick={() => openEditModal(task)}>
                              {task.title}
                            </span>
                            {task.description && (
                              <p className="text-2xs text-slate-400 font-normal line-clamp-1 mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              COLUMNS.find((c) => c.id === task.status)?.badge || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              PRIORITIES.find((p) => p.id === task.priority)?.badge || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {task.assignee ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-3xs">
                                {task.assignee.name.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-800">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {task.estimated_hours ? `${task.estimated_hours} hrs` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OVERVIEW & TEAM */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Project Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Project Code</p>
                    <p className="font-bold text-slate-800 mt-0.5">{project.code}</p>
                  </div>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Client</p>
                    <p className="font-bold text-slate-800 mt-0.5">{project.client_name || "Internal Project"}</p>
                  </div>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Priority</p>
                    <p className="font-bold text-slate-800 mt-0.5 capitalize">{project.priority}</p>
                  </div>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Budget</p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {project.budget ? `₹${project.budget.toLocaleString("en-IN")}` : "Unspecified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Start Date</p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Not scheduled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Deadline</p>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Open ended"}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Scope & Description</p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {project.description || "No full description provided for this project."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Team Members */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Assigned Team
                  </h3>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {(project.members?.length || 0) + (project.manager ? 1 : 0)} members
                  </span>
                </div>

                {/* Manager */}
                {project.manager && (
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                    <span className="text-3xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-200/60 text-blue-800">
                      Project Lead / Manager
                    </span>
                    <p className="text-xs font-bold text-slate-900 pt-1">{project.manager.name}</p>
                    <p className="text-2xs text-slate-500">{project.manager.email}</p>
                  </div>
                )}

                {/* Members list */}
                <div className="space-y-2">
                  {project.members && project.members.length > 0 ? (
                    project.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                          <p className="text-3xs text-slate-400 truncate">{m.designation || m.role}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-2xs text-slate-400 italic">No additional team members assigned yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE / EDIT TASK */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {editingTask ? "Edit Sprint Task" : "Add Task to Project"}
                    </h3>
                    <p className="text-2xs text-slate-400">
                      Project: <strong className="text-slate-700">{project.name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="p-5 space-y-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Implement OAuth2 refresh tokens"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Description & Acceptance Criteria
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details, scope, and technical acceptance guidelines..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Task["status"] })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {COLUMNS.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task["priority"] })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Assignee
                    </label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option value="">Unassigned</option>
                      {teamUsers.map((u) => (
                        <option key={u.id} value={u.id.toString()}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 4.5"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTask}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60"
                  >
                    {savingTask && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingTask ? "Update Task" : "Create Task"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
