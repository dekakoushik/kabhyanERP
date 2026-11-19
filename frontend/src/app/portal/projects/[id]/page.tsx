"use client";

import { useEffect, useState, use, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ProjectFileRequest, Task } from "@/lib/api";
import { toast } from "sonner";
import {
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  User,
  UploadCloud,
  FileText,
  AlertTriangle,
  Download,
  Calendar,
  Check,
  FileCheck2,
} from "lucide-react";

function ClientProjectWorkspaceContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [fileRequests, setFileRequests] = useState<ProjectFileRequest[]>([]);
  const [showTasks, setShowTasks] = useState(true);
  const [loading, setLoading] = useState(true);

  // File upload state
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = (await api.portal.project(projectId)) as any;
      setProject(res.project);
      setShowTasks(typeof res.show_tasks_to_client === "boolean" ? res.show_tasks_to_client : true);
      setFileRequests(res.file_requests || res.project?.file_requests || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load project details.");
      router.push("/portal/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleFileUpload = async (requestId: number, file: File) => {
    if (!file) return;

    try {
      setUploadingId(requestId);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.portal.uploadFileRequest(projectId, requestId, formData);
      toast.success("Document uploaded successfully. It is now under review.");

      // Update state
      setFileRequests((prev) =>
        prev.map((r) => (r.id === requestId ? res.file_request : r))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document file.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleDownloadFile = async (req: ProjectFileRequest) => {
    if (!req.file_name) return;
    try {
      setDownloadingId(req.id);
      await api.portal.downloadFileRequest(projectId, req.id, req.file_name);
      toast.success("Document downloaded.");
    } catch (err: any) {
      toast.error(err.message || "Failed to download document.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const tasks: Task[] = showTasks ? project.tasks || [] : [];
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href="/portal/projects"
          className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">{project.name}</span>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] font-mono uppercase tracking-wider border border-blue-100">
                {project.code || "PRJ"}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border ${
                  project.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {(project.status || "active").replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {project.description || "Project deliverables, specifications, and client document checkpoint."}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
            <User className="w-4 h-4 text-blue-600" />
            <span>Lead: {project.manager?.name || "Kabhyan Project Lead"}</span>
          </div>
        </div>

        {/* Timeline Row */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Start Date</p>
            <p className="font-semibold text-slate-800 mt-0.5">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Not scheduled"}
            </p>
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Target Deadline</p>
            <p className="font-semibold text-slate-800 mt-0.5">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Ongoing"}
            </p>
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Requested Files</p>
            <p className="font-semibold text-slate-800 mt-0.5">{fileRequests.length} Item(s)</p>
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Sprint Tracking</p>
            <p className="font-semibold text-slate-800 mt-0.5">
              {showTasks ? `${progressPct}% Complete` : "Internal Coordination"}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: REQUESTED DOCUMENTS & FILES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Requested Documents &amp; Assets
            </h2>
          </div>
          {fileRequests.length > 0 && (
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {fileRequests.length} requested
            </span>
          )}
        </div>

        {fileRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">All Set! No Documents Requested</h4>
            <p className="text-2xs text-slate-400 max-w-md mx-auto">
              Your Project Lead has not requested any additional files or documents at this stage. Any future requests will appear right here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {fileRequests.map((req) => {
              const isSubmitted = req.status === "submitted";
              const isApproved = req.status === "approved";
              const isRejected = req.status === "rejected";
              const isPending = req.status === "pending";
              const isUploading = uploadingId === req.id;

              return (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4"
                >
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
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isSubmitted && <UploadCloud className="w-3 h-3" />}
                          {isRejected && <AlertTriangle className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          <span>
                            {isApproved
                              ? "Approved & Verified"
                              : isSubmitted
                              ? "Under Review by Lead"
                              : isRejected
                              ? "Revision Requested"
                              : "Awaiting Your Upload"}
                          </span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1">{req.title}</h3>
                    </div>

                    {req.due_date && (
                      <span className="text-2xs text-slate-500 font-medium">
                        Due: {new Date(req.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Description / Instructions */}
                  {req.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {req.description}
                    </p>
                  )}

                  {/* Format instruction */}
                  <div className="text-2xs text-slate-500">
                    <span className="font-semibold text-slate-700">Supported Formats:</span>{" "}
                    <span className="font-mono text-slate-600">{req.file_type_allowed || "PDF, PNG, JPG, ZIP, DOCX"}</span>
                  </div>

                  {/* Review Feedback if Revision Requested */}
                  {req.review_notes && isRejected && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                      <p className="font-bold text-2xs uppercase tracking-wider text-rose-700">
                        Revision Notes from Project Lead:
                      </p>
                      <p className="leading-relaxed">{req.review_notes}</p>
                    </div>
                  )}

                  {/* File Upload / Status Box */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {req.file_name ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileCheck2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{req.file_name}</p>
                          <p className="text-3xs text-slate-500">
                            {req.file_size ? `${(req.file_size / 1024).toFixed(1)} KB` : "Uploaded"} •{" "}
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
                    ) : (
                      <p className="text-2xs text-slate-400 italic">No document file uploaded yet.</p>
                    )}

                    <div className="flex items-center gap-2">
                      {req.file_name && (
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(req)}
                          disabled={downloadingId === req.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer"
                        >
                          {downloadingId === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Download</span>
                        </button>
                      )}

                      {/* Upload / Re-upload Button */}
                      {!isApproved && (
                        <div>
                          <input
                            type="file"
                            ref={(el) => {
                              fileInputRefs.current[req.id] = el;
                            }}
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(req.id, f);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[req.id]?.click()}
                            disabled={isUploading}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer ${
                              isRejected || isPending
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            {isUploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5" />
                            )}
                            <span>{req.file_name ? "Re-upload File" : "Upload Document"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: DELIVERABLES & SPRINTS (CONDITIONALLY VISIBLE) */}
      {showTasks ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Sprint Deliverables
              </h2>
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {completedTasks}/{tasks.length} Completed
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <p className="text-xs font-semibold text-slate-700">No sprint tasks published yet</p>
              <p className="text-2xs text-slate-400 mt-1">
                Upcoming deliverables and sprint items will be tracked here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Deliverable Title</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Target Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{task.title}</p>
                          {task.description && (
                            <p className="text-2xs text-slate-500 mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              task.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : task.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 text-xs text-slate-500 flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
          <p>
            Sprint deliverables and technical engineering milestones for this project are coordinated internally by your Project Lead. For updates, please reference the requested documents above or reach out via Support Tickets.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ClientProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = useParams();
  const resolvedParams = use(params);
  const targetId = (resolvedParams?.id || routeParams?.id) as string;

  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading project workspace...</p>
        </div>
      }
    >
      <ClientProjectWorkspaceContent projectId={targetId} />
    </Suspense>
  );
}
