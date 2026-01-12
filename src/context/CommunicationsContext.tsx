"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { vendorContact, poHeader } from "@/lib/mock-data"

export type CommunicationType =
  | "email_sent"
  | "email_received"
  | "call_outbound"
  | "call_inbound"
  | "system"
  | "vendor_update"

export type MessageStatus = "sent" | "delivered" | "read" | "pending"

export interface Communication {
  id: string
  type: CommunicationType
  subject?: string
  preview: string
  fullContent?: string
  timestamp: string
  date: string
  from: {
    name: string
    email?: string
    isVendor?: boolean
    isSystem?: boolean
  }
  to?: {
    name: string
    email?: string
  }
  status?: MessageStatus
  duration?: string
  relatedTo?: string
  threadId?: string
}

// Initial mock data
const initialCommunications: Communication[] = [
  {
    id: "comm-001",
    type: "email_sent",
    subject: `Purchase Order ${poHeader.poNumber}`,
    preview: "Please find attached Purchase Order PO-0861 for the items listed below...",
    fullContent: `Dear Daniel,\n\nPlease find attached Purchase Order ${poHeader.poNumber} for the items listed below. Kindly acknowledge receipt and confirm the delivery schedule.\n\nBest regards,\nSarah Johnson`,
    timestamp: "10:15 AM",
    date: "Jan 5, 2026",
    from: { name: poHeader.buyer.name, email: poHeader.buyer.email },
    to: { name: vendorContact.name, email: vendorContact.email },
    status: "read",
    threadId: "thread-po",
  },
  {
    id: "comm-002",
    type: "email_received",
    subject: `Re: Purchase Order ${poHeader.poNumber}`,
    preview: "Thank you for your order. We confirm receipt and will ship as scheduled...",
    fullContent: `Dear Sarah,\n\nThank you for your order. We confirm receipt and will ship as scheduled. Please expect the first shipment by Jan 17th.\n\nBest regards,\nDaniel Thomas\nFlightTech Controllers Inc.`,
    timestamp: "2:45 PM",
    date: "Jan 6, 2026",
    from: { name: vendorContact.name, email: vendorContact.email, isVendor: true },
    to: { name: poHeader.buyer.name, email: poHeader.buyer.email },
    status: "read",
    threadId: "thread-po",
  },
  {
    id: "comm-003",
    type: "vendor_update",
    subject: "Shipment Notification - SHP-001",
    preview: "Your order has shipped. Tracking: FDX-0029384756",
    timestamp: "8:00 AM",
    date: "Jan 15, 2026",
    from: { name: "FlightTech", isVendor: true },
    status: "read",
    relatedTo: "SHP-001",
    threadId: "thread-shp001",
  },
  {
    id: "comm-004",
    type: "system",
    preview: "Shipment SHP-001 received at Main Office. 8 units processed.",
    timestamp: "3:30 PM",
    date: "Jan 17, 2026",
    from: { name: "System", isSystem: true },
    relatedTo: "SHP-001",
    threadId: "thread-shp001",
  },
  {
    id: "comm-005",
    type: "call_outbound",
    preview: "Discussed delivery schedule for remaining PSW-102 units",
    timestamp: "11:00 AM",
    date: "Jan 19, 2026",
    from: { name: poHeader.buyer.name },
    to: { name: vendorContact.name },
    duration: "8 min",
    relatedTo: "PSW-102",
    threadId: "thread-quality",
  },
  {
    id: "comm-006",
    type: "vendor_update",
    subject: "Shipment Notification - SHP-002",
    preview: "Your order has shipped. Tracking: FDX-0029384801",
    timestamp: "8:00 AM",
    date: "Jan 19, 2026",
    from: { name: "FlightTech", isVendor: true },
    status: "read",
    relatedTo: "SHP-002",
    threadId: "thread-shp002",
  },
  {
    id: "comm-007",
    type: "system",
    preview: "SHP-002 received. 1 unit placed on quality hold - inspection failure.",
    timestamp: "2:00 PM",
    date: "Jan 21, 2026",
    from: { name: "QA System", isSystem: true },
    relatedTo: "PSW-102",
    threadId: "thread-quality",
  },
  {
    id: "comm-008",
    type: "system",
    preview: "NCR-2026-0142 created for PSW-102. Vendor notification pending.",
    timestamp: "2:15 PM",
    date: "Jan 21, 2026",
    from: { name: "QA System", isSystem: true },
    relatedTo: "NCR-2026-0142",
    threadId: "thread-quality",
  },
  {
    id: "comm-009",
    type: "email_received",
    subject: "Invoice INV-2026-0094",
    preview: "Please find attached invoice for shipment SHP-002. Amount: $982.00",
    fullContent: `Dear Sarah,\n\nPlease find attached invoice INV-2026-0094 for shipment SHP-002.\n\nAmount: $982.00\nPayment Terms: Net 30\nDue Date: Feb 21, 2026\n\nBest regards,\nAccounts Receivable\nFlightTech Controllers Inc.`,
    timestamp: "9:00 AM",
    date: "Jan 22, 2026",
    from: { name: "FlightTech AR", email: "ar@flightechcontrollers.com", isVendor: true },
    to: { name: poHeader.buyer.name },
    status: "read",
    relatedTo: "INV-2026-0094",
    threadId: "thread-invoice",
  },
  {
    id: "comm-010",
    type: "system",
    preview: "Invoice INV-2026-0094 flagged: quantity variance with accepted receipt.",
    timestamp: "9:30 AM",
    date: "Jan 22, 2026",
    from: { name: "AP System", isSystem: true },
    relatedTo: "INV-2026-0094",
    threadId: "thread-invoice",
  },
  {
    id: "comm-011",
    type: "vendor_update",
    subject: "Shipment Notification - SHP-003",
    preview: "Your order has shipped. Tracking: FDX-0029385102. ETA Jan 28.",
    timestamp: "8:00 AM",
    date: "Jan 25, 2026",
    from: { name: "FlightTech", isVendor: true },
    status: "delivered",
    relatedTo: "SHP-003",
    threadId: "thread-shp003",
  },
]

