"use client";

import React from "react";
import { Plus, Trash2, GripVertical, Calculator, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface DocumentItemRow {
  id?: number;
  item_name: string;
  description?: string | null;
  sac_code?: string | null;
  quantity: number | string;
  unit?: string;
  unit_price: number | string;
  tax_rate?: number | string;
  tax_amount?: number;
  amount: number;
}

interface DocumentItemsTableProps {
  items: any[];
  currency?: string;
  taxRate?: number | string; // default fallback tax rate if item doesn't specify
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
  title = "Item Table",
  onItemChange,
  onAddItem,
  onRemoveItem,
}: DocumentItemsTableProps) {
  const defaultNumTax = Number(taxRate) || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden font-sans">
      {/* Card Header matching reference: clean "Item Table" */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
      </div>

      {/* Responsive Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <th className="py-3 px-3 w-10 text-center"></th>
              <th className="py-3 px-4 min-w-[320px] text-slate-600">ITEM DETAILS</th>
              <th className="py-3 px-4 w-32 text-right text-slate-600">QUANTITY</th>
              <th className="py-3 px-4 w-36 text-right text-slate-600">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span>RATE</span>
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </th>
              <th className="py-3 px-4 w-44 text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span>TAX</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </th>
              <th className="py-3 px-6 w-36 text-right text-slate-600">AMOUNT</th>
              <th className="py-3 px-2 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.map((item, idx) => {
              const qty = Number(item.quantity) || 0;
              const rate = Number(item.unit_price) || 0;
              const taxable = Number((qty * rate).toFixed(2));
              
              // Item tax rate or fall back to document default
              const currentItemTaxRate = item.tax_rate !== undefined && item.tax_rate !== null && item.tax_rate !== ""
                ? Number(item.tax_rate)
                : defaultNumTax;

              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/70 transition-colors group align-top"
                >
                  {/* Drag Grip Handle */}
                  <td className="py-4 px-2 text-center text-slate-300 group-hover:text-slate-400 cursor-grab pt-4 select-none">
                    <GripVertical className="w-4 h-4 mx-auto" />
                  </td>

                  {/* ITEM DETAILS (Title + Subtle Expandable Description) */}
                  <td className="py-3.5 px-4 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Type or click to select an item."
                      value={item.item_name || ""}
                      onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                      required
                      className="w-full text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 bg-transparent border-0 p-0"
                    />
                    <textarea
                      rows={1}
                      placeholder="Add milestone description or deliverable scope (optional)..."
                      value={item.description || ""}
                      onChange={(e) => onItemChange(idx, "description", e.target.value)}
                      className="w-full text-[11px] text-slate-500 placeholder:text-slate-300 focus:outline-none focus:text-slate-700 bg-transparent border-0 p-0 resize-none transition"
                    />
                  </td>

                  {/* QUANTITY */}
                  <td className="py-3.5 px-4 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="1.00"
                      value={item.quantity}
                      onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                      required
                      className="w-full text-right font-mono text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 transition"
                    />
                  </td>

                  {/* RATE */}
                  <td className="py-3.5 px-4 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={item.unit_price}
                      onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                      required
                      className="w-full text-right font-mono text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 transition"
                    />
                  </td>

                  {/* TAX DROPDOWN (matching reference: "Select a Tax ▾") */}
                  <td className="py-3.5 px-4">
                    <select
                      value={currentItemTaxRate}
                      onChange={(e) => onItemChange(idx, "tax_rate", Number(e.target.value))}
                      className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs font-medium"
                    >
                      <option value={18}>GST [18%]</option>
                      <option value={12}>GST [12%]</option>
                      <option value={5}>GST [5%]</option>
                      <option value={28}>GST [28%]</option>
                      <option value={0}>Non-Taxable [0%]</option>
                    </select>
                  </td>

                  {/* AMOUNT (Calculated Taxable / Gross Total) */}
                  <td className="py-4 px-6 text-right font-mono text-xs font-bold text-slate-900 select-none">
                    {taxable.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Delete Item Action */}
                  <td className="py-4 px-2 text-center">
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete Line Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="w-7 h-7 block" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Line Footer Bar */}
      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-3 py-1.5 rounded-lg transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Another Line</span>
        </button>

        <span className="text-[11px] text-slate-400 font-medium">
          Line amounts represent net taxable item subtotal before aggregate deductions.
        </span>
      </div>
    </div>
  );
}
