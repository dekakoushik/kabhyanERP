"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { Role, PermissionModuleGroup, api } from "@/lib/api";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Users,
  KeyRound,
  Lock,
  Edit,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.roles.list();
      setRoles(res.roles || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system) {
      toast.error("Standard system roles cannot be deleted.");
      return;
    }
    if ((role.users_count || 0) > 0) {
      toast.error(`Cannot delete role with ${role.users_count} active assigned staff members. Reassign them first.`);
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete the custom role "${role.name}"?`)) {
      return;
    }

    try {
      setDeletingId(role.id);
      await api.roles.delete(role.id);
      toast.success(`Role "${role.name}" removed successfully.`);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  const systemRoles = roles.filter((r) => r.is_system);
  const customRoles = roles.filter((r) => !r.is_system);

  const getRoleBadgeClasses = (color?: string) => {
    switch (color) {
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "indigo":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rose":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "blue":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12 font-sans">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/dashboard/users" className="hover:text-slate-800 transition">Team</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">Roles & Permissions</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-blue-600" />
              Roles & Permissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create roles with customized permissions for your team.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/users"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            >
              View Team
            </Link>
            <Link
              href="/dashboard/users/roles/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Role</span>
            </Link>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Total Roles</span>
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{roles.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">All active roles</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Custom Roles</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{customRoles.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Created by your team</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Built-in Roles</span>
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{systemRoles.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Standard system defaults</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Total Permissions</span>
              <KeyRound className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">44</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all modules</div>
          </div>
        </div>

        {/* Section 1: Custom Staff Roles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Custom Roles ({customRoles.length})
              </h2>
              <p className="text-xs text-slate-500">Roles created for specific jobs and responsibilities.</p>
            </div>
            <Link
              href="/dashboard/users/roles/create"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + New Role
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              Loading roles...
            </div>
          ) : customRoles.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Custom Roles Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Create customized roles with specific permissions for different members of your team.
              </p>
              <Link
                href="/dashboard/users/roles/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Role
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {customRoles.map((role) => (
                <div
                  key={role.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeClasses(role.color)}`}>
                        {role.name}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {role.slug}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-3">
                      {role.description || "Custom role with specific module permissions."}
                    </p>

                    <div className="flex items-center gap-4 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{role.users_count || 0}</span> members
                      </div>
                      <div className="w-px h-3.5 bg-slate-200" />
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{role.permissions?.length || 0}</span> permissions
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Link
                      href={`/dashboard/users/roles/${role.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Role
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === role.id || (role.users_count || 0) > 0}
                      onClick={() => handleDeleteRole(role)}
                      className="text-xs text-slate-400 hover:text-red-600 transition disabled:opacity-40 disabled:hover:text-slate-400 p-1"
                      title={(role.users_count || 0) > 0 ? "Cannot delete role while assigned to team members" : "Delete custom role"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Standard System Baseline Roles */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600" />
              Built-in Roles ({systemRoles.length})
            </h2>
            <p className="text-xs text-slate-500">Standard roles used across the platform. These cannot be modified or deleted.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {systemRoles.map((role) => (
                <div key={role.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{role.name}</span>
                        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {role.slug}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Default Role
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {role.description || "Core platform authority tier."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 sm:self-center">
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900">{role.users_count || 0}</span> members
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900">
                        {role.slug === "superadmin" ? "All (44/44)" : `${role.permissions?.length || 0} modular`}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 cursor-not-allowed flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
