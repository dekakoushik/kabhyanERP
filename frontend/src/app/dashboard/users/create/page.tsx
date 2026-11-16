"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, Role } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  ArrowLeft,
  Building,
  Briefcase,
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  Calendar,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Shield,
  HelpCircle,
} from "lucide-react";

export default function StaffCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
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
    date_of_joining: new Date().toISOString().split("T")[0],
    status: "active",
    password: "",
  });

  // Fetch roles and next employee code on mount
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingRoles(true);
        const [rolesRes, codeRes] = await Promise.all([
          api.request("/roles"),
          api.request("/users/next-code"),
        ]);

        if (rolesRes?.roles) {
          setRoles(rolesRes.roles);
          // Default to employee role if found
          const empRole = rolesRes.roles.find((r: Role) => r.slug === "employee");
          if (empRole) {
            setFormData((prev) => ({
              ...prev,
              role_id: String(empRole.id),
              role: empRole.slug,
            }));
          }
        }

        if (codeRes?.next_code) {
          setFormData((prev) => ({
            ...prev,
            employee_code: codeRes.next_code,
          }));
        }
      } catch (err: any) {
        console.error("Failed to load roles / employee code:", err);
      } finally {
        setLoadingRoles(false);
      }
    };

    initData();
  }, []);

  const generateSecurePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
    toast.info("Generated a secure 12-character temporary password");
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
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error("Name, official email, and password are required.");
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        emergency_contact: formData.emergency_contact.trim() || null,
        employee_code: formData.employee_code.trim() || null,
        role_id: formData.role_id ? Number(formData.role_id) : null,
        role: formData.role,
        department: formData.department.trim() || "General",
        designation: formData.designation.trim() || "Team Member",
        date_of_joining: formData.date_of_joining || null,
        status: formData.status,
        password: formData.password,
      };

      await api.request("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(`Staff member ${formData.name} onboarded successfully! Welcome email sent.`);
      router.push("/dashboard/users");
    } catch (err: any) {
      console.error("Staff onboarding error:", err);
      const msg = err.message || "Failed to onboard staff member.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => String(r.id) === formData.role_id);

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
        {/* Top Header & Breadcrumb Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>/</span>
              <Link href="/dashboard/users" className="hover:text-slate-800 transition">Team</Link>
              <span>/</span>
              <span className="text-blue-600 font-bold">Add Member</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </span>
              Add Team Member
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Set up a profile, assign a role, and generate their login details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide shadow-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{loading ? "Saving..." : "Save Member"}</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Personal & Professional Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Personal & Identification */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-blue-600" />
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
                    placeholder="e.g. Kaushik Deka"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Employee Code / ID <span className="text-slate-400 font-normal">(Auto)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                      placeholder="EMP-001"
                      className="w-full font-mono px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/70"
                    />
                  </div>
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
                      placeholder="name@kabhyan.com"
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
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Emergency Contact Phone / Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="+91 98765 00000 (Relative / Guardian)"
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

            {/* Card 2: Departmental Hierarchy */}
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
                    placeholder="e.g. Lead Cloud Architect"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Role, Access & Password Credentials */}
          <div className="space-y-6">
            {/* Card 3: Role & RBAC Assignment */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Role & Authority
                </h2>
                <Link
                  href="/dashboard/users/roles"
                  target="_blank"
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Manage Roles ↗
                </Link>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Role <span className="text-red-500">*</span>
                </label>
                {loadingRoles ? (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Loading roles...</span>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Selected Role Snapshot */}
              {selectedRole && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">{selectedRole.name}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      selectedRole.is_system ? "bg-slate-200 text-slate-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedRole.is_system ? "System Role" : "Custom Role"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {selectedRole.description || "Grants baseline authority according to organizational policies."}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Card 4: Security Credentials */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Temporary Password
              </h2>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
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
                  Share this temporary password with the team member. They can change it after logging in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
