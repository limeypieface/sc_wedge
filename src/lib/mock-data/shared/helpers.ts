/**
 * Shared Helper Functions
 *
 * Common computation and utility functions used across domains
 */

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

/**
 * Format a date string to a display format
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Calculate variance percentage
 */
export function calculateVariancePercent(actual: number, expected: number): number {
  if (expected === 0) return 0
  return ((actual - expected) / expected) * 100
}

/**
 * Tolerance status based on variance
 */
export type ToleranceStatus = "within" | "warning" | "exceeded"

/**
 * Get tolerance status based on variance percentage
 */
export function getToleranceStatus(variancePercent: number): ToleranceStatus {
  const absVariance = Math.abs(variancePercent)
  if (absVariance > 10) return "exceeded"
  if (absVariance > 5) return "warning"
  return "within"
}

/**
 * Generate a unique ID with prefix
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Parse order number to extract type and suffix
 * e.g., "PO-2026-00142" -> { type: "PO", year: "2026", suffix: "00142" }
 */
export function parseOrderNumber(orderNumber: string): { type: "PO" | "SO"; year: string; suffix: string } {
  const parts = orderNumber.split("-")
  const type = parts[0] === "SO" ? "SO" : "PO"
  const year = parts[1] || new Date().getFullYear().toString()
  const suffix = parts[parts.length - 1] || "00000"
  return { type, year, suffix }
}

/**
 * Generate an issue number based on order
 */
export function generateIssueNumber(orderNumber: string, sequence: number): string {
  const { type, suffix } = parseOrderNumber(orderNumber)
  return `ISS-${type}-${suffix}-${sequence.toString().padStart(3, "0")}`
}
