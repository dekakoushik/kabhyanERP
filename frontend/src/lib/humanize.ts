import {
  FileText,
  Receipt,
  FileCheck2,
  TrendingUp,
  CreditCard,
  Building2,
  FolderGit2,
  CheckSquare,
  HelpCircle,
  Users2,
  ShieldCheck,
  Settings2,
  LucideIcon,
} from "lucide-react";

export interface PermissionDefinition {
  slug: string;
  name: string;
  module: string;
  moduleLabel: string;
  description: string;
}

export interface ModulePermissionGroup {
  module: string;
  label: string;
  description: string;
  icon: LucideIcon;
  activeCount: number;
  totalCount: number;
  permissions: {
    slug: string;
    name: string;
    description: string;
    isGranted: boolean;
  }[];
}

export const PERMISSION_DEFINITIONS: Record<string, PermissionDefinition> = {
  // Estimates & Quotations
  "estimates.view": {
    slug: "estimates.view",
    name: "View Estimates",
    module: "estimates",
    moduleLabel: "Estimates & Proposals",
    description: "Browse and review commercial quotations and scope drafts.",
  },
  "estimates.create": {
    slug: "estimates.create",
    name: "Create Estimates",
    module: "estimates",
    moduleLabel: "Estimates & Proposals",
    description: "Author new commercial proposals, line items, and pricing scope.",
  },
  "estimates.edit": {
    slug: "estimates.edit",
    name: "Edit Estimates",
    module: "estimates",
    moduleLabel: "Estimates & Proposals",
    description: "Revise quotation deliverables, discounts, and commercial terms.",
  },
  "estimates.delete": {
    slug: "estimates.delete",
    name: "Delete Estimates",
    module: "estimates",
    moduleLabel: "Estimates & Proposals",
    description: "Discard unaccepted or archived quotation drafts.",
  },
  "estimates.convert_to_proforma": {
    slug: "estimates.convert_to_proforma",
    name: "Convert to Proforma",
    module: "estimates",
    moduleLabel: "Estimates & Proposals",
    description: "Convert an accepted proposal into an advance proforma invoice.",
  },
  "estimates.export_pdf": {
    slug: "estimates.export_pdf",
    name: "Download PDF",
    module: "estimates",
    moduleLabel: "Estimates & Proposals",
    description: "Generate and export official proposal document sheets.",
  },

  // Proforma Invoices
  "proforma.view": {
    slug: "proforma.view",
    name: "View Proformas",
    module: "proforma",
    moduleLabel: "Proforma Invoices",
    description: "Inspect advance billing schedules and proforma documents.",
  },
  "proforma.create": {
    slug: "proforma.create",
    name: "Issue Proforma",
    module: "proforma",
    moduleLabel: "Proforma Invoices",
    description: "Issue progressive proforma invoices for milestone retainers.",
  },
  "proforma.edit": {
    slug: "proforma.edit",
    name: "Edit Proforma",
    module: "proforma",
    moduleLabel: "Proforma Invoices",
    description: "Update proforma line items, milestone splits, and bank terms.",
  },
  "proforma.delete": {
    slug: "proforma.delete",
    name: "Delete Proforma",
    module: "proforma",
    moduleLabel: "Proforma Invoices",
    description: "Void or remove draft proforma invoices.",
  },
  "proforma.convert_to_invoice": {
    slug: "proforma.convert_to_invoice",
    name: "Convert to Tax Invoice",
    module: "proforma",
    moduleLabel: "Proforma Invoices",
    description: "Generate milestone GST tax invoices from settled proformas.",
  },
  "proforma.export_pdf": {
    slug: "proforma.export_pdf",
    name: "Download PDF",
    module: "proforma",
    moduleLabel: "Proforma Invoices",
    description: "Download official proforma invoice PDF document.",
  },

  // Tax Invoices & Billing
  "invoices.view": {
    slug: "invoices.view",
    name: "View Tax Invoices",
    module: "invoices",
    moduleLabel: "Tax Invoices & Billing",
    description: "Inspect GST compliant tax invoices and settlement status.",
  },
  "invoices.create": {
    slug: "invoices.create",
    name: "Issue Tax Invoice",
    module: "invoices",
    moduleLabel: "Tax Invoices & Billing",
    description: "Issue official tax invoices for IT and services deliverables.",
  },
  "invoices.edit": {
    slug: "invoices.edit",
    name: "Revise Tax Invoice",
    module: "invoices",
    moduleLabel: "Tax Invoices & Billing",
    description: "Modify invoice particulars prior to fiscal submission.",
  },
  "invoices.delete": {
    slug: "invoices.delete",
    name: "Void / Delete Invoice",
    module: "invoices",
    moduleLabel: "Tax Invoices & Billing",
    description: "Cancel or delete voided tax invoices.",
  },
  "invoices.record_payment": {
    slug: "invoices.record_payment",
    name: "Record Payments",
    module: "invoices",
    moduleLabel: "Tax Invoices & Billing",
    description: "Log payment receipts, reconcile bank transfers, and settle dues.",
  },
  "invoices.export_pdf": {
    slug: "invoices.export_pdf",
    name: "Download Signed PDF",
    module: "invoices",
    moduleLabel: "Tax Invoices & Billing",
    description: "Generate official tax invoice with company seal & GST breakdown.",
  },

  // Accounts & Income
  "accounts.view": {
    slug: "accounts.view",
    name: "View Financial Ledger",
    module: "accounts",
    moduleLabel: "Financial Accounts & Revenue",
    description: "Access corporate revenue, collections, and cash flow reports.",
  },
  "accounts.export_reports": {
    slug: "accounts.export_reports",
    name: "Export Financial Reports",
    module: "accounts",
    moduleLabel: "Financial Accounts & Revenue",
    description: "Download corporate balance sheets, P&L, and ledgers.",
  },

  // Expenses
  "expenses.view": {
    slug: "expenses.view",
    name: "View Expenses",
    module: "expenses",
    moduleLabel: "Expense Register",
    description: "Browse corporate expenditures, bills, and payment methods.",
  },
  "expenses.create": {
    slug: "expenses.create",
    name: "Record Expense",
    module: "expenses",
    moduleLabel: "Expense Register",
    description: "File organizational expense entries, receipts, and tax credits.",
  },
  "expenses.edit": {
    slug: "expenses.edit",
    name: "Edit Expenses",
    module: "expenses",
    moduleLabel: "Expense Register",
    description: "Adjust expense amounts, vendors, and category tags.",
  },
  "expenses.delete": {
    slug: "expenses.delete",
    name: "Delete Expense",
    module: "expenses",
    moduleLabel: "Expense Register",
    description: "Remove incorrect or voided expense records.",
  },
  "expenses.manage_categories": {
    slug: "expenses.manage_categories",
    name: "Manage Categories",
    module: "expenses",
    moduleLabel: "Expense Register",
    description: "Add or reconfigure corporate expense classification categories.",
  },

  // Clients & CRM
  "clients.view": {
    slug: "clients.view",
    name: "View Client Directory",
    module: "clients",
    moduleLabel: "Client Directory & CRM",
    description: "Browse registered corporate clients, GSTINs, and coordinates.",
  },
  "clients.create": {
    slug: "clients.create",
    name: "Register Client",
    module: "clients",
    moduleLabel: "Client Directory & CRM",
    description: "Register new corporate entities and billing contacts.",
  },
  "clients.edit": {
    slug: "clients.edit",
    name: "Edit Client",
    module: "clients",
    moduleLabel: "Client Directory & CRM",
    description: "Update client addresses, tax residency, and contact information.",
  },
  "clients.delete": {
    slug: "clients.delete",
    name: "Delete Client",
    module: "clients",
    moduleLabel: "Client Directory & CRM",
    description: "Archive or delete client accounts.",
  },
  "clients.manage_portal_access": {
    slug: "clients.manage_portal_access",
    name: "Manage Portal Access",
    module: "clients",
    moduleLabel: "Client Directory & CRM",
    description: "Activate or suspend customer self-service portal credentials.",
  },

  // Projects Portfolio
  "projects.view": {
    slug: "projects.view",
    name: "View Projects",
    module: "projects",
    moduleLabel: "Projects Portfolio",
    description: "Inspect enterprise project workspaces, budgets, and milestones.",
  },
  "projects.create": {
    slug: "projects.create",
    name: "Create Project",
    module: "projects",
    moduleLabel: "Projects Portfolio",
    description: "Initialize new software engineering and client delivery projects.",
  },
  "projects.edit": {
    slug: "projects.edit",
    name: "Edit Project",
    module: "projects",
    moduleLabel: "Projects Portfolio",
    description: "Modify project timelines, deadlines, managers, and budgets.",
  },
  "projects.delete": {
    slug: "projects.delete",
    name: "Delete Project",
    module: "projects",
    moduleLabel: "Projects Portfolio",
    description: "Archive or remove finished or cancelled projects.",
  },
  "projects.manage_members": {
    slug: "projects.manage_members",
    name: "Assign Team Members",
    module: "projects",
    moduleLabel: "Projects Portfolio",
    description: "Allocate and manage engineers and team leads across projects.",
  },

  // Tasks & Delivery
  "tasks.view": {
    slug: "tasks.view",
    name: "View Tasks",
    module: "tasks",
    moduleLabel: "Tasks & Delivery",
    description: "Track project deliverables, tasks, and sprint Kanban boards.",
  },
  "tasks.create": {
    slug: "tasks.create",
    name: "Create Tasks",
    module: "tasks",
    moduleLabel: "Tasks & Delivery",
    description: "Assign sprint tasks, estimated hours, and due dates.",
  },
  "tasks.edit": {
    slug: "tasks.edit",
    name: "Edit Tasks",
    module: "tasks",
    moduleLabel: "Tasks & Delivery",
    description: "Update task scopes, assignees, priorities, and descriptions.",
  },
  "tasks.delete": {
    slug: "tasks.delete",
    name: "Delete Tasks",
    module: "tasks",
    moduleLabel: "Tasks & Delivery",
    description: "Remove redundant or completed task items.",
  },
  "tasks.update_status": {
    slug: "tasks.update_status",
    name: "Update Task Progress",
    module: "tasks",
    moduleLabel: "Tasks & Delivery",
    description: "Move tasks between To-Do, In Progress, Review, and Completed.",
  },

  // Support Helpdesk
  "tickets.view": {
    slug: "tickets.view",
    name: "View Tickets",
    module: "tickets",
    moduleLabel: "Support Helpdesk",
    description: "Monitor client support queues, SLAs, and incident history.",
  },
  "tickets.create": {
    slug: "tickets.create",
    name: "Create Ticket",
    module: "tickets",
    moduleLabel: "Support Helpdesk",
    description: "File internal technical tickets or customer issue reports.",
  },
  "tickets.reply": {
    slug: "tickets.reply",
    name: "Reply to Tickets",
    module: "tickets",
    moduleLabel: "Support Helpdesk",
    description: "Post responses, troubleshooting steps, and customer messages.",
  },
  "tickets.assign": {
    slug: "tickets.assign",
    name: "Assign Tickets",
    module: "tickets",
    moduleLabel: "Support Helpdesk",
    description: "Route support tickets to dedicated developers or managers.",
  },
  "tickets.change_status": {
    slug: "tickets.change_status",
    name: "Update Ticket Status",
    module: "tickets",
    moduleLabel: "Support Helpdesk",
    description: "Mark tickets as In Progress, Resolved, Closed, or Escalated.",
  },

  // Team & Staff Operations
  "staff.view": {
    slug: "staff.view",
    name: "View Team Directory",
    module: "staff",
    moduleLabel: "Team & Staff Operations",
    description: "Browse organizational employee directory and profiles.",
  },
  "staff.create": {
    slug: "staff.create",
    name: "Add Team Member",
    module: "staff",
    moduleLabel: "Team & Staff Operations",
    description: "Onboard new team members, assign roles, and create logins.",
  },
  "staff.edit": {
    slug: "staff.edit",
    name: "Edit Profile",
    module: "staff",
    moduleLabel: "Team & Staff Operations",
    description: "Update staff designations, departments, and phone numbers.",
  },
  "staff.suspend": {
    slug: "staff.suspend",
    name: "Suspend Access",
    module: "staff",
    moduleLabel: "Team & Staff Operations",
    description: "Temporarily pause member portal and system login access.",
  },
  "staff.delete": {
    slug: "staff.delete",
    name: "Remove Member",
    module: "staff",
    moduleLabel: "Team & Staff Operations",
    description: "Deactivate and archive an employee profile.",
  },

  // Roles & Permissions
  "roles.view": {
    slug: "roles.view",
    name: "View Roles",
    module: "roles",
    moduleLabel: "Roles & Governance",
    description: "Review built-in and custom role permission profiles.",
  },
  "roles.manage": {
    slug: "roles.manage",
    name: "Manage Roles",
    module: "roles",
    moduleLabel: "Roles & Governance",
    description: "Create, configure, and customize role permission boundaries.",
  },

  // System Settings & Infrastructure
  "settings.view": {
    slug: "settings.view",
    name: "View Settings",
    module: "settings",
    moduleLabel: "System Settings & Infrastructure",
    description: "Inspect corporate setup, SMTP configuration, and health.",
  },
  "settings.manage_company": {
    slug: "settings.manage_company",
    name: "Company Profile",
    module: "settings",
    moduleLabel: "System Settings & Infrastructure",
    description: "Update registered corporate office, GSTIN, and branding.",
  },
  "settings.manage_taxation": {
    slug: "settings.manage_taxation",
    name: "Tax & Numbering",
    module: "settings",
    moduleLabel: "System Settings & Infrastructure",
    description: "Configure GST tax slabs and document numbering sequences.",
  },
  "settings.flush_cache": {
    slug: "settings.flush_cache",
    name: "Refresh System Cache",
    module: "settings",
    moduleLabel: "System Settings & Infrastructure",
    description: "Clear and rebuild configuration, routing, and system cache.",
  },
};

