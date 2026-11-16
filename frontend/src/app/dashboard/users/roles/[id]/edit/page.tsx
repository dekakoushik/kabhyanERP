"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { Permission, PermissionModuleGroup, Role, api } from "@/lib/api";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  Save,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

const COLOR_OPTIONS = [
  { id: "blue", label: "Blue", bg: "bg-blue-500" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500" },
  { id: "purple", label: "Purple", bg: "bg-purple-500" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500" },
  { id: "amber", label: "Amber", bg: "bg-amber-500" },
  { id: "rose", label: "Rose", bg: "bg-rose-500" },
];

export default function EditCustomRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [modules, setModules] = useState<PermissionModuleGroup[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("blue");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingRole(true);
        const [roleRes, permRes] = await Promise.all([
          api.roles.get(resolvedParams.id),
          api.permissions.list(),
        ]);

        const r: Role = roleRes.role;
        setRole(r);
        setName(r.name);
        setSlug(r.slug);
        setColor(r.color || "blue");
        setDescription(r.description || "");

        const existingPerms = new Set((r.permissions || []).map((p) => p.slug));
        setSelectedPermissions(existingPerms);

        setModules(permRes.modules || []);
        setAllPermissions(permRes.permissions || []);
      } catch (err: any) {
        toast.error("Failed to load role: " + err.message);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const togglePermission = (permSlug: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permSlug)) {
        next.delete(permSlug);
      } else {
        next.add(permSlug);
      }
      return next;
    });
  };

  const toggleModulePermissions = (mod: PermissionModuleGroup) => {
    const modSlugs = mod.permissions.map((p) => p.slug);
    const allSelected = modSlugs.every((s) => selectedPermissions.has(s));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        modSlugs.forEach((s) => next.delete(s));
      } else {
        modSlugs.forEach((s) => next.add(s));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPermissions(new Set(allPermissions.map((p) => p.slug)));
  };

  const handleClearAll = () => {
    setSelectedPermissions(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      setLoading(true);
      await api.roles.update(resolvedParams.id, {
        name: name.trim(),
        description: description.trim() || null,
        color,
        permissions: Array.from(selectedPermissions),
      });

      toast.success(`Role "${name}" updated successfully!`);
      router.push("/dashboard/users/roles");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  if (loadingRole) {
    return (
      <AdminLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading role & permissions...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!role) {
    return (
      <AdminLayout>
        <div className="py-24 text-center max-w-sm mx-auto space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Role Not Found</h2>
          <p className="text-xs text-slate-500">The requested staff role could not be located.</p>
          <Link
            href="/dashboard/users/roles"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            ← Return to Roles
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-16 font-sans max-w-5xl">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/dashboard/users" className="hover:text-slate-800 transition">Team</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/dashboard/users/roles" className="hover:text-slate-800 transition">Roles</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">Edit {role.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              Edit Role: {role.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Update the name, description, or permissions for this role.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/users/roles"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* System Role Notice if applicable */}
        {role.is_system && (
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200/60 flex items-start gap-3">
            <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 leading-relaxed">
              <span className="font-semibold">Built-in Default Role:</span> This is a standard system role. Its identifier cannot be modified.
            </div>
          </div>
        )}

        {/* Role Identity Details Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Role Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Identifier Slug
              </label>
              <input
                type="text"
                disabled
                value={slug}
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs font-mono bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Color Accent
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition border-2 ${
                      color === c.id ? "border-slate-800 scale-110 shadow-xs" : "border-transparent opacity-80"
                    } ${c.bg}`}
                    title={c.label}
                  >
                    {color === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Scope & Responsibilities
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Modular Permissions Matrix ({selectedPermissions.size} / {allPermissions.length} selected)
              </h2>
              <p className="text-xs text-slate-500">
                Grant or restrict authority across the 12 platform modules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => {
              const modSlugs = mod.permissions.map((p) => p.slug);
              const countSelected = modSlugs.filter((s) => selectedPermissions.has(s)).length;
              const allSelected = countSelected === modSlugs.length;

              return (
                <div
                  key={mod.module}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">({mod.module})</span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {countSelected} of {modSlugs.length} granted
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleModulePermissions(mod)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded transition ${
                        allSelected
                          ? "text-red-600 hover:bg-red-50"
                          : "text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {allSelected ? "Deselect Module" : "Select All in Module"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {mod.permissions.map((perm) => {
                      const isChecked = selectedPermissions.has(perm.slug);
                      return (
                        <label
                          key={perm.slug}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-start gap-2.5 ${
                            isChecked
                              ? "bg-blue-50/50 border-blue-200 text-blue-950"
                              : "bg-slate-50/40 border-slate-100 hover:border-slate-200 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.slug)}
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-xs font-bold leading-tight">
                              {perm.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {perm.slug}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/dashboard/users/roles"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Role Configuration
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
