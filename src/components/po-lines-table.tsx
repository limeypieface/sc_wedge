"use client"

import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Truck,
  Clock,
  Zap,
  Package,
  ChevronRight,
  ShieldCheck,
  FileWarning,
  FlaskConical,
  Eye,
  Briefcase,
  Wrench,
  Play,
  Pause,
  Flag,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LineStatusPill } from "@/components/line-status-pill"
import type { LineViewMode } from "@/components/line-display-selector"
import {
  LineType,
  LineTypeMeta,
  ServiceBillingType,
  ServiceBillingTypeMeta,
  ServiceLineStatus,
  ServiceLineStatusMeta,
} from "@/types/enums"
import type { ServiceLineDetails } from "@/app/supply/purchase-orders/_lib/types/purchase-order.types"

// =============================================================================
// TYPES
// =============================================================================

export interface POLineItem {
  id: number
  poNumber?: string
  lineNumber: number
  sku: string
  name: string
  vendor?: string
  vendorCode?: string
  projectCode?: string
  projectName?: string
  status: string
  // Quantities
  quantityOrdered: number
  quantityShipped: number
  quantityReceived: number
  quantityAccepted?: number
  quantityInQualityHold: number
  quantityPaid: number
  // Pricing
  unitPrice: number
  lineTotal: number
  subtotal?: number
  discountAmount?: number
  taxAmount?: number
  lineTotalWithTax?: number
  expediteFee?: number
  // Dates
  promisedDate: string
  needDate?: string
  expectedDate?: string
  // Quality
  inspectionRequired?: boolean
  cocRequired?: boolean
  ncrCount?: number
  // Sourcing
  preferredVendor?: string
  contractNumber?: string
  lastPurchasePrice?: number
  // Logistics
  expedite?: boolean
  shipments?: {
    id: string
    status: "expected" | "in_transit" | "received"
    expectedDate?: string
    receivedDate?: string
  }[]
  // Service line fields
  lineType?: LineType
  serviceDetails?: ServiceLineDetails
  serviceStatus?: ServiceLineStatus
}

