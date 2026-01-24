"use client"

/**
 * SOEditHeaderModal - Legacy wrapper for backward compatibility
 *
 * This wrapper allows existing code using SOEditHeaderModal to continue working.
 *
 * @deprecated Consider using EditHeaderModal directly with appropriate configuration
 */

import { EditHeaderModal, type HeaderEditData, type HeaderChargeEdit } from "./edit-header-modal"
import type { POHeader, POCharge, ChargeType } from "@/lib/mock-data"

// Re-export types with SO-specific names for backward compatibility
export type SOHeaderChargeEdit = HeaderChargeEdit

export interface SOHeaderEditData {
  changes: {
    field: string
    oldValue: string | null
    newValue: string | null
    label: string
  }[]
  shippingMethod?: string
  shippingTerms?: string
  paymentTerms?: string
  notes?: string
  chargeChanges: SOHeaderChargeEdit[]
}

interface SOEditHeaderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (changes: SOHeaderEditData) => void
  header: POHeader
  headerCharges: POCharge[]
}

export function SOEditHeaderModal({
  isOpen,
  onClose,
  onSave,
  header,
  headerCharges,
}: SOEditHeaderModalProps) {
  // Convert the PO-style save data to SO-style (they're the same structure)
  const handleSave = (data: HeaderEditData) => {
    const soData: SOHeaderEditData = {
      changes: data.changes,
      shippingMethod: data.shippingMethod,
      shippingTerms: data.shippingTerms,
      paymentTerms: data.paymentTerms,
      notes: data.notes,
      chargeChanges: data.chargeChanges,
    }
    onSave(soData)
  }

  return (
    <EditHeaderModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      header={header}
      headerCharges={headerCharges}
    />
  )
}
