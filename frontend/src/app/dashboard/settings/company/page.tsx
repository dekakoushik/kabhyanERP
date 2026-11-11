"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import {
  Building,
  Save,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileCheck,
  Smartphone,
  Moon,
  Sparkles,
} from "lucide-react";

interface BrandAssetSlot {
  type: "logo_primary" | "logo_document" | "logo_icon" | "logo_dark";
  title: string;
  description: string;
  dimensions: string;
  aspect: string;
  currentUrl: string;
  fallback: string;
}

function CompanySettingsContent() {
  const [form, setForm] = useState({
    company_name: "",
    company_legal_tagline: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_website: "",
  });

  const [brandLogos, setBrandLogos] = useState({
    logo_primary: "",
    logo_document: "",
    logo_icon: "",
    logo_dark: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const fileInputRefs = {
    logo_primary: useRef<HTMLInputElement>(null),
    logo_document: useRef<HTMLInputElement>(null),
    logo_icon: useRef<HTMLInputElement>(null),
    logo_dark: useRef<HTMLInputElement>(null),
  };

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const res: SettingsResponse = await api.request("/settings");
      const flat: Record<string, string> = {};
      if (res.settings && typeof res.settings === "object") {
        Object.values(res.settings).forEach((items) => {
          if (Array.isArray(items)) {
            items.forEach((item) => {
              flat[item.key] = item.value || "";
            });
          }
        });
      }
      setForm({
        company_name: flat["company_name"] || "Kabhyan Technologies Private Limited",
        company_legal_tagline: flat["company_legal_tagline"] || "Enterprise IT & Software Engineering Solutions",
        company_email: flat["company_email"] || "contact@kabhyan.com",
        company_phone: flat["company_phone"] || "+91 98200 12345",
        company_address: flat["company_address"] || "Bandra Kurla Complex, Mumbai, Maharashtra 400051",
        company_website: flat["company_website"] || "https://www.kabhyan.com",
      });
      setBrandLogos({
        logo_primary: flat["company_logo_primary"] || "",
        logo_document: flat["company_logo_document"] || "",
        logo_icon: flat["company_logo_icon"] || "",
        logo_dark: flat["company_logo_dark"] || "",
      });
    } catch (err: any) {
      toast.error("Failed to load company profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const handleFileUpload = async (type: "logo_primary" | "logo_document" | "logo_icon" | "logo_dark", file: File) => {
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size exceeds 3MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);

    try {
      setUploadingSlot(type);
      const res = await api.request("/settings/brand-assets", {
        method: "POST",
        body: formData,
      });

      if (res && res.url) {
        setBrandLogos((prev) => ({ ...prev, [type]: res.url }));
        toast.success(`Brand asset "${type.replace('_', ' ')}" updated successfully`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleResetAsset = async (type: "logo_primary" | "logo_document" | "logo_icon" | "logo_dark") => {
    if (!confirm(`Reset this brand asset to default template?`)) return;

    try {
      setUploadingSlot(type);
      await api.request(`/settings/brand-assets/${type}`, {
        method: "DELETE",
      });
      setBrandLogos((prev) => ({ ...prev, [type]: "" }));
      toast.success("Brand asset reset to default");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset asset");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "company",
      }));

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });
      toast.success("Corporate entity profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading company profile & brand assets...</p>
      </div>
    );
  }

  const assetSlots: BrandAssetSlot[] = [
    {
      type: "logo_primary",
      title: "Application UI Logo (Horizontal)",
      description: "Rendered in the ERP sidebar, topbar, client portal header, and login screens.",
      dimensions: "240 x 60 px (Recommended: SVG or Transparent PNG)",
      aspect: "w-48 h-12",
      currentUrl: brandLogos.logo_primary,
      fallback: "/logo.png",
    },
    {
      type: "logo_document",
      title: "Invoice & Printable Document Logo",
      description: "High-resolution corporate letterhead for Estimates, Proforma Invoices, and Official Tax Invoices.",
      dimensions: "320 x 80 px (High DPI 300dpi, White paper background)",
      aspect: "w-48 h-12",
      currentUrl: brandLogos.logo_document,
      fallback: "/kabhyan-logo.png",
    },
    {
      type: "logo_icon",
      title: "Compact Emblem / Favicon (Square)",
      description: "Icon used when the sidebar collapses to 64px width and browser tab favicon.",
      dimensions: "64 x 64 px or 128 x 128 px (1:1 Ratio Square, SVG/PNG)",
      aspect: "w-14 h-14",
      currentUrl: brandLogos.logo_icon,
      fallback: "/logo.png",
    },
    {
      type: "logo_dark",
      title: "Dark Mode / Monochrome Inverted Logo",
      description: "Alternate white/light logo rendered against dark slate email headers and dark themes.",
      dimensions: "240 x 60 px (White text/icon on transparent canvas)",
      aspect: "w-48 h-12",
      currentUrl: brandLogos.logo_dark,
      fallback: "/logo.png",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Brand Assets Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Brand Assets & Multi-Format Logos</h2>
              <p className="text-xs text-slate-500">
                Manage specialized logo formats optimized for Application UI, Document printing, and square icons.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Persistent Storage Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assetSlots.map((slot) => {
            const isSlotUploading = uploadingSlot === slot.type;
            const displayUrl = slot.currentUrl || slot.fallback;
            const isCustom = Boolean(slot.currentUrl);

            return (
              <div
                key={slot.type}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{slot.title}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isCustom
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {isCustom ? "Custom Upload" : "Default Asset"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{slot.description}</p>
                </div>

                {/* Preview Box */}
                <div
                  className={`p-4 rounded-xl border border-slate-200/80 flex items-center justify-center min-h-[90px] ${
                    slot.type === "logo_dark" ? "bg-slate-900" : "bg-white"
                  }`}
                >
                  {isSlotUploading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Saving asset to storage...</span>
                    </div>
                  ) : (
                    <div className={`relative ${slot.aspect} flex items-center justify-center`}>
                      <Image
                        src={displayUrl}
                        alt={slot.title}
                        width={200}
                        height={60}
                        className="max-h-full max-w-full object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">
                    {slot.dimensions}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRefs[slot.type]}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(slot.type, file);
                        e.target.value = "";
                      }}
                    />

                    <button
                      type="button"
                      disabled={isSlotUploading}
                      onClick={() => fileInputRefs[slot.type].current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload</span>
                    </button>

                    {isCustom && (
                      <button
                        type="button"
                        disabled={isSlotUploading}
                        onClick={() => handleResetAsset(slot.type)}
                        title="Reset to default template logo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corporate Particulars Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Corporate Entity Profile</h2>
                <p className="text-xs text-slate-500">
                  Official particulars rendered across Estimates, Proforma Invoices, and Official Tax Invoices.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Company Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Official Sub-tagline / Business Scope
              </label>
              <input
                type="text"
                value={form.company_legal_tagline}
                onChange={(e) => setForm({ ...form, company_legal_tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={form.company_email}
                  onChange={(e) => setForm({ ...form, company_email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">HQ Telephone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.company_phone}
                  onChange={(e) => setForm({ ...form, company_phone: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Official Website URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.company_website}
                  onChange={(e) => setForm({ ...form, company_website: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1.5">Registered Office Address</label>
            <div className="relative">
              <textarea
                rows={3}
                value={form.company_address}
                onChange={(e) => setForm({ ...form, company_address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading company profile...</p>
        </div>
      }
    >
      <CompanySettingsContent />
    </Suspense>
  );
}
