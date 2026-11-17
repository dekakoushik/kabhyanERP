"use client";

import React from "react";
import { X, ChevronUp, ChevronDown, Sparkles, Calculator, ShieldCheck } from "lucide-react";

interface MobileCalculationDrawerProps {
  open: boolean;
  onClose: () => void;
  currency?: string;
  subtotal: number;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  discountRate: number;
  effectiveDiscountRate: number;
  discountAmountInput: string;
  onChangeDiscountType: (type: "percentage" | "fixed") => void;
  onChangeDiscountRate: (rate: string) => void;
  onChangeDiscountAmountInput: (amt: string) => void;
  taxCalculationType: "exclusive" | "inclusive";
  onChangeTaxMode: (mode: "exclusive" | "inclusive") => void;
  taxRate: string;
  onChangeTaxRate: (rate: string) => void;
  taxableAmount: number;
  taxAmount: number;
  isRoundOff: boolean;
  onChangeRoundOff: (checked: boolean) => void;
  roundOffAmount: number;
  grandTotal: number;
}

export default function MobileCalculationDrawer({
  open,
  onClose,
  currency = "INR",
  subtotal,
  discountType,
  discountAmount,
  discountRate,
  effectiveDiscountRate,
  discountAmountInput,
  onChangeDiscountType,
  onChangeDiscountRate,
  onChangeDiscountAmountInput,
  taxCalculationType,
  onChangeTaxMode,
  taxRate,
  onChangeTaxRate,
  taxableAmount,
  taxAmount,
  isRoundOff,
  onChangeRoundOff,
  roundOffAmount,
  grandTotal,
}: MobileCalculationDrawerProps) {
  if (!open) return null;

  const isInclusive = taxCalculationType === "inclusive";
  const isFixedDiscount = discountType === "fixed";
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+20px)] animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto -mt-1 cursor-pointer" onClick={onClose} />

        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Commercial Settlement</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Tax Treatment: Exclusive vs Inclusive */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              GST Calculation Mode
            </span>
            <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {isInclusive ? "GST Included" : "GST Added on Top"}
            </span>
          </div>
          <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => onChangeTaxMode("exclusive")}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                !isInclusive ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
              }`}
            >
              Exclusive (+GST)
            </button>
            <button
              type="button"
              onClick={() => onChangeTaxMode("inclusive")}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                isInclusive ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
              }`}
            >
              Inclusive (Incl. GST)
            </button>
          </div>
        </div>

        {/* 2. Subtotal */}
        <div className="flex justify-between items-center text-xs text-slate-600 px-1">
          <span>Deliverables Turnover {isInclusive ? "(Gross)" : "(Net)"}</span>
          <span className="font-mono font-bold text-slate-900">
            {currencySymbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* 3. Discount Controls */}
        <div className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Discount</span>
            <div className="inline-flex p-0.5 bg-slate-200/60 rounded-lg text-2xs font-bold">
              <button
                type="button"
                onClick={() => onChangeDiscountType("percentage")}
                className={`px-2.5 py-1 rounded-md transition ${
                  !isFixedDiscount ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                }`}
              >
                % Percent
              </button>
              <button
                type="button"
                onClick={() => onChangeDiscountType("fixed")}
                className={`px-2.5 py-1 rounded-md transition ${
                  isFixedDiscount ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                }`}
              >
                ₹ Flat Rupee
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {!isFixedDiscount ? (
              <div className="relative inline-flex items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  inputMode="decimal"
                  placeholder="0"
                  value={discountRate}
                  onChange={(e) => onChangeDiscountRate(e.target.value)}
                  className="w-20 h-9 text-right pr-6 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                />
                <span className="absolute right-2 text-2xs font-bold text-slate-400 select-none">%</span>
              </div>
            ) : (
              <div className="relative inline-flex items-center">
                <span className="absolute left-2.5 text-2xs font-bold text-slate-400 select-none">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={discountAmountInput}
                  onChange={(e) => onChangeDiscountAmountInput(e.target.value)}
                  className="w-28 h-9 text-right pl-6 pr-2 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                />
              </div>
            )}

            <span className="font-mono text-xs font-bold text-emerald-600">
              -{currencySymbol}{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 4. GST Rate & Amount */}
        <div className="flex justify-between items-center text-xs text-slate-600 px-1">
          <span className="flex items-center gap-1.5">
            <span>GST Rate (%)</span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={taxRate}
              onChange={(e) => onChangeTaxRate(e.target.value)}
              className="w-14 h-8 text-center text-xs border border-slate-200 rounded-md font-bold"
            />
          </span>
          <span className="font-mono text-slate-900 font-bold">
            {isInclusive ? "Incl. " : "+"}{currencySymbol}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* 5. Round Off Adjustment */}
        <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-100 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRoundOff}
              onChange={(e) => onChangeRoundOff(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            <span className="font-medium">Round Off Adjustment</span>
          </label>
          <span className="font-mono text-slate-500">
            {roundOffAmount >= 0 ? `+${roundOffAmount}` : `-${Math.abs(roundOffAmount)}`}
          </span>
        </div>

        {/* 6. Grand Total Card */}
        <div className="p-4 rounded-2xl bg-blue-600 text-white flex justify-between items-center shadow-lg">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
              Net Payable Grand Total
            </p>
            <p className="text-2xl font-mono font-black mt-0.5">
              {currencySymbol}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Sparkles className="w-6 h-6 text-blue-200 opacity-90" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
        >
          Close Breakdown
        </button>
      </div>
    </div>
  );
}
