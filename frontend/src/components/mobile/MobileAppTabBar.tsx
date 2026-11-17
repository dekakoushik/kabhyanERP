"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  UserCheck,
  Menu,
  Plus,
  Receipt,
  Briefcase,
  LifeBuoy,
} from "lucide-react";

interface MobileAppTabBarProps {
  isPortal?: boolean;
  onOpenQuickAction: () => void;
  onOpenMenuDrawer: () => void;
}

interface TabItem {
  name: string;
  href?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}

export default function MobileAppTabBar({
  isPortal = false,
  onOpenQuickAction,
  onOpenMenuDrawer,
}: MobileAppTabBarProps) {
  const pathname = usePathname();

  // Internal ERP Tabs
  const staffTabs: TabItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      name: "Tasks",
      href: "/dashboard/tasks",
      icon: CheckSquare,
      isActive: pathname.startsWith("/dashboard/tasks") || pathname.startsWith("/dashboard/projects"),
    },
    // Center FAB is handled separately
    {
      name: "Attendance",
      href: "/dashboard/hrms/attendance",
      icon: UserCheck,
      isActive: pathname.startsWith("/dashboard/hrms"),
    },
    {
      name: "More",
      action: onOpenMenuDrawer,
      icon: Menu,
      isActive: false,
    },
  ];

  // Client Portal Tabs
  const clientTabs: TabItem[] = [
    {
      name: "Home",
      href: "/portal",
      icon: LayoutDashboard,
      isActive: pathname === "/portal",
    },
    {
      name: "Invoices",
      href: "/portal/invoices",
      icon: Receipt,
      isActive: pathname.startsWith("/portal/invoices"),
    },
    // Center FAB
    {
      name: "Projects",
      href: "/portal/projects",
      icon: Briefcase,
      isActive: pathname.startsWith("/portal/projects"),
    },
    {
      name: "Tickets",
      href: "/portal/tickets",
      icon: LifeBuoy,
      isActive: pathname.startsWith("/portal/tickets"),
    },
  ];

  const tabs = isPortal ? clientTabs : staffTabs;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] print:hidden select-none pb-[env(safe-area-inset-bottom,8px)]"
      aria-label="Mobile Navigation Bar"
    >
      <div className="grid grid-cols-5 items-center h-14 px-2 max-w-md mx-auto relative">
        {/* Tab 1 */}
        {renderTabItem(tabs[0])}

        {/* Tab 2 */}
        {renderTabItem(tabs[1])}

        {/* Tab 3: Central Elevated Quick Action FAB */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenQuickAction}
            aria-label="Quick Actions"
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/35 border-2 border-white active:scale-90 transition-transform cursor-pointer focus:outline-none"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-semibold text-blue-600 mt-1 tracking-tight">
            Action
          </span>
        </div>

        {/* Tab 4 */}
        {renderTabItem(tabs[2])}

        {/* Tab 5 */}
        {tabs[3].action ? (
          <button
            type="button"
            onClick={tabs[3].action}
            className="flex flex-col items-center justify-center h-full w-full py-1 text-slate-500 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
          >
            <div className="relative">
              <Menu className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-0.5 text-slate-500">
              {tabs[3].name}
            </span>
          </button>
        ) : (
          renderTabItem(tabs[3])
        )}
      </div>
    </nav>
  );

  function renderTabItem(item: {
    name: string;
    href?: string;
    action?: () => void;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
  }) {
    const Icon = item.icon;

    if (item.action) {
      return (
        <button
          key={item.name}
          type="button"
          onClick={item.action}
          className="flex flex-col items-center justify-center h-full w-full py-1 text-slate-500 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            {item.name}
          </span>
        </button>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href || "#"}
        className={`flex flex-col items-center justify-center h-full w-full py-1 transition-all active:scale-95 ${
          item.isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <div className="relative">
          <Icon
            className={`w-5 h-5 transition-transform ${
              item.isActive ? "scale-110 text-blue-600 stroke-[2.25]" : "text-slate-500"
            }`}
          />
          {item.isActive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
          )}
        </div>
        <span
          className={`text-[10px] tracking-tight mt-0.5 ${
            item.isActive ? "font-bold text-blue-600" : "font-medium text-slate-500"
          }`}
        >
          {item.name}
        </span>
      </Link>
    );
  }
}
