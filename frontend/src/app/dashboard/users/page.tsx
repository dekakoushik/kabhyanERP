"use client";

import { useEffect, useState, useTransition } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, User, UserStats } from "@/lib/api";
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
  X,
  Phone,
  Mail,
  Building,
  Briefcase,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    department: "",
    designation: "",
    status: "active",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [, startTransition] = useTransition();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", currentPage.toString());

      const res = await api.request(`/users?${params.toString()}`);
      setUsers(res.users.data);
      setLastPage(res.users.last_page);
      setTotal(res.users.total);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: unknown) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const openCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "employee",
      department: "",
      designation: "",
      status: "active",
      password: "",
    });
    setFormError(null);
    setIsEditing(false);
    setEditingUserId(null);
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      department: user.department || "",
      designation: user.designation || "",
      status: user.status,
      password: "",
    });
    setFormError(null);
    setIsEditing(true);
    setEditingUserId(user.id);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);

    try {
      const endpoint = isEditing ? `/users/${editingUserId}` : "/users";
      const method = isEditing ? "PUT" : "POST";

      const payload: Record<string, string> = { ...formData };
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      await api.request(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setModalOpen(false);
      startTransition(() => {
        fetchUsers();
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save user. Please check your inputs.");
      }
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleStatus = async (user: User, newStatus: string) => {
    try {
      await api.request(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await api.request(`/users/${deleteConfirmUser.id}`, {
        method: "DELETE",
      });
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "hr":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "manager":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "client":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "inactive":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "suspended":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              User Directory & Permissions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage internal company staff, role-based access, and corporate account status.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Users
            </span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{stats?.total_users ?? total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Active
            </span>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">{stats?.active_users ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Inactive
            </span>
            <p className="text-xl font-extrabold text-amber-700 mt-1">{stats?.inactive_users ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              Admins
            </span>
            <p className="text-xl font-extrabold text-purple-700 mt-1">
              {(stats?.superadmins ?? 0) + (stats?.admins ?? 0)}
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, designation, or department..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </form>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="superadmin">SuperAdmin</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
                <option value="client">Client</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
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
                Clear
              </button>
            )}
          </div>
        </div>

        {/* User Table (Responsive Card view on mobile, Table on desktop) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">Retrieving personnel records...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No users found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Try refining your search keyword or adjust the filter parameters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-6">User Info</th>
                      <th className="py-3.5 px-6">Role</th>
                      <th className="py-3.5 px-6">Department & Title</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {users.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                              {item.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
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
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getRoleBadge(
                              item.role
                            )}`}
                          >
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-slate-800 text-xs">
                            {item.designation || "Not assigned"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.department || "General"}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getStatusBadge(
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
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick status switch */}
                            {item.status === "active" ? (
                              <button
                                onClick={() => handleToggleStatus(item, "inactive")}
                                title="Deactivate account"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(item, "active")}
                                title="Activate account"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit user details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUser(item)}
                              title="Delete user"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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

              {/* Mobile Card View (For small screens) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {users.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.email}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${getRoleBadge(
                          item.role
                        )}`}
                      >
                        {item.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="font-medium text-slate-800">{item.designation || "Staff"}</span>
                        <span className="text-slate-400 block text-[11px]">{item.department || "IT"}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirmUser(item)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page <strong className="text-slate-800">{currentPage}</strong> of{" "}
                  <strong className="text-slate-800">{lastPage}</strong> ({total} total users)
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

      {/* Modal: Create / Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? "Modify User Account" : "Register New Staff Member"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter employee credentials and permission roles.
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

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Corporate Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="r.sharma@kabhyan.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="superadmin">SuperAdmin (Full Control)</option>
                    <option value="admin">Admin (Operations)</option>
                    <option value="hr">HR (Personnel)</option>
                    <option value="manager">Manager (Projects)</option>
                    <option value="employee">Employee (Developer/Analyst)</option>
                    <option value="client">Client (External)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering, Sales, HR"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Lead Software Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEditing ? "Password (Leave blank to keep current)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    required={!isEditing}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
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
                  disabled={formSaving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
                >
                  {formSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Save Changes" : "Create User"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action can be reversed by database admin.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmUser.name}</strong> (
              {deleteConfirmUser.email})? Their token sessions will be revoked.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

