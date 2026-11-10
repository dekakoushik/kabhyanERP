"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Layers,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Activity,
  UserCheck,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Estimates", href: "/dashboard/estimates", icon: FileText },
    { name: "Proforma Invoices", href: "/dashboard/proforma", icon: Receipt },
    { name: "Tax Invoices", href: "/dashboard/invoices", icon: FileCheck },
    { name: "Income vs Expense", href: "/dashboard/accounts", icon: TrendingUp },
    { name: "Expense Tracking", href: "/dashboard/expenses", icon: CreditCard },
    { name: "Clients", href: "/dashboard/clients", icon: Building },
    { name: "Support Tickets", href: "/dashboard/tickets", icon: LifeBuoy },
    { name: "Projects", href: "/dashboard/projects", icon: Briefcase },
    { name: "Tasks & Kanban", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "User Management", href: "/dashboard/users", icon: Users },
    { name: "System Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop and Mobile Offcanvas) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Kabhyan Technologies"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              ERP
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Preview Card */}
        <div className="p-4 mx-4 mt-4 bg-slate-50 border border-slate-200/60 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center shrink-0 border border-blue-200 text-sm">
              {user?.name?.slice(0, 2).toUpperCase() || "KB"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Workspace Modules
          </div>

          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System Status Indicators */}
        <div className="p-4 m-4 rounded-xl border border-slate-100 bg-slate-50/60 text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Redis Cache
            </span>
            <span className="text-emerald-700 font-semibold">Active (6379)</span>
          </div>
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Role Guard
            </span>
            <span className="text-blue-700 font-semibold uppercase">{user?.role}</span>
          </div>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
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
                  : pathname.startsWith("/dashboard/projects")
                  ? "Project Portfolio"
                  : pathname.startsWith("/dashboard/tasks")
                  ? "Task Management & Kanban"
                  : pathname.startsWith("/dashboard/users")
                  ? "User Management"
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
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
