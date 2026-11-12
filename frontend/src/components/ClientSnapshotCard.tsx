"use client";

import { Client } from "@/lib/api";
import ClientCombobox from "@/components/ClientCombobox";
import Link from "next/link";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  CreditCard,
} from "lucide-react";

interface ClientSnapshotCardProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onOpenQuickAdd: () => void;
  title?: string;
  subtitle?: string;
  required?: boolean;
}

export default function ClientSnapshotCard({
  clients,
  selectedClient,
  onSelectClient,
  onOpenQuickAdd,
  title = "Client & Entity Information",
  subtitle = "Select an existing client to auto-populate company, billing, and GST details",
  required = true,
}: ClientSnapshotCardProps) {
  const fullAddress = selectedClient
    ? [
        selectedClient.address,
        selectedClient.city,
        selectedClient.state,
        selectedClient.postal_code,
        selectedClient.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{title}</span>
            {required && <span className="text-rose-500">*</span>}
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Client</span>
          </button>
          <Link
            href="/dashboard/clients/create"
            target="_blank"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Open Master Client Onboarding in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Searchable Picker */}
        <div>
          <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Select Client From Directory
          </label>
          <ClientCombobox
            clients={clients}
            selectedClientId={selectedClient?.id}
            onSelectClient={onSelectClient}
            onOpenQuickAdd={onOpenQuickAdd}
          />
        </div>

        {/* Selected Client Snapshot View */}
        {selectedClient ? (
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900">
                    {selectedClient.company_name}
                  </h4>
                  <span className="font-mono text-2xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedClient.client_code}
                  </span>
                  <span
                    className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedClient.portal_access_status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {selectedClient.portal_access_status === "active" ? "Portal Enabled" : "Standard Client"}
                  </span>
                </div>
                <p className="text-2xs text-slate-500 flex items-center gap-1 font-medium">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Primary Contact: <strong>{selectedClient.name}</strong></span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectClient(null)}
                className="text-2xs font-semibold text-slate-500 hover:text-rose-600 self-start sm:self-auto cursor-pointer"
              >
                Change Client
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block">
                  Email
                </span>
                <span className="font-medium text-slate-700 truncate block">
                  {selectedClient.email || "No email registered"}
                </span>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block">
                  Phone
                </span>
                <span className="font-medium text-slate-700 block">
                  {selectedClient.phone || "—"}
                </span>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block">
                  GSTIN
                </span>
                <span className="font-mono font-medium text-slate-700 block">
                  {selectedClient.gstin || "Unregistered / Non-GST"}
                </span>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block">
                  Default Currency
                </span>
                <span className="font-semibold text-blue-700 block">
                  {selectedClient.currency || "INR"} ({selectedClient.payment_terms || "Net 30"})
                </span>
              </div>
            </div>

            {fullAddress && (
              <div className="pt-2 border-t border-slate-200/60 text-2xs text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Billing Address:</strong> {fullAddress}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 text-center space-y-1.5 bg-slate-50/40">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Client Selected</p>
            <p className="text-2xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Choose a client from the dropdown above to auto-populate company, billing, and tax information, or click <strong>+ Add New Client</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
