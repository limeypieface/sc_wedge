/**
 * Formatting Utilities
 *
 * Common formatting functions for display values.
 */

/**
 * Format a number as currency
 *
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, "EUR") // "€1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a decimal as percentage
 *
 * @param decimal - The decimal value (0.05 = 5%)
 * @param showSign - Whether to show +/- sign
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.05) // "5.0%"
 * formatPercent(0.05, true) // "+5.0%"
 * formatPercent(-0.03, true) // "-3.0%"
 */
export function formatPercent(
  decimal: number,
  showSign: boolean = false
): string {
  const percent = decimal * 100;
  const sign = showSign && percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Format a date for display
 *
 * @param date - Date string or Date object
 * @param format - Format style
 * @returns Formatted date string
 *
 * @example
 * formatDate("2026-01-15") // "Jan 15, 2026"
 * formatDate("2026-01-15", "short") // "1/15/26"
 */
export function formatDate(
  date: string | Date,
  format: "full" | "short" | "medium" = "medium"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    full: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    medium: { year: "numeric", month: "short", day: "numeric" },
    short: { year: "2-digit", month: "numeric", day: "numeric" },
  }[format];

  return dateObj.toLocaleDateString("en-US", options);
}

/**
 * Format a number with thousand separators
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567.89) // "1,234,567.89"
 * formatNumber(1234567.89, 0) // "1,234,568"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
