"use client"

/**
 * PO Line Status Pill - Legacy wrapper for backward compatibility
 *
 * @deprecated Use LineStatusPill from @/shared/ui/line-items with variant="po" instead
 */

import {
  LineStatusPill as UnifiedLineStatusPill,
  LineStatusDisplay as UnifiedLineStatusDisplay,
} from "@/shared/ui/line-items"

interface LineStatusPillProps {
  status: string
  size?: "sm" | "md"
}

export function LineStatusPill({ status, size = "md" }: LineStatusPillProps) {
  return <UnifiedLineStatusPill status={status} variant="po" size={size} />
}

export function LineStatusDisplay({ status }: { status: string }) {
  return <UnifiedLineStatusDisplay status={status} variant="po" />
}
