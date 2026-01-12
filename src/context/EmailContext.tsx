"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { vendorContact, type VendorContact } from "@/lib/mock-data"

// Email context types for different scenarios
export type EmailContextType =
  | "general"
  | "ncr"
  | "shipment"
  | "quality"
  | "follow_up"
  | "change_order"
  | "rma_request"      // Initial RMA request to supplier/customer
  | "rma_follow_up"    // Follow up on pending authorization
  | "rma_authorized"   // Confirm receipt of authorization
  | "rma_shipped"      // Notification of return shipment
  | "rma_received"     // Confirm supplier received the return
  | "rma_resolved"     // Confirm resolution (replacement/credit received)

export interface EmailAttachment {
  id: string
  name: string
  size: string
  type?: "document" | "pdf" | "spreadsheet"
}

export interface EmailPreset {
  contextType: EmailContextType
  subject?: string
  body?: string
  // NCR-specific fields
  ncrId?: string
  ncrType?: string
  sku?: string
  itemName?: string
  qtyAffected?: number
  issueDescription?: string
  // Shipment-specific fields
  shipmentId?: string
  // General metadata
  lineId?: string
  poNumber?: string
  // Change order-specific fields
  revisionVersion?: string
  changes?: Array<{ description: string }>
  costDelta?: { formatted: string; percent: number }
  // RMA-specific fields
  rmaId?: string
  rmaNumber?: string
  rmaType?: string
  carrier?: string
  returnTrackingNumber?: string
  // Pre-attached files
  attachments?: EmailAttachment[]
  // Callback when email is actually sent
  onSend?: () => void
}

interface EmailContextState {
  isOpen: boolean
  preset: EmailPreset | null
  recipient: VendorContact
  variant: "po" | "so"
  orderNumber: string
}

interface OpenEmailOptions {
  preset?: EmailPreset
  variant?: "po" | "so"
  orderNumber?: string
}

interface EmailContextValue {
  state: EmailContextState
  openEmailModal: (options?: OpenEmailOptions | EmailPreset) => void
  closeEmailModal: () => void
}

const EmailContext = createContext<EmailContextValue | null>(null)

export function EmailProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmailContextState>({
    isOpen: false,
    preset: null,
    recipient: vendorContact,
    variant: "po",
    orderNumber: "PO-0861",
  })

  const openEmailModal = useCallback((options?: OpenEmailOptions | EmailPreset) => {
    // Handle both old format (just preset) and new format (options object)
    let preset: EmailPreset | null = null
    let variant: "po" | "so" = "po"
    let orderNumber = "PO-0861"

    if (options) {
      // Check if it's the new options format (has variant or orderNumber keys)
      if ("variant" in options || "orderNumber" in options) {
        const opts = options as OpenEmailOptions
        preset = opts.preset || null
        variant = opts.variant || "po"
        orderNumber = opts.orderNumber || (variant === "so" ? "SO-2024-00142" : "PO-0861")
      } else {
        // Old format - just a preset
        preset = options as EmailPreset
        // Try to infer variant from poNumber if present
        if (preset.poNumber?.startsWith("SO")) {
          variant = "so"
          orderNumber = preset.poNumber
        } else if (preset.poNumber) {
          orderNumber = preset.poNumber
        }
      }
    }

    setState((prev) => ({
      ...prev,
      isOpen: true,
      preset,
      variant,
      orderNumber,
    }))
  }, [])

  const closeEmailModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      preset: null,
    }))
  }, [])

  return (
    <EmailContext.Provider value={{ state, openEmailModal, closeEmailModal }}>
      {children}
    </EmailContext.Provider>
  )
}

export function useEmailContext() {
  const context = useContext(EmailContext)
  if (!context) {
    throw new Error("useEmailContext must be used within an EmailProvider")
  }
  return context
}
