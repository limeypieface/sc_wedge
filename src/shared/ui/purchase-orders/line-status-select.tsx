"use client"

/**
 * LineStatusSelect - Legacy wrapper for backward compatibility
 *
 * @deprecated Use StatusSelect from @/shared/ui/controls with LineItemStatusMeta instead
 */

import { StatusSelect, StatusDisplay } from "@/shared/ui/controls"
import { LineItemStatus, LineItemStatusMeta } from "@/types/line-item-status"

interface LineStatusSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  showLabel?: boolean
  disabled?: boolean
}

export function LineStatusSelect({
  value,
  onChange,
  label = "Status",
  showLabel = true,
  disabled = false,
}: LineStatusSelectProps) {
  // Normalize value to match enum (lowercase)
  const normalizedValue = value.toLowerCase() as LineItemStatus

  return (
    <StatusSelect
      value={normalizedValue}
      onChange={onChange}
      meta={LineItemStatusMeta}
      label={label}
      showLabel={showLabel}
      disabled={disabled}
    />
  )
}

export function LineStatusDisplay({ value }: { value: string }) {
  const normalizedValue = value.toLowerCase() as LineItemStatus
  return <StatusDisplay value={normalizedValue} meta={LineItemStatusMeta} />
}
