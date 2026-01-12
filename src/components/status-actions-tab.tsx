"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ExternalLink,
  FileWarning,
  AlertTriangle,
  CircleDashed,
  Mail,
  Phone,
  PackageCheck,
  DollarSign,
} from "lucide-react"
import { shipments, lineItems, computeReceivingStats, type Shipment } from "@/lib/mock-data"
import { useEmailContext } from "@/context/EmailContext"
import { LineStatusPill } from "@/components/line-status-pill"

// Shipment data for a specific line
interface LineShipment {
  shipmentId: string
  status: Shipment["status"]
  shipDate?: string
  expectedDate?: string
  receivedDate?: string
  location?: string
  carrier?: string
  tracking?: string
  qtyShipped: number
  qtyReceived?: number
  qtyAccepted?: number
  qtyOnHold?: number
  qtyRejected?: number
  payable?: { type: "matched" | "variance" | "pending"; description: string; amount?: number }
  ncrs: {
    id: string
    type: string
    severity: "high" | "medium" | "low"
    status: "open" | "closed"
    description: string
    qtyAffected: number
  }[]
  isLate?: boolean
  needsConfirmation?: boolean
}

// Line with all its shipment activity
interface LineWithActivity {
  line: typeof lineItems[0]
  shipments: LineShipment[]
  hasIssues: boolean
  hasOpenNCR: boolean
  hasQualityHold: boolean
  hasPayableVariance: boolean
  hasLateShipment: boolean
  totalShipped: number
  totalReceived: number
  totalAccepted: number
  totalOnHold: number
}

