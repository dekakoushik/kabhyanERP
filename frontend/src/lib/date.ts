/**
 * Centralized Human-Friendly Date & Time Formatting Suite for Kabhyan ERP
 * Zero-dependency, lightweight, and hydration-safe.
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Parses any date input safely into a valid Date object or null
 */
export function parseDate(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

let cachedDateFormat: string | null = null;

/**
 * Get active system date format from memory or localStorage.
 */
export function getActiveDateFormat(): string {
  if (cachedDateFormat) return cachedDateFormat;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("kabhyan_date_format");
      if (stored) {
        cachedDateFormat = stored;
        return stored;
      }
    } catch {}
  }
  return "DD MMM YYYY";
}

/**
 * Update the active system date format across the application.
 */
export function setActiveDateFormat(fmt: string): void {
  if (!fmt) return;
  cachedDateFormat = fmt;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("kabhyan_date_format", fmt);
    } catch {}
  }
}

/**
 * Standard human-readable calendar date formatted as per system settings.
 * Supports: "DD MMM YYYY" (default), "DD/MM/YYYY", "YYYY-MM-DD"
 */
export function formatDate(
  dateInput: string | number | Date | null | undefined,
  formatOverride?: string
): string {
  const d = parseDate(dateInput);
  if (!d) return "—";

  const format = formatOverride || getActiveDateFormat();
  const day = String(d.getDate()).padStart(2, "0");
  const monthNum = String(d.getMonth() + 1).padStart(2, "0");
  const monthShort = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${monthNum}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${monthNum}-${day}`;
    case "DD MMM YYYY":
    default:
      return `${day} ${monthShort} ${year}`;
  }
}

/**
 * Full calendar date: e.g. "12 November 2026"
 */
export function formatLongDate(dateInput: string | number | Date | null | undefined): string {
  const d = parseDate(dateInput);
  if (!d) return "—";

  const day = d.getDate();
  const month = MONTHS_LONG[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Calendar date with 12-hour time: e.g. "12 Nov 2026, 03:45 PM"
 */
export function formatDateTime(dateInput: string | number | Date | null | undefined): string {
  const d = parseDate(dateInput);
  if (!d) return "—";

  const datePart = formatDate(d);

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${datePart}, ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

/**
 * Relative time for historical events (e.g. "just now", "25m ago", "3h ago", "Yesterday", "4d ago")
 */
export function formatRelativeTime(dateInput: string | number | Date | null | undefined): string {
  const d = parseDate(dateInput);
  if (!d) return "—";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return formatDate(d);
}

export interface DueDateStatus {
  label: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  badgeClass: string;
}

/**
 * Smart due-date status evaluation for tasks, invoices, and milestones.
 */
export function getDueDateStatus(
  dueDateInput: string | number | Date | null | undefined,
  prefix: string = "Due"
): DueDateStatus {
  const d = parseDate(dueDateInput);
  if (!d) {
    return {
      label: "No deadline",
      isOverdue: false,
      isDueSoon: false,
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    };
  }

  const now = new Date();
  // Normalize both to start of day for clean day differences
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDue = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffInDays = Math.round((startOfDue - startOfToday) / 86400000);

  if (diffInDays < 0) {
    const overdueDays = Math.abs(diffInDays);
    return {
      label: overdueDays === 1 ? "Overdue by 1 day" : `Overdue by ${overdueDays} days`,
      isOverdue: true,
      isDueSoon: false,
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    };
  }

  if (diffInDays === 0) {
    return {
      label: "Due today",
      isOverdue: false,
      isDueSoon: true,
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
    };
  }

  if (diffInDays === 1) {
    return {
      label: "Due tomorrow",
      isOverdue: false,
      isDueSoon: true,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
    };
  }

  if (diffInDays <= 5) {
    return {
      label: `Due in ${diffInDays} days`,
      isOverdue: false,
      isDueSoon: true,
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200 font-medium",
    };
  }

  return {
    label: `${prefix}: ${formatDate(d)}`,
    isOverdue: false,
    isDueSoon: false,
    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
  };
}