interface POLinesTableProps {
  lines: POLineItem[]
  viewMode: LineViewMode
  showPOColumn?: boolean
  onLineClick?: (line: POLineItem) => void
  className?: string
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const parseDate = (dateStr: string) => {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  const parts = dateStr.replace(",", "").split(" ")
  return new Date(parseInt(parts[2]), months[parts[0]], parseInt(parts[1]))
}

const getExpectedDateInfo = (line: POLineItem) => {
  const allReceived = line.quantityReceived >= line.quantityOrdered
  const promisedDate = parseDate(line.promisedDate)

  if (allReceived) {
    const lastReceived = line.shipments
      ?.filter(s => s.status === "received" && s.receivedDate)
      .sort((a, b) => parseDate(b.receivedDate!).getTime() - parseDate(a.receivedDate!).getTime())[0]
    return { date: lastReceived?.receivedDate || "", status: "delivered" as const }
  }

  const inTransit = line.shipments?.find(s => s.status === "in_transit")
  const expectedShipment = line.shipments?.find(s => s.status === "expected")
  const nextExpectedDate = inTransit?.expectedDate || expectedShipment?.expectedDate || line.expectedDate

  if (nextExpectedDate) {
    const expectedDate = parseDate(nextExpectedDate)
    const isDelayed = expectedDate > promisedDate
    return { date: nextExpectedDate, status: isDelayed ? "delayed" as const : "on_track" as const }
  }

  const today = new Date()
  if (today > promisedDate) {
    return { date: "", status: "delayed" as const }
  }

  return { date: "", status: "on_track" as const }
}

const getDeliveryStatus = (line: POLineItem) => {
  const allReceived = line.quantityReceived >= line.quantityOrdered
  if (allReceived) {
    return { label: "Delivered", color: "text-primary", bgColor: "bg-primary/10", icon: CheckCircle2 }
  }

  const expectedInfo = getExpectedDateInfo(line)
  if (expectedInfo.status === "delayed") {
    return { label: "Late", color: "text-destructive", bgColor: "bg-destructive/10", icon: AlertTriangle }
  }

  return { label: "On Track", color: "text-foreground", bgColor: "bg-muted", icon: Clock }
}

const getShipmentPillInfo = (status: string) => {
  switch (status) {
    case "received":
      return { label: "Delivered", style: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 }
    case "in_transit":
      return { label: "In Transit", style: "bg-blue-50 text-blue-600 border-blue-200", icon: Truck }
    default:
      return { label: "Expected", style: "bg-muted text-muted-foreground border-border", icon: Package }
  }
}

// =============================================================================
// SERVICE LINE UTILITIES
// =============================================================================

const isServiceLine = (line: POLineItem): boolean => {
  return line.lineType === LineType.Service || line.lineType === LineType.NRE
}

const getLineTypeIcon = (lineType?: LineType) => {
  switch (lineType) {
    case LineType.Service:
      return Briefcase
    case LineType.NRE:
      return Wrench
    default:
      return Package
  }
}

const getLineTypeBadge = (lineType?: LineType) => {
  if (!lineType || lineType === LineType.Item) return null
  const meta = LineTypeMeta.meta[lineType]
  return { label: meta.label, className: meta.className }
}

const getServiceStatusInfo = (status?: ServiceLineStatus) => {
  if (!status) return null
  const meta = ServiceLineStatusMeta.meta[status]
  return {
    label: meta.label,
    className: meta.className,
    isActive: meta.isActive,
    isComplete: meta.isComplete,
  }
}

const getBillingTypeLabel = (billingType?: ServiceBillingType) => {
  if (!billingType) return ""
  return ServiceBillingTypeMeta.meta[billingType].shortLabel
}

// =============================================================================
// COMPONENT
// =============================================================================

export function POLinesTable({
  lines,
  viewMode,
  showPOColumn = false,
  onLineClick,
  className,
}: POLinesTableProps) {
  const handleRowClick = (line: POLineItem) => {
    onLineClick?.(line)
  }

  switch (viewMode) {
    case "basic":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Project</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Ext. Cost</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={`${line.poNumber}-${line.id}`}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => handleRowClick(line)}
                >
                  {showPOColumn && (
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{line.poNumber}</span>
                    </td>
                  )}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                      {line.lineNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Line type icon for service/NRE lines */}
                      {isServiceLine(line) && (
                        (() => {
                          const TypeIcon = getLineTypeIcon(line.lineType)
                          const typeBadge = getLineTypeBadge(line.lineType)
                          return typeBadge ? (
                            <span className={cn(
                              "inline-flex items-center gap-0.5 text-[10px] font-medium px-1 py-0.5 rounded",
                              typeBadge.className
                            )}>
                              <TypeIcon className="w-2.5 h-2.5" />
                              {typeBadge.label}
                            </span>
                          ) : null
                        })()
                      )}
                      <span className="text-primary font-medium">{line.sku}</span>
                      {line.expedite && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                          <Zap className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{line.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {line.projectCode || line.projectName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <LineStatusPill status={line.status} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">{line.quantityOrdered}</td>
                  <td className="py-3 px-4 text-right tabular-nums">${line.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-medium">${line.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "financials":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Subtotal</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Discount</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Expedite</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Tax</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const subtotal = line.subtotal ?? line.lineTotal
                const discount = line.discountAmount ?? 0
                const tax = line.taxAmount ?? 0
                const expedite = line.expediteFee ?? 0
                const total = line.lineTotalWithTax ?? (subtotal - discount + tax + expedite)

                return (
                  <tr
                    key={`${line.poNumber}-${line.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(line)}
                  >
                    {showPOColumn && (
                      <td className="py-3 px-4">
                        <span className="text-primary font-medium">{line.poNumber}</span>
                      </td>
                    )}
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs text-muted-foreground">{line.lineNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{line.sku}</span>
                        <span className="text-xs text-muted-foreground">{line.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {discount > 0 ? (
                        <span className="text-muted-foreground">
                          (${discount.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {expedite > 0 ? (
                        <span>${expedite.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                      {tax > 0 ? `$${tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">
                      ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    case "quantity":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Ordered</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Shipped</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Received</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Accepted</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">QH</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Paid</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={`${line.poNumber}-${line.id}`}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(line)}
                >
                  {showPOColumn && (
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{line.poNumber}</span>
                    </td>
                  )}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                      {line.lineNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-primary font-medium">{line.sku}</span>
                  </td>
                  <td className="py-3 px-4">{line.name}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <LineStatusPill status={line.status} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">{line.quantityOrdered}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{line.quantityShipped}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{line.quantityReceived}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{line.quantityAccepted ?? "-"}</td>
                  <td className="py-3 px-4 text-center">
                    {line.quantityInQualityHold > 0 ? (
                      <span className="text-amber-600 tabular-nums font-medium">{line.quantityInQualityHold}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">{line.quantityPaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "needs":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Project</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Need Date</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Promised</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Gap</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const needDate = line.needDate ? parseDate(line.needDate) : null
                const promisedDate = parseDate(line.promisedDate)
                const gapDays = needDate ? Math.ceil((promisedDate.getTime() - needDate.getTime()) / (1000 * 60 * 60 * 24)) : null
                const isAtRisk = gapDays !== null && gapDays > 0

                return (
                  <tr
                    key={`${line.poNumber}-${line.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(line)}
                  >
                    {showPOColumn && (
                      <td className="py-3 px-4">
                        <span className="text-primary font-medium">{line.poNumber}</span>
                      </td>
                    )}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {line.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{line.sku}</span>
                    </td>
                    <td className="py-3 px-4">{line.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {line.projectCode || line.projectName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">{line.quantityOrdered}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {line.needDate || "—"}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {line.promisedDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {gapDays !== null ? (
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded",
                          gapDays > 0 ? "text-destructive bg-destructive/10" :
                          gapDays < 0 ? "text-primary bg-primary/10" :
                          "text-muted-foreground bg-muted"
                        )}>
                          {gapDays > 0 ? `+${gapDays}d late` : gapDays < 0 ? `${Math.abs(gapDays)}d early` : "On time"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    case "quality":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Insp</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">CoC</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Received</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Accepted</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">In Hold</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">NCRs</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Quality</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const hasQualityIssue = line.quantityInQualityHold > 0 || (line.ncrCount ?? 0) > 0

                return (
                  <tr
                    key={`${line.poNumber}-${line.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(line)}
                  >
                    {showPOColumn && (
                      <td className="py-3 px-4">
                        <span className="text-primary font-medium">{line.poNumber}</span>
                      </td>
                    )}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {line.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{line.sku}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {line.inspectionRequired ? (
                        <Eye className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {line.cocRequired ? (
                        <FlaskConical className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">{line.quantityReceived}</td>
                    <td className="py-3 px-4 text-center tabular-nums">{line.quantityAccepted ?? "-"}</td>
                    <td className="py-3 px-4 text-center">
                      {line.quantityInQualityHold > 0 ? (
                        <span className="text-amber-600 tabular-nums font-medium">{line.quantityInQualityHold}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(line.ncrCount ?? 0) > 0 ? (
                        <span className="text-destructive tabular-nums font-medium">{line.ncrCount}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasQualityIssue ? (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <FileWarning className="w-3.5 h-3.5" />
                          Issues
                        </span>
                      ) : line.quantityReceived > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Clear
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    case "logistics":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Promised</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Expected</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Shipments</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const expectedInfo = getExpectedDateInfo(line)
                const lineStatus = getDeliveryStatus(line)
                const StatusIcon = lineStatus.icon

                return (
                  <tr
                    key={`${line.poNumber}-${line.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(line)}
                  >
                    {showPOColumn && (
                      <td className="py-3 px-4">
                        <span className="text-primary font-medium">{line.poNumber}</span>
                      </td>
                    )}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {line.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">{line.sku}</span>
                        {line.expedite && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Zap className="w-2.5 h-2.5" />
                            EXPEDITE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center tabular-nums text-xs leading-tight">
                        <span className={line.quantityReceived >= line.quantityOrdered ? "text-primary font-medium" : ""}>
                          {line.quantityReceived}
                        </span>
                        <span className="text-muted-foreground text-[10px]">of {line.quantityOrdered}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-xs">{line.promisedDate}</td>
                    <td className="py-3 px-4 text-center text-xs">
                      {expectedInfo.date ? (
                        <span className={
                          expectedInfo.status === "delivered" ? "text-primary font-medium" :
                          expectedInfo.status === "delayed" ? "text-destructive" : ""
                        }>
                          {expectedInfo.date}
                        </span>
                      ) : expectedInfo.status === "delayed" ? (
                        <span className="text-destructive">TBD</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {line.shipments && line.shipments.length > 0 ? (
                          line.shipments.map((shipment) => {
                            const pillInfo = getShipmentPillInfo(shipment.status)
                            const PillIcon = pillInfo.icon
                            return (
                              <span
                                key={shipment.id}
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${pillInfo.style}`}
                              >
                                <PillIcon className="w-2.5 h-2.5" />
                                {shipment.id}
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded",
                        lineStatus.bgColor,
                        lineStatus.color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {lineStatus.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    case "sourcing":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Vendor</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Contract</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Last Price</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Variance</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const variance = line.lastPurchasePrice
                  ? ((line.unitPrice - line.lastPurchasePrice) / line.lastPurchasePrice) * 100
                  : null

                return (
                  <tr
                    key={`${line.poNumber}-${line.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(line)}
                  >
                    {showPOColumn && (
                      <td className="py-3 px-4">
                        <span className="text-primary font-medium">{line.poNumber}</span>
                      </td>
                    )}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {line.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{line.sku}</span>
                    </td>
                    <td className="py-3 px-4">{line.name}</td>
                    <td className="py-3 px-4">
                      <div className="text-foreground">{line.vendor || line.preferredVendor || "—"}</div>
                      {line.vendorCode && (
                        <div className="text-xs text-muted-foreground">{line.vendorCode}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {line.contractNumber ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {line.contractNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">${line.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                      {line.lastPurchasePrice ? `$${line.lastPurchasePrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {variance !== null ? (
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded tabular-nums",
                          variance > 5 ? "text-destructive bg-destructive/10" :
                          variance < -5 ? "text-primary bg-primary/10" :
                          "text-muted-foreground bg-muted"
                        )}>
                          {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    case "services":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showPOColumn && <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Service</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Category</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Billing</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Progress</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Hours/Units</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines
                .filter((line) => isServiceLine(line))
                .map((line) => {
                  const serviceDetails = line.serviceDetails
                  const progress = serviceDetails?.progress
                  const billingType = serviceDetails?.billingType
                  const statusInfo = getServiceStatusInfo(line.serviceStatus)
                  const TypeIcon = getLineTypeIcon(line.lineType)

                  return (
                    <tr
                      key={`${line.poNumber}-${line.id}`}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(line)}
                    >
                      {showPOColumn && (
                        <td className="py-3 px-4">
                          <span className="text-primary font-medium">{line.poNumber}</span>
                        </td>
                      )}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                          {line.lineNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{line.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{line.sku}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          {serviceDetails?.category || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {billingType ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded",
                            ServiceBillingTypeMeta.meta[billingType].className
                          )}>
                            {billingType === ServiceBillingType.Milestone && <Flag className="w-3 h-3" />}
                            {getBillingTypeLabel(billingType)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {progress ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all",
                                  progress.percentComplete >= 100 ? "bg-emerald-500" :
                                  progress.percentComplete >= 50 ? "bg-blue-500" : "bg-amber-500"
                                )}
                                style={{ width: `${Math.min(100, progress.percentComplete)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium tabular-nums">
                              {progress.percentComplete}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {progress ? (
                          <span className="text-xs tabular-nums">
                            {progress.consumedUnits} / {progress.estimatedUnits}
                            <span className="text-muted-foreground ml-1">
                              {progress.unitType === "hours" ? "hrs" : progress.unitType}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium">
                        ${line.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {statusInfo ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded",
                            statusInfo.className
                          )}>
                            {statusInfo.isActive && <Play className="w-3 h-3" />}
                            {statusInfo.isComplete && <CheckCircle2 className="w-3 h-3" />}
                            {statusInfo.label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              {lines.filter((line) => isServiceLine(line)).length === 0 && (
                <tr>
                  <td
                    colSpan={showPOColumn ? 9 : 8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="w-8 h-8 text-muted-foreground/50" />
                      <span>No service lines on this order</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )

    default:
      return null
  }
}