export const MODULE_METADATA: Record<string, { label: string; description: string; icon: LucideIcon }> = {
  estimates: {
    label: "Estimates & Proposals",
    description: "Drafting, scope definitions, quotations, and proforma conversions",
    icon: FileText,
  },
  proforma: {
    label: "Proforma Invoices",
    description: "Advance billing schedules, phase retainers, and progressive milestones",
    icon: Receipt,
  },
  invoices: {
    label: "Tax Invoices & Billing",
    description: "Statutory GST invoicing, line items, payments, and signed PDFs",
    icon: FileCheck2,
  },
  accounts: {
    label: "Financial Accounts & Revenue",
    description: "General financial ledger, turnover analytics, and P&L reports",
    icon: TrendingUp,
  },
  expenses: {
    label: "Expense Register",
    description: "Organizational expenditures, vendor receipts, and expense taxonomy",
    icon: CreditCard,
  },
  clients: {
    label: "Client Directory & CRM",
    description: "Corporate customer profiles, billing coordinates, and portal accounts",
    icon: Building2,
  },
  projects: {
    label: "Projects Portfolio",
    description: "Enterprise software delivery workspaces, budgets, and teams",
    icon: FolderGit2,
  },
  tasks: {
    label: "Tasks & Delivery",
    description: "Sprint Kanban boards, estimated hours, and deliverable statuses",
    icon: CheckSquare,
  },
  tickets: {
    label: "Support Helpdesk",
    description: "Customer service tickets, client replies, and issue resolution",
    icon: HelpCircle,
  },
  staff: {
    label: "Team & Staff Operations",
    description: "Internal employee profiles, designations, and access management",
    icon: Users2,
  },
  roles: {
    label: "Roles & Governance",
    description: "Role authority tiers, access rights, and permission boundaries",
    icon: ShieldCheck,
  },
  settings: {
    label: "System Settings & Infrastructure",
    description: "Corporate setup, GST slabs, SMTP mailers, and system cache",
    icon: Settings2,
  },
};

