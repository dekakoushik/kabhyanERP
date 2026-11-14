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

      {/* 1. DESKTOP & TABLET VIEWPORT TABLE */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <th className="py-3 px-3 w-8 text-center"></th>
              <th className="py-3 px-3 min-w-[300px] text-slate-600">ITEM DETAILS</th>
              <th className="py-3 px-3 w-28 text-right text-slate-600">QUANTITY</th>
              <th className="py-3 px-3 w-36 text-right text-slate-600">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span>RATE ({currencySymbol})</span>
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </th>
              <th className="py-3 px-3 w-44 text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span>TAX</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </th>
              <th className="py-3 px-4 w-32 text-right text-slate-600">AMOUNT</th>
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
                  className="hover:bg-slate-50/50 transition-colors group align-middle"
                >
                  {/* Drag Handle */}
                  <td className="py-3.5 px-2 text-center text-slate-300 group-hover:text-slate-400 cursor-grab select-none">
                    <GripVertical className="w-4 h-4 mx-auto" />
                  </td>

                  {/* ITEM DETAILS (Title + Description inside visible input boxes) */}
                  <td className="py-3.5 px-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Type or click to select an item."
                      value={item.item_name || ""}
                      onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                      required
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
                    />
                    <textarea
                      rows={1}
                      placeholder="Add milestone description or deliverable scope (optional)..."
                      value={item.description || ""}
                      onChange={(e) => onItemChange(idx, "description", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs resize-none transition"
                    />
                  </td>

                  {/* QUANTITY (Visible input box) */}
                  <td className="py-3.5 px-3 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="1.00"
                      value={item.quantity}
                      onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                      required
                      className="w-full h-9 px-3 text-right font-mono text-xs font-bold text-slate-800 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
                    />
                  </td>

                  {/* RATE (Visible input box) */}
                  <td className="py-3.5 px-3 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={item.unit_price}
                      onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                      required
                      className="w-full h-9 px-3 text-right font-mono text-xs font-bold text-slate-800 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
                    />
                  </td>

                  {/* TAX DROPDOWN (Comfortable width, clean labels without truncation) */}
                  <td className="py-3.5 px-3">
                    <select
                      value={currentItemTaxRate}
                      onChange={(e) => onItemChange(idx, "tax_rate", Number(e.target.value))}
                      className="w-full h-9 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs font-semibold"
                    >
                      <option value={18}>18% GST (Standard)</option>
                      <option value={12}>12% GST</option>
                      <option value={5}>5% GST</option>
                      <option value={28}>28% GST</option>
                      <option value={0}>0% (Tax Exempt)</option>
                    </select>
                  </td>

                  {/* AMOUNT (Crisp right-aligned tabular total) */}
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-extrabold text-slate-900 select-none">
                    {taxable.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-2 text-center">
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer mx-auto"
                        title="Delete Line Item"
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

      {/* 2. MOBILE CARD VIEWPORT */}
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
              className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs pt-3"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  Item #{idx + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

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
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <textarea
                  rows={2}
                  placeholder="Add milestone description or deliverable scope (optional)..."
                  value={item.description || ""}
                  onChange={(e) => onItemChange(idx, "description", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

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
                    className="w-full h-9 px-3 text-right font-mono font-bold rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    className="w-full h-9 px-3 text-right font-mono font-bold rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1 items-center">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Tax Slab
                  </label>
                  <select
                    value={currentItemTaxRate}
                    onChange={(e) => onItemChange(idx, "tax_rate", Number(e.target.value))}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value={18}>18% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={28}>28% GST</option>
                    <option value={0}>0% Exempt</option>
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
