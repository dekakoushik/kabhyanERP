"use client";

import { useState, useMemo } from "react";
import { Client } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Search,
  Plus,
  X,
  User,
  Mail,
  Phone,
} from "lucide-react";

interface ClientComboboxProps {
  clients: Client[];
  selectedClientId?: number | null;
  onSelectClient: (client: Client | null) => void;
  onOpenQuickAdd: () => void;
  disabled?: boolean;
}

export default function ClientCombobox({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenQuickAdd,
  disabled = false,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => {
      return (
        c.company_name?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.client_code?.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    });
  }, [clients, search]);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-1.5 w-full">
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs text-left transition bg-white shadow-2xs ${
                open
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                {selectedClient ? (
                  <span className="font-semibold text-slate-900 truncate">
                    {selectedClient.company_name}{" "}
                    <span className="text-slate-400 font-normal">
                      ({selectedClient.name})
                    </span>{" "}
                    <span className="font-mono text-2xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {selectedClient.client_code}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Search and select an existing client...
                  </span>
                )}
              </div>
              <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </PopoverTrigger>

          {selectedClient && (
            <button
              type="button"
              onClick={() => onSelectClient(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Clear selected client"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[380px] sm:w-[480px] p-0 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50"
        >
          {/* SEARCH INPUT */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by company, contact person, code, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* CLIENT LIST */}
          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-slate-100/60">
            {filteredClients.length === 0 ? (
              <div className="py-8 text-center px-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  No matching clients found
                </p>
                <p className="text-2xs text-slate-400">
                  You can register a new client profile right away.
                </p>
              </div>
            ) : (
              filteredClients.map((cli) => {
                const isSelected = selectedClient?.id === cli.id;
                return (
                  <button
                    key={cli.id}
                    type="button"
                    onClick={() => {
                      onSelectClient(cli);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs truncate">
                          {cli.company_name}
                        </span>
                        <span className="font-mono text-3xs font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200">
                          {cli.client_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-2xs text-slate-500 font-normal">
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cli.name}</span>
                        </span>
                        {cli.email && (
                          <span className="flex items-center gap-1 truncate text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{cli.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* FOOTER: ADD NEW CLIENT */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
            <span className="text-2xs text-slate-500 font-medium px-2">
              {clients.length} corporate clients registered
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenQuickAdd();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Client</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

