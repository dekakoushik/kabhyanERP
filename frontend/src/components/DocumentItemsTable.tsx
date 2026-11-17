"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Calculator,
  Info,
  Sparkles,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  FileCode,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export interface DocumentItemRow {
  id?: number;
  item_name: string;
  description?: string | null;
  sac_code?: string | null;
  hsn_sac?: string | null;
  quantity: number | string;
  unit?: string;
  unit_price: number | string;
  tax_rate?: number | string;
  tax_amount?: number;
  amount: number;
}

export const DELIVERABLE_PRESETS = [
  {
    name: "Full-Stack Web Application",
    description: "End-to-end frontend and backend development with secure authentication, API architecture, and database design.",
    quantity: 160,
    unit: "hrs",
    unit_price: 2000,
    sac_code: "998314",
  },
  {
    name: "UI/UX Design Sprint",
    description: "High-fidelity Figma prototypes, interactive wireframes, component library design, and design system documentation.",
    quantity: 60,
    unit: "hrs",
    unit_price: 1500,
    sac_code: "998314",
  },
  {
    name: "Cloud Infrastructure & DevOps Setup",
    description: "Containerized deployment, automated CI/CD pipeline, SSL configuration, and server hardening.",
    quantity: 1,
    unit: "units",
    unit_price: 45000,
    sac_code: "998313",
  },
  {
    name: "Mobile App Development (iOS & Android)",
    description: "Cross-platform mobile application development with responsive layouts, push notifications, and API synchronization.",
    quantity: 180,
    unit: "hrs",
    unit_price: 2200,
    sac_code: "998314",
  },
  {
    name: "Annual Maintenance & Support Retainer",
    description: "Monthly server monitoring, bug fixes, performance optimizations, and priority technical support.",
    quantity: 12,
    unit: "mos",
    unit_price: 25000,
    sac_code: "998313",
  },
  {
    name: "Technical Architecture & Consulting",
    description: "Senior architectural consultation, code review audit, security assessment, and scalability roadmap.",
    quantity: 40,
    unit: "hrs",
    unit_price: 3000,
    sac_code: "998313",
  },
];

interface DocumentItemsTableProps {
  items: any[];
  currency?: string;
  taxRate?: number | string;
  taxCalculationType?: "exclusive" | "inclusive";
  title?: string;
  subtitle?: string;
  itemLabel?: string;
  allowSacCode?: boolean;
  onItemChange: (index: number, field: any, value: any) => void;
  onAddItem: () => void;
  onDuplicateItem?: (index: number) => void;
  onAddPresetItem?: (preset: typeof DELIVERABLE_PRESETS[0]) => void;
  onRemoveItem: (index: number) => void;
  onReorderItems?: (startIndex: number, endIndex: number) => void;
}

