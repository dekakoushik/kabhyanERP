"use client";

import React from "react";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";

interface TermsPresetsChipsProps {
  documentType: "estimate" | "proforma" | "invoice";
  onSelectTerm: (text: string) => void;
  onSelectNote?: (text: string) => void;
}

export const ESTIMATE_TERMS_PRESETS = [
  {
    label: "30-Day Validity",
    text: "• This quotation is valid for 30 calendar days from the date of issuance.\n• Commercial rates are subject to change thereafter based on resource availability.",
  },
  {
    label: "50/50 Milestone Terms",
    text: "• Payment Terms: 50% mobilization advance upon project agreement sign-off.\n• Balance 50% upon successful completion and User Acceptance Testing (UAT) deployment.",
  },
  {
    label: "Excludes 3rd Party Licenses",
    text: "• Quotation excludes external third-party API usage fees, domain registration, SSL certificates, and cloud infrastructure hosting costs (AWS/GCP/Vercel).",
  },
  {
    label: "Standard IP Ownership",
    text: "• Full intellectual property rights, source code, and assets will be transferred to the client upon full commercial settlement.",
  },
];

export const PROFORMA_TERMS_PRESETS = [
  {
    label: "100% Advance Payment",
    text: "• 100% advance payment requested prior to initiation and milestone sprint release.\n• Work will commence within 2 business days of payment realization.",
  },
  {
    label: "Sprint 1 Retainer",
    text: "• Proforma Invoice issued against Sprint 1 sprint deliverables and engineering mobilization.",
  },
  {
    label: "Bank Transfer (NEFT/RTGS)",
    text: "• Please transfer funds via NEFT/RTGS to:\n  Account Name: Kabhyan Technologies Private Limited\n  Bank: HDFC Bank | Account No: 50200088992211 | IFSC: HDFC0001234",
  },
  {
    label: "Due in 7 Days",
    text: "• Payment is requested within 7 calendar days to maintain the committed delivery schedule.",
  },
];

export const INVOICE_TERMS_PRESETS = [
  {
    label: "Net 15 Days",
    text: "• Payment is due strictly within 15 calendar days of the invoice date.",
  },
  {
    label: "Late Payment Interest (18%)",
    text: "• Overdue accounts are subject to a statutory interest charge of 18% per annum from the due date until full realization.",
  },
  {
    label: "Bank Remittance Details",
    text: "• Please remit payment to:\n  Kabhyan Technologies Private Limited | HDFC Bank\n  Account: 50200088992211 | IFSC: HDFC0001234\n  Please quote invoice number in the payment reference.",
  },
  {
    label: "Statutory GST Declaration",
    text: "• Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and there is no additional flow of consideration.",
  },
];

export default function TermsPresetsChips({
  documentType,
  onSelectTerm,
  onSelectNote,
}: TermsPresetsChipsProps) {
  const presets =
    documentType === "estimate"
      ? ESTIMATE_TERMS_PRESETS
      : documentType === "proforma"
      ? PROFORMA_TERMS_PRESETS
      : INVOICE_TERMS_PRESETS;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-500">
        <Sparkles className="w-3 h-3 text-purple-600" />
        <span>Quick Insert Standard Terms & Clauses:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectTerm(preset.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 text-2xs font-semibold transition cursor-pointer"
            title="Click to append clause to Terms & Conditions"
          >
            <span className="text-purple-600 font-bold">+</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
