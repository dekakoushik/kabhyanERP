"use client";

import React from "react";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface DocumentItemRow {
  id?: number;
  item_name: string;
  description?: string | null;
  sac_code?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

interface DocumentItemsTableProps {
  items: any[];
  currency?: string;
  taxRate: number | string;
  title?: string;
  subtitle?: string;
  itemLabel?: string;
  allowSacCode?: boolean;
  onItemChange: (index: number, field: any, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

export default function DocumentItemsTable({
  items,
  currency = "INR",
  taxRate = 18,
  title = "Itemized Deliverables & Pricing",
  subtitle = "Add scope deliverables, specify billable quantities, rates, and inspect per-item taxes",
  itemLabel = "Deliverable",
  allowSacCode = false,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: DocumentItemsTableProps) {
  const numTaxRate = Number(taxRate) || 0;
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200/60">
              {items.length} {items.length === 1 ? "Line Item" : "Line Items"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
          className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add {itemLabel}
        </Button>
      </div>

      {/* Desktop Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-12 text-center text-slate-400">#</th>
              <th className="py-3 px-4 min-w-[280px]">
                {itemLabel} & Description
              </th>
              {allowSacCode && (
                <th className="py-3 px-3 w-28 text-center">HSN / SAC</th>
              )}
              <th className="py-3 px-3 w-40 text-center">Qty & Units</th>
              <th className="py-3 px-3 w-36 text-right">Unit Rate ({currency})</th>
              <th className="py-3 px-3 w-32 text-right">Taxable</th>
              <th className="py-3 px-3 w-32 text-right">GST ({numTaxRate}%)</th>
              <th className="py-3 px-4 w-36 text-right">Line Total</th>
              <th className="py-3 px-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.map((item, idx) => {
              const taxable = Number(item.amount) || 0;
              const gstAmount = taxable * (numTaxRate / 100);
              const grossTotal = taxable + gstAmount;

              return (
                <tr
                  key={idx}
                  className="hover:bg-blue-50/20 transition-colors group"
                >
                  {/* Row Index */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 text-xs align-top pt-4">
                    {idx + 1}
                  </td>

                  {/* Title & Scope in single cohesive block */}
                  <td className="py-3.5 px-4 align-top space-y-1.5">
                    <Input
                      placeholder={`${itemLabel} Title (e.g. Frontend Development)`}
                      value={item.item_name}
                      onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                      required
                      className="h-9 font-semibold text-slate-900 bg-white placeholder:text-slate-400 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-xs"
                    />
                    <textarea
                      rows={2}
                      placeholder="Scope details, deliverables, milestone requirements..."
                      value={item.description || ""}
                      onChange={(e) => onItemChange(idx, "description", e.target.value)}
                      className="w-full rounded-lg border border-slate-200/90 bg-white/90 p-2 text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition"
                    />
                  </td>

                  {/* Optional HSN / SAC Code */}
                  {allowSacCode && (
                    <td className="py-3.5 px-3 align-top pt-4">
                      <Input
                        placeholder="998311"
                        value={item.sac_code || ""}
                        onChange={(e) => onItemChange(idx, "sac_code", e.target.value)}
                        className="h-9 font-mono text-center text-xs bg-white rounded-lg border-slate-200"
                      />
                    </td>
                  )}

                  {/* Qty & Unit Input Group */}
                  <td className="py-3.5 px-3 align-top pt-4">
                    <div className="flex rounded-lg shadow-2xs border border-slate-200 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                        required
                        className="w-16 h-9 px-2 text-center font-mono text-xs font-semibold text-slate-800 focus:outline-none border-r border-slate-200"
                      />
                      <select
                        value={item.unit || "hours"}
                        onChange={(e) => onItemChange(idx, "unit", e.target.value)}
                        className="h-9 px-2 text-xs font-medium text-slate-600 bg-slate-50/50 hover:bg-slate-100/50 focus:outline-none cursor-pointer"
                      >
                        <option value="hours">hrs</option>
                        <option value="days">days</option>
                        <option value="units">units</option>
                        <option value="milestone">mile</option>
                        <option value="months">mos</option>
                        <option value="service">srv</option>
                      </select>
                    </div>
                  </td>

                  {/* Unit Rate */}
                  <td className="py-3.5 px-3 align-top pt-4">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs select-none">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={item.unit_price}
                        onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                        required
                        className="h-9 pl-7 pr-2.5 text-right font-mono font-semibold text-slate-900 bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </td>

                  {/* Taxable Amount */}
                  <td className="py-3.5 px-3 text-right align-top pt-5 font-mono text-xs font-semibold text-slate-800">
                    {currencySymbol}{taxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Per-Item GST Breakdown */}
                  <td className="py-3.5 px-3 text-right align-top pt-4">
                    <div className="inline-flex flex-col items-end">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">
                        +{currencySymbol}{gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {numTaxRate}% GST
                      </span>
                    </div>
                  </td>

                  {/* Line Total (Gross) */}
                  <td className="py-3.5 px-4 text-right align-top pt-5 font-mono text-xs font-extrabold text-slate-900">
                    {currencySymbol}{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Row Delete Action */}
                  <td className="py-3.5 px-3 text-center align-top pt-4">
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition opacity-60 group-hover:opacity-100 cursor-pointer"
                        title="Remove Line Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="w-8 h-8 block" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Quick-Add Bar */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddItem}
          className="text-xs font-semibold text-blue-600 hover:bg-blue-100/60 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Another Deliverable Line
        </Button>

        <span className="text-[11px] text-slate-400">
          Amounts reflect <span className="font-semibold text-slate-600">{numTaxRate}% standard GST</span> rate.
        </span>
      </div>
    </div>
  );
}
