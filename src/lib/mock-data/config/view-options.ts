/**
 * View Options Configurations
 *
 * Display mode configurations for various views
 */

/**
 * PO view options for the detail page
 */
export const PO_VIEW_OPTIONS = [
  { value: "all", label: "All Lines" },
  { value: "open", label: "Open Only" },
  { value: "issues", label: "With Issues" },
  { value: "needs", label: "With Needs" },
] as const

/**
 * SO view options for the detail page
 */
export const SO_VIEW_OPTIONS = [
  { value: "all", label: "All Lines" },
  { value: "open", label: "Open Only" },
  { value: "issues", label: "With Issues" },
  { value: "backorder", label: "Backordered" },
] as const

/**
 * Line display mode options
 */
export const LINE_DISPLAY_OPTIONS = [
  { value: "details", label: "Details" },
  { value: "quantity", label: "Quantity" },
  { value: "financial", label: "Financial" },
  { value: "compliance", label: "Compliance" },
] as const

export type LineDisplayMode = (typeof LINE_DISPLAY_OPTIONS)[number]["value"]

/**
 * Dashboard view options for buyer dashboard
 */
export const DASHBOARD_VIEW_OPTIONS = [
  { value: "list", label: "List View" },
  { value: "kanban", label: "Kanban" },
  { value: "calendar", label: "Calendar" },
] as const

export type DashboardViewMode = (typeof DASHBOARD_VIEW_OPTIONS)[number]["value"]
