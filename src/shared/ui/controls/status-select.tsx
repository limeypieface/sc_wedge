"use client"

/**
 * StatusSelect - Generic status selection component
 *
 * A unified status selection component that works with any status enum
 * that has been created using createEnumMeta.
 *
 * This component uses SmartSelect under the hood and is fully configuration-driven.
 *
 * @example
 * // With PO header status
 * <StatusSelect
 *   value={currentStatus}
 *   onChange={setStatus}
 *   meta={PurchaseOrderStatusMeta}
 * />
 *
 * // With SO line status
 * <StatusSelect
 *   value={lineStatus}
 *   onChange={setLineStatus}
 *   meta={SOLineItemStatusMeta}
 * />
 */

import { Label } from "@/shared/ui/label"
import SmartSelect, { SmartSelectOption } from "@/shared/ui/fields/smart-select"
import type { ReactNode } from "react"

// =============================================================================
// TYPES
// =============================================================================

/**
 * Interface matching the structure returned by createEnumMeta.
 * This allows the component to work with any enum meta object.
 */
export interface EnumMeta<T extends string> {
  meta: Record<T, { label: string; icon?: ReactNode }>
  options: () => Array<{ value: T; label: string; icon?: ReactNode }>
}

export interface StatusSelectProps<T extends string> {
  /** Current selected value */
  value: T
  /** Callback when value changes */
  onChange: (value: T) => void
  /** Enum meta object created by createEnumMeta */
  meta: EnumMeta<T>
  /** Label text */
  label?: string
  /** Whether to show the label */
  showLabel?: boolean
  /** Whether the select is disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
}

export interface StatusDisplayProps<T extends string> {
  /** Current value to display */
  value: T
  /** Enum meta object created by createEnumMeta */
  meta: EnumMeta<T>
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Generic status selection dropdown.
 */
export function StatusSelect<T extends string>({
  value,
  onChange,
  meta,
  label = "Status",
  showLabel = true,
  disabled = false,
  placeholder = "Select status",
}: StatusSelectProps<T>) {
  const options: SmartSelectOption[] = meta.options().map(status => ({
    id: status.value,
    label: status.label,
    icon: status.icon,
  }))

  const normalizedValue = value?.toLowerCase()
  const selectedOption = options.find(opt => opt.id.toLowerCase() === normalizedValue) || options[0] || null

  const handleChange = (option: SmartSelectOption | null) => {
    if (option) {
      onChange(option.id as T)
    }
  }

  return (
    <div className="space-y-2">
      {showLabel && <Label className="text-sm text-muted-foreground font-normal">{label}</Label>}
      <SmartSelect
        value={selectedOption}
        onChange={handleChange}
        options={options}
        disabled={disabled}
        placeholder={placeholder}
        searchable={true}
        allowClear={false}
      />
    </div>
  )
}

/**
 * Generic status display (view-only).
 */
export function StatusDisplay<T extends string>({
  value,
  meta,
}: StatusDisplayProps<T>) {
  const statusMeta = meta.meta[value]

  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      {statusMeta?.icon}
      <span>{statusMeta?.label || value}</span>
    </div>
  )
}
