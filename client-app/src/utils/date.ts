const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Format any date string safely into "18 Nov 2026"
 */
export function formatDate(dateInput?: string | null): string {
  if (!dateInput) return "N/A";
  try {
    // Handle YYYY-MM-DD or ISO strings without timezone shift issues
    const parts = dateInput.split(/[-T ]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month < 12) {
        return `${day.toString().padStart(2, "0")} ${MONTHS_SHORT[month]} ${year}`;
      }
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    return `${d.getDate().toString().padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateInput;
  }
}

/**
 * Format currency numbers with Indian commas (e.g. ₹25,000.00)
 */
export function formatCurrency(amount?: number | string | null, currency: string = "INR"): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return "₹0.00";
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "INR" ? `₹${formatted}` : `${currency} ${formatted}`;
}