export default function DocumentItemsTable({
  items,
  currency = "INR",
  taxRate = 18,
  taxCalculationType = "exclusive",
  title = "Item Table",
  allowSacCode = false,
  onItemChange,
  onAddItem,
  onDuplicateItem,
  onAddPresetItem,
  onRemoveItem,
  onReorderItems,
}: DocumentItemsTableProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultNumTax = Number(taxRate) || 0;
  const currencySymbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    if (startIndex === endIndex) return;

    if (onReorderItems) {
      onReorderItems(startIndex, endIndex);
    }
  };

  const handleSelectPreset = (preset: typeof DELIVERABLE_PRESETS[0]) => {
    setPresetDropdownOpen(false);
    if (onAddPresetItem) {
      onAddPresetItem(preset);
    } else {
      // Default fallback if parent did not provide onAddPresetItem:
      // Fill the last item if blank, otherwise onAddItem then populate
      const lastIndex = items.length - 1;
      const lastItem = items[lastIndex];
      const isBlank = lastItem && !lastItem.item_name && (!lastItem.unit_price || Number(lastItem.unit_price) === 0);

      const targetIndex = isBlank ? lastIndex : items.length;
      if (!isBlank) {
        onAddItem();
      }

      setTimeout(() => {
        onItemChange(targetIndex, "item_name", preset.name);
        onItemChange(targetIndex, "description", preset.description);
        onItemChange(targetIndex, "quantity", preset.quantity);
        onItemChange(targetIndex, "unit", preset.unit);
        onItemChange(targetIndex, "unit_price", preset.unit_price);
        if (allowSacCode) {
          onItemChange(targetIndex, "sac_code", preset.sac_code);
          onItemChange(targetIndex, "hsn_sac", preset.sac_code);
        }
      }, 50);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden font-sans">
      {/* Header Bar with Scope Presets and Add Line CTAs */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {items.length} {items.length === 1 ? "Line" : "Lines"}
            </span>
          </h3>
          <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hidden md:inline-flex">
            {taxCalculationType === "inclusive" ? "Rates Incl. GST" : "Rates +GST (Exclusive)"}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto relative">
          {/* Preset Offerings Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/70 font-semibold text-xs shadow-2xs transition cursor-pointer select-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Scope Presets</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {presetDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPresetDropdownOpen(false)}
                />
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Insert Service Package
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {DELIVERABLE_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50/70 transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-blue-700">
                          <span>{preset.name}</span>
                          <span className="font-mono text-2xs text-slate-500 font-semibold">
                            ₹{preset.unit_price.toLocaleString("en-IN")}/{preset.unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Add Blank Line */}
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 font-semibold text-xs shadow-2xs transition cursor-pointer select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line</span>
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* 1. DESKTOP & TABLET VIEWPORT TABLE (≥ 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                <th className="py-3 px-2 w-8 text-center"></th>
                <th className="py-3 px-3 min-w-[240px] text-slate-600">Item & Description</th>
                {allowSacCode && (
                  <th className="py-3 px-2 w-24 text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <span>SAC</span>
                      <FileCode className="w-3 h-3 text-slate-400" />
                    </span>
                  </th>
                )}
                <th className="py-3 px-3 w-32 text-right text-slate-600">Qty & Unit</th>
                <th className="py-3 px-3 w-28 text-right text-slate-600">
                  <span className="inline-flex items-center gap-1 justify-end">
                    <span>{taxCalculationType === "inclusive" ? "Gross Rate" : "Rate"} ({currencySymbol})</span>
                    <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </th>
                <th className="py-3 px-3 w-36 text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <span>Tax Rate</span>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </th>
                <th className="py-3 px-4 w-36 text-right text-slate-600">
                  {taxCalculationType === "inclusive" ? `Gross Total (${currencySymbol})` : `Amount (${currencySymbol})`}
                </th>
                <th className="py-3 px-2 w-16 text-center"></th>
              </tr>
            </thead>

            {isMounted ? (
              <Droppable droppableId="document-items-desktop">
                {(droppableProvided) => (
                  <tbody
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                    className="divide-y divide-slate-100 text-xs"
                  >
                    {items.map((item, idx) => {
                      const qty = Number(item.quantity) || 0;
                      const rate = Number(item.unit_price) || 0;
                      const lineTotal = Number((qty * rate).toFixed(2));

                      const currentItemTaxRate =
                        item.tax_rate !== undefined && item.tax_rate !== null && item.tax_rate !== ""
                          ? Number(item.tax_rate)
                          : defaultNumTax;

                      const isInclusive = taxCalculationType === "inclusive";
                      const taxable = isInclusive
                        ? (currentItemTaxRate > 0 ? Number((lineTotal / (1 + currentItemTaxRate / 100)).toFixed(2)) : lineTotal)
                        : lineTotal;

                      const itemGst = isInclusive
                        ? Number((lineTotal - taxable).toFixed(2))
                        : Number(((taxable * currentItemTaxRate) / 100).toFixed(2));

                      const draggableKey = `desktop-item-${item.id ?? idx}`;

                      return (
                        <Draggable key={draggableKey} draggableId={draggableKey} index={idx}>
                          {(draggableProvided, snapshot) => (
                            <tr
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              style={{
                                ...draggableProvided.draggableProps.style,
                                ...(snapshot.isDragging ? { background: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" } : {}),
                              }}
                              className={`group hover:bg-slate-50/60 transition ${snapshot.isDragging ? "bg-slate-50" : ""}`}
                            >
                              <td className="py-3 px-2 text-center text-slate-300">
                                <div
                                  {...draggableProvided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 hover:text-slate-600 inline-block"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    placeholder="Deliverable title or milestone..."
                                    value={item.item_name || ""}
                                    onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                                    className="w-full h-8 px-2.5 font-bold text-slate-900 rounded-md border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                  />
                                  <textarea
                                    rows={1}
                                    placeholder="Scope details or deliverable specifications..."
                                    value={item.description || ""}
                                    onChange={(e) => onItemChange(idx, "description", e.target.value)}
                                    className="w-full p-2 text-2xs text-slate-600 rounded-md border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                  />
                                </div>
                              </td>
                              {allowSacCode && (
                                <td className="py-3 px-2 align-top">
                                  <input
                                    type="text"
                                    placeholder="998314"
                                    value={item.sac_code || item.hsn_sac || ""}
                                    onChange={(e) => {
                                      onItemChange(idx, "sac_code", e.target.value);
                                      onItemChange(idx, "hsn_sac", e.target.value);
                                    }}
                                    className="w-20 h-8 px-2 font-mono text-2xs font-semibold text-slate-700 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                              )}
                              <td className="py-3 px-3 text-right whitespace-nowrap align-top">
                                <div className="flex items-center justify-end border border-slate-200 rounded-md overflow-hidden bg-white">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    value={item.quantity}
                                    onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                                    className="w-16 h-8 px-2 text-right font-mono text-xs font-bold text-slate-800 focus:outline-none"
                                  />
                                  <select
                                    value={item.unit || "hrs"}
                                    onChange={(e) => onItemChange(idx, "unit", e.target.value)}
                                    className="h-8 px-1.5 text-2xs font-semibold text-slate-600 bg-slate-50 border-l border-slate-200 focus:outline-none cursor-pointer"
                                  >
                                    <option value="hrs">hrs</option>
                                    <option value="days">days</option>
                                    <option value="units">units</option>
                                    <option value="mile">mile</option>
                                    <option value="mos">mos</option>
                                  </select>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap align-top">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                                  className="w-28 h-8 px-2.5 text-right font-mono text-xs font-bold text-slate-800 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap align-top">
                                <select
                                  value={currentItemTaxRate}
                                  onChange={(e) => onItemChange(idx, "tax_rate", Number(e.target.value))}
                                  className="w-full h-8 text-2xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value={18}>18% GST (Standard)</option>
                                  <option value={12}>12% GST</option>
                                  <option value={5}>5% GST</option>
                                  <option value={28}>28% GST</option>
                                  <option value={0}>0% (Tax Exempt)</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap align-top">
                                <div className="font-mono text-xs font-black text-slate-900 select-none">
                                  {currencySymbol} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                {currentItemTaxRate > 0 && (
                                  <div className="text-[10px] font-mono text-purple-700 font-semibold mt-0.5 select-none">
                                    {isInclusive
                                      ? `Incl. ₹${itemGst.toFixed(2)} (${currentItemTaxRate}% GST) • ₹${taxable.toFixed(2)} net`
                                      : `+₹${itemGst.toFixed(2)} (${currentItemTaxRate}% GST)`}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center whitespace-nowrap align-top">
                                <div className="flex items-center gap-1 justify-center">
                                  {onDuplicateItem && (
                                    <button
                                      type="button"
                                      onClick={() => onDuplicateItem(idx)}
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition cursor-pointer"
                                      title="Duplicate line item"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveItem(idx)}
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                                      title="Remove line item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      );
                    })}
                    {droppableProvided.placeholder}
                  </tbody>
                    )}
                  </Droppable>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400">Loading deliverables ledger...</td>
                    </tr>
                  </tbody>
                )}
          </table>
        </div>

        {/* 2. MOBILE CARD VIEWPORT (< 640px) - TOUCH-OPTIMIZED NATIVE APP FEEL */}
        <div className="block sm:hidden divide-y divide-slate-100 p-3 space-y-3">
          {isMounted ? (
            <Droppable droppableId="document-items-mobile">
              {(droppableProvided) => (
                <div
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  className="space-y-3"
                >
                  {items.map((item, idx) => {
                    const qty = Number(item.quantity) || 0;
                    const rate = Number(item.unit_price) || 0;
                    const lineTotal = Number((qty * rate).toFixed(2));
                    const currentItemTaxRate =
                      item.tax_rate !== undefined && item.tax_rate !== null && item.tax_rate !== ""
                        ? Number(item.tax_rate)
                        : defaultNumTax;
                    const isInclusive = taxCalculationType === "inclusive";
                    const taxable = isInclusive
                      ? (currentItemTaxRate > 0 ? Number((lineTotal / (1 + currentItemTaxRate / 100)).toFixed(2)) : lineTotal)
                      : lineTotal;
                    const itemGst = isInclusive
                      ? Number((lineTotal - taxable).toFixed(2))
                      : Number(((taxable * currentItemTaxRate) / 100).toFixed(2));

                    const draggableKey = `mobile-item-${item.id ?? idx}`;

                    return (
                      <Draggable key={draggableKey} draggableId={draggableKey} index={idx}>
                        {(draggableProvided, snapshot) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            className={`p-3.5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs pt-3 transition-shadow ${
                              snapshot.isDragging
                                ? "ring-2 ring-blue-500 shadow-xl bg-blue-50/50"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <div
                                  {...draggableProvided.dragHandleProps}
                                  className="p-1 -ml-1 text-slate-400 hover:text-blue-600 cursor-grab active:cursor-grabbing select-none"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                  #{idx + 1}
                                </span>
                              </div>

                              {/* Action Buttons: Up/Down Reorder, Duplicate, Delete */}
                              <div className="flex items-center gap-1">
                                {onReorderItems && idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => onReorderItems(idx, idx - 1)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onReorderItems && idx < items.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => onReorderItems(idx, idx + 1)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onDuplicateItem && (
                                  <button
                                    type="button"
                                    onClick={() => onDuplicateItem(idx)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition"
                                    title="Duplicate line item"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveItem(idx)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                                    title="Remove line item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Line Item Title & Description */}
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold uppercase text-slate-500">
                                Deliverable Scope <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Frontend Development, Sprint 1"
                                value={item.item_name || ""}
                                onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                                required
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                              <textarea
                                rows={2}
                                placeholder="Milestone details, deliverables or tasks..."
                                value={item.description || ""}
                                onChange={(e) => onItemChange(idx, "description", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                              />
                            </div>

                            {/* SAC Code if enabled */}
                            {allowSacCode && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                  SAC Code
                                </label>
                                <input
                                  type="text"
                                  placeholder="998314"
                                  value={item.sac_code || item.hsn_sac || ""}
                                  onChange={(e) => {
                                    onItemChange(idx, "sac_code", e.target.value);
                                    onItemChange(idx, "hsn_sac", e.target.value);
                                  }}
                                  className="w-full h-10 px-3 font-mono text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 bg-white focus:outline-none"
                                />
                              </div>
                            )}

                            {/* Quantity & Unit and Unit Rate (Side-by-side with 44px touch targets) */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                  Quantity & Unit
                                </label>
                                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    inputMode="decimal"
                                    placeholder="1.00"
                                    value={item.quantity}
                                    onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                                    required
                                    className="w-full h-11 px-2.5 text-right font-mono font-bold text-xs text-slate-800 focus:outline-none"
                                  />
                                  <select
                                    value={item.unit || "hrs"}
                                    onChange={(e) => onItemChange(idx, "unit", e.target.value)}
                                    className="h-11 px-2 text-2xs font-semibold text-slate-600 bg-slate-50 border-l border-slate-200 focus:outline-none cursor-pointer"
                                  >
                                    <option value="hrs">hrs</option>
                                    <option value="days">days</option>
                                    <option value="units">units</option>
                                    <option value="mile">mile</option>
                                    <option value="mos">mos</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                  Rate ({currencySymbol})
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={item.unit_price}
                                  onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                                  required
                                  className="w-full h-11 px-2.5 text-right font-mono font-bold rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                              </div>
                            </div>

                            {/* Tax Slab & Gross Total */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1 items-center">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                  Tax Slab
                                </label>
                                <select
                                  value={currentItemTaxRate}
                                  onChange={(e) => onItemChange(idx, "tax_rate", Number(e.target.value))}
                                  className="w-full h-11 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                  <option value={18}>18% GST (Standard)</option>
                                  <option value={12}>12% GST</option>
                                  <option value={5}>5% GST</option>
                                  <option value={28}>28% GST</option>
                                  <option value={0}>0% Exempt</option>
                                </select>
                              </div>

                              <div className="text-right">
                                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                  {isInclusive ? "Gross Total" : "Line Amount"}
                                </span>
                                <p className="font-mono text-sm font-extrabold text-slate-900">
                                  {currencySymbol}
                                  {lineTotal.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </p>
                                {currentItemTaxRate > 0 && (
                                  <span className="block text-[10px] font-mono text-purple-700 font-semibold mt-0.5">
                                    {isInclusive ? `Incl. ₹${itemGst.toFixed(2)} (${currentItemTaxRate}% GST)` : `+₹${itemGst.toFixed(2)} GST`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-[11px] font-mono font-bold text-slate-500">Item #{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={item.item_name || ""}
                    onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Add New Line Footer Bar */}
      <div className="p-3.5 sm:px-5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 font-semibold text-xs shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Another Line</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {taxCalculationType === "inclusive"
              ? "Rates entered already include GST. Statutory taxes are back-calculated automatically."
              : "Amounts are net rates. Statutory GST is calculated on top in the financial summary."}
          </span>
        </div>
      </div>
    </div>
  );
}
