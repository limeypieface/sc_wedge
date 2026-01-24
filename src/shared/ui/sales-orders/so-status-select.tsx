"use client"

/**
 * SOStatusSelect - Legacy wrapper for backward compatibility
 *
 * @deprecated Use StatusSelect from @/shared/ui/controls with SalesOrderStatusMeta instead
 */

import { StatusSelect, StatusDisplay } from "@/shared/ui/controls"
import { SalesOrderStatus, SalesOrderStatusMeta } from "@/types/sales-order-status"

interface SOStatusSelectProps {
  value: SalesOrderStatus
  onChange: (value: SalesOrderStatus) => void
  label?: string
  showLabel?: boolean
  disabled?: boolean
}

export function SOStatusSelect({
  value,
  onChange,
  label = "Status",
  showLabel = true,
  disabled = false,
}: SOStatusSelectProps) {
  return (
    <StatusSelect
      value={value}
      onChange={onChange}
      meta={SalesOrderStatusMeta}
      label={label}
      showLabel={showLabel}
      disabled={disabled}
    />
  )
}

export function SOStatusDisplay({ value }: { value: SalesOrderStatus }) {
  return <StatusDisplay value={value} meta={SalesOrderStatusMeta} />
}
