"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        { name: "Tasks & Kanban", href: "/dashboard/tasks", icon: CheckSquare },
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
            <Image
              src="/logo.png"
              alt="Kabhyan Technologies"
              width={130}
              height={36}
              className={`h-7 w-auto object-contain transition-all ${isCollapsed ? "hidden" : "block"}`}
              priority
            />
            {isCollapsed && (
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                K
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {pathname === "/dashboard"
                  ? "Corporate Overview"
                  : pathname.startsWith("/dashboard/estimates")
                  ? "Client Estimates & Quotes"
                  : pathname.startsWith("/dashboard/proforma")
                  ? "Proforma Invoices"
                  : pathname.startsWith("/dashboard/invoices")
                  ? "Tax Invoices & GST"
                  : pathname.startsWith("/dashboard/accounts")
                  ? "Financial Ledger & Cashflow"
                  : pathname.startsWith("/dashboard/expenses")
                  ? "Expense Tracking"
                  : pathname.startsWith("/dashboard/clients")
                  ? "Client Directory"
                  : pathname.startsWith("/dashboard/tickets")
                  ? "Helpdesk & Support Tickets"
                  : pathname.startsWith("/dashboard/projects")
                  ? "Project Portfolio"
                  : pathname.startsWith("/dashboard/tasks")
                  ? "Task Management & Kanban"
                  : pathname.startsWith("/dashboard/users")
                  ? "Team & User Management"
                  : pathname.startsWith("/dashboard/settings")
                  ? "System Settings"
                  : "Workspace"}
              </h1>
              <p className="hidden sm:block text-xs text-slate-500">
                Kabhyan IT Operations & Management Suite
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">Live Session</span>
            </div>

            {/* In-App Notification Center */}
            <NotificationBell />

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs">
                  {user?.name?.slice(0, 1).toUpperCase() || "K"}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <p className="font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-slate-500 text-[11px]">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-slate-200/80 py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {user?.role}
                    </span>
                  </div>
                  <Link
                    href="/dashboard/estimates"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Estimates</span>
                  </Link>
                  <Link
                    href="/dashboard/proforma"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span>Proforma Invoices</span>
                  </Link>
                  <Link
                    href="/dashboard/projects"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>Projects</span>
                  </Link>
                  <Link
                    href="/dashboard/tasks"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <CheckSquare className="w-4 h-4 text-slate-400" />
                    <span>Tasks</span>
                  </Link>
                  <Link
                    href="/dashboard/users"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Manage Staff</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-full print:m-0 print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
