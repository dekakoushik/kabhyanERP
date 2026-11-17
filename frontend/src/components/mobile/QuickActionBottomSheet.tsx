"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  X,
  UserCheck,
  CalendarDays,
  CreditCard,
  FileCheck,
  CheckSquare,
  Receipt,
  LifeBuoy,
  FileText,
  Sparkles,
} from "lucide-react";

interface QuickActionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isPortal?: boolean;
}

export default function QuickActionBottomSheet({
  isOpen,
  onClose,
  isPortal = false,
}: QuickActionBottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const staffActions = [
    {
      title: "Punch Attendance",
      description: "Log today's check-in / check-out",
      href: "/dashboard/hrms/attendance",
      icon: UserCheck,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      title: "Apply for Leave",
      description: "Submit vacation, sick, or personal time off",
      href: "/dashboard/hrms/leaves/apply",
      icon: CalendarDays,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      title: "Add Expense",
      description: "Log corporate bill or vendor reimbursement",
      href: "/dashboard/expenses/create",
      icon: CreditCard,
      color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      title: "Create Tax Invoice",
      description: "Issue GST invoice with deliverables",
      href: "/dashboard/invoices/create",
      icon: FileCheck,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
      title: "New Deliverable / Task",
      description: "Assign sprint ticket to project team",
      href: "/dashboard/tasks",
      icon: CheckSquare,
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
  ];

  const clientActions = [
    {
      title: "Pay Invoices",
      description: "Quick online UPI / Card checkout with Cashfree",
      href: "/portal/invoices",
      icon: Receipt,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      title: "New Support Ticket",
      description: "Report an issue or request assistance",
      href: "/portal/tickets/create",
      icon: LifeBuoy,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      title: "Review Estimates",
      description: "Approve project quotation & scope",
      href: "/portal/estimates",
      icon: FileText,
      color: "bg-amber-50 text-amber-600 border-amber-200",
    },
  ];

  const actions = isPortal ? clientActions : staffActions;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Sheet Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 pb-[env(safe-area-inset-bottom,24px)] z-10 animate-in slide-in-from-bottom duration-250">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
              <p className="text-[11px] text-slate-500">Tap to perform an action instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="divide-y divide-slate-100 mt-2 max-h-[60vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.title}
                href={act.href}
                onClick={onClose}
                className="flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${act.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 tracking-tight">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {act.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
