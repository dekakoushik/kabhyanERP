"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, User } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User as UserIcon,
  ArrowLeft,
  Edit2,
  ShieldCheck,
  Building,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FolderGit2,
  CheckSquare,
  Lock,
  Activity,
  ShieldAlert,
} from "lucide-react";
import {
  groupPermissionsByModule,
  humanizeRole,
  humanizeStatus,
} from "@/lib/humanize";

export default function StaffDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "tasks" | "permissions">("overview");

  // Auxiliary dossier data
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [managedProjects, setManagedProjects] = useState<any[]>([]);
  const [memberProjects, setMemberProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksCount, setTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  const fetchStaffDossier = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.request(`/users/${resolvedParams.id}`);
      if (res?.user) {
        setUser(res.user);
        setEffectivePermissions(res.effective_permissions || []);
        setManagedProjects(res.managed_projects || []);
        setMemberProjects(res.member_projects || []);
        setTasks(res.tasks || []);
        setTasksCount(res.tasks_count || 0);
        setCompletedTasksCount(res.completed_tasks_count || 0);
      } else {
        throw new Error("Staff member record not found.");
      }
    } catch (err: any) {
      console.error("Failed to load staff dossier:", err);
      setError(err.message || "Failed to load staff record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDossier();
  }, [resolvedParams.id]);

  const handleStatusToggle = async () => {
    if (!user) return;
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      await api.request(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setUser({ ...user, status: nextStatus });
      toast.success(`Account status updated to ${nextStatus}.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading member profile...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Member Profile Not Found</h2>
          <p className="text-xs text-slate-500">{error || "Could not locate this team member's record."}</p>
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Team</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/users"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              title="Back to Team"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-0.5">
                <Link href="/dashboard" className="hover:text-slate-600 transition">Workspace</Link>
                <span>/</span>
                <Link href="/dashboard/users" className="hover:text-slate-600 transition">Team</Link>
                <span>/</span>
                <span className="font-semibold text-slate-700">{user.name}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                {user.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStatusToggle}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                user.status === "active"
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {user.status === "active" ? "Suspend Access" : "Activate Access"}
            </button>

            <Link
              href={`/dashboard/users/${user.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Hero Staff Card */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
                  {user.employee_code && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {user.employee_code}
                    </span>
                  )}
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    user.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {humanizeStatus(user.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{user.designation || "Staff Member"}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{user.department || "General Operations"}</span>
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-24">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Role</p>
                <p className="text-xs font-bold text-blue-700 capitalize mt-0.5">
                  {user.custom_role?.name || humanizeRole(user.role)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-24">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tasks</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {completedTasksCount} / {tasksCount}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-24">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Projects</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {managedProjects.length + memberProjects.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Overview & Records
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Projects</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-mono">
              {managedProjects.length + memberProjects.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "tasks"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Tasks & Sprints</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-mono">
              {tasksCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "permissions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Effective Permissions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-mono">
              {effectivePermissions.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Employment & Organizational Record
              </h3>
              <dl className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Department</dt>
                  <dd className="font-bold text-slate-800">{user.department || "General"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Job Designation</dt>
                  <dd className="font-bold text-slate-800">{user.designation || "Staff"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Joining Date</dt>
                  <dd className="font-medium text-slate-800">{user.date_of_joining || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Assigned Role</dt>
                  <dd className="font-bold text-blue-600 capitalize">{user.custom_role?.name || user.role}</dd>
                </div>
              </dl>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Activity className="w-4 h-4 text-blue-600" />
                Account Security & Login Activity
              </h3>
              <dl className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Last Login Time</dt>
                  <dd className="font-medium text-slate-800">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString("en-IN") : "Never logged in"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Emergency Contact</dt>
                  <dd className="font-medium text-slate-800">{user.emergency_contact || "None provided"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Account Status</dt>
                  <dd className="font-bold text-slate-800 capitalize">{user.status}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-semibold mb-0.5">Member Since</dt>
                  <dd className="font-medium text-slate-800">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "Recent"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Tab 2: Projects */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Assigned Project Workspaces</h3>
            {managedProjects.length === 0 && memberProjects.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl">
                <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No active projects assigned yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[...managedProjects, ...memberProjects].map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    className="p-4 bg-white border border-slate-200/80 hover:border-blue-400 rounded-xl shadow-xs transition group block"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                        {p.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-blue-600">{p.status}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {p.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Progress</span>
                      <span className="font-mono font-bold text-slate-700">{p.progress_percentage || 0}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Tasks */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Sprint & Deliverable Tasks</h3>
            {tasks.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl">
                <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No sprint tasks assigned.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
                {tasks.map((t) => (
                  <div key={t.id} className="p-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">{t.title}</p>
                      {t.project && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-600">{t.project.code}</span>
                          <span>•</span>
                          <span>{t.project.name}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        t.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Effective Permissions */}
        {activeTab === "permissions" && (() => {
          const permissionGroups = groupPermissionsByModule(effectivePermissions);

          return (
            <div className="space-y-4">
              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Role Capabilities & Permissions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Active permissions for <span className="font-semibold text-slate-800">{user.name}</span> inherited from role <span className="font-semibold text-slate-800">{user.custom_role?.name || humanizeRole(user.role)}</span>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-700 px-3 py-1 bg-blue-50 border border-blue-200/60 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {effectivePermissions.length} Active Privileges
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const isFullyActive = group.activeCount === group.totalCount && group.totalCount > 0;
                  const isPartiallyActive = group.activeCount > 0 && group.activeCount < group.totalCount;

                  return (
                    <div
                      key={group.module}
                      className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3.5 hover:border-slate-300 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                              <GroupIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{group.label}</h4>
                              <p className="text-[11px] text-slate-500">{group.description}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                              isFullyActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : isPartiallyActive
                                ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                : "bg-slate-50 text-slate-400 border border-slate-200/60"
                            }`}
                          >
                            {group.activeCount} / {group.totalCount} Active
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.permissions.map((perm) => (
                            <div
                              key={perm.slug}
                              title={`${perm.name} (${perm.slug})\n${perm.description}`}
                              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition ${
                                perm.isGranted
                                  ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900 font-medium"
                                  : "bg-slate-50/50 border-slate-200/60 text-slate-400 opacity-60"
                              }`}
                            >
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  perm.isGranted ? "text-emerald-600" : "text-slate-300"
                                }`}
                              />
                              <span>{perm.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </AdminLayout>
  );
}
