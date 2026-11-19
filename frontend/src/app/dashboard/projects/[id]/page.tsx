"use client";

import { useEffect, useState, useMemo, use, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, Project, Task, User, ProjectFileRequest } from "@/lib/api";
import {
  Briefcase,
  Calendar,
  Layers,
  LayoutGrid,
  ListFilter,
  Loader2,
  Plus,
  Search,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  UploadCloud,
  AlertTriangle,
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

function ProjectWorkspaceContent({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (searchParams?.get("tab") as "kanban" | "list" | "documents" | "overview") || "kanban";

  const [activeTab, setActiveTab] = useState<"kanban" | "list" | "documents" | "overview">(initialTab);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Client Document Requests & Client Tasks Visibility State
  const [fileRequests, setFileRequests] = useState<ProjectFileRequest[]>([]);
  const [canManageFiles, setCanManageFiles] = useState(false);
  const [showTasksToClient, setShowTasksToClient] = useState(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [savingDocRequest, setSavingDocRequest] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  const [docFormData, setDocFormData] = useState({
    title: "",
    description: "",
    file_type_allowed: "PDF, PNG, JPG, ZIP, DOCX",
    due_date: "",
    priority: "normal" as "normal" | "high" | "urgent",
  });
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    requestId: number | null;
    status: "approved" | "rejected";
    review_notes: string;
    requestTitle: string;
  }>({
    isOpen: false,
    requestId: null,
    status: "approved",
    review_notes: "",
    requestTitle: "",
  });
  const [savingReview, setSavingReview] = useState(false);

  // Native HTML5 DnD State
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null);

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
      const [res, fileRes] = await Promise.all([
        api.request(`/projects/${projectId}`) as Promise<{ project: Project }>,
        api.projectFileRequests.list(projectId).catch(() => ({
          file_requests: [] as ProjectFileRequest[],
          can_manage: false,
          show_tasks_to_client: true,
        })),
      ]);

      setProject(res.project);
      setTasks(res.project?.tasks || []);
      setFileRequests(fileRes.file_requests || []);
      setCanManageFiles(fileRes.can_manage);
      setShowTasksToClient(
        typeof fileRes.show_tasks_to_client === "boolean"
          ? fileRes.show_tasks_to_client
          : res.project.show_tasks_to_client ?? true
      );

      // Load team users for assignment - safely handle both Array and Laravel LengthAwarePaginator
      try {
        const usersRes = (await api.request("/users?status=active")) as any;
        const rawUsers = usersRes?.users?.data || usersRes?.users || [];
        setTeamUsers(Array.isArray(rawUsers) ? rawUsers : []);
      } catch (e) {
        console.error("Failed to load users for assignment", e);
        setTeamUsers([]);
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
  const switchTab = (tab: "kanban" | "list" | "documents" | "overview") => {
    setActiveTab(tab);
    router.replace(`/dashboard/projects/${projectId}?tab=${tab}`, { scroll: false });
  };

  // Toggle client task visibility
  const handleToggleClientVisibility = async () => {
    if (!canManageFiles) {
      toast.error("Only the assigned Project Lead or Admin can adjust client task visibility.");
      return;
    }
    try {
      setTogglingVisibility(true);
      const next = !showTasksToClient;
      const res = await api.projectFileRequests.updateVisibility(projectId, next);
      setShowTasksToClient(res.show_tasks_to_client);
      toast.success(
        res.show_tasks_to_client
          ? "Client visibility enabled. Tasks are now visible in Client Portal & App."
          : "Client visibility disabled. Internal tasks are now hidden from the client."
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update client visibility.");
    } finally {
      setTogglingVisibility(false);
    }
  };

  // Create file request
  const handleCreateDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormData.title.trim()) {
      toast.error("Please enter a document title.");
      return;
    }

    try {
      setSavingDocRequest(true);
      const res = await api.projectFileRequests.create(projectId, {
        title: docFormData.title.trim(),
        description: docFormData.description.trim() || undefined,
        file_type_allowed: docFormData.file_type_allowed.trim() || undefined,
        due_date: docFormData.due_date || undefined,
        priority: docFormData.priority,
      });

      toast.success("Document request sent to client.");
      setIsDocModalOpen(false);
      setDocFormData({
        title: "",
        description: "",
        file_type_allowed: "PDF, PNG, JPG, ZIP, DOCX",
        due_date: "",
        priority: "normal",
      });
      setFileRequests((prev) => [res.file_request, ...prev]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit document request.");
    } finally {
      setSavingDocRequest(false);
    }
  };

  // Download submitted document file
  const handleDownloadDoc = async (req: ProjectFileRequest) => {
    if (!req.file_name) return;
    try {
      setDownloadingFileId(req.id);
      await api.projectFileRequests.downloadFile(projectId, req.id, req.file_name);
      toast.success("Document downloaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to download document file.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Open PM Review Modal
  const handleOpenReview = (req: ProjectFileRequest, status: "approved" | "rejected") => {
    setReviewModal({
      isOpen: true,
      requestId: req.id,
      status,
      review_notes: req.review_notes || "",
      requestTitle: req.title,
    });
  };

  // Submit PM Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal.requestId) return;
    try {
      setSavingReview(true);
      const res = await api.projectFileRequests.review(projectId, reviewModal.requestId, {
        status: reviewModal.status,
        review_notes: reviewModal.review_notes.trim() || undefined,
      });
      toast.success(
        reviewModal.status === "approved"
          ? "Document approved and verified."
          : "Revision request submitted to client."
      );
      setReviewModal({
        isOpen: false,
        requestId: null,
        status: "approved",
        review_notes: "",
        requestTitle: "",
      });
      setFileRequests((prev) =>
        prev.map((item) => (item.id === res.file_request.id ? res.file_request : item))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setSavingReview(false);
    }
  };

  // Delete / cancel file request
  const handleDeleteDocRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to cancel and remove this client file request?")) return;
    try {
      await api.projectFileRequests.delete(projectId, requestId);
      setFileRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("File request cancelled and removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove file request.");
    }
  };

  // Move task status via Native Drag and Drop
  const handleMoveTask = async (taskId: number, newStatus: Task["status"]) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

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
    } catch {
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
      const payload: Record<string, any> = {
        project_id: projectId,
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

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            This project may have been deleted, archived, or the link is invalid.
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* TOP BREADCRUMB & HEADER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/dashboard/projects"
            className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects Portfolio</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{project.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] font-mono uppercase tracking-wider border border-blue-100">
                {project.code}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border ${
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
              <div className="flex items-center gap-2 text-xs text-slate-600 font-normal pt-0.5">
                <span className="text-slate-400">Client:</span>
                <span className="font-semibold text-slate-800">{project.client_name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* CLIENT TASKS VISIBILITY TOGGLE */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                showTasksToClient
                  ? "bg-blue-50/70 border-blue-200/80 text-blue-800"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <button
                type="button"
                onClick={handleToggleClientVisibility}
                disabled={togglingVisibility || !canManageFiles}
                title={
                  canManageFiles
                    ? (showTasksToClient ? "Click to hide tasks from client" : "Click to show tasks to client")
                    : "Only Project Lead or Admin can adjust client visibility"
                }
                className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showTasksToClient ? "bg-blue-600" : "bg-slate-300"
                } ${!canManageFiles ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showTasksToClient ? "translate-x-3 sm:translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-semibold select-none">
                {showTasksToClient ? (
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden sm:inline">Client Tasks:</span>
                <span className={showTasksToClient ? "text-blue-700" : "text-slate-500"}>
                  {showTasksToClient ? "Visible" : "Hidden"}
                </span>
              </div>
            </div>

            <button
              onClick={() => openCreateModal("todo")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Tasks</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">In Progress</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Completed</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Blocked</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{stats.blocked}</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Progress</p>
            <span className="text-xs font-bold text-slate-900">{stats.progress}%</span>
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
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit flex-wrap">
          <button
            onClick={() => switchTab("kanban")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "kanban"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => switchTab("list")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "list"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => switchTab("documents")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "documents"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Client Documents</span>
            {fileRequests.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  fileRequests.some((r) => r.status === "submitted")
                    ? "bg-blue-600 text-white animate-pulse"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {fileRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => switchTab("overview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
        </div>

        {/* SEARCH & FILTERS (Only in kanban and list tabs) */}
        {(activeTab === "kanban" || activeTab === "list") && (
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
              {(Array.isArray(teamUsers) ? teamUsers : []).map((u) => (
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverColumn !== col.id) {
                    setDragOverColumn(col.id);
                  }
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColumn(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  setDraggedTaskId(null);
                  const taskIdStr = e.dataTransfer.getData("text/plain");
                  const taskId = parseInt(taskIdStr, 10);
                  if (!isNaN(taskId)) {
                    handleMoveTask(taskId, col.id);
                  }
                }}
                className={`rounded-2xl border transition-all duration-200 ${
                  isOver
                    ? "border-blue-500 bg-blue-100/60 ring-2 ring-blue-400/50 shadow-md"
                    : `border-slate-200/80 ${col.bg} shadow-2xs`
                } p-3 flex flex-col min-h-[500px]`}
              >
                {/* COLUMN HEADER */}
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight">
                      {col.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreateModal(col.id)}
                    className="text-slate-400 hover:text-blue-600 transition p-1 rounded-md hover:bg-white cursor-pointer"
                    title="Add task to this column"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* TASK CARDS */}
                <div className="flex-1 space-y-2.5 rounded-xl p-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task.id.toString());
                        e.dataTransfer.effectAllowed = "move";
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColumn(null);
                      }}
                      className={`bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition group cursor-grab active:cursor-grabbing select-none ${
                        draggedTaskId === task.id ? "opacity-50 scale-95 border-blue-400 ring-2 ring-blue-300" : ""
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
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
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
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200/80 rounded-xl">
                      <p className="text-3xs font-semibold text-slate-400">
                        No tasks
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
                    {project.budget ? `₹${Number(project.budget).toLocaleString("en-IN")}` : "Unspecified"}
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

      {/* TAB 4: CLIENT DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* HEADER STRIP */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Client Document & Asset Requests
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Request verified contracts, specifications, brand assets, and KYC deliverables directly from the client.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {canManageFiles ? (
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request Document</span>
                </button>
              ) : (
                <span className="text-2xs text-slate-400 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
                  Read-only: Only Project Lead can request files
                </span>
              )}
            </div>
          </div>

          {/* METRICS MINI-STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Requested</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{fileRequests.length}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Awaiting Upload</p>
              <p className="text-lg font-bold text-amber-700 mt-0.5">
                {fileRequests.filter((r) => r.status === "pending").length}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Ready for Review</p>
              <p className="text-lg font-bold text-blue-700 mt-0.5">
                {fileRequests.filter((r) => r.status === "submitted").length}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Approved & Verified</p>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">
                {fileRequests.filter((r) => r.status === "approved").length}
              </p>
            </div>
          </div>

          {/* REQUESTS LIST */}
          {fileRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-2xs text-center max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Document Requests Yet</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Need assets, credentials, or signed agreements from the client? Use the request button to create a dedicated upload checkpoint.
              </p>
              {canManageFiles && (
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Document Request</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {fileRequests.map((req) => {
                const isSubmitted = req.status === "submitted";
                const isApproved = req.status === "approved";
                const isRejected = req.status === "rejected";
                const isPending = req.status === "pending";

                return (
                  <div
                    key={req.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 hover:border-slate-300 transition"
                  >
                    {/* Top Row: Title, Priority, Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              req.priority === "urgent"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : req.priority === "high"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {req.priority} Priority
                          </span>

                          <span
                            className={`text-3xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isSubmitted
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : isRejected
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {isApproved && <CheckCircle className="w-3 h-3" />}
                            {isSubmitted && <UploadCloud className="w-3 h-3" />}
                            {isRejected && <AlertTriangle className="w-3 h-3" />}
                            {isPending && <Clock className="w-3 h-3" />}
                            <span>
                              {isApproved
                                ? "Approved & Verified"
                                : isSubmitted
                                ? "Uploaded • Ready for Review"
                                : isRejected
                                ? "Revision Requested"
                                : "Awaiting Client Upload"}
                            </span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mt-1">{req.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {canManageFiles && isPending && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocRequest(req.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Cancel Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description / Instructions */}
                    {req.description && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        {req.description}
                      </p>
                    )}

                    {/* Metadata strip: Allowed formats & Due date */}
                    <div className="flex items-center gap-4 text-2xs text-slate-500 flex-wrap">
                      {req.file_type_allowed && (
                        <div>
                          <span className="font-semibold text-slate-700">Format:</span>{" "}
                          <span className="font-mono text-slate-600">{req.file_type_allowed}</span>
                        </div>
                      )}
                      {req.due_date && (
                        <div>
                          <span className="font-semibold text-slate-700">Due:</span>{" "}
                          <span>
                            {new Date(req.due_date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {req.created_at && (
                        <div className="text-slate-400">
                          Requested: {new Date(req.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                      )}
                    </div>

                    {/* Uploaded File Box (if submitted/approved) */}
                    {req.file_name && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileCheck2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{req.file_name}</p>
                            <p className="text-3xs text-slate-500">
                              {req.file_size ? `${(req.file_size / 1024).toFixed(1)} KB` : "Uploaded Document"} •{" "}
                              {req.uploaded_at
                                ? new Date(req.uploaded_at).toLocaleString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Recent"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(req)}
                          disabled={downloadingFileId === req.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold text-xs shadow-2xs transition cursor-pointer shrink-0"
                        >
                          {downloadingFileId === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Download</span>
                        </button>
                      </div>
                    )}

                    {/* Review Notes (Revision feedback if present) */}
                    {req.review_notes && (
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                        <p className="font-bold text-2xs uppercase tracking-wider text-amber-800">
                          PM Review Notes:
                        </p>
                        <p className="leading-relaxed">{req.review_notes}</p>
                      </div>
                    )}

                    {/* PM Action Bar */}
                    {canManageFiles && (isSubmitted || isRejected) && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, "rejected")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                        >
                          Request Revision
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, "approved")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve Document</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
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
                    {(Array.isArray(teamUsers) ? teamUsers : []).map((u) => (
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 cursor-pointer"
                >
                  {savingTask && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTask ? "Update Task" : "Create Task"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST DOCUMENT FROM CLIENT */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Request Document from Client</h3>
                  <p className="text-2xs text-slate-400">
                    Project: <strong className="text-slate-700">{project.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocRequest} className="p-5 space-y-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Signed Statement of Work, Brand Identity Vector (SVG)"
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Instructions & Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain exactly what file, resolution, or format is required..."
                  value={docFormData.description}
                  onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={docFormData.priority}
                    onChange={(e) =>
                      setDocFormData({ ...docFormData, priority: e.target.value as "normal" | "high" | "urgent" })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Allowed Format(s)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PDF, PNG, JPG, ZIP"
                    value={docFormData.file_type_allowed}
                    onChange={(e) => setDocFormData({ ...docFormData, file_type_allowed: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={docFormData.due_date}
                  onChange={(e) => setDocFormData({ ...docFormData, due_date: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDocRequest}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 cursor-pointer"
                >
                  {savingDocRequest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Request to Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PM DOCUMENT REVIEW / REVISION */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    reviewModal.status === "approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {reviewModal.status === "approved" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {reviewModal.status === "approved"
                      ? "Approve Client Document"
                      : "Request Document Revision"}
                  </h3>
                  <p className="text-2xs text-slate-400 truncate max-w-xs">{reviewModal.requestTitle}</p>
                </div>
              </div>
              <button
                onClick={() =>
                  setReviewModal({
                    isOpen: false,
                    requestId: null,
                    status: "approved",
                    review_notes: "",
                    requestTitle: "",
                  })
                }
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {reviewModal.status === "approved"
                    ? "Approval Remarks (Optional)"
                    : "Revision Notes & Missing Items *"}
                </label>
                <textarea
                  rows={4}
                  required={reviewModal.status === "rejected"}
                  placeholder={
                    reviewModal.status === "approved"
                      ? "e.g., Verified vector format and dimensions. Accepted."
                      : "e.g., The uploaded PDF is missing the signature on page 3. Please re-upload with all signatures."
                  }
                  value={reviewModal.review_notes}
                  onChange={(e) =>
                    setReviewModal({ ...reviewModal, review_notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReviewModal({
                      isOpen: false,
                      requestId: null,
                      status: "approved",
                      review_notes: "",
                      requestTitle: "",
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReview}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 cursor-pointer ${
                    reviewModal.status === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {savingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {reviewModal.status === "approved" ? "Approve Document" : "Send Revision Request"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectWorkspaceResolver({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = useParams();
  const resolvedParams = use(params);
  const targetId = (resolvedParams?.id || routeParams?.id) as string;

  return <ProjectWorkspaceContent projectId={targetId} />;
}

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading project workspace...</p>
          </div>
        }
      >
        <ProjectWorkspaceResolver params={params} />
      </Suspense>
    </AdminLayout>
  );
}
