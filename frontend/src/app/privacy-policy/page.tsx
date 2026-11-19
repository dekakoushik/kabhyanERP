"use client";

import Image from "next/image";
import Link from "next/link";
import { useBrand } from "@/context/BrandContext";
import {
  Shield,
  Lock,
  EyeOff,
  Bell,
  Camera,
  Server,
  UserX,
  Mail,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Clock,
  Building,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const { brand } = useBrand();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={brand.logoPrimary || "/logo.png"}
              alt={brand.companyName || "Kabhyan Technologies"}
              width={160}
              height={45}
              className="h-9 w-auto object-contain"
              priority
              unoptimized
            />
            <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Legal & Privacy
            </span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portal
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Document Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            Official Privacy & Data Protection Policy
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Privacy Policy for Kabhyan Connect & ERP
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            This Privacy Policy governs the manner in which <strong>Kabhyan Technologies Private Limited</strong> collects, uses, maintains, and safeguards information collected from users of the <strong>Kabhyan Connect</strong> mobile application and the <strong>Kabhyan ERP</strong> web platform.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Effective Date: <strong>November 19, 2026</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Entity: <strong>Kabhyan Technologies Private Limited</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google Play Policy Compliant</span>
            </div>
          </div>
        </div>

        {/* Policy Body */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10 text-sm leading-relaxed text-slate-700">
          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Application Overview & Purpose</h2>
            </div>
            <p>
              Kabhyan Connect is a dedicated B2B enterprise client application designed exclusively for verified corporate clients and project stakeholders of Kabhyan Technologies Private Limited. The app facilitates real-time project milestone tracking, document verification (Estimates, Proforma Invoices, and Tax Invoices), and direct technical support ticket management.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Information We Collect</h2>
            </div>
            <p className="mb-3">
              We collect only the minimum information necessary to authenticate users, fulfill contractual project deliverables, and deliver customer support:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Account & Organization Data
                </div>
                <p className="text-xs text-slate-600">
                  Full name, corporate email address, verified phone number, company name, registered business billing address, and GSTIN.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Support Tickets & Uploaded Media
                </div>
                <p className="text-xs text-slate-600">
                  Ticket subject, issue descriptions, and user-selected photo/document attachments voluntarily uploaded to demonstrate technical issues.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Device & Push Notification Tokens
                </div>
                <p className="text-xs text-slate-600">
                  Expo Push Notification token and device OS version used strictly for delivering real-time ticket replies, milestone updates, and invoice alerts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Hardware-Secured Credentials
                </div>
                <p className="text-xs text-slate-600">
                  Sanctum session tokens stored in the device&apos;s hardware-backed Android KeyStore / iOS Keychain via encrypted secure storage.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Device Permissions & Usage Justification</h2>
            </div>
            <p className="mb-3">
              Kabhyan Connect requests specific device permissions strictly when initiated by the user:
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="font-semibold text-slate-900 min-w-36">NOTIFICATIONS:</span>
                <span>Used solely to alert you when a project milestone is completed, a new invoice is issued, or our support team responds to a ticket.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-semibold text-slate-900 min-w-36">CAMERA:</span>
                <span>Used only when you choose to take a photo directly inside a Support Ticket to share visual evidence of a technical error.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-semibold text-slate-900 min-w-36">READ_MEDIA_IMAGES:</span>
                <span>Used only when you select existing images from your gallery to attach to a Support Ticket.</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Anti-Screen Capture & Confidentiality Policy</h2>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Hardware-Enforced Screen Shielding (FLAG_SECURE)</p>
                <p className="text-xs text-blue-800 mt-1">
                  To safeguard sensitive corporate project agreements, confidential proprietary deliverables, and commercial GST invoice details from accidental capture or malware, Kabhyan Connect activates the operating system&apos;s <code>FLAG_SECURE</code> security policy. Screenshots and screen recordings are blocked at the OS level, and app previews are concealed in the Android Multitask / App Switcher.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                5
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Data Storage, Encryption & Security</h2>
            </div>
            <p>
              All network communication between Kabhyan Connect and our servers is strictly encrypted using Transport Layer Security (TLS 1.3 / HTTPS). Authentication tokens are securely signed via Laravel Sanctum and stored locally using the device&apos;s hardware-backed Secure Storage. We do not store plaintext credentials on user devices or in unencrypted storage.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                6
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Zero Third-Party Advertising & Data Sales</h2>
            </div>
            <p>
              <strong>We do not sell, rent, monetize, or trade your personal or corporate information to any third parties.</strong> Kabhyan Connect contains zero commercial advertising SDKs, tracking pixels, or third-party behavioral profiling trackers. Information is shared strictly with authorized infrastructure processors (such as transactional cloud hosting and push notification delivery) under confidentiality agreements.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                7
              </div>
              <h2 className="text-lg font-semibold text-slate-900">User Rights, Data Access & Account Deletion</h2>
            </div>
            <p className="mb-3">
              Clients retain full control over their corporate data and personal information in accordance with applicable data protection regulations:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Access & Portability:</strong> You may view or download your estimates, invoices, and ticket logs at any time directly through the app or web portal.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Correction:</strong> You may update your profile information, phone number, and company contact details directly or by requesting updates from your project manager.</span>
              </div>
              <div className="flex items-start gap-2">
                <UserX className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Account & Data Deletion:</strong> You may request the permanent deletion of your account and associated mobile session data at any time by contacting your dedicated Kabhyan account manager or writing to <code>support@kabhyan.com</code>.</span>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                8
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Children&apos;s Privacy</h2>
            </div>
            <p>
              Our services and mobile applications are strictly intended for enterprise B2B use by corporate professionals aged 18 and older. We do not knowingly collect or solicit personal information from minors.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                9
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Contact Us & Grievance Officer</h2>
            </div>
            <p className="mb-3">
              For any questions, concerns, or requests regarding this Privacy Policy or our data protection practices, please contact us:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm space-y-1.5">
              <p className="font-semibold text-slate-900">Kabhyan Technologies Private Limited</p>
              <p className="text-slate-600">Attn: Legal & Privacy Grievance Officer</p>
              <p className="flex items-center gap-1.5 text-blue-600 font-medium">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:support@kabhyan.com" className="hover:underline">support@kabhyan.com</a>
              </p>
              <p className="text-slate-500 text-xs pt-1">
                Website: <a href="https://erp.kabhyan.com" className="hover:underline text-slate-700">https://erp.kabhyan.com</a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Kabhyan Technologies Private Limited. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
