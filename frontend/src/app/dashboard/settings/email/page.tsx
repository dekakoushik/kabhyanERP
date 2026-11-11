"use client";

import { useEffect, useState, Suspense } from "react";
import { api, SettingsResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Mail,
  Save,
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
} from "lucide-react";

function EmailSettingsContent() {
  const [form, setForm] = useState({
    mail_mailer: "smtp",
    mail_host: "smtp.gmail.com",
    mail_port: "587",
    mail_username: "",
    mail_password: "",
    mail_encryption: "tls",
    mail_from_address: "support@kabhyan.com",
    mail_from_name: "Kabhyan Technologies ERP",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Test Email Box
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
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
          mail_mailer: flat["mail_mailer"] || "smtp",
          mail_host: flat["mail_host"] || "smtp.gmail.com",
          mail_port: flat["mail_port"] || "587",
          mail_username: flat["mail_username"] || "",
          mail_password: flat["mail_password"] || "",
          mail_encryption: flat["mail_encryption"] || "tls",
          mail_from_address: flat["mail_from_address"] || "support@kabhyan.com",
          mail_from_name: flat["mail_from_name"] || "Kabhyan Technologies ERP",
        });
      } catch (err: any) {
        toast.error("Failed to load SMTP settings");
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "email_smtp",
      }));

      await api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings: itemsToUpdate }),
      });
      toast.success("SMTP Email configuration saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) return;

    try {
      setSendingTest(true);
      setTestResult(null);
      const res = await api.request("/settings/test-email", {
        method: "POST",
        body: JSON.stringify({
          email: testEmailAddress,
          mail_host: form.mail_host || undefined,
          mail_port: form.mail_port || undefined,
          mail_username: form.mail_username || undefined,
          mail_password: form.mail_password || undefined,
          mail_encryption: form.mail_encryption || undefined,
          mail_from_address: form.mail_from_address || undefined,
          mail_from_name: form.mail_from_name || undefined,
        }),
      });
      setTestResult({
        success: true,
        message: res.message || "Test email dispatched successfully!",
      });
      toast.success("Test email sent!");
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to deliver test email.",
      });
      toast.error("Failed to deliver test email");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        <p className="text-xs font-semibold text-slate-500">Loading SMTP configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">SMTP Server & Mail Pipeline Configuration</h2>
                <p className="text-xs text-slate-500">
                  Configure corporate SMTP credentials for automated invoicing, client ticket alerts, and system notifications.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Mail Protocol / Driver</label>
              <select
                value={form.mail_mailer}
                onChange={(e) => setForm({ ...form, mail_mailer: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="smtp">SMTP (Recommended)</option>
                <option value="sendmail">Sendmail</option>
                <option value="log">Log (Local development)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">SMTP Host Server</label>
              <input
                type="text"
                placeholder="e.g. smtp.gmail.com, mail.yourdomain.com"
                value={form.mail_host}
                onChange={(e) => setForm({ ...form, mail_host: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">SMTP Port</label>
              <input
                type="number"
                placeholder="587, 465, or 25"
                value={form.mail_port}
                onChange={(e) => setForm({ ...form, mail_port: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">SMTP Username / Email</label>
              <input
                type="text"
                placeholder="e.g. contact@kabhyan.com"
                value={form.mail_username}
                onChange={(e) => setForm({ ...form, mail_username: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">SMTP Password / App Key</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={form.mail_password}
                onChange={(e) => setForm({ ...form, mail_password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Encryption Protocol</label>
              <select
                value={form.mail_encryption}
                onChange={(e) => setForm({ ...form, mail_encryption: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="tls">TLS (Port 587 - Standard)</option>
                <option value="ssl">SSL (Port 465)</option>
                <option value="null">None (Plain / Port 25)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Default "From" Email Address</label>
              <input
                type="email"
                placeholder="e.g. no-reply@kabhyan.com"
                value={form.mail_from_address}
                onChange={(e) => setForm({ ...form, mail_from_address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Default "From" Display Name</label>
              <input
                type="text"
                placeholder="e.g. Kabhyan Technologies ERP"
                value={form.mail_from_name}
                onChange={(e) => setForm({ ...form, mail_from_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save SMTP Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Live Test Email Box */}
      <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Send Live Test Email Verification</h3>
            <p className="text-xs text-slate-500">
              Verify that your SMTP host credentials, authentication, and port reachability are operating cleanly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <input
            type="email"
            required
            placeholder="Enter recipient email (e.g. yourname@domain.com)"
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sendingTest || !testEmailAddress}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send Test Email</span>
          </button>
        </form>

        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
          <p className="text-xs font-semibold text-slate-500">Loading email configuration...</p>
        </div>
      }
    >
      <EmailSettingsContent />
    </Suspense>
  );
}
