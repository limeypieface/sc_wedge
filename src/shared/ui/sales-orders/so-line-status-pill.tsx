"use client"

/**
 * SO Line Status Pill - Legacy wrapper for backward compatibility
 *
 * @deprecated Use LineStatusPill from @/shared/ui/line-items with variant="so" instead
 */

import {
  LineStatusPill as UnifiedLineStatusPill,
  LineStatusDisplay as UnifiedLineStatusDisplay,
} from "@/shared/ui/line-items"

interface SOLineStatusPillProps {
  status: string
  size?: "sm" | "md"
}

export function SOLineStatusPill({ status, size = "md" }: SOLineStatusPillProps) {
  return <UnifiedLineStatusPill status={status} variant="so" size={size} />
}

export function SOLineStatusDisplay({ status }: { status: string }) {
  return <UnifiedLineStatusDisplay status={status} variant="so" />
}
