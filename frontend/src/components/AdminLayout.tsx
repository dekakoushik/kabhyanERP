"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { api, SettingsResponse } from "@/lib/api";
import { setActiveDateFormat } from "@/lib/date";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppTabBar from "@/components/mobile/MobileAppTabBar";
import QuickActionBottomSheet from "@/components/mobile/QuickActionBottomSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Users,
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  CheckSquare,
  FileText,
  Receipt,
  FileCheck,
  TrendingUp,
  CreditCard,
  Building,
  LifeBuoy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  UserCheck,
  UserPlus,
  Shield,
  KeyRound,
  Hash,
  Sparkles,
  Calendar,
  CalendarDays,
  Handshake,
  Plus,
  Globe,
  Mail,
  BarChart3,
  Clock,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export interface NavSubItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

export interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
  children?: NavSubItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const { brand } = useBrand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  // Load saved collapse state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}

    // Bootstrap global date format from system settings
    if (typeof window !== "undefined" && !localStorage.getItem("kabhyan_date_format")) {
      (api.request("/settings") as Promise<SettingsResponse>)
        .then((res: any) => {
          if (res?.settings && typeof res.settings === "object") {
            Object.values(res.settings).forEach((items) => {
              if (Array.isArray(items)) {
                items.forEach((item) => {
                  if (item.key === "date_format" && item.value) {
                    setActiveDateFormat(String(item.value));
                  }
                });
              }
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("erp_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const navigationGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          name: "Tax Invoices",
          icon: FileCheck,
          roles: ["superadmin", "admin", "manager"],
          children: [
            { name: "All Invoices", href: "/dashboard/invoices", icon: FileCheck },
            { name: "+ New Invoice", href: "/dashboard/invoices/create", icon: Plus, roles: ["superadmin", "admin", "manager"] },
          ],
        },
        {
          name: "Receipt Vouchers",
          icon: ShieldCheck,
          roles: ["superadmin", "admin", "manager"],
          children: [
            { name: "All Vouchers", href: "/dashboard/receipt-vouchers", icon: ShieldCheck },
            { name: "+ Issue Voucher", href: "/dashboard/receipt-vouchers/create", icon: Plus, roles: ["superadmin", "admin", "manager"] },
          ],
        },
        {
          name: "Proforma Invoices",
          icon: Receipt,
          roles: ["superadmin", "admin", "manager"],
          children: [
            { name: "All Proformas", href: "/dashboard/proforma", icon: Receipt },
            { name: "+ New Proforma", href: "/dashboard/proforma/create", icon: Plus, roles: ["superadmin", "admin", "manager"] },
          ],
        },
        {
          name: "Estimates",
          icon: FileText,
          roles: ["superadmin", "admin", "manager", "hr"],
          children: [
            { name: "All Estimates", href: "/dashboard/estimates", icon: FileText },
            { name: "+ New Estimate", href: "/dashboard/estimates/create", icon: Plus, roles: ["superadmin", "admin", "manager"] },
          ],
        },
        {
          name: "Accounts & Expenses",
          icon: TrendingUp,
          roles: ["superadmin", "admin", "manager", "hr"],
          children: [
            { name: "Income & Accounts", href: "/dashboard/accounts", icon: TrendingUp, roles: ["superadmin", "admin"] },
            { name: "Company Expenses", href: "/dashboard/expenses", icon: CreditCard },
            { name: "+ Log Expense", href: "/dashboard/expenses/create", icon: Plus, roles: ["superadmin", "admin", "manager", "hr"] },
          ],
        },
        {
          name: "Business Reports",
          icon: BarChart3,
          roles: ["superadmin", "admin"],
          children: [
            { name: "Executive Overview", href: "/dashboard/reports", icon: BarChart3 },
            { name: "Revenue & P&L", href: "/dashboard/reports/revenue", icon: TrendingUp },
            { name: "Statutory GST", href: "/dashboard/reports/gst", icon: Receipt },
            { name: "Receivables Aging", href: "/dashboard/reports/receivables", icon: Clock },
            { name: "Client Portfolio", href: "/dashboard/reports/clients", icon: Users },
            { name: "Project Margins", href: "/dashboard/reports/projects", icon: Briefcase },
          ],
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          name: "Clients",
          icon: Building,
          roles: ["superadmin", "admin", "manager"],
          children: [
            { name: "Client Directory", href: "/dashboard/clients", icon: Building },
            { name: "+ Add Client", href: "/dashboard/clients/create", icon: UserPlus, roles: ["superadmin", "admin", "manager"] },
          ],
        },
        {
          name: "Business Associates",
          icon: Handshake,
          roles: ["superadmin", "admin", "manager"],
          children: [
            { name: "Partner Directory", href: "/dashboard/business-associates", icon: Handshake },
            { name: "+ Add Associate", href: "/dashboard/business-associates/create", icon: Plus, roles: ["superadmin", "admin", "manager"] },
          ],
        },
        {
          name: "Projects",
          icon: Briefcase,
          children: [
            { name: "Project Portfolio", href: "/dashboard/projects", icon: Briefcase },
            { name: "+ New Project", href: "/dashboard/projects/create", icon: Plus, roles: ["superadmin", "admin", "manager"] },
          ],
        },
        {
          name: "Support Tickets",
          icon: LifeBuoy,
          children: [
            { name: "Ticket Desk", href: "/dashboard/tickets", icon: LifeBuoy },
            { name: "+ Raise Ticket", href: "/dashboard/tickets/create", icon: Plus },
          ],
        },
      ],
    },
    {
      title: "HR & Payroll",
      items: [
        {
          name: "HR Operations",
          icon: UserCheck,
          roles: ["superadmin", "admin", "hr", "manager", "staff"],
          children: [
            { name: "Overview", href: "/dashboard/hrms", icon: LayoutDashboard },
            { name: "Attendance", href: "/dashboard/hrms/attendance", icon: CheckSquare },
            { name: "Leaves", href: "/dashboard/hrms/leaves", icon: CalendarDays },
            { name: "+ Apply Leave", href: "/dashboard/hrms/leaves/apply", icon: Plus },
            { name: "Payroll", href: "/dashboard/hrms/payroll", icon: CreditCard, roles: ["superadmin", "admin", "hr"] },
            { name: "Salary Setup", href: "/dashboard/hrms/salary-structures", icon: Receipt, roles: ["superadmin", "admin", "hr"] },
            { name: "Holidays", href: "/dashboard/hrms/holidays", icon: Calendar },
          ],
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          name: "Team & Staff",
          icon: Users,
          roles: ["superadmin", "admin", "hr"],
          children: [
            { name: "Team Directory", href: "/dashboard/users", icon: Users },
            { name: "+ Add Member", href: "/dashboard/users/create", icon: UserPlus, roles: ["superadmin", "admin"] },
            { name: "Roles & Permissions", href: "/dashboard/users/roles", icon: ShieldCheck, roles: ["superadmin", "admin"] },
            { name: "Departments", href: "/dashboard/users/departments", icon: Building },
          ],
        },
        {
          name: "Settings",
          icon: Settings,
          roles: ["superadmin", "admin"],
          children: [
            { name: "Overview", href: "/dashboard/settings", icon: Settings },
            { name: "Company Profile", href: "/dashboard/settings/company", icon: Building },
            { name: "Document Numbering", href: "/dashboard/settings/numbering", icon: Hash },
            { name: "GST & Taxation", href: "/dashboard/settings/gst", icon: Receipt },
            { name: "Banking & Wire", href: "/dashboard/settings/banking", icon: CreditCard },
            { name: "Localization", href: "/dashboard/settings/localization", icon: Globe },
            { name: "Security & Access", href: "/dashboard/settings/security", icon: KeyRound },
            { name: "SMTP Email", href: "/dashboard/settings/email", icon: Mail },
            { name: "System Health", href: "/dashboard/settings/system", icon: Activity },
          ],
        },
      ],
    },
  ];

  // Auto-expand accordion dropdown if a child link is active
  useEffect(() => {
    navigationGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(
            (c) => pathname === c.href || (c.href !== "/dashboard" && pathname.startsWith(c.href))
          );
          if (hasActiveChild) {
            setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
          }
        }
      });
    });
  }, [pathname]);

  // Filter groups according to current user's role
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if (!item.roles || item.roles.length === 0) return true;
          if (!user?.role) return true;
          return item.roles.includes(user.role);
        })
        .map((item) => {
          if (!item.children) return item;
          return {
            ...item,
            children: item.children.filter((child) => {
              if (!child.roles || child.roles.length === 0) return true;
              if (!user?.role) return true;
              return child.roles.includes(user.role);
            }),
          };
        }),
    }))
    .filter((group) => group.items.length > 0);

  // Dynamic Hierarchical Breadcrumb Generator
  const getBreadcrumbs = () => {
    if (pathname === "/dashboard") {
      return [{ label: "Corporate Overview", href: "/dashboard", isCurrent: true }];
    }

    const segments = pathname.split("/").filter(Boolean); // ['dashboard', 'projects', ...]
    const crumbs: { label: string; href: string; isCurrent: boolean }[] = [];

    // Base Dashboard Link
    crumbs.push({ label: "Workspace", href: "/dashboard", isCurrent: false });

    if (segments.length >= 2) {
      const section = segments[1];
      let sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
      if (section === "estimates") sectionLabel = "Estimates";
      if (section === "receipt-vouchers") sectionLabel = "Receipt Vouchers";
      if (section === "proforma") sectionLabel = "Proforma Invoices";
      if (section === "invoices") sectionLabel = "Tax Invoices";
      if (section === "accounts") sectionLabel = "Ledger & Income";
      if (section === "expenses") sectionLabel = "Expenses";
      if (section === "clients") sectionLabel = "Clients";
      if (section === "business-associates") sectionLabel = "Business Associates";
      if (section === "projects") sectionLabel = "Projects";
      if (section === "tasks") sectionLabel = "Tasks";
      if (section === "tickets") sectionLabel = "Support Tickets";
      if (section === "users") sectionLabel = "Team";
      if (section === "settings") sectionLabel = "Settings";
      if (section === "reports") sectionLabel = "Reports";

      const sectionHref = `/dashboard/${section}`;
      const isCurrent = segments.length === 2;
      crumbs.push({ label: sectionLabel, href: sectionHref, isCurrent });

      // Sub-segment (e.g. /clients/create, /users/1, /users/roles/create, /invoices/5/edit)
      if (segments.length >= 3) {
        const sub = segments[2];

        if (section === "users" && sub === "create") {
          crumbs.push({ label: "Add Member", href: pathname, isCurrent: true });
        } else if (section === "business-associates" && sub === "create") {
          crumbs.push({ label: "Onboard Associate", href: pathname, isCurrent: true });
        } else if (sub === "create") {
          crumbs.push({ label: "New Record", href: pathname, isCurrent: true });
        } else if (sub === "roles") {
          const isRolesIndex = segments.length === 3;
          crumbs.push({ label: "Roles & Permissions", href: "/dashboard/users/roles", isCurrent: isRolesIndex });
          if (segments.length >= 4) {
            const roleAction = segments[3];
            if (roleAction === "create") {
              crumbs.push({ label: "New Role", href: pathname, isCurrent: true });
            } else {
              crumbs.push({ label: "Edit Role", href: pathname, isCurrent: true });
            }
          }
        } else if (sub === "departments") {
          crumbs.push({ label: "Departments", href: pathname, isCurrent: true });
        } else if (sub === "numbering") {
          crumbs.push({ label: "Document Numbering", href: pathname, isCurrent: true });
        } else if (sub === "company") {
          crumbs.push({ label: "Company & Brand", href: pathname, isCurrent: true });
        } else if (sub === "gst") {
          crumbs.push({ label: "GST Compliance", href: pathname, isCurrent: true });
        } else if (sub === "banking") {
          crumbs.push({ label: "Banking Details", href: pathname, isCurrent: true });
        } else if (sub === "localization") {
          crumbs.push({ label: "Localization", href: pathname, isCurrent: true });
        } else if (sub === "security") {
          crumbs.push({ label: "Security & Access", href: pathname, isCurrent: true });
        } else if (sub === "email") {
          crumbs.push({ label: "Email Infrastructure", href: pathname, isCurrent: true });
        } else if (sub === "system") {
          crumbs.push({ label: "System Health", href: pathname, isCurrent: true });
        } else if (section === "reports" && sub === "revenue") {
          crumbs.push({ label: "Revenue & P&L", href: pathname, isCurrent: true });
        } else if (section === "reports" && sub === "gst") {
          crumbs.push({ label: "Statutory GST", href: pathname, isCurrent: true });
        } else if (section === "reports" && sub === "receivables") {
          crumbs.push({ label: "Receivables & Aging", href: pathname, isCurrent: true });
        } else if (section === "reports" && sub === "clients") {
          crumbs.push({ label: "Client Portfolio", href: pathname, isCurrent: true });
        } else if (section === "reports" && sub === "projects") {
          crumbs.push({ label: "Project Margins", href: pathname, isCurrent: true });
        } else {
          // Dynamic record identifier (e.g. /dashboard/users/1, /dashboard/invoices/5/edit)
          const getEntityLabels = (sec: string) => {
            switch (sec) {
              case "users": return { record: "Member Profile", edit: "Edit Profile" };
              case "estimates": return { record: "Estimate Details", edit: "Edit Estimate" };
              case "receipt-vouchers": return { record: "Voucher Details", edit: "Edit Voucher" };
              case "proforma": return { record: "Proforma Details", edit: "Edit Proforma" };
              case "invoices": return { record: "Tax Invoice Details", edit: "Edit Invoice" };
              case "clients": return { record: "Client Profile", edit: "Edit Client" };
              case "business-associates": return { record: "Associate Profile", edit: "Edit Terms" };
              case "projects": return { record: "Project Details", edit: "Edit Project" };
              case "tasks": return { record: "Task Details", edit: "Edit Task" };
              case "tickets": return { record: "Ticket Details", edit: "Edit Ticket" };
              case "expenses": return { record: "Expense Details", edit: "Edit Expense" };
              default: return { record: "Record Details", edit: "Edit Record" };
            }
          };

          const entityLabels = getEntityLabels(section);
          const isDirectRecord = segments.length === 3;
          const isEditPage = segments.length >= 4 && segments[3] === "edit";
          const isAddClientPage = segments.length >= 4 && segments[3] === "add-client";

          if (isDirectRecord) {
            crumbs.push({ label: entityLabels.record, href: pathname, isCurrent: true });
          } else if (isEditPage) {
            crumbs.push({ label: entityLabels.record, href: `/dashboard/${section}/${sub}`, isCurrent: false });
            crumbs.push({ label: entityLabels.edit, href: pathname, isCurrent: true });
          } else if (isAddClientPage) {
            crumbs.push({ label: entityLabels.record, href: `/dashboard/${section}/${sub}`, isCurrent: false });
            crumbs.push({ label: "Onboard Client", href: pathname, isCurrent: true });
          } else {
            let fallbackLabel = sub.charAt(0).toUpperCase() + sub.slice(1);
            crumbs.push({ label: fallbackLabel, href: pathname, isCurrent: true });
          }
        }
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Modern Sidebar (Desktop Fixed & Mobile Offcanvas) */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 transform transition-all duration-200 ease-in-out lg:translate-x-0 h-screen flex flex-col print:hidden ${
          mobileMenuOpen ? "translate-x-0 w-72 z-50" : "-translate-x-full lg:translate-x-0 z-40"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Fixed Brand & Collapse Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className={`relative h-7 w-32 ${isCollapsed ? "hidden" : "block"}`}>
              <Image
                src={brand.logoPrimary || "/logo.png"}
                alt={brand.companyName || "Kabhyan Technologies"}
                fill
                className="object-contain object-left"
                priority
                unoptimized
              />
            </div>
            {isCollapsed && (
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                {brand.logoIcon && brand.logoIcon !== "/logo.png" ? (
                  <Image
                    src={brand.logoIcon}
                    alt="Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  "K"
                )}
              </div>
            )}
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                ERP
              </span>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden">
          {filteredGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = Boolean(item.children && item.children.length > 0);

                if (hasChildren && item.children) {
                  const hasActiveChild = item.children.some(
                    (c) => pathname === c.href || (c.href !== "/dashboard" && pathname.startsWith(c.href))
                  );
                  const isOpen = Boolean(openDropdowns[item.name]);

                  // Collapsed mode: Floating flyout menu
                  if (isCollapsed) {
                    return (
                      <DropdownMenu key={item.name}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title={item.name}
                            className={`w-full flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              hasActiveChild
                                ? "bg-blue-600 text-white font-semibold shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${hasActiveChild ? "text-white" : "text-slate-500"}`} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-56 p-1.5 font-sans z-50 shadow-md">
                          <DropdownMenuLabel className="text-xs font-bold text-slate-500 px-2 py-1">
                            {item.name}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuGroup>
                            {item.children.map((child) => {
                              const hasExactSibling = item.children?.some((c) => c.href === pathname);
                              const isChildActive = hasExactSibling
                                ? pathname === child.href
                                : pathname === child.href || (child.href !== "/dashboard" && pathname.startsWith(`${child.href}/`));
                              const ChildIcon = child.icon;
                              return (
                                <DropdownMenuItem key={child.name} asChild>
                                  <Link
                                    href={child.href}
                                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md cursor-pointer ${
                                      isChildActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700"
                                    }`}
                                  >
                                    {ChildIcon ? (
                                      <ChildIcon className={`w-3.5 h-3.5 ${isChildActive ? "text-blue-600" : "text-slate-400"}`} />
                                    ) : (
                                      <span className={`w-1.5 h-1.5 rounded-full ${isChildActive ? "bg-blue-600" : "bg-slate-300"}`} />
                                    )}
                                    <span className="truncate">{child.name}</span>
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  // Expanded mode: Interactive accordion
                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleDropdown(item.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          hasActiveChild
                            ? "bg-slate-100 text-blue-700 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${hasActiveChild ? "text-blue-600" : "text-slate-500"}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-100 text-blue-700">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="ml-4 pl-2 border-l border-slate-200 space-y-1 mt-1 transition-all">
                          {item.children.map((child) => {
                            const hasExactSibling = item.children?.some((c) => c.href === pathname);
                            const isChildActive = hasExactSibling
                              ? pathname === child.href
                              : pathname === child.href || (child.href !== "/dashboard" && pathname.startsWith(`${child.href}/`));
                            const ChildIcon = child.icon;

                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                  isChildActive
                                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {ChildIcon ? (
                                    <ChildIcon
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isChildActive ? "text-white" : "text-slate-400"
                                      }`}
                                    />
                                  ) : (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isChildActive ? "bg-white" : "bg-slate-300"
                                      }`}
                                    />
                                  )}
                                  <span className="truncate">{child.name}</span>
                                </div>
                                {child.badge && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                      isChildActive ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Standard single item
                const isActive =
                  pathname === item.href ||
                  (item.href && item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href || "#"}
                    title={isCollapsed ? item.name : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center ${
                      isCollapsed ? "justify-center px-2" : "justify-between px-3"
                    } py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isActive ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Role Guard Indicator (When Expanded) */}
        {!isCollapsed && (
          <div className="px-3 pb-2 shrink-0">
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Active Session
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {user?.role || "Staff"}
              </span>
            </div>
          </div>
        )}

        {/* Docked User Profile Footer */}
        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} gap-2`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center shrink-0 text-xs shadow-xs">
                {user?.name?.slice(0, 2).toUpperCase() || "KB"}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={logout}
                title="Sign Out"
                className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Prominent Full-Width Logout Action for Mobile Drawer */}
          <div className="mt-2.5 lg:hidden">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 active:scale-98 text-red-600 font-semibold text-xs border border-red-200/70 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Workspace</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 print:w-full print:block print:p-0 transition-all duration-200 ${
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      }`}>
        {/* Mobile Native App Header */}
        <MobileAppHeader
          user={user}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onInstallClick={handleInstallApp}
          canInstall={canInstall}
          onLogout={logout}
        />

        {/* Desktop Top Navbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 items-center justify-between sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.href + idx}>
                      <BreadcrumbItem>
                        {crumb.isCurrent ? (
                          <BreadcrumbPage className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-none">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href} className="text-slate-500 hover:text-slate-800 font-medium text-xs transition">
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
              <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5">
                Kabhyan IT Operations & Management Suite
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/90 text-slate-500 hover:text-slate-700 text-xs transition cursor-pointer shadow-2xs"
            >
              <span className="font-medium text-[11px]">Quick search...</span>
              <kbd className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Live Session Status */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold cursor-default">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Gateway</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connected to Kabhyan Cloud Cluster (Session Active)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* In-App Notification Center via Shadcn Popover */}
            <NotificationBell />

            {/* Profile Menu via Shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="User Profile Menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                      {user?.name ? user.name.slice(0, 1).toUpperCase() : "K"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left text-xs leading-tight">
                    <p className="font-semibold text-slate-900 truncate max-w-[130px]">{user?.name}</p>
                    <p className="text-slate-400 text-[10px] truncate max-w-[130px]">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-1.5 shadow-xl">
                <DropdownMenuLabel className="p-2">
                  <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate font-normal">{user?.email}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                    {user?.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/projects" className="flex items-center gap-2 cursor-pointer">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      <span>Projects Portfolio</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/invoices" className="flex items-center gap-2 cursor-pointer">
                      <Receipt className="w-4 h-4 text-slate-500" />
                      <span>Invoices & Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/clients" className="flex items-center gap-2 cursor-pointer">
                      <Building className="w-4 h-4 text-slate-500" />
                      <span>Client Accounts</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>System Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Log Out of Workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8 print:p-0 print:max-w-full print:m-0 print:w-full print:block">
          {children}
        </main>
      </div>

      {/* Mobile App Fixed Bottom Tab Bar */}
      <MobileAppTabBar
        onOpenQuickAction={() => setQuickActionOpen(true)}
        onOpenMenuDrawer={() => setMobileMenuOpen(true)}
      />

      {/* Mobile Slide-Up Quick Action Bottom Sheet */}
      <QuickActionBottomSheet
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <GlobalCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