interface CommunicationsContextValue {
  communications: Communication[]
  addCommunication: (comm: Omit<Communication, "id">) => void
  addEmailSent: (params: {
    subject: string
    body: string
    toName: string
    toEmail: string
    relatedTo?: string
  }) => void
  addCallCompleted: (params: {
    toName: string
    duration: string
    summary: string
    relatedTo?: string
  }) => void
}

const CommunicationsContext = createContext<CommunicationsContextValue | null>(null)

function generateId(): string {
  return `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function CommunicationsProvider({ children }: { children: ReactNode }) {
  const [communications, setCommunications] = useState<Communication[]>(initialCommunications)

  const addCommunication = useCallback((comm: Omit<Communication, "id">) => {
    const newComm: Communication = {
      ...comm,
      id: generateId(),
    }
    setCommunications((prev) => [newComm, ...prev])
  }, [])

  const addEmailSent = useCallback(
    (params: {
      subject: string
      body: string
      toName: string
      toEmail: string
      relatedTo?: string
    }) => {
      const preview = params.body.length > 80 ? params.body.substring(0, 80) + "..." : params.body
      addCommunication({
        type: "email_sent",
        subject: params.subject,
        preview,
        fullContent: params.body,
        timestamp: formatCurrentTime(),
        date: formatCurrentDate(),
        from: { name: poHeader.buyer.name, email: poHeader.buyer.email },
        to: { name: params.toName, email: params.toEmail },
        status: "sent",
        relatedTo: params.relatedTo,
        threadId: `thread-${Date.now()}`,
      })
    },
    [addCommunication]
  )

  const addCallCompleted = useCallback(
    (params: {
      toName: string
      duration: string
      summary: string
      relatedTo?: string
    }) => {
      addCommunication({
        type: "call_outbound",
        preview: params.summary,
        timestamp: formatCurrentTime(),
        date: formatCurrentDate(),
        from: { name: poHeader.buyer.name },
        to: { name: params.toName },
        duration: params.duration,
        relatedTo: params.relatedTo,
        threadId: `thread-${Date.now()}`,
      })
    },
    [addCommunication]
  )

  return (
    <CommunicationsContext.Provider
      value={{ communications, addCommunication, addEmailSent, addCallCompleted }}
    >
      {children}
    </CommunicationsContext.Provider>
  )
}

export function useCommunications() {
  const context = useContext(CommunicationsContext)
  if (!context) {
    throw new Error("useCommunications must be used within a CommunicationsProvider")
  }
  return context
}
