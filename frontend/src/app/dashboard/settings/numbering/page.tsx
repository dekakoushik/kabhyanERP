"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Hash,
  Save,
  Loader2,
  FileText,
  Receipt,
  FileCheck,
  Sparkles,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface NumberingConfig {
  prefix: string;
  suffix: string;
  padding: number;
  includeYear: boolean;
  nextNumber: number;
}

export default function DocumentNumberingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Document Numbering State
  const [estimate, setEstimate] = useState<NumberingConfig>({
    prefix: "EST-",
    suffix: "",
    padding: 3,
    includeYear: true,
    nextNumber: 1,
  });

  const [proforma, setProforma] = useState<NumberingConfig>({
    prefix: "PI-",
    suffix: "",
    padding: 3,
    includeYear: true,
    nextNumber: 1,
  });

  const [invoice, setInvoice] = useState<NumberingConfig>({
    prefix: "INV-",
    suffix: "",
    padding: 3,
    includeYear: true,
    nextNumber: 1,
  });

  // Calculate live preview client-side
  const computePreview = (cfg: NumberingConfig) => {
    const yearPart = cfg.includeYear ? `${new Date().getFullYear()}-` : "";
    const padded = String(cfg.nextNumber).padStart(Math.max(1, cfg.padding), "0");
    return `${cfg.prefix}${yearPart}${padded}${cfg.suffix}`;
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.request("/settings");
      const list = res.settings?.document_numbering || [];
      const map: Record<string, string> = {};
      list.forEach((item: { key: string; value: string }) => {
        map[item.key] = item.value;
      });

      if (map.estimate_prefix !== undefined) {
        setEstimate({
          prefix: map.estimate_prefix ?? "EST-",
          suffix: map.estimate_suffix ?? "",
          padding: Number(map.estimate_padding ?? 3),
          includeYear: map.estimate_include_year === "true" || map.estimate_include_year === true as any || map.estimate_include_year === "1",
          nextNumber: Number(map.estimate_next_number ?? 1),
        });
      }

      if (map.proforma_prefix !== undefined) {
        setProforma({
          prefix: map.proforma_prefix ?? "PI-",
          suffix: map.proforma_suffix ?? "",
          padding: Number(map.proforma_padding ?? 3),
          includeYear: map.proforma_include_year === "true" || map.proforma_include_year === true as any || map.proforma_include_year === "1",
          nextNumber: Number(map.proforma_next_number ?? 1),
        });
      }

      if (map.invoice_prefix !== undefined) {
        setInvoice({
          prefix: map.invoice_prefix ?? "INV-",
          suffix: map.invoice_suffix ?? "",
          padding: Number(map.invoice_padding ?? 3),
          includeYear: map.invoice_include_year === "true" || map.invoice_include_year === true as any || map.invoice_include_year === "1",
          nextNumber: Number(map.invoice_next_number ?? 1),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load settings";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        settings: [
          // Estimate
          { key: "estimate_prefix", value: estimate.prefix, group: "document_numbering" },
          { key: "estimate_suffix", value: estimate.suffix, group: "document_numbering" },
          { key: "estimate_padding", value: estimate.padding.toString(), group: "document_numbering" },
          { key: "estimate_include_year", value: estimate.includeYear ? "true" : "false", group: "document_numbering" },
          { key: "estimate_next_number", value: estimate.nextNumber.toString(), group: "document_numbering" },
          // Proforma
          { key: "proforma_prefix", value: proforma.prefix, group: "document_numbering" },
          { key: "proforma_suffix", value: proforma.suffix, group: "document_numbering" },
          { key: "proforma_padding", value: proforma.padding.toString(), group: "document_numbering" },
          { key: "proforma_include_year", value: proforma.includeYear ? "true" : "false", group: "document_numbering" },
          { key: "proforma_next_number", value: proforma.nextNumber.toString(), group: "document_numbering" },
          // Invoice
          { key: "invoice_prefix", value: invoice.prefix, group: "document_numbering" },
          { key: "invoice_suffix", value: invoice.suffix, group: "document_numbering" },
          { key: "invoice_padding", value: invoice.padding.toString(), group: "document_numbering" },
          { key: "invoice_include_year", value: invoice.includeYear ? "true" : "false", group: "document_numbering" },
          { key: "invoice_next_number", value: invoice.nextNumber.toString(), group: "document_numbering" },
        ],
      };

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Document numbering preferences saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save document numbering settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading document numbering configurations...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Hash className="w-5 h-5" />
            </span>
            Document Numbering & Sequence Formats
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure prefix, suffix, zero-padding, and starting sequences for Quotations, Proforma Invoices, and Official Tax Invoices.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 cursor-pointer self-start sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Numbering Rules</span>
        </button>
      </div>

      {/* CARD 1: ESTIMATES & QUOTATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Estimates & Quotations Sequence</h3>
              <p className="text-2xs text-slate-400">Controls new quotations created at /dashboard/estimates/create</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-slate-400 font-medium">Next Output:</span>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
              {computePreview(estimate)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={estimate.prefix}
              onChange={(e) => setEstimate({ ...estimate, prefix: e.target.value })}
              placeholder="e.g. EST-"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Include Year
            </label>
            <select
              value={estimate.includeYear ? "yes" : "no"}
              onChange={(e) => setEstimate({ ...estimate, includeYear: e.target.value === "yes" })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium bg-white"
            >
              <option value="yes">Yes ({new Date().getFullYear()}-)</option>
              <option value="no">No Year</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Zero Padding
            </label>
            <select
              value={estimate.padding}
              onChange={(e) => setEstimate({ ...estimate, padding: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium bg-white"
            >
              <option value={2}>2 Digits (01)</option>
              <option value={3}>3 Digits (001)</option>
              <option value={4}>4 Digits (0001)</option>
              <option value={5}>5 Digits (00001)</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Next Counter
            </label>
            <input
              type="number"
              min={1}
              value={estimate.nextNumber}
              onChange={(e) => setEstimate({ ...estimate, nextNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Suffix (Optional)
            </label>
            <input
              type="text"
              value={estimate.suffix}
              onChange={(e) => setEstimate({ ...estimate, suffix: e.target.value })}
              placeholder="e.g. /26-27"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* CARD 2: PROFORMA INVOICES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Proforma Invoices Sequence</h3>
              <p className="text-2xs text-slate-400">Controls proforma generation from estimates and custom creation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-slate-400 font-medium">Next Output:</span>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              {computePreview(proforma)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={proforma.prefix}
              onChange={(e) => setProforma({ ...proforma, prefix: e.target.value })}
              placeholder="e.g. PI-"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Include Year
            </label>
            <select
              value={proforma.includeYear ? "yes" : "no"}
              onChange={(e) => setProforma({ ...proforma, includeYear: e.target.value === "yes" })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium bg-white"
            >
              <option value="yes">Yes ({new Date().getFullYear()}-)</option>
              <option value="no">No Year</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Zero Padding
            </label>
            <select
              value={proforma.padding}
              onChange={(e) => setProforma({ ...proforma, padding: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium bg-white"
            >
              <option value={2}>2 Digits (01)</option>
              <option value={3}>3 Digits (001)</option>
              <option value={4}>4 Digits (0001)</option>
              <option value={5}>5 Digits (00001)</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Next Counter
            </label>
            <input
              type="number"
              min={1}
              value={proforma.nextNumber}
              onChange={(e) => setProforma({ ...proforma, nextNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Suffix (Optional)
            </label>
            <input
              type="text"
              value={proforma.suffix}
              onChange={(e) => setProforma({ ...proforma, suffix: e.target.value })}
              placeholder="e.g. /26-27"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* CARD 3: GST TAX INVOICES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">GST Tax Invoices Sequence</h3>
              <p className="text-2xs text-slate-400">Statutory tax invoice series compliant with Section 31 of CGST Act</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-slate-400 font-medium">Next Output:</span>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              {computePreview(invoice)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={invoice.prefix}
              onChange={(e) => setInvoice({ ...invoice, prefix: e.target.value })}
              placeholder="e.g. INV-"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Include Year
            </label>
            <select
              value={invoice.includeYear ? "yes" : "no"}
              onChange={(e) => setInvoice({ ...invoice, includeYear: e.target.value === "yes" })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium bg-white"
            >
              <option value="yes">Yes ({new Date().getFullYear()}-)</option>
              <option value="no">No Year</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Zero Padding
            </label>
            <select
              value={invoice.padding}
              onChange={(e) => setInvoice({ ...invoice, padding: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium bg-white"
            >
              <option value={2}>2 Digits (01)</option>
              <option value={3}>3 Digits (001)</option>
              <option value={4}>4 Digits (0001)</option>
              <option value={5}>5 Digits (00001)</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Next Counter
            </label>
            <input
              type="number"
              min={1}
              value={invoice.nextNumber}
              onChange={(e) => setInvoice({ ...invoice, nextNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Suffix (Optional)
            </label>
            <input
              type="text"
              value={invoice.suffix}
              onChange={(e) => setInvoice({ ...invoice, suffix: e.target.value })}
              placeholder="e.g. /26-27"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
