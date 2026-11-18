"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, BusinessAssociate, BusinessAssociateStats } from "@/lib/api";
import Link from "next/link";
import {
  Handshake,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Loader2,
  Percent,
  Wallet,
  ShieldAlert,
} from "lucide-react";

export default function BusinessAssociatesPage() {
  const [associates, setAssociates] = useState<BusinessAssociate[]>([]);
  const [stats, setStats] = useState<BusinessAssociateStats>({
    total_associates: 0,
    active_associates: 0,
    salary_model_count: 0,
    commission_model_count: 0,
    total_payouts_disbursed: 0,
    pending_payouts_count: 0,
    pending_payouts_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAssociates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (modelFilter !== "all") params.append("engagement_model", modelFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await api.request(`/business-associates?${params.toString()}`);
      if (res?.associates?.data) {
        setAssociates(res.associates.data);
      } else if (Array.isArray(res?.associates)) {
        setAssociates(res.associates);
      }
      if (res?.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load business associates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAssociates();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, modelFilter, statusFilter]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "gold":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Gold Partner</span>;
      case "silver":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Silver Partner</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Bronze Partner</span>;
    }
  };

  const getModelBadge = (model: string, salary: number | string, rate: number | string) => {
    if (model === "salary") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Wallet className="w-3 h-3" />
          Salary (₹{Number(salary).toLocaleString()}/mo)
        </span>
      );
    }
    if (model === "commission") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Percent className="w-3 h-3" />
          Commission ({rate}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <TrendingUp className="w-3 h-3" />
        Hybrid (₹{Number(salary).toLocaleString()} + {rate}%)
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Active</span>;
      case "probation":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Probation</span>;
      case "inactive":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Inactive</span>;
      case "terminated":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">Terminated</span>;
      default:
        return <span className="text-[11px] text-slate-600">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header & Global Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-800 transition">Workspace</Link>
              <span>/</span>
              <span>Operations</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">Business Associates</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Handshake className="w-5 h-5" />
              </span>
              Business Associates
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Onboard and manage referral partners, salary sales consultants, and commission brokers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/business-associates/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Associate</span>
            </Link>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Associates</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">{stats.total_associates}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              {stats.active_associates} currently active
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Commission Partners</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Percent className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">{stats.commission_model_count}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Performance deal brokers
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Salary Retainers</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">{stats.salary_model_count}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Fixed monthly stipends
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Payouts Disbursed</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              ₹{Number(stats.total_payouts_disbursed).toLocaleString()}
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              {stats.pending_payouts_count} pending approvals (₹{Number(stats.pending_payouts_amount).toLocaleString()})
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, phone, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Engagement Models</option>
              <option value="salary">Salary Only</option>
              <option value="commission">Commission Only</option>
              <option value="hybrid">Hybrid (Salary + Commission)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Associates Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">Loading business associates directory...</p>
            </div>
          ) : associates.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Handshake className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Business Associates Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Onboard your first referral broker, salary consultant, or partner to track deals and payouts.
              </p>
              <Link
                href="/dashboard/business-associates/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Associate</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Associate Code & Name</th>
                    <th className="py-3.5 px-4">Engagement Model</th>
                    <th className="py-3.5 px-4">Partner Tier</th>
                    <th className="py-3.5 px-4">Referred Clients</th>
                    <th className="py-3.5 px-4">Total Paid Payouts</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {associates.map((ba) => (
                    <tr key={ba.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {ba.associate_code}
                          </span>
                          <span>{ba.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ba.email ? `${ba.email} • ` : ""}{ba.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getModelBadge(ba.engagement_model, ba.base_salary, ba.commission_rate)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getTierBadge(ba.partner_tier)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {ba.clients_count || 0} clients
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        ₹{Number(ba.total_paid || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(ba.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/business-associates/${ba.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="View Associate Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/business-associates/${ba.id}/edit`}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-blue-600 transition"
                            title="Edit Associate Terms"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
