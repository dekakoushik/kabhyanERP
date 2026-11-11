"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, User, Client } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Briefcase,
  Building,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CreateProjectPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "PRJ-2026-001",
    description: "",
    client_id: "",
    client_name: "",
    manager_id: "",
    status: "planning",
    priority: "medium",
    budget: "",
    start_date: "",
    deadline: "",
    member_ids: [] as number[],
  });

  useEffect(() => {
    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      code: `PRJ-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      start_date: now.toISOString().split("T")[0],
    }));

    const loadData = async () => {
      try {
        const [uRes, cRes] = await Promise.all([
          api.request("/users?per_page=100"),
          api.request("/clients?per_page=100"),
        ]);
        setUsers(uRes.users?.data || uRes.data || []);
        setClients(cRes.clients?.data || cRes.data || []);
      } catch (err) {
        console.error("Failed to load users or clients:", err);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.code) {
        throw new Error("Project name and project code are required");
      }

      await api.request("/projects", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? Number(formData.budget) : 0,
          client_id: formData.client_id ? Number(formData.client_id) : null,
          manager_id: formData.manager_id ? Number(formData.manager_id) : null,
        }),
      });

      router.push("/dashboard/projects");
    } catch (err: any) {
      setFormError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: number) => {
    setFormData((prev) => {
      const exists = prev.member_ids.includes(userId);
      return {
        ...prev,
        member_ids: exists
          ? prev.member_ids.filter((id) => id !== userId)
          : [...prev.member_ids, userId],
      };
    });
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/projects"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Create New Project
              </h1>
              <p className="text-xs text-slate-500">
                Initialize a client project with milestones, budgets, and team allocations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/projects")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save & Launch Project
                </>
              )}
            </Button>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {formError}
          </div>
        )}

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Project Charter */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Project Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Enterprise Logistics API & Web Application"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Project Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Associated Client</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => {
                      const sel = clients.find((c) => String(c.id) === e.target.value);
                      setFormData({
                        ...formData,
                        client_id: e.target.value,
                        client_name: sel?.company_name || sel?.name || "",
                      });
                    }}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Internal / No External Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name ? `${c.company_name} (${c.name})` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Lead Project Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Project Manager --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Project Scope & Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detailed project requirements, architecture specifications, and delivery milestones..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Team Allocations */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Assigned Team Members ({formData.member_ids.length} selected)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {users.map((u) => {
                    const isSelected = formData.member_ids.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center gap-2.5 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-900 font-semibold"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="truncate leading-tight">{u.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Milestones & Budget */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <Card className="border-blue-200/80 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-blue-50/40 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Budget & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Allocated Budget (INR)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 500000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Deadline Date</label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Lifecycle Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-medium shadow-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Launch Project
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/projects")}
                className="w-full"
              >
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}

