"use client"

/**
 * POStatusSelect - Legacy wrapper for backward compatibility
 *
 * @deprecated Use StatusSelect from @/shared/ui/controls with PurchaseOrderStatusMeta instead
 */

import { StatusSelect, StatusDisplay } from "@/shared/ui/controls"
import { PurchaseOrderStatus, PurchaseOrderStatusMeta } from "@/types/purchase-order-status"

interface POStatusSelectProps {
  value: PurchaseOrderStatus
  onChange: (value: PurchaseOrderStatus) => void
  label?: string
  showLabel?: boolean
  disabled?: boolean
}

export function POStatusSelect({
  value,
  onChange,
  label = "Status",
  showLabel = true,
  disabled = false,
}: POStatusSelectProps) {
  return (
    <StatusSelect
      value={value}
      onChange={onChange}
      meta={PurchaseOrderStatusMeta}
      label={label}
      showLabel={showLabel}
      disabled={disabled}
    />
  )
}

export function POStatusDisplay({ value }: { value: PurchaseOrderStatus }) {
  return <StatusDisplay value={value} meta={PurchaseOrderStatusMeta} />
}