/**
 * Convert a raw technical permission slug into a human-readable title.
 */
export function humanizePermission(slug: string): string {
  if (PERMISSION_DEFINITIONS[slug]) {
    return PERMISSION_DEFINITIONS[slug].name;
  }
  // Fallback: title case dot notation e.g. "estimates.view" -> "View Estimates"
  const parts = slug.split(".");
  if (parts.length === 2) {
    const action = parts[1].replace(/_/g, " ");
    const module = parts[0].replace(/_/g, " ");
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.charAt(0).toUpperCase() + module.slice(1)}`;
  }
  return slug.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Group a list of granted permission slugs by their domain module.
 */
export function groupPermissionsByModule(grantedSlugs: string[]): ModulePermissionGroup[] {
  const grantedSet = new Set(grantedSlugs || []);

  const groups: Record<string, ModulePermissionGroup> = {};

  // Initialize with known modules in logical order
  const moduleOrder = [
    "estimates",
    "proforma",
    "invoices",
    "accounts",
    "expenses",
    "clients",
    "projects",
    "tasks",
    "tickets",
    "staff",
    "roles",
    "settings",
  ];

  moduleOrder.forEach((mod) => {
    const meta = MODULE_METADATA[mod];
    groups[mod] = {
      module: mod,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      activeCount: 0,
      totalCount: 0,
      permissions: [],
    };
  });

  // Populate permissions from dictionary
  Object.values(PERMISSION_DEFINITIONS).forEach((def) => {
    const mod = def.module;
    if (!groups[mod]) {
      groups[mod] = {
        module: mod,
        label: def.moduleLabel,
        description: "",
        icon: ShieldCheck,
        activeCount: 0,
        totalCount: 0,
        permissions: [],
      };
    }

    const isGranted = grantedSet.has(def.slug);
    groups[mod].totalCount += 1;
    if (isGranted) {
      groups[mod].activeCount += 1;
    }

    groups[mod].permissions.push({
      slug: def.slug,
      name: def.name,
      description: def.description,
      isGranted,
    });
  });

  // Handle any custom or unknown slugs passed
  grantedSlugs.forEach((slug) => {
    if (!PERMISSION_DEFINITIONS[slug]) {
      const parts = slug.split(".");
      const mod = parts[0] || "custom";
      if (!groups[mod]) {
        groups[mod] = {
          module: mod,
          label: mod.charAt(0).toUpperCase() + mod.slice(1),
          description: "Custom system capabilities",
          icon: ShieldCheck,
          activeCount: 0,
          totalCount: 0,
          permissions: [],
        };
      }
      if (!groups[mod].permissions.some((p) => p.slug === slug)) {
        groups[mod].activeCount += 1;
        groups[mod].totalCount += 1;
        groups[mod].permissions.push({
          slug,
          name: humanizePermission(slug),
          description: "Custom privilege",
          isGranted: true,
        });
      }
    }
  });

  return Object.values(groups);
}

/**
 * Human-friendly role title.
 */
export function humanizeRole(slug: string): string {
  const map: Record<string, string> = {
    superadmin: "Super Administrator",
    admin: "Operations Director",
    hr: "Human Resources Lead",
    manager: "Project Manager",
    employee: "Team Member",
    client: "Client Portal Account",
  };
  return map[slug] || slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Human-friendly status label.
 */
export function humanizeStatus(status: string): string {
  const map: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    invoiced: "Invoiced",
    unpaid: "Unpaid",
    partially_paid: "Partially Paid",
    paid: "Paid",
    partially_invoiced: "Partially Invoiced",
    fully_invoiced: "Fully Invoiced",
    overdue: "Overdue",
    cancelled: "Cancelled",
    planning: "Planning",
    in_progress: "In Progress",
    on_hold: "On Hold",
    completed: "Completed",
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return map[status] || status.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Human-friendly payment method label.
 */
export function humanizePaymentMethod(method: string): string {
  const map: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    corporate_card: "Corporate Card",
    upi: "UPI",
    cash: "Cash",
    cheque: "Cheque",
    neft: "NEFT",
    rtgs: "RTGS",
  };
  return map[method] || method.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
