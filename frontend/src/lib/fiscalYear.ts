/**
 * Centralized Indian Fiscal Year (April 1 to March 31) Utility
 * Autonomously resolves current, upcoming, and past fiscal cycles without manual updates.
 */

export interface FiscalYearOption {
  value: string; // e.g. "2026-2027"
  label: string; // e.g. "FY 2026–27 (Current)"
  isCurrent: boolean;
  isUpcoming: boolean;
}

/**
 * Get the current Indian Fiscal Year string (e.g. "2026-2027").
 * If current month is April (month index 3) or later, FY begins in the current calendar year.
 * If current month is Jan-Mar (month index 0-2), FY began in the previous calendar year.
 */
export function getCurrentFiscalYear(): string {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 = Jan, 3 = Apr, 11 = Dec
  const currentYear = now.getFullYear();

  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  return `${startYear}-${startYear + 1}`;
}

/**
 * Generate a dynamic rolling list of fiscal years relative to the current fiscal year.
 * Defaults to 1 upcoming year, current year, and past 4 years.
 */
export function getFiscalYearOptions(
  pastYearsCount: number = 3,
  futureYearsCount: number = 1
): FiscalYearOption[] {
  const currentFy = getCurrentFiscalYear();
  const [currentStartStr] = currentFy.split("-");
  const currentStart = parseInt(currentStartStr, 10);

  const options: FiscalYearOption[] = [];

  // Future / upcoming fiscal cycles
  for (let i = futureYearsCount; i > 0; i--) {
    const start = currentStart + i;
    const end = start + 1;
    const val = `${start}-${end}`;
    const shortEnd = String(end).slice(-2);
    options.push({
      value: val,
      label: `FY ${start}–${shortEnd} (Upcoming)`,
      isCurrent: false,
      isUpcoming: true,
    });
  }

  // Current active fiscal year
  const currentEnd = currentStart + 1;
  const currentShortEnd = String(currentEnd).slice(-2);
  options.push({
    value: currentFy,
    label: `FY ${currentStart}–${currentShortEnd} (Current)`,
    isCurrent: true,
    isUpcoming: false,
  });

  // Historical fiscal years
  for (let i = 1; i <= pastYearsCount; i++) {
    const start = currentStart - i;
    const end = start + 1;
    const val = `${start}-${end}`;
    const shortEnd = String(end).slice(-2);
    options.push({
      value: val,
      label: `FY ${start}–${shortEnd}`,
      isCurrent: false,
      isUpcoming: false,
    });
  }

  return options;
}

/**
 * Format a raw FY string (e.g. "2026-2027") into a clean display label (e.g. "FY 2026–27").
 */
export function formatFiscalYearLabel(fy: string): string {
  if (!fy || !fy.includes("-")) return fy || "Current FY";
  const [start, end] = fy.split("-");
  const shortEnd = end ? end.slice(-2) : "";
  return `FY ${start}–${shortEnd}`;
}
