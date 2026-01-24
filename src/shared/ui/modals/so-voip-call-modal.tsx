"use client"

/**
 * SOVoipCallModal - Legacy wrapper for backward compatibility
 *
 * This wrapper allows existing code using SOVoipCallModal to continue working
 * while the unified VoipCallModal is used under the hood.
 *
 * @deprecated Use VoipCallModal with variant="so" instead
 */

import { VoipCallModal, type VoipCallModalProps } from "./voip-call-modal"
import { useCommunications } from "@/context/CommunicationsContext"
import { type VendorContact } from "@/lib/mock-data"

export interface SOVoipCallModalProps {
  isOpen: boolean
  onClose: () => void
  customerContact: VendorContact
  soNumber: string
}

export function SOVoipCallModal({
  isOpen,
  onClose,
  customerContact,
  soNumber,
}: SOVoipCallModalProps) {
  const { addCallCompleted } = useCommunications()

  return (
    <VoipCallModal
      isOpen={isOpen}
      onClose={onClose}
      contact={customerContact}
      orderNumber={soNumber}
      variant="so"
      onCallCompleted={addCallCompleted}
    />
  )
}
