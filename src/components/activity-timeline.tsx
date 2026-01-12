"use client"

import { useState, useMemo } from "react"
import {
  Mail,
  Phone,
  ChevronDown,
  CheckCheck,
  Bell,
  FileText,
  Reply,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { vendorContact, poHeader } from "@/lib/mock-data"
import { useEmailContext } from "@/context/EmailContext"
import { useFeatureFlag } from "@/context/FeatureFlagsContext"
import { cn } from "@/lib/utils"

type CommunicationType =
  | "email_sent"
  | "email_received"
  | "call_outbound"
  | "call_inbound"
  | "system"
  | "vendor_notification"

interface Communication {
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
  isRead?: boolean
  duration?: string
  relatedEntities?: string[]
}

const communications: Communication[] = [
  // Jan 22, 2026
  {
    id: "comm-010",
    type: "system",
    preview: "Invoice INV-2026-0094 flagged: quantity variance with...",
    timestamp: "9:30 AM",
    date: "JAN 22, 2026",
    from: { name: "AP System", isSystem: true },
    relatedEntities: ["INV-2026-0094"],
  },
  {
    id: "comm-009",
    type: "email_received",
    subject: "Invoice INV-2026-0094",
    preview: "Please find attached invoice for shipment SHP-002. Amount:...",
    fullContent: `Dear Sarah,\n\nPlease find attached invoice INV-2026-0094 for shipment SHP-002.\n\nAmount: $982.00\nPayment Terms: Net 30\nDue Date: Feb 21, 2026\n\nBest regards,\nAccounts Receivable\nFlightTech Controllers Inc.`,
    timestamp: "9:00 AM",
    date: "JAN 22, 2026",
    from: { name: "FlightTech AR", email: "ar@flightechcontrollers.com", isVendor: true },
    to: { name: poHeader.buyer.name },
    isRead: true,
    relatedEntities: ["INV-2026-0094"],
  },

  // Jan 21, 2026
  {
    id: "comm-008",
    type: "system",
    preview: "NCR-2026-0142 created for PSW-102. Vendor notification...",
    timestamp: "2:15 PM",
    date: "JAN 21, 2026",
    from: { name: "QA System", isSystem: true },
    relatedEntities: ["NCR-2026-0142"],
  },
  {
    id: "comm-007",
    type: "system",
    preview: "SHP-002 received. 1 unit placed on quality hold - inspection...",
    timestamp: "2:00 PM",
    date: "JAN 21, 2026",
    from: { name: "QA System", isSystem: true },
    relatedEntities: ["PSW-102"],
  },

  // Jan 19, 2026
  {
    id: "comm-006",
    type: "vendor_notification",
    subject: "Shipment Notification - SHP-002",
    preview: "Your order has shipped. Tracking: FDX-0029384801",
    timestamp: "8:00 AM",
    date: "JAN 19, 2026",
    from: { name: "FlightTech", isVendor: true },
    isRead: true,
    relatedEntities: ["SHP-002"],
  },
  {
    id: "comm-005",
    type: "call_outbound",
    preview: "Discussed delivery schedule for remaining PSW-102 units",
    timestamp: "11:00 AM",
    date: "JAN 19, 2026",
    from: { name: poHeader.buyer.name },
    to: { name: vendorContact.name },
    duration: "8 min",
  },

  // Jan 17, 2026
  {
    id: "comm-004",
    type: "system",
    preview: "Shipment SHP-001 received at Main Office. 8 units processed.",
    timestamp: "3:30 PM",
    date: "JAN 17, 2026",
    from: { name: "System", isSystem: true },
    relatedEntities: ["SHP-001"],
  },

  // Jan 15, 2026
  {
    id: "comm-003",
    type: "vendor_notification",
    subject: "Shipment Notification - SHP-001",
    preview: "Your order has shipped. Tracking: FDX-0029384756",
    timestamp: "8:00 AM",
    date: "JAN 15, 2026",
    from: { name: "FlightTech", isVendor: true },
    isRead: true,
    relatedEntities: ["SHP-001"],
  },

  // Jan 6, 2026
  {
    id: "comm-002",
    type: "email_received",
    subject: `Re: Purchase Order ${poHeader.poNumber}`,
    preview: "Thank you for your order. We confirm receipt and will ship as scheduled...",
    fullContent: `Dear Sarah,\n\nThank you for your order. We confirm receipt and will ship as scheduled. Please expect the first shipment by Jan 17th.\n\nBest regards,\nDaniel Thomas\nFlightTech Controllers Inc.`,
    timestamp: "2:45 PM",
    date: "JAN 6, 2026",
    from: { name: vendorContact.name, email: vendorContact.email, isVendor: true },
    to: { name: poHeader.buyer.name, email: poHeader.buyer.email },
    isRead: true,
  },

  // Jan 5, 2026
  {
    id: "comm-001",
    type: "email_sent",
    subject: `Purchase Order ${poHeader.poNumber}`,
    preview: "Please find attached Purchase Order PO-0861 for the items listed below...",
    fullContent: `Dear Daniel,\n\nPlease find attached Purchase Order ${poHeader.poNumber} for the items listed below. Kindly acknowledge receipt and confirm the delivery schedule.\n\nBest regards,\nSarah Johnson`,
    timestamp: "10:15 AM",
    date: "JAN 5, 2026",
    from: { name: poHeader.buyer.name, email: poHeader.buyer.email },
    to: { name: vendorContact.name, email: vendorContact.email },
    isRead: true,
  },
]

export function ActivityTimeline() {
  const { openEmailModal } = useEmailContext()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const isActivityTimelineEnabled = useFeatureFlag("activity_timeline")

  // If feature is disabled, show placeholder
  if (!isActivityTimelineEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mail className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Activity timeline is disabled</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Enable in Settings → Feature Flags
        </p>
      </div>
    )
  }

  // Group by date
  const groupedComms = useMemo(() => {
    const groups: Record<string, Communication[]> = {}
    communications.forEach((comm) => {
      if (!groups[comm.date]) {
        groups[comm.date] = []
      }
      groups[comm.date].push(comm)
    })
    return groups
  }, [])

  // Sort dates (most recent first) - dates are already in "JAN 22, 2026" format
  const sortedDates = Object.keys(groupedComms).sort((a, b) => {
    const parseDate = (d: string) => {
      const parts = d.split(" ")
      const monthMap: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
      }
      return new Date(parseInt(parts[2]), monthMap[parts[0]], parseInt(parts[1].replace(",", "")))
    }
    return parseDate(b).getTime() - parseDate(a).getTime()
  })

  const getIcon = (type: CommunicationType) => {
    switch (type) {
      case "email_sent":
      case "email_received":
        return <Mail className="w-4 h-4" />
      case "call_outbound":
      case "call_inbound":
        return <Phone className="w-4 h-4" />
      case "system":
        return <Bell className="w-4 h-4" />
      case "vendor_notification":
        return <FileText className="w-4 h-4" />
    }
  }

  const getIconStyle = (type: CommunicationType) => {
    switch (type) {
      case "email_sent":
      case "email_received":
        return "text-amber-600"
      case "call_outbound":
      case "call_inbound":
        return "text-emerald-600"
      case "system":
        return "text-muted-foreground"
      case "vendor_notification":
        return "text-amber-600"
    }
  }

  const handleReply = (comm: Communication) => {
    openEmailModal({
      contextType: "follow_up",
      subject: comm.subject ? `Re: ${comm.subject}` : `Re: ${poHeader.poNumber}`,
      poNumber: poHeader.poNumber,
    })
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date Header */}
          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground tracking-wide">
              {date}
            </span>
          </div>

          {/* Communications */}
          <div className="space-y-2">
            {groupedComms[date]
              .sort((a, b) => {
                // Sort by time descending within the day
                const timeA = a.timestamp.includes("PM") && !a.timestamp.startsWith("12")
                  ? parseInt(a.timestamp) + 12
                  : parseInt(a.timestamp)
                const timeB = b.timestamp.includes("PM") && !b.timestamp.startsWith("12")
                  ? parseInt(b.timestamp) + 12
                  : parseInt(b.timestamp)
                return timeB - timeA
              })
              .map((comm) => {
                const isExpanded = expandedId === comm.id

                return (
                  <div
                    key={comm.id}
                    className="bg-amber-50/30 rounded-lg border border-amber-100/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : comm.id)}
                      className="w-full text-left p-3 hover:bg-amber-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn("mt-0.5", getIconStyle(comm.type))}>
                          {getIcon(comm.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {comm.from.name}
                              </span>
                              {comm.from.isVendor && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-4 px-1.5 bg-amber-50 border-amber-200 text-amber-700"
                                >
                                  Vendor
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{comm.timestamp}</span>
                              {comm.isRead && (
                                <CheckCheck className="w-3.5 h-3.5 text-amber-600" />
                              )}
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-muted-foreground transition-transform",
                                  isExpanded && "rotate-180"
                                )}
                              />
                            </div>
                          </div>

                          {/* Subject */}
                          {comm.subject && (
                            <p className="text-sm font-medium text-foreground mt-1">
                              {comm.subject}
                            </p>
                          )}

                          {/* Preview */}
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {comm.preview}
                          </p>

                          {/* Related entities & duration */}
                          <div className="flex items-center gap-2 mt-2">
                            {comm.relatedEntities?.map((entity) => (
                              <span
                                key={entity}
                                className="text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                              >
                                {entity}
                              </span>
                            ))}
                            {comm.duration && (
                              <span className="text-xs text-muted-foreground">
                                {comm.duration}
                              </span>
                            )}
                            {comm.to && (
                              <span className="text-xs text-muted-foreground">
                                → {comm.to.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-amber-100/50 px-4 py-3 bg-white/60">
                        {comm.fullContent ? (
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                            {comm.fullContent}
                          </pre>
                        ) : (
                          <p className="text-sm text-foreground">{comm.preview}</p>
                        )}

                        {/* Actions */}
                        {(comm.type === "email_received" || comm.type === "vendor_notification") && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-100/50">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReply(comm)
                              }}
                            >
                              <Reply className="w-3.5 h-3.5" />
                              Reply
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {communications.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <Mail className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No communications</p>
        </div>
      )}
    </div>
  )
}
