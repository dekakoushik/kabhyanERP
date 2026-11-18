"use client";

import { useEffect, useState, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, ReceiptVoucher } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/date";
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Building,
  User,
  Eye,
  CreditCard,
  Building2,
  ArrowUpRight,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";

function ReceiptVouchersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vouchers, setVouchers] = useState<ReceiptVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await api.request(`/receipt-vouchers${qs}`);
      const data = res?.receipt_vouchers?.data || res?.receipt_vouchers || [];
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load receipt vouchers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVouchers();
  };

  // Metrics
  const totalReceived = vouchers.reduce((acc, v) => acc + Number(v.amount_received || 0), 0);
  const totalAdjusted = vouchers.reduce((acc, v) => acc + Number(v.adjusted_amount || 0), 0);
  const totalRemaining = vouchers.reduce(
    (acc, v) => acc + Number(v.remaining_advance ?? (Number(v.amount_received || 0) - Number(v.adjusted_amount || 0))),
    0
  );
  const activeCount = vouchers.filter((v) => v.status === "active" || v.status === "partially_adjusted").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Active Advance
          </span>
        );
      case "partially_adjusted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Partially Adjusted
          </span>
        );
      case "fully_adjusted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Fully Adjusted
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Refunded (Rule 51)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">GST Receipt Vouchers</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              CGST Rule 50
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Statutory vouchers acknowledging advance payments for services. Output tax reported under GSTR-1 Table 11A.
          </p>
        </div>

        <Link
          href="/dashboard/receipt-vouchers/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Receipt Voucher</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Advances</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">₹{totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500 mt-1">{vouchers.length} total voucher(s) issued</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Adjusted on Invoices</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">₹{totalAdjusted.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500 mt-1">Deducted under Table 11B</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unadjusted Balance</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-600">₹{totalRemaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500 mt-1">Available to adjust against invoices</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Advances</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
            <p className="text-xs text-slate-500 mt-1">Pending milestone delivery</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search voucher #, client, payment ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Advance</option>
            <option value="partially_adjusted">Partially Adjusted</option>
            <option value="fully_adjusted">Fully Adjusted</option>
            <option value="refunded">Refunded (Rule 51)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
            <p className="text-sm font-medium">Loading GST receipt vouchers...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Receipt Vouchers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              When clients pay advance mobilization for projects, issue GST Receipt Vouchers to declare tax liability under Rule 50.
            </p>
            <Link
              href="/dashboard/receipt-vouchers/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Issue First Receipt Voucher</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Voucher #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Place of Supply</th>
                  <th className="py-3.5 px-4">Payment Info</th>
                  <th className="py-3.5 px-4 text-right">Advance Received</th>
                  <th className="py-3.5 px-4 text-right">Unadjusted Bal</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v) => {
                  const remaining =
                    v.remaining_advance ??
                    Number(v.amount_received || 0) - Number(v.adjusted_amount || 0);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/dashboard/receipt-vouchers/${v.id}`}
                          className="font-bold text-blue-600 hover:text-blue-800 transition font-mono"
                        >
                          {v.voucher_number}
                        </Link>
                        {v.estimate && (
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            via Quote #{v.estimate.estimate_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatDate(v.voucher_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{v.client_name}</div>
                        {v.client_company && (
                          <div className="text-[11px] text-slate-400">{v.client_company}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">{v.place_of_supply || "Assam (18)"}</div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                            v.is_inter_state
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {v.is_inter_state ? "IGST 18%" : "CGST + SGST (9%+9%)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium capitalize">
                          {(v.payment_mode || "bank_transfer").replace("_", " ")}
                        </div>
                        {v.payment_reference && (
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                            Ref: {v.payment_reference}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          ₹{Number(v.amount_received || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Tax: ₹{Number(v.tax_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-purple-600">
                          ₹{remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        {Number(v.adjusted_amount || 0) > 0 && (
                          <div className="text-[10px] text-emerald-600">
                            Adj: ₹{Number(v.adjusted_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(v.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/receipt-vouchers/${v.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/receipt-vouchers/${v.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Print / PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReceiptVouchersPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
        <ReceiptVouchersContent />
      </Suspense>
    </AdminLayout>
  );
}
