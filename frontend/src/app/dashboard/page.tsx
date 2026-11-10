"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { api, UserStats } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Crown,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Server,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.request("/users?per_page=1");
        setStats(res.stats);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider text-blue-200">
              <Crown className="w-3.5 h-3.5" />
              <span>SuperAdmin Control Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Administrator"}
            </h2>
            <p className="text-sm text-blue-100 max-w-xl">
              You have full administrative privileges over Kabhyan IT ERP modules, authentication policies, and personnel accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-950 font-semibold text-xs sm:text-sm hover:bg-blue-50 transition shadow-xs"
            >
              <Users className="w-4 h-4 text-blue-700" />
              <span>Manage Users</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Staff */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Personnel
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {loading ? "..." : stats?.total_users ?? 0}
              </span>
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Active base
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Registered across all departments</p>
          </div>

          {/* Active Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Accounts
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {loading ? "..." : stats?.active_users ?? 0}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Allowed to sign in & access workspace</p>
          </div>

          {/* SuperAdmins & Admins */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Admin Roles
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Crown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {loading ? "..." : (stats?.superadmins ?? 0) + (stats?.admins ?? 0)}
              </span>
              <span className="text-xs text-slate-500">
                ({stats?.superadmins ?? 0} Super, {stats?.admins ?? 0} Admin)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Elevated privileges granted</p>
          </div>

          {/* Inactive / Suspended */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Inactive / Suspended
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {loading ? "..." : (stats?.inactive_users ?? 0) + (stats?.suspended_users ?? 0)}
              </span>
              <span className="text-xs text-amber-700 font-medium">Requires review</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Access revoked or awaiting onboarding</p>
          </div>
        </div>

        {/* Infrastructure & Stack Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Kabhyan ERP Core Infrastructure</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                System Healthy
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Backend API</p>
                    <p className="text-xs text-slate-500">Laravel 13 REST API with Laravel Sanctum</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                  Port 8000
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Redis Cache & Session Broker</p>
                    <p className="text-xs text-slate-500">High performance caching and instantaneous token audit</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                  Port 6379 (Active)
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Relational Database</p>
                    <p className="text-xs text-slate-500">MySQL / MariaDB with Eloquent ORM & soft deletes</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                  kabhyan_erp
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Quick Actions</h3>
              <p className="text-xs text-slate-500 mb-4">
                Rapid workflows for SuperAdmin tasks
              </p>
              <div className="space-y-2">
                <Link
                  href="/dashboard/users"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Open User Directory
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/dashboard/users"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-indigo-600" />
                    Create New Staff Account
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">
                Connected User: <span className="font-semibold text-slate-700">{user?.email}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

