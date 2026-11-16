"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Role, User, UserStats } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Phone,
  Mail,
  Building,
  Briefcase,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Confirmation Dialog
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", currentPage.toString());

      const [usersRes, rolesRes] = await Promise.all([
        api.request(`/users?${params.toString()}`),
        api.request("/roles").catch(() => null),
      ]);

      if (usersRes?.users) {
        setUsers(usersRes.users.data || []);
        setLastPage(usersRes.users.last_page || 1);
        setTotal(usersRes.users.total || 0);
      }
      if (usersRes?.stats) {
        setStats(usersRes.stats);
      }
      if (rolesRes?.roles) {
        setRoles(rolesRes.roles);
      }
    } catch (err: unknown) {
      console.error("Failed to load staff directory:", err);
      toast.error("Failed to load staff directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsersAndRoles();
  };

  const handleToggleStatus = async (user: User, nextStatus: "active" | "inactive" | "suspended") => {
    try {
      await api.request(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      toast.success(`Account status for ${user.name} changed to ${nextStatus}.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update account status.");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      setDeleting(true);
      await api.request(`/users/${deleteConfirmUser.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
      toast.success("Staff account deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (roleStr: string, customRole?: Role | null) => {
    if (customRole) {
      return customRole.is_system
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-purple-50 text-purple-700 border-purple-200";
    }

    switch (roleStr?.toLowerCase()) {
      case "superadmin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "hr":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "manager":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "inactive":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "suspended":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
        {/* Header and Unified Action CTAs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-blue-600">Team</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Users className="w-5 h-5" />
              </span>
              Team Members
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View all team members, assign their roles, and track active work.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/users/departments"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Departments</span>
            </Link>

            <Link
              href="/dashboard/users/roles"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Roles & Permissions</span>
            </Link>

            <Link
              href="/dashboard/users/create"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </Link>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Team</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_users ?? total}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Active Now</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats?.active_users ?? 0}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Leadership</span>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {(stats?.superadmins ?? 0) + (stats?.admins ?? 0) + (stats?.managers ?? 0)}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Custom Roles</span>
            <p className="text-2xl font-black text-blue-700 mt-1">{stats?.custom_role_users ?? 0}</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members by name, email, or role..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </form>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {(search || roleFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setStatusFilter("");
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">Retrieving personnel records...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center px-4 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-800">No staff members found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No staff matching your search parameters. You can onboard new staff at any time.
              </p>
              <Link
                href="/dashboard/users/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Onboard First Staff Member</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role & Authority</th>
                      <th className="py-3 px-4">Department & Designation</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {users.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition group">
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/users/${item.id}`} className="flex items-center gap-3 group-hover:opacity-90">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                              {item.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                                  {item.name}
                                </span>
                                {item.employee_code && (
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {item.employee_code}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {item.email}
                                </span>
                                {item.phone && (
                                  <span className="flex items-center gap-1">
                                    • <Phone className="w-3 h-3 text-slate-400" />
                                    {item.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getRoleBadge(
                              item.role,
                              item.custom_role
                            )}`}
                          >
                            {item.custom_role?.name || item.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 text-xs">
                            {item.designation || "Staff Member"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {item.department || "General"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${getStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status === "active" ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-amber-600" />
                            )}
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === "active" ? (
                              <button
                                onClick={() => handleToggleStatus(item, "suspended")}
                                title="Suspend account"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(item, "active")}
                                title="Activate account"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            <Link
                              href={`/dashboard/users/${item.id}`}
                              title="View dossier"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <Link
                              href={`/dashboard/users/${item.id}/edit`}
                              title="Edit profile"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => setDeleteConfirmUser(item)}
                              title="Delete staff record"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-slate-100">
                {users.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <Link href={`/dashboard/users/${item.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.email}</p>
                        </div>
                      </Link>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getRoleBadge(
                          item.role,
                          item.custom_role
                        )}`}
                      >
                        {item.custom_role?.name || item.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-800">{item.designation || "Staff"}</span>
                        <span className="text-slate-400 block text-[11px]">{item.department || "General"}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        href={`/dashboard/users/${item.id}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/dashboard/users/${item.id}/edit`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page <strong className="text-slate-800">{currentPage}</strong> of{" "}
                  <strong className="text-slate-800">{lastPage}</strong> ({total} total staff)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage >= lastPage}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog: Delete */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Team Member</h3>
                <p className="text-xs text-slate-500">This action will remove their account and revoke platform access.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmUser.name}</strong> (
              {deleteConfirmUser.email})?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
