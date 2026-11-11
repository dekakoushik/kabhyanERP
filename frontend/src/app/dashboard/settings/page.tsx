"use client";

import { useEffect, useState, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, SettingsResponse, SystemSettingItem } from "@/lib/api";
import {
  Settings,
  Building,
  ShieldAlert,
  Server,
  Receipt,
  Globe,
  Database,
  Cpu,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  KeyRound,
  FileText,
  Mail,
  Phone,
  Loader2,
  Trash2,
  Check,
  Send,
} from "lucide-react";

function SettingsContent() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<"company" | "tax_compliance" | "banking" | "localization" | "security_policy" | "email_smtp" | "system_health">("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [flushingCache, setFlushingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const defaultSettingKeys = [
    { key: "company_name", group: "company" },
    { key: "company_legal_tagline", group: "company" },
    { key: "company_email", group: "company" },
    { key: "company_phone", group: "company" },
    { key: "company_address", group: "company" },
    { key: "company_website", group: "company" },
    { key: "company_gstin", group: "tax_compliance" },
    { key: "company_pan", group: "tax_compliance" },
    { key: "default_sac_code", group: "tax_compliance" },
    { key: "default_gst_rate", group: "tax_compliance" },
    { key: "reverse_charge_applicable", group: "tax_compliance" },
    { key: "bank_beneficiary_name", group: "banking" },
    { key: "bank_name", group: "banking" },
    { key: "bank_branch", group: "banking" },
    { key: "bank_account_number", group: "banking" },
    { key: "bank_ifsc_code", group: "banking" },
    { key: "bank_swift_code", group: "banking" },
    { key: "bank_upi_id", group: "banking" },
    { key: "currency_code", group: "localization" },
    { key: "currency_symbol", group: "localization" },
    { key: "date_format", group: "localization" },
    { key: "time_zone", group: "localization" },
    { key: "client_portal_enabled", group: "security_policy" },
    { key: "auto_notify_client_on_reply", group: "security_policy" },
    { key: "session_timeout_minutes", group: "security_policy" },
    { key: "mail_mailer", group: "email_smtp" },
    { key: "mail_host", group: "email_smtp" },
    { key: "mail_port", group: "email_smtp" },
    { key: "mail_username", group: "email_smtp" },
    { key: "mail_password", group: "email_smtp" },
    { key: "mail_encryption", group: "email_smtp" },
    { key: "mail_from_address", group: "email_smtp" },
    { key: "mail_from_name", group: "email_smtp" },
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res: SettingsResponse = await api.request("/settings");
      setData(res);

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
      setFormState(flat);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSavedSuccess(false);

      const itemsToUpdate: { key: string; value: string; group?: string }[] = [];
      const handledKeys = new Set<string>();

      // 1. Collect from data.settings if returned as grouped arrays
      if (data?.settings && typeof data.settings === "object") {
        Object.entries(data.settings).forEach(([groupName, items]) => {
          if (Array.isArray(items)) {
            items.forEach((item) => {
              if (formState[item.key] !== undefined) {
                itemsToUpdate.push({
                  key: item.key,
                  value: formState[item.key],
                  group: groupName,
                });
                handledKeys.add(item.key);
              }
            });
          }
        });
      }

      // 2. Also ensure any newly introduced inputs (like email_smtp) are saved even if not yet in data.settings
      defaultSettingKeys.forEach(({ key, group }) => {
        if (!handledKeys.has(key) && formState[key] !== undefined) {
          itemsToUpdate.push({
            key,
            value: formState[key],
            group,
          });
          handledKeys.add(key);
        }
      });

      // 3. Fallback: catch any arbitrary keys remaining in formState
      Object.entries(formState).forEach(([k, v]) => {
        if (!handledKeys.has(k)) {
          itemsToUpdate.push({
            key: k,
            value: v,
            group: "general",
          });
        }
      });

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchSettings();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFlushCache = async () => {
    try {
      setFlushingCache(true);
      setCacheMessage(null);
      const res = await api.request("/settings/flush-cache", { method: "POST" });
      setCacheMessage(res.message);
      setTimeout(() => setCacheMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setFlushingCache(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) return;

    try {
      setSendingTestEmail(true);
      setTestEmailResult(null);
      const res = await api.request("/settings/test-email", {
        method: "POST",
        body: JSON.stringify({ email: testEmailAddress }),
      });
      setTestEmailResult({
        success: true,
        message: res.message || "Test email dispatched successfully!",
      });
    } catch (err: unknown) {
      setTestEmailResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to deliver test email.",
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading System Configuration & Health...</p>
      </div>
    );
  }

  const { settings, environment } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Settings className="w-6 h-6" />
            </span>
            System Settings & Enterprise Config
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure official corporate identity, GST tax codes, banking details, Redis cache, and security policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Check className="w-4 h-4" />
              <span>Saved!</span>
            </div>
          )}

          <button
            onClick={handleFlushCache}
            disabled={flushingCache}
            title="Flush Application & Redis Cache"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${flushingCache ? "animate-spin" : ""}`} />
            <span>Flush Cache</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {cacheMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{cacheMessage}</span>
        </div>
      )}

      {/* Main Container with Left Category Tabs & Right Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1 h-fit">
          <button
            onClick={() => setActiveGroup("company")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
              activeGroup === "company"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Company Profile</span>
          </button>

          <button
            onClick={() => setActiveGroup("tax_compliance")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
              activeGroup === "tax_compliance"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Tax & GST Statutory</span>
          </button>

          <button
            onClick={() => setActiveGroup("banking")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
              activeGroup === "banking"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Bank & Wire Details</span>
          </button>

          <button
            onClick={() => setActiveGroup("localization")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
              activeGroup === "localization"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Localization & Formats</span>
          </button>

          <button
            onClick={() => setActiveGroup("security_policy")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
              activeGroup === "security_policy"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security & Portal Policies</span>
          </button>

          <button
            onClick={() => setActiveGroup("email_smtp")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
              activeGroup === "email_smtp"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>SMTP & Email Config</span>
          </button>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveGroup("system_health")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                activeGroup === "system_health"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Server & Redis Health</span>
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Tab: Company Profile */}
            {activeGroup === "company" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Corporate Entity Profile</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official business particulars rendered across Estimates, Proforma Invoices, and Tax Invoices.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Company Legal Name</label>
                    <input
                      type="text"
                      value={formState["company_name"] || ""}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Official Sub-tagline / Business Scope</label>
                    <input
                      type="text"
                      value={formState["company_legal_tagline"] || ""}
                      onChange={(e) => handleInputChange("company_legal_tagline", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Corporate Email</label>
                    <input
                      type="email"
                      value={formState["company_email"] || ""}
                      onChange={(e) => handleInputChange("company_email", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">HQ Telephone</label>
                    <input
                      type="text"
                      value={formState["company_phone"] || ""}
                      onChange={(e) => handleInputChange("company_phone", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Official Website URL</label>
                    <input
                      type="text"
                      value={formState["company_website"] || ""}
                      onChange={(e) => handleInputChange("company_website", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-slate-700 mb-1.5">Registered Office Address</label>
                  <textarea
                    rows={3}
                    value={formState["company_address"] || ""}
                    onChange={(e) => handleInputChange("company_address", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tab: Tax & Statutory Compliance */}
            {activeGroup === "tax_compliance" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tax & GST Statutory Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    GSTIN registration, PAN number, and default IT Services Accounting Code (SAC).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Corporate GSTIN (West Bengal)</label>
                    <input
                      type="text"
                      value={formState["company_gstin"] || ""}
                      onChange={(e) => handleInputChange("company_gstin", e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">State Code: 19 (West Bengal)</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Company PAN</label>
                    <input
                      type="text"
                      value={formState["company_pan"] || ""}
                      onChange={(e) => handleInputChange("company_pan", e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Default IT Services SAC Code</label>
                    <input
                      type="text"
                      value={formState["default_sac_code"] || ""}
                      onChange={(e) => handleInputChange("default_sac_code", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      998314: Information Technology consultancy & design services
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Default Standard GST Rate (%)</label>
                    <input
                      type="number"
                      value={formState["default_gst_rate"] || ""}
                      onChange={(e) => handleInputChange("default_gst_rate", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Split into CGST 9% + SGST 9% for intra-state billing</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Banking & Wire Details */}
            {activeGroup === "banking" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Beneficiary Bank Wire & UPI Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rendered in the remittance instruction box on Proforma & Tax Invoices.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={formState["bank_name"] || ""}
                      onChange={(e) => handleInputChange("bank_name", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Account Title / Beneficiary</label>
                    <input
                      type="text"
                      value={formState["bank_account_name"] || ""}
                      onChange={(e) => handleInputChange("bank_account_name", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Current Account Number</label>
                    <input
                      type="text"
                      value={formState["bank_account_number"] || ""}
                      onChange={(e) => handleInputChange("bank_account_number", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">RTGS / NEFT IFSC Code</label>
                    <input
                      type="text"
                      value={formState["bank_ifsc_code"] || ""}
                      onChange={(e) => handleInputChange("bank_ifsc_code", e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Corporate UPI ID</label>
                    <input
                      type="text"
                      value={formState["bank_upi_id"] || ""}
                      onChange={(e) => handleInputChange("bank_upi_id", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-slate-700 mb-1.5">Branch Location</label>
                  <input
                    type="text"
                    value={formState["bank_branch"] || ""}
                    onChange={(e) => handleInputChange("bank_branch", e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tab: Localization & Formats */}
            {activeGroup === "localization" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Currency & Regional Localization</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Default currency, symbol, date representations, and operating timezone.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Operating Currency</label>
                    <input
                      type="text"
                      value={formState["default_currency"] || ""}
                      onChange={(e) => handleInputChange("default_currency", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Currency Symbol</label>
                    <input
                      type="text"
                      value={formState["currency_symbol"] || ""}
                      onChange={(e) => handleInputChange("currency_symbol", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Standard Date Format</label>
                    <select
                      value={formState["date_format"] || "YYYY-MM-DD"}
                      onChange={(e) => handleInputChange("date_format", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (Indian Standard)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Operating Timezone</label>
                    <select
                      value={formState["time_zone"] || "Asia/Kolkata"}
                      onChange={(e) => handleInputChange("time_zone", e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Security & Portal Policies */}
            {activeGroup === "security_policy" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Security & Client Portal Access Policies</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Self-service customer portal permissions, session timeouts, and notification rules.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Enable Client Self-Service Portal (/portal)</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Allow customers to log in, review project sprints, and submit tickets.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState["client_portal_enabled"] === "true"}
                        onChange={(e) =>
                          handleInputChange("client_portal_enabled", e.target.checked ? "true" : "false")
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Auto-Notify Clients on Ticket Updates</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Automatically trigger email dispatch when staff posts replies to customer inquiries.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState["auto_notify_client_on_reply"] === "true"}
                        onChange={(e) =>
                          handleInputChange("auto_notify_client_on_reply", e.target.checked ? "true" : "false")
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Redis Sanctum Session Inactivity Lifetime (Minutes)
                    </label>
                    <input
                      type="number"
                      value={formState["session_timeout_minutes"] || "120"}
                      onChange={(e) => handleInputChange("session_timeout_minutes", e.target.value)}
                      className="w-48 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: SMTP & Email Configuration */}
            {activeGroup === "email_smtp" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">SMTP Server & Mail Pipeline Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure your corporate SMTP credentials for automated invoicing, client ticket alerts, and system notices.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Mail Protocol / Driver</label>
                      <select
                        value={formState["mail_mailer"] || "smtp"}
                        onChange={(e) => handleInputChange("mail_mailer", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="smtp">SMTP (Recommended)</option>
                        <option value="sendmail">Sendmail</option>
                        <option value="log">Log (Local development testing)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">SMTP Host Server</label>
                      <input
                        type="text"
                        placeholder="e.g. smtp.gmail.com, mail.yourdomain.com"
                        value={formState["mail_host"] || ""}
                        onChange={(e) => handleInputChange("mail_host", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">SMTP Port</label>
                      <input
                        type="number"
                        placeholder="587, 465, or 25"
                        value={formState["mail_port"] || "587"}
                        onChange={(e) => handleInputChange("mail_port", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">SMTP Username / Email</label>
                      <input
                        type="text"
                        placeholder="e.g. contact@kabhyan.com"
                        value={formState["mail_username"] || ""}
                        onChange={(e) => handleInputChange("mail_username", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">SMTP Password / App Key</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={formState["mail_password"] || ""}
                        onChange={(e) => handleInputChange("mail_password", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Encryption Protocol</label>
                      <select
                        value={formState["mail_encryption"] || "tls"}
                        onChange={(e) => handleInputChange("mail_encryption", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="tls">TLS (Port 587 - Standard)</option>
                        <option value="ssl">SSL (Port 465)</option>
                        <option value="null">None (Plain / Port 25)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Default "From" Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. no-reply@kabhyan.com"
                        value={formState["mail_from_address"] || ""}
                        onChange={(e) => handleInputChange("mail_from_address", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Default "From" Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Kabhyan Technologies ERP"
                        value={formState["mail_from_name"] || ""}
                        onChange={(e) => handleInputChange("mail_from_name", e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Email Verification Box */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-blue-900">Send Test Email Verification</h4>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Verify that your SMTP host credentials, authentication, and port reachability are operating without error.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <input
                      type="email"
                      placeholder="Enter recipient email (e.g. yourname@domain.com)"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs bg-white border border-blue-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={sendingTestEmail || !testEmailAddress}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {sendingTestEmail ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Send Test Email</span>
                    </button>
                  </div>

                  {testEmailResult && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                        testEmailResult.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {testEmailResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <span>{testEmailResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: System & Redis Health */}
            {activeGroup === "system_health" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Infrastructure & System Diagnostics</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time operational status of Redis cache, MariaDB, and PHP runtime.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Redis Health */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Database className="w-4 h-4 text-red-500" />
                        Redis Cache Node
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {environment.redis_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Host: 127.0.0.1:6379 (Driver: predis)</p>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Cache Driver</span>
                      <strong className="font-mono text-slate-700">{environment.cache_driver}</strong>
                    </div>
                  </div>

                  {/* Database Health */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-500" />
                        MariaDB Database
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {environment.database_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Database: kabhyan_erp (Port 3306)</p>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Connection</span>
                      <strong className="font-mono text-slate-700">mysql (PDO)</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <span className="font-bold text-slate-800 block">Server Environment Summary</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Framework</span>
                      <p className="font-mono font-bold text-slate-800">Laravel {environment.laravel_version}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">PHP Runtime</span>
                      <p className="font-mono font-bold text-slate-800">PHP {environment.php_version}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Environment</span>
                      <p className="font-mono font-bold text-slate-800 uppercase">{environment.app_env}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Server Timestamp</span>
                      <p className="font-mono font-bold text-slate-800">{environment.server_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            {activeGroup !== "system_health" && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={fetchSettings}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700 text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading System Settings...</p>
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </AdminLayout>
  );
}

