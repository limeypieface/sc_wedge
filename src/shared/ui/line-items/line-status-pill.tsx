"use client"

/**
 * LineStatusPill - Unified line item status display component
 *
 * Works for both Purchase Order and Sales Order line items via the variant prop.
 * Uses the universal status icon system for consistent visual language.
 *
 * @example
 * // For PO line items
 * <LineStatusPill status="received" variant="po" />
 *
 * // For SO line items
 * <LineStatusPill status="shipped" variant="so" />
 */

import { LineItemStatus, LineItemStatusMeta } from "@/types/line-item-status"
import { SOLineItemStatus, SOLineItemStatusMeta, mapPOStatusToSOStatus } from "@/types/so-line-item-status"

// =============================================================================
// TYPES
// =============================================================================

export type LineStatusVariant = "po" | "so"

export interface LineStatusPillProps {
  /** Status string value */
  status: string
  /** Variant determines which status metadata to use */
  variant?: LineStatusVariant
  /** Size of the icon */
  size?: "sm" | "md"
}

export interface LineStatusDisplayProps extends LineStatusPillProps {
  /** Whether to show the label */
  showLabel?: boolean
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Icon-only line status indicator.
 */
export function LineStatusPill({
  status,
  variant = "po",
  size = "md",
}: LineStatusPillProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5"

  if (variant === "so") {
    const soStatus = mapPOStatusToSOStatus(status)
    const meta = SOLineItemStatusMeta.meta[soStatus] || SOLineItemStatusMeta.meta[SOLineItemStatus.Open]

    return (
      <div className="flex items-center gap-2">
        <span className={sizeClass}>
          {meta?.icon}
        </span>
      </div>
    )
  }

  // PO variant
  const normalizedStatus = status.toLowerCase() as LineItemStatus
  const meta = LineItemStatusMeta.meta[normalizedStatus] || LineItemStatusMeta.meta[LineItemStatus.Open]

  return (
    <div className="flex items-center gap-2">
      <span className={sizeClass}>
        {meta?.icon}
      </span>
    </div>
  )
}

/**
 * Line status indicator with label.
 */
export function LineStatusDisplay({
  status,
  variant = "po",
  showLabel = true,
}: LineStatusDisplayProps) {
  if (variant === "so") {
    const soStatus = mapPOStatusToSOStatus(status)
    const meta = SOLineItemStatusMeta.meta[soStatus] || SOLineItemStatusMeta.meta[SOLineItemStatus.Open]

    return (
      <div className="flex items-center gap-2 text-sm text-foreground">
        <span className="h-4 w-4">
          {meta?.icon}
        </span>
        {showLabel && <span>{meta?.label || status}</span>}
      </div>
    )
  }

  // PO variant
  const normalizedStatus = status.toLowerCase() as LineItemStatus
  const meta = LineItemStatusMeta.meta[normalizedStatus] || LineItemStatusMeta.meta[LineItemStatus.Open]

  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <span className="h-4 w-4">
        {meta?.icon}
      </span>
      {showLabel && <span>{meta?.label || status}</span>}
    </div>
  )
}