export function StatusActionsTab() {
  const [expandedLine, setExpandedLine] = useState<string | null>(null)
  const { openEmailModal } = useEmailContext()

  const stats = computeReceivingStats()

  // Build line-centric data
  const linesWithActivity: LineWithActivity[] = lineItems.map((line) => {
    // Find all shipments that include this line
    const lineShipments: LineShipment[] = shipments
      .filter((s) => s.lines.some((sl) => sl.sku === line.sku))
      .map((s) => {
        const shipmentLine = s.lines.find((sl) => sl.sku === line.sku)!
        const lineNCRs = (s.ncrs || []).filter((ncr) => ncr.lineNumber === line.lineNumber)

        // Check if shipment is late or needs confirmation
        const isLate = s.status === "in_transit" && s.expectedDate === "Jan 28, 2026" // Mock: SHP-003 is running late
        const needsConfirmation = s.status === "expected"

        return {
          shipmentId: s.id,
          status: s.status,
          shipDate: s.shipDate,
          expectedDate: s.expectedDate,
          receivedDate: s.receivedDate,
          location: s.location,
          carrier: s.carrier,
          tracking: s.tracking,
          qtyShipped: shipmentLine.qtyShipped,
          qtyReceived: shipmentLine.qtyReceived,
          qtyAccepted: shipmentLine.qtyAccepted,
          qtyOnHold: shipmentLine.qtyOnHold,
          qtyRejected: shipmentLine.qtyRejected,
          payable: s.payable,
          ncrs: lineNCRs,
          isLate,
          needsConfirmation,
        }
      })

    const hasOpenNCR = lineShipments.some((s) => s.ncrs.some((n) => n.status === "open"))
    const hasQualityHold = line.quantityInQualityHold > 0
    const hasPayableVariance = lineShipments.some((s) => s.payable?.type === "variance")
    const hasLateShipment = lineShipments.some((s) => s.isLate || s.needsConfirmation)
    const totalShipped = lineShipments.reduce((sum, s) => sum + s.qtyShipped, 0)
    const totalReceived = lineShipments.reduce((sum, s) => sum + (s.qtyReceived || 0), 0)
    const totalAccepted = lineShipments.reduce((sum, s) => sum + (s.qtyAccepted || 0), 0)
    const totalOnHold = lineShipments.reduce((sum, s) => sum + (s.qtyOnHold || 0), 0)

    return {
      line,
      shipments: lineShipments,
      hasIssues: hasOpenNCR || hasQualityHold || hasPayableVariance || hasLateShipment,
      hasOpenNCR,
      hasQualityHold,
      hasPayableVariance,
      hasLateShipment,
      totalShipped,
      totalReceived,
      totalAccepted,
      totalOnHold,
    }
  })

  // Group lines
  const linesWithIssues = linesWithActivity.filter((l) => l.hasIssues)
  const linesOnTrack = linesWithActivity.filter((l) => !l.hasIssues && l.totalShipped > 0)
  const linesAwaitingShipment = linesWithActivity.filter((l) => l.totalShipped === 0)

  // Counts
  const openNCRCount = linesWithActivity.filter((l) => l.hasOpenNCR).length

  const getLineStatusBorder = (lineData: LineWithActivity) => {
    if (lineData.hasOpenNCR) return "border-l-destructive"
    if (lineData.hasQualityHold || lineData.hasPayableVariance) return "border-l-amber-400"
    if (lineData.hasLateShipment) return "border-l-amber-400"
    if (lineData.totalReceived === lineData.line.quantityOrdered) return "border-l-primary"
    if (lineData.totalShipped > 0) return "border-l-primary/50"
    return "border-l-border"
  }

  const getShipmentStatusIcon = (status: Shipment["status"]) => {
    switch (status) {
      case "received": return <PackageCheck className="w-4 h-4 text-primary" />
      case "in_transit": return <Truck className="w-4 h-4 text-primary/70" />
      case "expected": return <Clock className="w-4 h-4 text-muted-foreground" />
      case "on_hold": return <AlertCircle className="w-4 h-4 text-amber-500" />
      default: return <CircleDashed className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getShipmentStatusLabel = (status: Shipment["status"]) => {
    switch (status) {
      case "received": return "Received"
      case "in_transit": return "In Transit"
      case "expected": return "Expected"
      case "on_hold": return "On Hold"
      default: return status
    }
  }

  const handleEmailVendor = (context: { ncrId?: string; sku?: string; itemName?: string; issueType?: string }) => {
    openEmailModal({
      contextType: context.ncrId ? "ncr" : "general",
      poNumber: "PO-0861",
      ncrId: context.ncrId,
      sku: context.sku,
      itemName: context.itemName,
    })
  }

  const renderLineCard = (lineData: LineWithActivity) => {
    const { line } = lineData
    const isExpanded = expandedLine === line.sku

    return (
      <div
        key={line.sku}
        className={`border border-border rounded-lg overflow-hidden border-l-2 bg-background ${getLineStatusBorder(lineData)}`}
      >
        {/* Header - No icons, just clean info */}
        <button
          onClick={() => setExpandedLine(isExpanded ? null : line.sku)}
          className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                {line.lineNumber}
              </span>
              <span className="text-sm font-medium text-primary">{line.sku}</span>
              <span className="text-sm text-muted-foreground">{line.name}</span>
            </div>
            <p className="text-xs text-muted-foreground ml-9">
              {lineData.totalShipped === 0 ? (
                <>Promised {line.promisedDate}</>
              ) : (
                <>{lineData.totalReceived}/{line.quantityOrdered} received · {lineData.totalAccepted} accepted{lineData.totalOnHold > 0 && <> · <span className="text-amber-600">{lineData.totalOnHold} hold</span></>}</>
              )}
            </p>
          </div>

          {/* Issue indicators - small, subtle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {lineData.hasOpenNCR && <FileWarning className="w-3.5 h-3.5 text-destructive" />}
            {lineData.hasPayableVariance && <DollarSign className="w-3.5 h-3.5 text-amber-500" />}
            {lineData.hasLateShipment && !lineData.hasOpenNCR && !lineData.hasPayableVariance && <Clock className="w-3.5 h-3.5 text-amber-500" />}
          </div>

          <div className="flex-shrink-0">
            <LineStatusPill status={line.status} />
          </div>

          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-border bg-muted/20">
            {/* Shipments Table */}
            {lineData.shipments.length > 0 && (
              <div className="p-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Shipments
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left font-medium pb-2 pl-2">Shipment</th>
                      <th className="text-center font-medium pb-2">Status</th>
                      <th className="text-right font-medium pb-2">Shipped</th>
                      <th className="text-right font-medium pb-2">Received</th>
                      <th className="text-right font-medium pb-2">Accepted</th>
                      <th className="text-right font-medium pb-2 pr-2">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineData.shipments.map((shipment) => (
                      <tr key={shipment.shipmentId} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pl-2">
                          <div className="flex items-center gap-2">
                            {getShipmentStatusIcon(shipment.status)}
                            <span className="font-medium">{shipment.shipmentId}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {shipment.status === "received" ? (
                              <>{shipment.receivedDate} · {shipment.carrier}</>
                            ) : (
                              <>Expected {shipment.expectedDate}</>
                            )}
                          </p>
                        </td>
                        <td className="py-2.5 text-center">
                          <Badge variant="outline" className={`text-xs ${shipment.isLate ? "border-amber-300 text-amber-600" : ""}`}>
                            {shipment.isLate ? "Late" : shipment.needsConfirmation ? "Confirm" : getShipmentStatusLabel(shipment.status)}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{shipment.qtyShipped}</td>
                        <td className="py-2.5 text-right tabular-nums">
                          {shipment.qtyReceived !== undefined ? shipment.qtyReceived : "—"}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {shipment.qtyAccepted !== undefined ? shipment.qtyAccepted : "—"}
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          {(shipment.qtyOnHold && shipment.qtyOnHold > 0) ? (
                            <span className="text-amber-600">{shipment.qtyOnHold} hold</span>
                          ) : (shipment.qtyRejected && shipment.qtyRejected > 0) ? (
                            <span className="text-destructive">{shipment.qtyRejected} rejected</span>
                          ) : shipment.ncrs.some(n => n.status === "open") ? (
                            <span className="text-destructive">NCR</span>
                          ) : shipment.qtyReceived !== undefined ? (
                            <span className="text-muted-foreground">—</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tracking links */}
                {lineData.shipments.some(s => s.tracking) && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-4">
                    {lineData.shipments.filter(s => s.tracking).map((s) => (
                      <a key={s.shipmentId} href="#" className="text-xs text-primary hover:underline flex items-center gap-1">
                        Track {s.shipmentId} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No shipments yet */}
            {lineData.shipments.length === 0 && (
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <CircleDashed className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">No shipments yet</p>
                    <p className="text-xs text-muted-foreground">Promised {line.promisedDate}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEmailVendor({ sku: line.sku, itemName: line.name })
                    }}
                  >
                    <Mail className="w-3 h-3" />
                    Confirm On Track
                  </Button>
                </div>
              </div>
            )}

            {/* Late/Needs Confirmation Shipments */}
            {lineData.shipments.some((s) => s.isLate || s.needsConfirmation) && (
              <div className="px-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Needs Follow-up
                </div>
                <div className="space-y-2">
                  {lineData.shipments.filter(s => s.isLate || s.needsConfirmation).map((shipment) => (
                    <div
                      key={`followup-${shipment.shipmentId}`}
                      className="p-3 rounded-lg border border-amber-200 bg-background"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{shipment.shipmentId}</span>
                            <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                              {shipment.isLate ? "Running Late" : "Awaiting Shipment"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {shipment.isLate
                              ? `Expected ${shipment.expectedDate} - confirm delivery status`
                              : `Expected ${shipment.expectedDate} - confirm vendor will ship on time`}
                          </p>

                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEmailVendor({ sku: line.sku, itemName: line.name })
                              }}
                            >
                              <Mail className="w-3 h-3" />
                              {shipment.isLate ? "Follow Up" : "Confirm On Track"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-3 h-3" />
                              Call
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Issues (NCRs) */}
            {lineData.shipments.some((s) => s.ncrs.length > 0) && (
              <div className="px-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FileWarning className="w-3 h-3" /> Quality Issues
                </div>
                <div className="space-y-2">
                  {lineData.shipments.flatMap((shipment) =>
                    shipment.ncrs.map((ncr) => (
                      <div
                        key={ncr.id}
                        className={`p-3 rounded-lg border bg-background ${
                          ncr.status === "open" ? "border-destructive/30" : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileWarning className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ncr.status === "open" ? "text-destructive" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{ncr.id}</span>
                              <Badge variant="outline" className="text-xs">
                                {ncr.status}
                              </Badge>
                              {ncr.severity === "high" && (
                                <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                                  {ncr.severity}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">· {shipment.shipmentId}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{ncr.description}</p>
                            {ncr.qtyAffected > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">{ncr.qtyAffected} unit affected</p>
                            )}

                            {ncr.status === "open" && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEmailVendor({ ncrId: ncr.id, sku: line.sku, itemName: line.name })
                                  }}
                                >
                                  <Mail className="w-3 h-3" />
                                  Email Vendor
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="w-3 h-3" />
                                  Call
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Payables Issues */}
            {lineData.shipments.some((s) => s.payable?.type === "variance") && (
              <div className="px-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Payables
                </div>
                <div className="space-y-2">
                  {lineData.shipments.filter(s => s.payable?.type === "variance").map((shipment) => (
                    <div
                      key={`payable-${shipment.shipmentId}`}
                      className="p-3 rounded-lg border border-amber-200 bg-background"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">Invoice Variance</span>
                            <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                              Disputed
                            </Badge>
                            <span className="text-xs text-muted-foreground">· {shipment.shipmentId}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{shipment.payable?.description}</p>
                          {shipment.payable?.amount && (
                            <p className="text-xs text-muted-foreground mt-1">Amount: ${shipment.payable.amount.toFixed(2)}</p>
                          )}

                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEmailVendor({ sku: line.sku, itemName: line.name, issueType: "variance" })
                              }}
                            >
                              <Mail className="w-3 h-3" />
                              Dispute with Vendor
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
          <p className="text-2xl font-semibold">{stats.totalOrdered}</p>
          <p className="text-xs text-muted-foreground">Ordered</p>
        </div>
        <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
          <p className="text-2xl font-semibold">{stats.totalShipped}</p>
          <p className="text-xs text-muted-foreground">Shipped</p>
        </div>
        <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
          <p className="text-2xl font-semibold">{stats.totalReceived}</p>
          <p className="text-xs text-muted-foreground">Received</p>
        </div>
        <div className={`rounded-lg px-4 py-3 border text-center ${
          openNCRCount > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border"
        }`}>
          <p className={`text-2xl font-semibold ${openNCRCount > 0 ? "text-destructive" : ""}`}>
            {openNCRCount}
          </p>
          <p className={`text-xs ${openNCRCount > 0 ? "text-destructive/70" : "text-muted-foreground"}`}>
            Open NCRs
          </p>
        </div>
        <div className={`rounded-lg px-4 py-3 border text-center ${
          stats.totalOnHold > 0 ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border"
        }`}>
          <p className={`text-2xl font-semibold ${stats.totalOnHold > 0 ? "text-amber-600" : ""}`}>
            {stats.totalOnHold}
          </p>
          <p className={`text-xs ${stats.totalOnHold > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
            On Hold
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
        <div
          className="h-full bg-primary"
          style={{ width: `${(stats.totalAccepted / stats.totalOrdered) * 100}%` }}
        />
        <div
          className="h-full bg-amber-400"
          style={{ width: `${(stats.totalOnHold / stats.totalOrdered) * 100}%` }}
        />
        <div
          className="h-full bg-primary/40"
          style={{ width: `${((stats.totalShipped - stats.totalReceived) / stats.totalOrdered) * 100}%` }}
        />
      </div>

      {/* Lines with Issues */}
      {linesWithIssues.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Needs Attention ({linesWithIssues.length})
          </h3>
          <div className="space-y-2">
            {linesWithIssues.map(renderLineCard)}
          </div>
        </div>
      )}

      {/* Lines On Track */}
      {linesOnTrack.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            On Track ({linesOnTrack.length})
          </h3>
          <div className="space-y-2">
            {linesOnTrack.map(renderLineCard)}
          </div>
        </div>
      )}

      {/* Lines Awaiting Shipment */}
      {linesAwaitingShipment.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Awaiting Shipment ({linesAwaitingShipment.length})
          </h3>
          <div className="space-y-2">
            {linesAwaitingShipment.map(renderLineCard)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {lineItems.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No line items</p>
        </div>
      )}
    </div>
  )
}
