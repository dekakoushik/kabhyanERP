"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { User, api } from "@/lib/api";
import {
  Building2,
  Users,
  ChevronRight,
  Plus,
  Mail,
  Phone,
  Briefcase,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface DepartmentGroup {
  department: string;
  count: number;
  members: User[];
}

export default function DepartmentsOverviewPage() {
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.users.list({ per_page: 200 });
        const users: User[] = res.users?.data || [];

        // Group by department
        const map = new Map<string, User[]>();
        users.forEach((u) => {
          const dept = u.department || "Operations";
          if (!map.has(dept)) {
            map.set(dept, []);
          }
          map.get(dept)!.push(u);
        });

        const groups: DepartmentGroup[] = Array.from(map.entries()).map(([dept, members]) => ({
          department: dept,
          count: members.length,
          members,
        }));

        groups.sort((a, b) => b.count - a.count);
        setDepartments(groups);
      } catch (err: any) {
        toast.error("Failed to load departments: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              <span className="font-semibold text-slate-800">Departments</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-600" />
              Departments
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              View team distribution and headcount across all company departments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              View Team
            </Link>
            <Link
              href="/dashboard/users/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              + Add Member
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Departments</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{departments.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active teams</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Team Size</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {departments.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total members</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Largest Team</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 truncate">
              {departments[0]?.department || "Engineering"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {departments[0]?.count || 0} members
            </div>
          </div>
        </div>

        {/* Department Cards Grid */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            Loading departmental breakdown...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.department}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{dept.department}</h3>
                      <p className="text-[11px] text-slate-400">Functional Division</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold">
                    {dept.count} {dept.count === 1 ? "Employee" : "Employees"}
                  </span>
                </div>

                <div className="p-4 space-y-2.5 divide-y divide-slate-100">
                  {dept.members.map((member) => (
                    <div key={member.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/users/${member.id}`}
                              className="text-xs font-bold text-slate-900 hover:text-blue-600 transition"
                            >
                              {member.name}
                            </Link>
                            {member.employee_code && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {member.employee_code}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              {member.designation || member.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/users/${member.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                      >
                        Profile →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
