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
  FileText,
  X,
  Check,
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

export const COMMON_SAC_CODES = [
  { code: "998314", label: "IT & Software Development" },
  { code: "998313", label: "Consulting & Architecture" },
  { code: "998315", label: "Hosting & Cloud Infrastructure" },
  { code: "998316", label: "Network Management & DevOps" },
  { code: "998311", label: "Management Consulting" },
];

export const GST_RATE_OPTIONS = [
  { rate: 18, label: "18% GST (Standard Services)", short: "18% GST" },
  { rate: 12, label: "12% GST (Works & Products)", short: "12% GST" },
  { rate: 5, label: "5% GST (Concessional / Transport)", short: "5% GST" },
  { rate: 28, label: "28% GST (Luxury & Special)", short: "28% GST" },
  { rate: 0, label: "0% GST (Tax Exempt / Nil)", short: "0% Exempt" },
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
  title = "Deliverables & Services Ledger",
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
  const [activeTaxPopover, setActiveTaxPopover] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

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
      const lastIndex = items.length - 1;
      const lastItem = items[lastIndex];
      const isLastBlank =
        lastItem &&
        (!lastItem.item_name || lastItem.item_name.trim() === "") &&
        Number(lastItem.unit_price || 0) === 0;

      const targetIdx = isLastBlank ? lastIndex : items.length;
      if (!isLastBlank) {
        onAddItem();
      }

      setTimeout(() => {
        onItemChange(targetIdx, "item_name", preset.name);
        onItemChange(targetIdx, "description", preset.description);
        onItemChange(targetIdx, "quantity", preset.quantity);
        onItemChange(targetIdx, "unit", preset.unit);
        onItemChange(targetIdx, "unit_price", preset.unit_price);
        if (preset.sac_code) {
          onItemChange(targetIdx, "sac_code", preset.sac_code);
          onItemChange(targetIdx, "hsn_sac", preset.sac_code);
        }
      }, 0);
    }
  };

  // Active item being edited in modal
  const activeModalItem = editingItemIndex !== null && items[editingItemIndex] ? items[editingItemIndex] : null;
  const modalItemTaxRate = activeModalItem
    ? activeModalItem.tax_rate !== undefined && activeModalItem.tax_rate !== null && activeModalItem.tax_rate !== ""
      ? Number(activeModalItem.tax_rate)
      : defaultNumTax
    : defaultNumTax;
  const modalQty = activeModalItem ? Number(activeModalItem.quantity) || 0 : 0;
  const modalRate = activeModalItem ? Number(activeModalItem.unit_price) || 0 : 0;
  const modalLineTotal = Number((modalQty * modalRate).toFixed(2));
  const isInclusive = taxCalculationType === "inclusive";
  const modalTaxable = isInclusive
    ? modalItemTaxRate > 0
      ? Number((modalLineTotal / (1 + modalItemTaxRate / 100)).toFixed(2))
      : modalLineTotal
    : modalLineTotal;
  const modalTaxAmount = isInclusive
    ? Number((modalLineTotal - modalTaxable).toFixed(2))
    : Number(((modalTaxable * modalItemTaxRate) / 100).toFixed(2));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? "Line" : "Lines"}
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isInclusive
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {isInclusive ? "Rates Inclusive of GST" : "Rates +GST (Exclusive)"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Template Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-semibold text-xs shadow-2xs transition cursor-pointer select-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Scope Presets</span>
              <ChevronDown className="w-3 h-3 text-purple-500" />
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
        {/* 1. DESKTOP & TABLET VIEWPORT TABLE (Zero Horizontal Scroll Guaranteed) */}
        <div className="hidden sm:block overflow-hidden w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-8" />
              <col className="w-auto" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-36" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                <th className="py-3 px-2 text-center"></th>
                <th className="py-3 px-3 text-slate-600">Item & Scope Description</th>
                <th className="py-3 px-3 text-right text-slate-600">Qty & Unit</th>
                <th className="py-3 px-3 text-right text-slate-600">
                  <span className="inline-flex items-center gap-1 justify-end">
                    <span>{isInclusive ? "Gross Rate" : "Rate"} ({currencySymbol})</span>
                  </span>
                </th>
                <th className="py-3 px-3 text-right text-slate-600">
                  <span>{isInclusive ? "Gross Total" : "Amount"} ({currencySymbol})</span>
                </th>
                <th className="py-3 px-2 text-center"></th>
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

                      const taxable = isInclusive
                        ? currentItemTaxRate > 0
                          ? Number((lineTotal / (1 + currentItemTaxRate / 100)).toFixed(2))
                          : lineTotal
                        : lineTotal;

                      const itemGst = isInclusive
                        ? Number((lineTotal - taxable).toFixed(2))
                        : Number(((taxable * currentItemTaxRate) / 100).toFixed(2));

                      const sacDisplay = item.hsn_sac || item.sac_code || (allowSacCode ? "998314" : null);
                      const draggableKey = `desktop-item-${item.id ?? idx}`;

                      return (
                        <Draggable key={draggableKey} draggableId={draggableKey} index={idx}>
                          {(draggableProvided, snapshot) => (
                            <tr
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              style={{
                                ...draggableProvided.draggableProps.style,
                                ...(snapshot.isDragging
                                  ? { background: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }
                                  : {}),
                              }}
                              className={`group hover:bg-slate-50/60 transition ${
                                snapshot.isDragging ? "bg-slate-50" : ""
                              }`}
                            >
                              {/* Drag Grip */}
                              <td className="py-3 px-2 text-center text-slate-300 align-top pt-3.5">
                                <div
                                  {...draggableProvided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 hover:text-slate-600 inline-block"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              </td>

                              {/* Item Title & Scope Summary (Flexible Width) */}
                              <td className="py-2.5 px-3 align-top">
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    placeholder="Deliverable title or milestone..."
                                    value={item.item_name || ""}
                                    onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                                    className="w-full h-8 px-2.5 font-bold text-slate-900 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                    required
                                  />

                                  {/* Compact Scope Preview & Quick Modal Trigger */}
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                                    {sacDisplay && (
                                      <span className="inline-flex items-center font-mono font-bold text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/70 shrink-0">
                                        SAC {sacDisplay}
                                      </span>
                                    )}
                                    <span
                                      className="truncate flex-1 text-slate-500 text-[11px]"
                                      title={item.description || "Click 'Edit Scope' to add technical specifications"}
                                    >
                                      {item.description ? (
                                        item.description
                                      ) : (
                                        <span className="text-slate-400 italic">No scope details</span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemIndex(idx)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded transition shrink-0 cursor-pointer"
                                      title="Open detailed specifications modal"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>Edit Scope</span>
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Qty & Unit */}
                              <td className="py-2.5 px-3 text-right whitespace-nowrap align-top pt-3">
                                <div className="flex items-center justify-end border border-slate-200 rounded-lg overflow-hidden bg-white">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    value={item.quantity}
                                    onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                                    className="w-14 h-8 px-1.5 text-right font-mono text-xs font-bold text-slate-800 focus:outline-none"
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

                              {/* Rate */}
                              <td className="py-2.5 px-3 text-right whitespace-nowrap align-top pt-3">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                                  className="w-full h-8 px-2 text-right font-mono text-xs font-bold text-slate-800 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>

                              {/* Amount & In-Row GST Tax Pill Popover */}
                              <td className="py-2.5 px-3 text-right whitespace-nowrap align-top pt-2.5">
                                <div className="font-mono text-xs font-black text-slate-900 select-none">
                                  {currencySymbol}{" "}
                                  {lineTotal.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>

                                {/* In-Row GST Pill Trigger with Popover */}
                                <div className="relative inline-block mt-0.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTaxPopover(activeTaxPopover === idx ? null : idx)}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer select-none border ${
                                      currentItemTaxRate === 0
                                        ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                        : "bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100"
                                    }`}
                                    title="Click to change statutory GST rate for this deliverable"
                                  >
                                    <span>
                                      {currentItemTaxRate === 0
                                        ? "0% Exempt"
                                        : isInclusive
                                        ? `Incl. ${currentItemTaxRate}%`
                                        : `+${currentItemTaxRate}% GST`}
                                    </span>
                                    <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                                  </button>

                                  {/* Popover Dropdown */}
                                  {activeTaxPopover === idx && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setActiveTaxPopover(null)}
                                      />
                                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                          Select GST Slab
                                        </div>
                                        {GST_RATE_OPTIONS.map((opt) => (
                                          <button
                                            key={opt.rate}
                                            type="button"
                                            onClick={() => {
                                              onItemChange(idx, "tax_rate", opt.rate);
                                              setActiveTaxPopover(null);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer ${
                                              currentItemTaxRate === opt.rate
                                                ? "bg-purple-50/70 text-purple-700 font-bold"
                                                : "text-slate-700 font-medium"
                                            }`}
                                          >
                                            <span>{opt.label}</span>
                                            {currentItemTaxRate === opt.rate && (
                                              <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Line GST Subtext */}
                                {currentItemTaxRate > 0 && (
                                  <div className="text-[10px] font-mono text-purple-600/90 font-medium">
                                    {isInclusive ? `₹${itemGst.toFixed(2)} tax` : `+₹${itemGst.toFixed(2)}`}
                                  </div>
                                )}
                              </td>

                              {/* Row Actions */}
                              <td className="py-2.5 px-2 text-center whitespace-nowrap align-top pt-3">
                                <div className="flex items-center gap-1 justify-center">
                                  {onDuplicateItem && (
                                    <button
                                      type="button"
                                      onClick={() => onDuplicateItem(idx)}
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition cursor-pointer"
                                      title="Duplicate deliverable"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveItem(idx)}
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                                      title="Remove deliverable"
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
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    Loading deliverables ledger...
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {/* 2. MOBILE CARD VIEWPORT (< 640px) */}
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

                    const taxable = isInclusive
                      ? currentItemTaxRate > 0
                        ? Number((lineTotal / (1 + currentItemTaxRate / 100)).toFixed(2))
                        : lineTotal
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

                              {/* Mobile Actions */}
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
                                <button
                                  type="button"
                                  onClick={() => setEditingItemIndex(idx)}
                                  className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer transition"
                                  title="Edit full specifications"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
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

                            {/* Item Title & Scope Excerpt */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase text-slate-500">
                                Deliverable Title <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Frontend Development, Sprint 1"
                                value={item.item_name || ""}
                                onChange={(e) => onItemChange(idx, "item_name", e.target.value)}
                                required
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                <span className="truncate max-w-[200px]" title={item.description || ""}>
                                  {item.description || <span className="italic text-slate-400">No scope specifications</span>}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingItemIndex(idx)}
                                  className="text-blue-600 font-semibold hover:underline shrink-0 text-xs"
                                >
                                  Edit Scope ↗
                                </button>
                              </div>
                            </div>

                            {/* Quantity & Unit and Unit Rate */}
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

                            {/* Statutory GST Slab & Line Total */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1 items-center">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                  GST Tax Slab
                                </label>
                                <select
                                  value={currentItemTaxRate}
                                  onChange={(e) => onItemChange(idx, "tax_rate", Number(e.target.value))}
                                  className="w-full h-11 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                  {GST_RATE_OPTIONS.map((opt) => (
                                    <option key={opt.rate} value={opt.rate}>
                                      {opt.label}
                                    </option>
                                  ))}
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
                                    {isInclusive
                                      ? `Incl. ₹${itemGst.toFixed(2)} (${currentItemTaxRate}% GST)`
                                      : `+₹${itemGst.toFixed(2)} GST`}
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
            {isInclusive
              ? "Rates entered include statutory GST. Tax values are back-calculated automatically."
              : "Amounts are net rates. Statutory GST is calculated on top in the financial summary."}
          </span>
        </div>
      </div>

      {/* 3. ITEM SCOPE & DETAILS MODAL (Deep Deliverable Customization) */}
      {editingItemIndex !== null && activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Deliverable Scope & Pricing
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Line #{editingItemIndex + 1} detailed specifications and tax configuration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItemIndex(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Deliverable Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable Title / Milestone Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architecture Sprint, Frontend Phase 1"
                  value={activeModalItem.item_name || ""}
                  onChange={(e) => onItemChange(editingItemIndex, "item_name", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* SAC / HSN Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Service Accounting Code (SAC / HSN)
                  </label>
                  <span className="text-[10px] text-slate-400">Section 31 CGST Act</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 998314"
                  value={activeModalItem.hsn_sac || activeModalItem.sac_code || ""}
                  onChange={(e) => {
                    onItemChange(editingItemIndex, "hsn_sac", e.target.value);
                    onItemChange(editingItemIndex, "sac_code", e.target.value);
                  }}
                  className="w-full h-9 px-3 font-mono text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick SAC:</span>
                  {COMMON_SAC_CODES.map((sac) => (
                    <button
                      key={sac.code}
                      type="button"
                      onClick={() => {
                        onItemChange(editingItemIndex, "hsn_sac", sac.code);
                        onItemChange(editingItemIndex, "sac_code", sac.code);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/60 transition cursor-pointer"
                    >
                      {sac.code} ({sac.label.split(" ")[0]})
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope & Detailed Specifications */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Detailed Scope & Deliverable Specifications
                  </label>
                  <span className="text-[10px] text-slate-400">Included on proposal / invoice</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Outline complete milestones, tech stack deliverables, acceptance criteria, or work breakdown..."
                  value={activeModalItem.description || ""}
                  onChange={(e) => onItemChange(editingItemIndex, "description", e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                />
              </div>

              {/* Quantity, Unit & Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity & Unit
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={activeModalItem.quantity}
                      onChange={(e) => onItemChange(editingItemIndex, "quantity", e.target.value)}
                      className="w-full h-10 px-3 text-right font-mono font-bold text-xs text-slate-800 focus:outline-none"
                    />
                    <select
                      value={activeModalItem.unit || "hrs"}
                      onChange={(e) => onItemChange(editingItemIndex, "unit", e.target.value)}
                      className="h-10 px-2.5 text-xs font-semibold text-slate-600 bg-slate-50 border-l border-slate-200 focus:outline-none cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isInclusive ? "Unit Rate (Incl. GST)" : "Unit Rate (Excl. GST)"} ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={activeModalItem.unit_price}
                    onChange={(e) => onItemChange(editingItemIndex, "unit_price", e.target.value)}
                    className="w-full h-10 px-3 text-right font-mono font-bold text-xs text-slate-800 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Statutory GST Rate Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Statutory GST Tax Slab
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GST_RATE_OPTIONS.map((opt) => {
                    const isSelected = modalItemTaxRate === opt.rate;
                    return (
                      <button
                        key={opt.rate}
                        type="button"
                        onClick={() => onItemChange(editingItemIndex, "tax_rate", opt.rate)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-purple-50/80 border-purple-400 ring-1 ring-purple-400 text-purple-900"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{opt.short}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                          {opt.label.split("(")[1]?.replace(")", "") || "Exempt"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Financial Calculation Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Taxable Base:</span>
                  <span>{currencySymbol} {modalTaxable.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-purple-700 text-[11px]">
                  <span>GST ({modalItemTaxRate}%):</span>
                  <span>{isInclusive ? "Incl. " : "+"}{currencySymbol} {modalTaxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span>Gross Deliverable Total:</span>
                  <span>{currencySymbol} {modalLineTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItemIndex(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setEditingItemIndex(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Save Deliverable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
