"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, Search, Sparkles, LogOut, LayoutDashboard, Settings } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/lib/api";

interface MobileAppHeaderProps {
  user: User | null;
  pageTitle?: string;
  onOpenCommandPalette?: () => void;
  onOpenNotifications?: () => void;
  onInstallClick?: () => void;
  canInstall?: boolean;
  onLogout?: () => void;
}

export default function MobileAppHeader({
  user,
  pageTitle,
  onOpenCommandPalette,
  onInstallClick,
  canInstall,
  onLogout,
}: MobileAppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine if this is a subpage that should show a Back button
  const isRootPage = pathname === "/dashboard" || pathname === "/portal";

  // Compute a clean title if not provided
  const getComputedTitle = () => {
    if (pageTitle) return pageTitle;
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/portal") return "Client Portal";
    
    const parts = pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1] || "";
    
    if (lastPart === "create") return `Add ${parts[parts.length - 2]?.replace(/s$/, "") || "Item"}`;
    if (lastPart === "edit") return `Edit ${parts[parts.length - 3]?.replace(/s$/, "") || "Item"}`;
    if (lastPart === "attendance") return "Attendance";
    if (lastPart === "salary-structures") return "Salary Structures";
    if (lastPart === "invoices") return "Tax Invoices";
    if (lastPart === "expenses") return "Expenses";
    if (lastPart === "tickets") return "Support Tickets";
    if (lastPart === "projects") return "Projects";
    if (lastPart === "estimates") return "Estimates";
    if (lastPart === "proforma") return "Proforma Invoices";
    if (lastPart === "leaves") return "Leave Requests";
    
    // Capitalize slug
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, " ");
  };

  const title = getComputedTitle();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 h-14 flex items-center justify-between select-none print:hidden pt-[env(safe-area-inset-top,0px)]">
      {/* Left: Back button or Brand */}
      <div className="flex items-center min-w-0">
        {!isRootPage ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 py-1.5 pr-2.5 rounded-lg text-blue-600 hover:text-blue-700 active:scale-95 transition-all font-semibold text-xs cursor-pointer -ml-1"
            aria-label="Go Back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              K
            </div>
            <span className="text-xs font-bold text-slate-900 tracking-tight">Kabhyan</span>
          </div>
        )}
      </div>

      {/* Center: Title */}
      <div className="absolute left-1/2 -translate-x-1/2 max-w-[45%] text-center pointer-events-none">
        <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right: Actions & User Account */}
      <div className="flex items-center gap-1.5 shrink-0">
        {canInstall && onInstallClick && (
          <button
            type="button"
            onClick={onInstallClick}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>App</span>
          </button>
        )}

        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        <NotificationBell />

        {/* User Account / Logout Menu Trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer focus:outline-none ring-2 ring-transparent focus:ring-blue-300 shrink-0 ml-0.5"
              aria-label="User Account Menu"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "KB"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl border-slate-200/90 rounded-2xl">
            <div className="px-3 py-2.5 bg-slate-50/90 rounded-xl mb-1 border border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "User"}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                  {user?.role || "Staff"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={pathname.startsWith("/portal") ? "/portal" : "/dashboard"}
                  className="flex items-center gap-2 cursor-pointer py-2 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>{pathname.startsWith("/portal") ? "Client Portal" : "Dashboard Overview"}</span>
                </Link>
              </DropdownMenuItem>

              {!pathname.startsWith("/portal") && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 cursor-pointer py-2 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>System Settings</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1" />

            {onLogout && (
              <DropdownMenuItem
                onClick={onLogout}
                className="flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer py-2 text-xs font-semibold rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>{pathname.startsWith("/portal") ? "Log Out of Portal" : "Log Out of Workspace"}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
