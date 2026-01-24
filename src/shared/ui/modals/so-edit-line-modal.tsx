"use client"

/**
 * SOEditLineModal - Legacy wrapper for backward compatibility
 *
 * This wrapper allows existing code using SOEditLineModal to continue working.
 * The SO version has minor differences from PO (tax code vs tax rate).
 *
 * @deprecated Consider using EditLineModal directly with appropriate configuration
 */

import { EditLineModal, type LineEditData, type LineChargeEdit } from "./edit-line-modal"
import type { LineItem, POCharge, ChargeType } from "@/lib/mock-data"

// Re-export types with SO-specific names for backward compatibility
export type SOLineChargeEdit = LineChargeEdit

export interface SOLineEditData {
  lineId: number
  lineNumber: number
  sku: string
  changes: {
    field: string
    oldValue: string | number | null
    newValue: string | number | null
    label: string
  }[]
  quantity?: number
  unitPrice?: number
  promisedDate?: string
  discountPercent?: number
  taxCode?: "STANDARD" | "EXEMPT" | "REDUCED"
  chargeChanges: SOLineChargeEdit[]
}

interface SOEditLineModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (changes: SOLineEditData) => void
  line: LineItem | null
  lineCharges: POCharge[]
}

export function SOEditLineModal({
  isOpen,
  onClose,
  onSave,
  line,
  lineCharges,
}: SOEditLineModalProps) {
  // Convert the PO-style save data to SO-style
  const handleSave = (data: LineEditData) => {
    const soData: SOLineEditData = {
      lineId: data.lineId,
      lineNumber: data.lineNumber,
      sku: data.sku,
      changes: data.changes,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      promisedDate: data.promisedDate,
      discountPercent: data.discountPercent,
      // Convert tax rate back to tax code for SO
      taxCode: data.taxRate === 0 ? "EXEMPT" : data.taxRate === 5 ? "REDUCED" : "STANDARD",
      chargeChanges: data.chargeChanges,
    }
    onSave(soData)
  }

  return (
    <EditLineModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      line={line}
      lineCharges={lineCharges}
    />
  )
}
