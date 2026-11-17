"use client";

import { useEffect, useState, use } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Role, User } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Edit2,
  ArrowLeft,
  Building,
  Briefcase,
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User as UserIcon,
} from "lucide-react";

export default function StaffEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emergency_contact: "",
    employee_code: "",
    role_id: "",
    role: "employee",
    department: "Engineering",
    designation: "Software Engineer",
    date_of_joining: "",
    status: "active",
    password: "",
  });

  useEffect(() => {
    const fetchStaffAndRoles = async () => {
      try {
        setLoading(true);
        const [userRes, rolesRes] = await Promise.all([
          api.request(`/users/${resolvedParams.id}`),
          api.request("/roles"),
        ]);

        if (rolesRes?.roles) {
          setRoles(rolesRes.roles);
        }

        if (userRes?.user) {
          const u: User = userRes.user;
          const availableRoles: Role[] = rolesRes?.roles || [];
          const matchedRole = availableRoles.find((r) =>
            u.role_id ? r.id === u.role_id : r.slug === u.role
          );
          const initialRoleId = matchedRole ? String(matchedRole.id) : (u.role_id ? String(u.role_id) : "");

          setFormData({
            name: u.name,
            email: u.email,
            phone: u.phone || "",
            emergency_contact: u.emergency_contact || "",
            employee_code: u.employee_code || "",
            role_id: initialRoleId,
            role: matchedRole ? matchedRole.slug : u.role,
            department: u.department || "General",
            designation: u.designation || "Staff Member",
            date_of_joining: u.date_of_joining ? u.date_of_joining.split("T")[0] : "",
            status: u.status,
            password: "",
          });
        }
      } catch (err: any) {
        console.error("Failed to load staff details:", err);
        setFormError(err.message || "Failed to load staff details.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffAndRoles();
  }, [resolvedParams.id]);

  const generateSecurePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
    toast.info("Generated a secure 12-character replacement password");
  };

  const handleRoleChange = (roleIdStr: string) => {
    const selected = roles.find((r) => String(r.id) === roleIdStr);
    setFormData((prev) => ({
      ...prev,
      role_id: roleIdStr,
      role: selected ? selected.slug : prev.role,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        emergency_contact: formData.emergency_contact.trim() || null,
        employee_code: formData.employee_code.trim() || null,
        role_id: formData.role_id ? Number(formData.role_id) : null,
        role: formData.role,
        department: formData.department.trim() || "General",
        designation: formData.designation.trim() || "Staff Member",
        date_of_joining: formData.date_of_joining || null,
        status: formData.status,
      };

      if (formData.password.trim() !== "") {
        payload.password = formData.password.trim();
      }

      const updateRes = await api.request(`/users/${resolvedParams.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Synchronize client session in localStorage if the user edited their own profile
      const currentUser = api.getUser();
      if (currentUser && String(currentUser.id) === String(resolvedParams.id)) {
        if (updateRes?.user) {
          api.setUser(updateRes.user);
        }
      }

      toast.success("Staff profile updated successfully.");
      router.push(`/dashboard/users/${resolvedParams.id}`);
    } catch (err: any) {
      console.error("Staff update error:", err);
      const msg = err.message || "Failed to update staff record.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading staff editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>/</span>
              <Link href="/dashboard/users" className="hover:text-slate-800 transition">Team</Link>
              <span>/</span>
              <Link href={`/dashboard/users/${resolvedParams.id}`} className="hover:text-slate-800 transition">
                {formData.name || "Profile"}
              </Link>
              <span>/</span>
              <span className="text-blue-600 font-bold">Edit</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Edit2 className="w-5 h-5" />
              </span>
              Edit Profile: {formData.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Update contact info, department, designation, or role permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/users/${resolvedParams.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide shadow-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserIcon className="w-4 h-4 text-blue-600" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Employee Code / ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Joining Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={formData.date_of_joining}
                      onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="w-4 h-4 text-blue-600" />
                Department & Job Designation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Engineering">Engineering & Development</option>
                    <option value="Product Design">Product & UI/UX Design</option>
                    <option value="Operations">Operations & Delivery</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Human Resources">Human Resources (HR)</option>
                    <option value="Sales & Marketing">Sales & Business Development</option>
                    <option value="Quality Assurance">Quality Assurance (QA)</option>
                    <option value="Executive Office">Executive Office / Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Job Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Role & Account Status
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name} {r.is_system ? "(System)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="active">Active (Full Portal Access)</option>
                  <option value="inactive">Inactive (Pending Induction)</option>
                  <option value="suspended">Suspended (Access Revoked)</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Update Password
              </h2>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    New Password <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Strong</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full pr-9 pl-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Only enter a password if you want to reset the user's login credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
