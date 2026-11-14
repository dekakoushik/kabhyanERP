"use client";

import React from "react";
import { Plus, Trash2, GripVertical, Calculator, Info } from "lucide-react";

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
  taxRate?: number | string;
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
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          </h3>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 font-semibold text-xs shadow-2xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Line</span>
        </button>
      </div>

      {/* 1. DESKTOP & TABLET VIEWPORT TABLE (hidden on mobile < 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <th className="py-3 px-3 w-10 text-center"></th>
              <th className="py-3 px-4 min-w-[280px] text-slate-600">ITEM DETAILS</th>
              <th className="py-3 px-4 w-32 text-right text-slate-600">QUANTITY</th>
              <th className="py-3 px-4 w-36 text-right text-slate-600">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span>RATE ({currencySymbol})</span>
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </th>
              <th className="py-3 px-4 w-40 text-slate-600">
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
              
              const currentItemTaxRate = item.tax_rate !== undefined && item.tax_rate !== null && item.tax_rate !== ""
                ? Number(item.tax_rate)
                : defaultNumTax;

              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/70 transition-colors group align-top"
                >
                  {/* Drag Handle */}
                  <td className="py-4 px-2 text-center text-slate-300 group-hover:text-slate-400 cursor-grab pt-4 select-none">
                    <GripVertical className="w-4 h-4 mx-auto" />
                  </td>

                  {/* ITEM DETAILS */}
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
                      className="w-full text-right font-mono text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 transition"
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
                      className="w-full text-right font-mono text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 transition"
                    />
                  </td>

                  {/* TAX DROPDOWN */}
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

                  {/* AMOUNT */}
                  <td className="py-4 px-6 text-right font-mono text-xs font-bold text-slate-900 select-none">
                    {taxable.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Actions */}
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

      {/* 2. MOBILE CARD VIEWPORT (shown only on mobile < 640px) */}
      <div className="block sm:hidden divide-y divide-slate-100 p-3 space-y-3">
        {items.map((item, idx) => {
          const qty = Number(item.quantity) || 0;
          const rate = Number(item.unit_price) || 0;
          const taxable = Number((qty * rate).toFixed(2));
          const currentItemTaxRate = item.tax_rate !== undefined && item.tax_rate !== null && item.tax_rate !== ""
            ? Number(item.tax_rate)
            : defaultNumTax;

          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40 space-y-3 shadow-2xs pt-3"
            >
              {/* Card Row Header: Item # and Delete */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/50">
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Item #{idx + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-slate-500">
                  Item Details <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type or click to select an item."
                  value={item.item_name || ""}
                  onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                  required
                  className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <textarea
                  rows={2}
                  placeholder="Scope or milestone details..."
                  value={item.description || ""}
                  onChange={(e) => onItemChange(idx, "description", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-[11px] text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Quantity and Rate Side-by-Side */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="1.00"
                    value={item.quantity}
                    onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                    required
                    className="w-full min-h-[38px] px-2.5 py-1.5 text-right font-mono font-semibold rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Rate ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                    required
                    className="w-full min-h-[38px] px-2.5 py-1.5 text-right font-mono font-semibold rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tax Selection and Computed Amount */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 items-center">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Tax Slab
                  </label>
                  <select
                    value={currentItemTaxRate}
                    onChange={(e) => onItemChange(idx, "tax_rate", Number(e.target.value))}
                    className="w-full min-h-[38px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={18}>GST 18%</option>
                    <option value={12}>GST 12%</option>
                    <option value={5}>GST 5%</option>
                    <option value={28}>GST 28%</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Amount
                  </span>
                  <p className="font-mono text-sm font-extrabold text-slate-900">
                    {currencySymbol}{taxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Line Footer Bar */}
      <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 rounded-lg transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Another Line</span>
        </button>

        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Line amounts represent net taxable subtotal before aggregate deductions.
        </span>
      </div>
    </div>
  );
}
