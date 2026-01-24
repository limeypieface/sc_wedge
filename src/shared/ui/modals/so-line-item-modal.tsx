"use client"

/**
 * SOLineItemModal - Legacy wrapper for backward compatibility
 *
 * This wrapper allows existing code using SOLineItemModal to continue working
 * while recommending migration to LineItemModal with variant="so".
 *
 * @deprecated Use LineItemModal from @/shared/ui/modals with variant="so" instead
 */

import { LineItemModal } from "./line-item-modal"
import type { LineItem } from "@/lib/mock-data"

export interface SOLineItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: LineItem
  soNumber: string
}

export function SOLineItemModal({
  isOpen,
  onClose,
  item,
  soNumber,
}: SOLineItemModalProps) {
  return (
    <LineItemModal
      isOpen={isOpen}
      onClose={onClose}
      item={item}
      orderNumber={soNumber}
      variant="so"
    />
  )
}
