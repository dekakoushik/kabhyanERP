"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, SystemNotificationItem, NotificationResponse } from "@/lib/api";
import {
  Bell,
  CheckCheck,
  LifeBuoy,
  MessageSquare,
  Building,
  Users,
  ShieldCheck,
  Info,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res: NotificationResponse = await api.request("/notifications?per_page=20");
      setUnreadCount(res.unread_count || 0);
      setNotifications(res.notifications?.data || []);
    } catch {
      // Graceful fallback if offline
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Periodic poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleMarkAsRead = async (item: SystemNotificationItem) => {
    if (!item.is_read) {
      try {
        await api.request(`/notifications/${item.id}/read`, { method: "PATCH" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently continue navigation
      }
    }

    if (item.action_url) {
      setOpen(false);
      router.push(item.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.request("/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Failed silently
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ticket":
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-4 h-4" />
          </div>
        );
      case "reply":
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case "client":
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
        );
      case "user":
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        );
      case "auth":
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications(true);
        }}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Notification Centre"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 sm:right-auto sm:left-auto mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">All read</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You will receive updates when clients, tickets, or users are updated.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    !item.is_read
                      ? "bg-blue-50/40 hover:bg-blue-50/70"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {getNotificationIcon(item.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          !item.is_read
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {item.action_url && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                        <span>View details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Kabhyan Live Notification Service
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
