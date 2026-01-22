/**
 * Status Options and Color Configurations
 *
 * Centralized status display configurations for lists and dashboards
 */

/**
 * Line statuses for PO/SO detail views
 */
export const LINE_STATUSES = [
  "Open",
  "Partial",
  "Received",
  "Closed",
  "Cancelled",
  "On Hold",
  "Quality Hold",
  "Backordered",
] as const

export type LineStatus = (typeof LINE_STATUSES)[number]

/**
 * Status color mappings for consistent styling
 */
export const STATUS_COLORS: Record<string, string> = {
  // PO statuses
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  sent: "bg-blue-100 text-blue-700",
  acknowledged: "bg-emerald-100 text-emerald-700",

  // Line statuses
  open: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
  "on hold": "bg-orange-100 text-orange-700",
  "quality hold": "bg-purple-100 text-purple-700",
  backordered: "bg-rose-100 text-rose-700",

  // Generic fallback
  default: "bg-gray-100 text-gray-700",
}

/**
 * Get color class for a status
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase()
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.default
}

/**
 * PO status filter options for lists
 */
export const PO_STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "sent", label: "Sent to Vendor" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "partially_received", label: "Partially Received" },
  { value: "received", label: "Received" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
] as const

/**
 * SO status filter options for lists
 */
export const SO_STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "sent", label: "Sent to Customer" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_production", label: "In Production" },
  { value: "partially_shipped", label: "Partially Shipped" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
] as const

/**
 * Issue priority options
 */
export const PRIORITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "low", label: "Low", color: "bg-green-500" },
] as const

export type Priority = (typeof PRIORITY_OPTIONS)[number]["value"]
