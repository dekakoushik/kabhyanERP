"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { Permission, PermissionModuleGroup, api } from "@/lib/api";
import { PERMISSION_DEFINITIONS } from "@/lib/humanize";
import {
  Shield,
  ShieldPlus,
  ArrowLeft,
  Check,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Info,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

const PRESET_TEMPLATES = [
  {
    name: "Finance & Invoicing",
    slug: "finance-invoicing",
    color: "emerald",
    description: "Manage invoices, estimates, accounting ledgers, and expenses.",
    permissions: [
      "estimates.view", "estimates.create", "estimates.edit", "estimates.delete", "estimates.send",
      "proforma.view", "proforma.create", "proforma.edit", "proforma.delete", "proforma.send",
      "invoices.view", "invoices.create", "invoices.edit", "invoices.delete", "invoices.record_payment",
      "accounts.view", "accounts.export",
      "expenses.view", "expenses.create", "expenses.edit", "expenses.delete", "expenses.approve",
      "clients.view",
    ],
  },
  {
    name: "Technical Lead",
    slug: "technical-lead",
    color: "indigo",
    description: "Manage projects, task boards, and handle client support tickets.",
    permissions: [
      "projects.view", "projects.create", "projects.edit", "projects.assign_members",
      "tasks.view", "tasks.create", "tasks.edit", "tasks.delete", "tasks.change_status",
      "tickets.view", "tickets.reply", "tickets.assign", "tickets.change_status",
      "clients.view",
    ],
  },
  {
    name: "Client Specialist",
    slug: "client-specialist",
    color: "purple",
    description: "Manage client profiles, issue quotations, and support requests.",
    permissions: [
      "clients.view", "clients.create", "clients.edit", "clients.manage_portal",
      "estimates.view", "estimates.create", "estimates.edit", "estimates.send",
      "proforma.view", "proforma.create", "proforma.edit", "proforma.send",
      "projects.view",
      "tickets.view", "tickets.reply", "tickets.assign", "tickets.change_status",
    ],
  },
  {
    name: "Compliance Auditor",
    slug: "compliance-auditor",
    color: "amber",
    description: "View-only access to inspect financial records, projects, and logs.",
    permissions: [
      "estimates.view", "proforma.view", "invoices.view", "accounts.view", "accounts.export",
      "expenses.view", "clients.view", "projects.view", "tasks.view", "tickets.view",
      "staff.view", "roles.view", "settings.view",
    ],
  },
];

const COLOR_OPTIONS = [
  { id: "blue", label: "Blue", bg: "bg-blue-500", text: "text-blue-700" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", text: "text-emerald-700" },
  { id: "purple", label: "Purple", bg: "bg-purple-500", text: "text-purple-700" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500", text: "text-indigo-700" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", text: "text-amber-700" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", text: "text-rose-700" },
];

export default function CreateCustomRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [modules, setModules] = useState<PermissionModuleGroup[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("blue");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoadingModules(true);
        const res = await api.permissions.list();
        setModules(res.modules || []);
        setAllPermissions(res.permissions || []);
      } catch (err: any) {
        toast.error("Failed to load permissions matrix: " + err.message);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(generatedSlug);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setName(preset.name);
    setSlug(preset.slug);
    setColor(preset.color);
    setDescription(preset.description);
    setSelectedPermissions(new Set(preset.permissions));
    toast.success(`Applied "${preset.name}" preset template!`);
  };

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
    if (slug.trim() === "client") {
      toast.error('The slug "client" is reserved for external client portal access.');
      return;
    }

    try {
      setLoading(true);
      await api.roles.create({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || null,
        color,
        permissions: Array.from(selectedPermissions),
      });

      toast.success(`Custom role "${name}" created successfully!`);
      router.push("/dashboard/users/roles");
    } catch (err: any) {
      toast.error(err.message || "Failed to create custom role");
    } finally {
      setLoading(false);
    }
  };

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
              <span className="font-semibold text-slate-800">New Role</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldPlus className="w-6 h-6 text-blue-600" />
              Create New Role
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Choose a name, pick a preset or start from scratch, and select permissions.
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
              Save Role
            </button>
          </div>
        </div>

        {/* Preset Templates Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Role Templates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESET_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.slug}
                type="button"
                onClick={() => handleApplyPreset(tmpl)}
                className="p-3 text-left bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 flex items-center justify-between mb-1">
                  <span>{tmpl.name}</span>
                  <span className="text-[10px] text-slate-400">{tmpl.permissions.length} perms</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </button>
            ))}
          </div>
        </div>

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
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Project Coordinator"
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Identifier (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. project-coordinator"
                className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs font-mono bg-slate-50 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Color
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
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this role responsible for?"
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
                Permissions ({selectedPermissions.size} of {allPermissions.length} selected)
              </h2>
              <p className="text-xs text-slate-500">
                Select what people with this role can do in each area.
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

          {loadingModules ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              Loading modular permissions matrix...
            </div>
          ) : (
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
                              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                                {PERMISSION_DEFINITIONS[perm.slug]?.description || perm.name}
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
          )}
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
            Save & Deploy Custom Role
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
