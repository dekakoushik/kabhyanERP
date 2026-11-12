"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, SystemNotificationItem, NotificationResponse } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [filter, setFilter] = useState<"all" | "unread">("all");

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
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-4 h-4" />
          </div>
        );
      case "reply":
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case "client":
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
        );
      case "user":
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        );
      case "auth":
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  const displayedNotifications = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Notification Centre"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-xs animate-in zoom-in-50 duration-150">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xl bg-white"
      >
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
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center px-4 pt-2 border-b border-slate-100 gap-2 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`pb-2 px-1 font-semibold border-b-2 transition ${
              filter === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`pb-2 px-1 font-semibold border-b-2 transition ${
              filter === "unread"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List Area */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                You will receive updates when clients, tickets, or projects are updated.
              </p>
            </div>
          ) : (
            displayedNotifications.map((item) => (
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
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Kabhyan Live Notification Gateway
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
