"use client"

import { useState, useMemo } from "react"
import {
  Mail,
  MailOpen,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Send,
  ChevronDown,
  CheckCheck,
  Check,
  Clock,
  Bell,
  Building2,
  Truck,
  Package,
  Receipt,
  X,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// SO-specific communication types
export type SOCommunicationType =
  | "email_sent"
  | "email_received"
  | "call_outbound"
  | "call_inbound"
  | "system"
  | "customer_update"
  | "shipment"
  | "invoice"

export type MessageStatus = "sent" | "delivered" | "read" | "pending"

export interface SOCommunication {
  id: string
  type: SOCommunicationType
  subject?: string
  preview: string
  fullContent?: string
  timestamp: string
  date: string
  from: {
    name: string
    email?: string
    isCustomer?: boolean
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
  soNumber?: string
  customerName?: string
}

// SO-specific mock communications
const soMockCommunications: SOCommunication[] = [
  {
    id: "so-comm-001",
    type: "email_sent",
    subject: "Order Confirmation - SO-2024-00142",
    preview: "Thank you for your order. We are pleased to confirm receipt of your purchase order ACME-PO-2024-089...",
    fullContent: `Dear Bob,\n\nThank you for your order. We are pleased to confirm receipt of your purchase order ACME-PO-2024-089.\n\nOrder Total: $6,581.61\nExpected Ship Date: Jan 18, 2024\n\nBest regards,\nAlex Rivera`,
    timestamp: "10:15 AM",
    date: "Jan 15, 2024",
    from: { name: "Alex Rivera", email: "alex.rivera@company.com" },
    to: { name: "Bob Wilson", email: "bob.wilson@acme-mfg.com" },
    status: "read",
    threadId: "thread-so-142",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-002",
    type: "email_received",
    subject: "Re: Order Confirmation - SO-2024-00142",
    preview: "Thank you for the confirmation. Please ensure all items are shipped together if possible...",
    fullContent: `Hi Alex,\n\nThank you for the confirmation. Please ensure all items are shipped together if possible. Our dock hours are 7am-4pm.\n\nBob Wilson\nAcme Manufacturing Inc.`,
    timestamp: "2:45 PM",
    date: "Jan 15, 2024",
    from: { name: "Bob Wilson", email: "bob.wilson@acme-mfg.com", isCustomer: true },
    to: { name: "Alex Rivera", email: "alex.rivera@company.com" },
    status: "read",
    threadId: "thread-so-142",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-003",
    type: "shipment",
    subject: "Shipment SHP-SO-001 Created",
    preview: "Shipment created for 60 WDG-100 + 50 WDG-200. Ready for carrier pickup.",
    timestamp: "8:00 AM",
    date: "Jan 18, 2024",
    from: { name: "Warehouse", isSystem: true },
    status: "read",
    relatedTo: "SHP-SO-001",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-004",
    type: "email_sent",
    subject: "Your Order Has Shipped - SO-2024-00142",
    preview: "Great news! Your order has been shipped. Tracking: FDX-9876543210...",
    fullContent: `Dear Bob,\n\nGreat news! Your order SO-2024-00142 has been shipped.\n\nCarrier: FedEx\nTracking: FDX-9876543210\nExpected Delivery: Jan 21, 2024\n\nBest regards,\nAlex Rivera`,
    timestamp: "9:30 AM",
    date: "Jan 18, 2024",
    from: { name: "Alex Rivera" },
    to: { name: "Bob Wilson" },
    status: "read",
    relatedTo: "SHP-SO-001",
    threadId: "thread-so-142-ship",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-005",
    type: "customer_update",
    subject: "Delivery Confirmed",
    preview: "Customer confirmed receipt of shipment SHP-SO-001 at Dock B.",
    timestamp: "11:00 AM",
    date: "Jan 21, 2024",
    from: { name: "Acme Manufacturing", isCustomer: true },
    status: "read",
    relatedTo: "SHP-SO-001",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-006",
    type: "invoice",
    subject: "Invoice INV-SO-2024-001 Sent",
    preview: "Invoice $3,949.73 sent to customer. Payment due Feb 21, 2024.",
    timestamp: "8:00 AM",
    date: "Jan 22, 2024",
    from: { name: "AR System", isSystem: true },
    relatedTo: "INV-SO-2024-001",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-007",
    type: "call_inbound",
    preview: "Customer called regarding quality issue with 5 units of WDG-100",
    timestamp: "2:00 PM",
    date: "Jan 22, 2024",
    from: { name: "Bob Wilson", isCustomer: true },
    to: { name: "Alex Rivera" },
    duration: "12 min",
    relatedTo: "WDG-100",
    threadId: "thread-quality",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-008",
    type: "system",
    preview: "Customer complaint logged: 5 units WDG-100 with cosmetic defects. Awaiting resolution.",
    timestamp: "2:30 PM",
    date: "Jan 22, 2024",
    from: { name: "CRM System", isSystem: true },
    relatedTo: "NCR-SO-2024-001",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-009",
    type: "email_received",
    subject: "Invoice Dispute - 5 units",
    preview: "We are disputing the 5 defective WDG-100 units on invoice INV-SO-2024-001...",
    fullContent: `Hi Alex,\n\nWe are disputing the 5 defective WDG-100 units ($225) on invoice INV-SO-2024-001. Please issue a credit memo or arrange replacement.\n\nBob Wilson`,
    timestamp: "10:00 AM",
    date: "Jan 23, 2024",
    from: { name: "Bob Wilson", isCustomer: true },
    to: { name: "Alex Rivera" },
    status: "read",
    relatedTo: "INV-SO-2024-001",
    threadId: "thread-dispute",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
  {
    id: "so-comm-010",
    type: "system",
    preview: "Invoice INV-SO-2024-001 marked as disputed. 5 units ($225) pending resolution.",
    timestamp: "10:15 AM",
    date: "Jan 23, 2024",
    from: { name: "AR System", isSystem: true },
    relatedTo: "INV-SO-2024-001",
    soNumber: "SO-2024-00142",
    customerName: "Acme Manufacturing Inc.",
  },
]

const filterOptions = [
  { label: "All", value: "all", icon: null },
  { label: "Emails", value: "email", icon: Mail },
  { label: "Calls", value: "call", icon: Phone },
  { label: "Shipping", value: "shipping", icon: Truck },
  { label: "System", value: "system", icon: Bell },
]

interface SOActivityTimelineProps {
  soNumber?: string
  onClose?: () => void
  onComposeEmail?: () => void
  onMakeCall?: () => void
}

export function SOActivityTimeline({ soNumber, onClose, onComposeEmail, onMakeCall }: SOActivityTimelineProps) {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredComms = useMemo(() => {
    let comms = soMockCommunications
    if (soNumber) {
      comms = comms.filter(c => c.soNumber === soNumber)
    }

    if (selectedFilter === "all") return comms
    if (selectedFilter === "email") {
      return comms.filter((c) => c.type === "email_sent" || c.type === "email_received")
    }
    if (selectedFilter === "call") {
      return comms.filter((c) => c.type === "call_outbound" || c.type === "call_inbound")
    }
    if (selectedFilter === "shipping") {
      return comms.filter((c) => c.type === "shipment" || c.type === "customer_update" || c.type === "invoice")
    }
    if (selectedFilter === "system") {
      return comms.filter((c) => c.type === "system")
    }
    return comms
  }, [selectedFilter, soNumber])

  // Group by date
  const groupedComms = useMemo(() => {
    const groups: Record<string, SOCommunication[]> = {}
    filteredComms.forEach((comm) => {
      if (!groups[comm.date]) {
        groups[comm.date] = []
      }
      groups[comm.date].push(comm)
    })
    return groups
  }, [filteredComms])

  // Sort dates (most recent first)
  const sortedDates = Object.keys(groupedComms).sort((a, b) => {
    const parseDate = (d: string) => {
      const [month, day, year] = d.replace(",", "").split(" ")
      const monthMap: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      }
      return new Date(parseInt(year), monthMap[month], parseInt(day))
    }
    return parseDate(b).getTime() - parseDate(a).getTime()
  })

  const getIcon = (type: SOCommunicationType, status?: MessageStatus) => {
    switch (type) {
      case "email_sent":
        return <Send className="w-4 h-4" />
      case "email_received":
        return status === "read" ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />
      case "call_outbound":
        return <PhoneOutgoing className="w-4 h-4" />
      case "call_inbound":
        return <PhoneIncoming className="w-4 h-4" />
      case "system":
        return <Bell className="w-4 h-4" />
      case "customer_update":
        return <Building2 className="w-4 h-4" />
      case "shipment":
        return <Truck className="w-4 h-4" />
      case "invoice":
        return <Receipt className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: SOCommunicationType) => {
    switch (type) {
      case "email_sent":
      case "call_outbound":
        return "bg-primary/10 text-primary"
      case "email_received":
      case "call_inbound":
      case "customer_update":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "shipment":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "invoice":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "system":
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status?: MessageStatus) => {
    switch (status) {
      case "read":
        return <CheckCheck className="w-3 h-3 text-primary" />
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />
      case "sent":
        return <Check className="w-3 h-3 text-muted-foreground" />
      case "pending":
        return <Clock className="w-3 h-3 text-muted-foreground" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-semibold">Activity</h3>
        <div className="flex items-center gap-1">
          {onComposeEmail && (
            <Button size="sm" variant="ghost" onClick={onComposeEmail} title="New Email">
              <Mail className="w-4 h-4" />
            </Button>
          )}
          {onMakeCall && (
            <Button size="sm" variant="ghost" onClick={onMakeCall} title="Make Call">
              <Phone className="w-4 h-4" />
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <div className="flex gap-1 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                selectedFilter === option.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {option.icon && <option.icon className="w-3 h-3" />}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="text-xs font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                  {date}
                </div>
                <div className="space-y-3">
                  {groupedComms[date].map((comm) => {
                    const isExpanded = expandedId === comm.id
                    return (
                      <div
                        key={comm.id}
                        className={cn(
                          "rounded-lg border transition-all",
                          comm.from.isCustomer
                            ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                            : "border-border bg-background"
                        )}
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : comm.id)}
                          className="w-full text-left p-3"
                        >
                          {/* Header row */}
                          <div className="flex items-start gap-2">
                            <div className={cn("p-1.5 rounded", getTypeColor(comm.type))}>
                              {getIcon(comm.type, comm.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium">
                                  {comm.from.name}
                                </span>
                                {comm.from.isCustomer && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">Customer</Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                                  {comm.timestamp}
                                  {getStatusIcon(comm.status)}
                                </span>
                              </div>
                              {comm.subject && (
                                <p className="text-sm font-medium truncate">{comm.subject}</p>
                              )}
                              <p className="text-xs text-muted-foreground line-clamp-2">{comm.preview}</p>
                              {comm.duration && (
                                <p className="text-[10px] text-muted-foreground mt-1">Duration: {comm.duration}</p>
                              )}
                              {comm.relatedTo && (
                                <Badge variant="secondary" className="text-[10px] mt-1.5">{comm.relatedTo}</Badge>
                              )}
                            </div>
                            {comm.fullContent && (
                              <ChevronDown className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                                isExpanded && "rotate-180"
                              )} />
                            )}
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && comm.fullContent && (
                          <div className="px-3 pb-3 border-t border-border/50 pt-3 mx-3">
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                              {comm.fullContent}
                            </pre>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
