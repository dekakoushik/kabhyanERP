"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Briefcase,
  ChevronRight,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.portal.projects();
        setProjects(res.projects || []);
      } catch (err: unknown) {
        console.error("Failed to load projects:", err);
        toast.error("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
          <Link href="/portal" className="hover:text-slate-900">Portal</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Projects</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Projects &amp; Sprint Deliverables
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time visibility into sprint progress, deliverable completion, and engineering roadmaps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400">Loading project deliverables...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full p-12 bg-white border border-slate-200/80 rounded-xl text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No projects currently active</p>
            <p className="text-xs text-slate-400 mt-1">New projects will appear here once commissioned.</p>
          </div>
        ) : (
          projects.map((proj) => {
            const totalTasks = proj.tasks?.length || 0;
            const completedTasks = proj.tasks?.filter((t: any) => t.status === "completed").length || 0;
            const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={proj.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {proj.code || "PRJ"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {proj.name}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    proj.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {proj.status.replace("_", " ")}
                  </span>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {proj.description}
                  </p>
                )}

                {/* Progress Bar (Only if tasks are visible to client) */}
                {proj.show_tasks_to_client !== false ? (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>Deliverable Milestones</span>
                      <span>{progressPct}% ({completedTasks}/{totalTasks})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Internal Milestones</span>
                    <span className="text-2xs font-semibold text-slate-400">Managed by Team</span>
                  </div>
                )}

                {/* Requested Documents Indicator */}
                {proj.file_requests && proj.file_requests.length > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-slate-600 font-medium">Requested Documents</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        proj.file_requests.some((r: any) => r.status === "pending" || r.status === "rejected")
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {proj.file_requests.length} Document{proj.file_requests.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lead: {proj.manager?.name || "Kabhyan Team"}</span>
                  </div>

                  <Link
                    href={`/portal/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>View Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
