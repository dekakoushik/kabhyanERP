"use client";

import React from "react";
import { X, FileText, CheckCircle2, Building, ShieldCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  documentType: "Estimate" | "Proforma Invoice" | "Tax Invoice";
  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGstin?: string;
  currency?: string;
  items: Array<{
    item_name: string;
    description?: string | null;
    quantity: number | string;
    unit?: string;
    unit_price: number | string;
    amount?: number | string;
  }>;
  subtotal: number;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  discountRate: number;
  taxCalculationType: "exclusive" | "inclusive";
  taxRate: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  notes?: string;
  termsAndConditions?: string;
  onConfirmSave?: () => void;
}

export default function DocumentPreviewDrawer({
  open,
  onClose,
  documentType,
  documentNumber,
  issueDate,
  dueDate,
  clientName,
  clientCompany,
  clientEmail,
  clientPhone,
  clientAddress,
  clientGstin,
  currency = "INR",
  items,
  subtotal,
  discountType,
  discountAmount,
  discountRate,
  taxCalculationType,
  taxRate,
  taxAmount,
  roundOff,
  grandTotal,
  notes,
  termsAndConditions,
  onConfirmSave,
}: DocumentPreviewDrawerProps) {
  if (!open) return null;

  const isAssam = clientGstin?.startsWith("18") || (clientAddress || "").toLowerCase().includes("assam");
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{documentType} Live Sheet Preview</span>
                <span className="font-mono text-2xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  {documentNumber || "DRAFT"}
                </span>
              </h2>
              <p className="text-2xs text-slate-500">
                Exact presentation layout that client sees on PDF and client portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Sheet Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-700 bg-white font-sans">
          {/* Header Row: Company & Document Metadata */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">
                  KABHYAN TECHNOLOGIES
                </span>
                <span className="text-3xs font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              </div>
              <p className="text-slate-500 text-2xs">Kabhyan Technologies Private Limited</p>
              <p className="text-slate-500 text-2xs">Guwahati, Assam, India - 781001</p>
              <p className="font-mono text-2xs text-slate-600">GSTIN: 18AABCA1234F1Z</p>
            </div>

            <div className="sm:text-right space-y-1">
              <h3 className="text-lg font-black text-blue-700 uppercase tracking-wide">
                {documentType}
              </h3>
              <p className="font-mono text-xs font-bold text-slate-900">{documentNumber}</p>
              <p className="text-2xs text-slate-500">Date: {issueDate || "—"}</p>
              {dueDate && <p className="text-2xs text-slate-500">Due / Valid Until: {dueDate}</p>}
            </div>
          </div>

          {/* Client Bill To & Tax Residency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To / Proposal For
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {clientCompany || clientName || "Client Not Selected"}
              </p>
              {clientCompany && clientName && (
                <p className="text-2xs text-slate-600 font-medium">Attn: {clientName}</p>
              )}
              {clientAddress && (
                <p className="text-2xs text-slate-500 mt-1 leading-relaxed">{clientAddress}</p>
              )}
              {clientEmail && <p className="text-2xs text-slate-500">{clientEmail}</p>}
              {clientPhone && <p className="text-2xs text-slate-500">{clientPhone}</p>}
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tax & Legal Details
              </span>
              <p className="font-mono text-2xs text-slate-800">
                Client GSTIN: <strong>{clientGstin || "Unregistered / Consumer"}</strong>
              </p>
              <p className="text-2xs text-slate-600">
                Tax Mode: <strong>{taxCalculationType === "inclusive" ? "GST Inclusive" : "GST Exclusive (+18%)"}</strong>
              </p>
              <p className="text-2xs text-purple-700 font-semibold">
                Place of Supply: {isAssam ? "Assam (Intra-State CGST+SGST)" : "Inter-State (IGST)"}
              </p>
            </div>
          </div>

          {/* Deliverables Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Scope / Deliverable Description</th>
                  <th className="py-2.5 px-3 text-right w-24">Qty & Unit</th>
                  <th className="py-2.5 px-3 text-right w-28">Rate ({currencySymbol})</th>
                  <th className="py-2.5 px-4 text-right w-32">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, i) => {
                  const q = Number(it.quantity) || 0;
                  const r = Number(it.unit_price) || 0;
                  const tot = Number((q * r).toFixed(2));
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{it.item_name || "Untitled Deliverable"}</div>
                        {it.description && (
                          <div className="text-2xs text-slate-500 whitespace-pre-line mt-0.5">
                            {it.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {q} {it.unit || "hrs"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {r.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {tot.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Commercial Settlement Summary */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="sm:max-w-md space-y-4">
              {notes && (
                <div>
                  <h4 className="text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Notes & Scope Clarifications
                  </h4>
                  <p className="text-2xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {notes}
                  </p>
                </div>
              )}
              {termsAndConditions && (
                <div>
                  <h4 className="text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Terms of Engagement & Conditions
                  </h4>
                  <p className="text-2xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {termsAndConditions}
                  </p>
                </div>
              )}
            </div>

            <div className="sm:w-80 space-y-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Deliverables Turnover</span>
                  <span className="font-mono font-bold">
                    {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({discountType === "fixed" ? "Flat" : `${discountRate}%`})</span>
                    <span className="font-mono">
                      -{currencySymbol}{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>GST ({taxRate}% {taxCalculationType === "inclusive" ? "Included" : "Added"})</span>
                  <span className="font-mono font-bold">
                    {taxCalculationType === "inclusive" ? "Incl. " : "+"}
                    {currencySymbol}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500 text-2xs">
                    <span>Round-Off</span>
                    <span className="font-mono">{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900">
                  <span className="font-black text-sm">Total Payable</span>
                  <span className="font-mono font-black text-base text-blue-700">
                    {currencySymbol}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onClose} size="sm">
            Close Preview
          </Button>

          {onConfirmSave && (
            <Button
              type="button"
              onClick={() => {
                onClose();
                onConfirmSave();
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Confirm & Save {documentType}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
