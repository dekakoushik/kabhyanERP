"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  FileCheck,
  TrendingUp,
  CreditCard,
  Building,
  Briefcase,
  CheckSquare,
  LifeBuoy,
  Users,
  Settings,
  Plus,
  ExternalLink,
  Search,
  Building2,
  Mail,
  Cpu,
} from "lucide-react";

interface GlobalCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalCommandPalette({
  open,
  onOpenChange,
}: GlobalCommandPaletteProps) {
  const router = useRouter();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or jump to page... (Ctrl + K)" />
      <CommandList>
        <CommandEmpty>No matching pages or actions found.</CommandEmpty>

        {/* Quick Actions Group */}
        <CommandGroup heading="Quick Create Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/estimates/create"))}
          >
            <div className="p-1 rounded-md bg-blue-50 text-blue-600 mr-2.5">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Draft Client Estimate</span>
            <CommandShortcut>NE</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/invoices/create"))}
          >
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 mr-2.5">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Generate Tax Invoice</span>
            <CommandShortcut>NI</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/proforma/create"))}
          >
            <div className="p-1 rounded-md bg-indigo-50 text-indigo-600 mr-2.5">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Create Proforma Invoice</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/projects/create"))}
          >
            <div className="p-1 rounded-md bg-purple-50 text-purple-600 mr-2.5">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Create Client Project</span>
            <CommandShortcut>NP</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/clients/create"))}
          >
            <div className="p-1 rounded-md bg-blue-50 text-blue-600 mr-2.5">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Register Corporate Client</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/tickets/create"))}
          >
            <div className="p-1 rounded-md bg-rose-50 text-rose-600 mr-2.5">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Open Support Ticket</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation Group */}
        <CommandGroup heading="Navigation & Modules">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Executive Dashboard Cockpit</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/estimates"))}>
            <FileText className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Estimates & Proposals</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/invoices"))}>
            <FileCheck className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Tax Invoices & Billing</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/proforma"))}>
            <Receipt className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Proforma Invoices</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/clients"))}>
            <Building className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Client Accounts CRM</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/projects"))}>
            <Briefcase className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Project Deliverables Portfolio</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/tickets"))}>
            <LifeBuoy className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Client Support Desk</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/accounts"))}>
            <TrendingUp className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Income vs Expense Financials</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/expenses"))}>
            <CreditCard className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Expense Register</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/users"))}>
            <Users className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Team & Personnel Directory</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <Settings className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Settings: Overview Control Centre</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/gst"))}>
            <Receipt className="w-4 h-4 mr-2.5 text-purple-500" />
            <span>Settings: Indian GST & Statutory Taxation</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/company"))}>
            <Building className="w-4 h-4 mr-2.5 text-blue-500" />
            <span>Settings: Corporate Entity Profile</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/banking"))}>
            <Building2 className="w-4 h-4 mr-2.5 text-emerald-500" />
            <span>Settings: Bank & Wire Settlement</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/email"))}>
            <Mail className="w-4 h-4 mr-2.5 text-cyan-500" />
            <span>Settings: SMTP Server & Live Test Mailer</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/system"))}>
            <Cpu className="w-4 h-4 mr-2.5 text-emerald-500" />
            <span>Settings: Redis & Server Infrastructure Health</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* External Portals */}
        <CommandGroup heading="External Links">
          <CommandItem onSelect={() => runCommand(() => window.open("/portal", "_blank"))}>
            <ExternalLink className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Open Client Self-Service Portal</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

