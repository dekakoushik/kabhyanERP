"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
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
  Sparkles,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

interface NavGroup {
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
  const pathname = usePathname();

  // Load saved collapse state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
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

  const navigationGroups: NavGroup[] = [
    {
      title: "Core Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Finance & Sales",
      items: [
        { name: "Estimates", href: "/dashboard/estimates", icon: FileText, roles: ["superadmin", "admin", "manager", "hr"] },
        { name: "Proforma Invoices", href: "/dashboard/proforma", icon: Receipt, roles: ["superadmin", "admin", "manager"] },
        { name: "Tax Invoices", href: "/dashboard/invoices", icon: FileCheck, roles: ["superadmin", "admin", "manager"] },
        { name: "Income & Expense", href: "/dashboard/accounts", icon: TrendingUp, roles: ["superadmin", "admin"] },
        { name: "Expense Register", href: "/dashboard/expenses", icon: CreditCard, roles: ["superadmin", "admin", "manager", "hr"] },
      ],
    },
    {
      title: "Operations & Delivery",
      items: [
        { name: "Client Directory", href: "/dashboard/clients", icon: Building, roles: ["superadmin", "admin", "manager"] },
        { name: "Projects Portfolio", href: "/dashboard/projects", icon: Briefcase },
        { name: "Support Tickets", href: "/dashboard/tickets", icon: LifeBuoy },
      ],
    },
    {
      title: "Administration",
      items: [
        { name: "Team & Staff", href: "/dashboard/users", icon: Users, roles: ["superadmin", "admin"] },
        { name: "System Settings", href: "/dashboard/settings", icon: Settings, roles: ["superadmin", "admin"] },
      ],
    },
  ];

  // Filter groups according to current user's role
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!user?.role) return true;
        return item.roles.includes(user.role);
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
      if (section === "proforma") sectionLabel = "Proforma Invoices";
      if (section === "invoices") sectionLabel = "Tax Invoices";
      if (section === "accounts") sectionLabel = "Ledger & Income";
      if (section === "expenses") sectionLabel = "Expenses";
      if (section === "clients") sectionLabel = "Clients";
      if (section === "projects") sectionLabel = "Projects";
      if (section === "tasks") sectionLabel = "Tasks";
      if (section === "tickets") sectionLabel = "Support Tickets";
      if (section === "users") sectionLabel = "Team & Staff";
      if (section === "settings") sectionLabel = "Settings";

      const sectionHref = `/dashboard/${section}`;
      const isCurrent = segments.length === 2;
      crumbs.push({ label: sectionLabel, href: sectionHref, isCurrent });

      // Sub-segment (e.g. /clients/create or /settings/company or /invoices/[id])
      if (segments.length >= 3) {
        const sub = segments[2];
        let subLabel = sub.charAt(0).toUpperCase() + sub.slice(1);
        if (sub === "create") subLabel = "New Record";
        if (sub === "company") subLabel = "Company & Brand";
        if (sub === "gst") subLabel = "GST Compliance";
        if (sub === "banking") subLabel = "Banking Details";
        if (sub === "localization") subLabel = "Localization";
        if (sub === "security") subLabel = "Security & Access";
        if (sub === "email") subLabel = "Email Infrastructure";
        if (sub === "system") subLabel = "System Health";

        crumbs.push({ label: subLabel, href: pathname, isCurrent: true });
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Modern Sidebar (Desktop Fixed & Mobile Offcanvas) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 transform transition-all duration-200 ease-in-out lg:translate-x-0 h-screen flex flex-col print:hidden ${
          mobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
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
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
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
                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 print:w-full print:block print:p-0 transition-all duration-200 ${
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      }`}>
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 print:hidden">
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
                          <BreadcrumbPage className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-none">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href} className="text-slate-500 hover:text-slate-800 font-semibold text-xs transition">
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
                    <p className="font-bold text-slate-900 truncate max-w-[130px]">{user?.name}</p>
                    <p className="text-slate-400 text-[10px] truncate max-w-[130px]">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-1.5 shadow-xl">
                <DropdownMenuLabel className="p-2">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate font-normal">{user?.email}</p>
                  <span className="mt-1.5 inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-full print:m-0 print:w-full print:block">
          {children}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <GlobalCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
