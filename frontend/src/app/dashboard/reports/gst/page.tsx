"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ReportHeader from "@/components/ReportHeader";
import { api, ReportGstResponse } from "@/lib/api";
import {
  Receipt,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Building2,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function GstReportsPage() {
  const [fy, setFy] = useState("2026-2027");
  const [quarter, setQuarter] = useState("");
  const [activeGstrTab, setActiveGstrTab] = useState<"t4" | "t7" | "t11a" | "t11b" | "t13">("t4");
  const [data, setData] = useState<ReportGstResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const qParam = quarter ? `&quarter=${quarter}` : "";
      const res = await api.request<ReportGstResponse>(`/reports/gst?fy=${fy}${qParam}`);
      setData(res);
    } catch (err) {
      console.error("Failed to load GST report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fy, quarter]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amt || 0);
  };

  return (
    <AdminLayout>
      <ReportHeader
        title="Statutory GST Compliance & Tax Audit"
        subtitle="GSTR-1 schedule filing tables and GSTR-3B tax liability reconciliation."
        icon={<Receipt className="w-4 h-4" />}
        exportType="gst"
        fy={fy}
        setFy={setFy}
        quarter={quarter}
        setQuarter={setQuarter}
      />

      {loading || !data ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">
            Compiling GSTR-1 schedules and reconciling Input Tax Credit (ITC)...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* GSTR-3B Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  GSTR-3B Monthly Tax Liability Summary
                </h2>
                <p className="text-xs text-slate-500">
                  Kabhyan Technologies Pvt. Ltd. • GSTIN:{" "}
                  <span className="font-semibold text-slate-700">{data.company_info.gstin}</span> (State {data.company_info.state_code})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  CA Ready
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Gross Turnover
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {formatCurrency(data.gstr3b_summary.total_turnover)}
                </div>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Taxable Turnover
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {formatCurrency(data.gstr3b_summary.taxable_turnover)}
                </div>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Total Output Tax
                </span>
                <div className="text-base sm:text-lg font-bold text-purple-600 mt-0.5">
                  {formatCurrency(data.gstr3b_summary.total_output_tax)}
                </div>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Input Tax Credit (ITC)
                </span>
                <div className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(data.gstr3b_summary.total_itc_claimed)}
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-500">
                  Net Tax Payable (Cash)
                </span>
                <div className="text-base sm:text-lg font-extrabold text-blue-700 mt-0.5">
                  {formatCurrency(data.gstr3b_summary.net_gst_payable)}
                </div>
              </div>
            </div>
          </div>

          {/* GSTR-1 Schedule Navigation Sub-Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">GSTR-1 Outward Supply Schedules</h3>
                <p className="text-xs text-slate-500">
                  Statutory tables required for monthly GSTR-1 return filing.
                </p>
              </div>

              {/* Table Selector Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveGstrTab("t4")}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                    activeGstrTab === "t4"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Table 4: B2B ({data.table4_b2b.totals.count})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGstrTab("t7")}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                    activeGstrTab === "t7"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Table 7: B2C ({data.table7_b2c.totals.count})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGstrTab("t11a")}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                    activeGstrTab === "t11a"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Table 11A: Advances ({data.table11a_advances.totals.count})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGstrTab("t11b")}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                    activeGstrTab === "t11b"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Table 11B: Adjusted ({data.table11b_adjustments.records.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGstrTab("t13")}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                    activeGstrTab === "t13"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Table 13: Documents
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Table 4 (B2B) */}
            {activeGstrTab === "t4" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                    <tr>
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Client Name</th>
                      <th className="py-2.5 px-3">GSTIN</th>
                      <th className="py-2.5 px-3">Place of Supply</th>
                      <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                      <th className="py-2.5 px-3 text-right">IGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {data.table4_b2b.records.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          No B2B invoices issued in this tax period.
                        </td>
                      </tr>
                    ) : (
                      data.table4_b2b.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{r.invoice_number}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.invoice_date}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {r.client_company || r.client_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">
                            {r.client_gstin}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{r.place_of_supply}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {formatCurrency(r.taxable_value)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.igst > 0 ? formatCurrency(r.igst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.cgst > 0 ? formatCurrency(r.cgst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.sgst > 0 ? formatCurrency(r.sgst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(r.invoice_value)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.table4_b2b.records.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={5} className="py-3 px-3">
                          Total Table 4 B2B ({data.table4_b2b.totals.count} Invoices)
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table4_b2b.totals.taxable_value)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table4_b2b.totals.igst)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table4_b2b.totals.cgst)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table4_b2b.totals.sgst)}
                        </td>
                        <td className="py-3 px-3 text-right text-blue-700">
                          {formatCurrency(data.table4_b2b.totals.invoice_value)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* TAB CONTENT: Table 7 (B2C) */}
            {activeGstrTab === "t7" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                    <tr>
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Consumer / Party</th>
                      <th className="py-2.5 px-3">Place of Supply</th>
                      <th className="py-2.5 px-3 text-right">Taxable Value</th>
                      <th className="py-2.5 px-3 text-right">IGST</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">Total Invoice Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {data.table7_b2c.records.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          No B2C unregistered supplies in this period.
                        </td>
                      </tr>
                    ) : (
                      data.table7_b2c.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{r.invoice_number}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.invoice_date}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{r.client_name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.place_of_supply}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {formatCurrency(r.taxable_value)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.igst > 0 ? formatCurrency(r.igst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.cgst > 0 ? formatCurrency(r.cgst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.sgst > 0 ? formatCurrency(r.sgst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(r.invoice_value)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.table7_b2c.records.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={4} className="py-3 px-3">
                          Total Table 7 B2C Supplies
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table7_b2c.totals.taxable_value)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table7_b2c.totals.igst)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table7_b2c.totals.cgst)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table7_b2c.totals.sgst)}
                        </td>
                        <td className="py-3 px-3 text-right text-blue-700">
                          {formatCurrency(data.table7_b2c.totals.invoice_value)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* TAB CONTENT: Table 11A (Advances Received - Rule 50) */}
            {activeGstrTab === "t11a" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                    <tr>
                      <th className="py-2.5 px-3">Voucher No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Place of Supply</th>
                      <th className="py-2.5 px-3 text-right">Taxable Advance</th>
                      <th className="py-2.5 px-3 text-right">IGST</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">Gross Received</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {data.table11a_advances.records.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          No Rule 50 advance receipt vouchers issued in this period.
                        </td>
                      </tr>
                    ) : (
                      data.table11a_advances.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{r.voucher_number}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.voucher_date}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{r.client_name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.place_of_supply}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {formatCurrency(r.taxable_amount)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.igst > 0 ? formatCurrency(r.igst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.cgst > 0 ? formatCurrency(r.cgst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {r.sgst > 0 ? formatCurrency(r.sgst) : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(r.amount_received)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                                r.status === "fully_adjusted"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.table11a_advances.records.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={4} className="py-3 px-3">
                          Total Table 11A Advance Receipts
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table11a_advances.totals.taxable_amount)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table11a_advances.totals.igst)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table11a_advances.totals.cgst)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {formatCurrency(data.table11a_advances.totals.sgst)}
                        </td>
                        <td className="py-3 px-3 text-right text-blue-700">
                          {formatCurrency(data.table11a_advances.totals.gross_amount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* TAB CONTENT: Table 11B (Advance Adjustments) */}
            {activeGstrTab === "t11b" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                    <tr>
                      <th className="py-2.5 px-4">Invoice No</th>
                      <th className="py-2.5 px-4">Invoice Date</th>
                      <th className="py-2.5 px-4">Client</th>
                      <th className="py-2.5 px-4">Origin Receipt Voucher</th>
                      <th className="py-2.5 px-4 text-right">Advance Adjusted (Deduction)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {data.table11b_adjustments.records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No advance adjustments made on invoices in this period.
                        </td>
                      </tr>
                    ) : (
                      data.table11b_adjustments.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{r.invoice_number}</td>
                          <td className="py-2.5 px-4 text-slate-600">{r.invoice_date}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{r.client_name}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-purple-700">
                            {r.voucher_number}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                            -{formatCurrency(r.adjusted_amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.table11b_adjustments.records.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={4} className="py-3 px-4">
                          Total Advances Adjusted (Table 11B)
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600">
                          -{formatCurrency(data.table11b_adjustments.total_adjusted)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* TAB CONTENT: Table 13 (Document Register) */}
            {activeGstrTab === "t13" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-3xs">
                    <tr>
                      <th className="py-2.5 px-4">Nature of Document</th>
                      <th className="py-2.5 px-4">Sr. No. From</th>
                      <th className="py-2.5 px-4">Sr. No. To</th>
                      <th className="py-2.5 px-4 text-right">Total Number</th>
                      <th className="py-2.5 px-4 text-right">Cancelled</th>
                      <th className="py-2.5 px-4 text-right font-bold text-slate-900">Net Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {data.table13_documents.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{doc.nature_of_doc}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{doc.sr_from}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{doc.sr_to}</td>
                        <td className="py-3 px-4 text-right">{doc.total_number}</td>
                        <td className="py-3 px-4 text-right text-rose-600">{doc.cancelled}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-700">
                          {doc.net_issued}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
