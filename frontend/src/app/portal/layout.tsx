"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppTabBar from "@/components/mobile/MobileAppTabBar";
import QuickActionBottomSheet from "@/components/mobile/QuickActionBottomSheet";
import {
  Building2,
  FileText,
  Receipt,
  Briefcase,
  LifeBuoy,
  LogOut,
  LayoutDashboard,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  User,
} from "lucide-react";

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { brand } = useBrand();
  const pathname = usePathname();
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

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

  const navItems = [
    { name: "Overview", href: "/portal", icon: LayoutDashboard },
    { name: "Invoices", href: "/portal/invoices", icon: FileText },
    { name: "Quotations", href: "/portal/estimates", icon: Receipt },
    { name: "Projects", href: "/portal/projects", icon: Briefcase },
    { name: "Support Tickets", href: "/portal/tickets", icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile App Header */}
      <MobileAppHeader
        user={user}
        onInstallClick={handleInstallApp}
        canInstall={canInstall}
        onLogout={logout}
      />

      {/* Desktop Top Client Navigation Bar */}
      <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                K
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm tracking-tight block">
                  {brand?.companyName || "Kabhyan Technologies"}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
                  Client Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action / Profile Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900">{user?.name || "Client Partner"}</span>
              <span className="text-[10px] text-slate-400">{user?.email}</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileAppTabBar
        isPortal={true}
        onOpenQuickAction={() => setQuickActionOpen(true)}
        onOpenMenuDrawer={() => {}}
      />

      {/* Quick Action Bottom Sheet */}
      <QuickActionBottomSheet
        isPortal={true}
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Corporate Gateway &bull; Kabhyan Technologies</span>
          </div>
          <div>
            <span>Need immediate technical assistance? Contact </span>
            <a href="mailto:support@kabhyan.com" className="font-semibold text-blue-600 hover:underline">
              support@kabhyan.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
