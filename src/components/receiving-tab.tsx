"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ExternalLink,
  FileWarning,
  DollarSign,
  AlertTriangle,
  CircleDashed,
} from "lucide-react"
import { shipments, computeReceivingStats, detectPOIssues, type Shipment, type ShipmentStatus } from "@/lib/mock-data"
import { IssueRef } from "@/components/issue-ref"

interface LineItem {
  id: number
  sku: string
  name: string
  quantity: number
  quantityOrdered?: number
  quantityShipped?: number
  quantityReceived?: number
  quantityAccepted?: number
  quantityInQualityHold?: number
  promisedDate?: string
  status?: string
}

interface ReceivingTabProps {
  lineItems: LineItem[]
}

export function ReceivingTab({ lineItems }: ReceivingTabProps) {
  const [expandedShipment, setExpandedShipment] = useState<string | null>("SHP-001")

  // Use centralized stats computation
  const stats = computeReceivingStats()

  // Get all issues for linking
  const allIssues = detectPOIssues()

  // Helper to find issues for a line
  const getIssuesForLine = (lineNumber: number) => {
    return allIssues.filter(i => i.lineNumber === lineNumber)
  }

  const completedShipments = shipments.filter(s => s.status === "received")
  const upcomingShipments = shipments.filter(s => s.status !== "received")

  const getStatusIcon = (status: ShipmentStatus) => {
    switch (status) {
      case "received": return <CheckCircle2 className="w-5 h-5 text-primary" />
      case "in_transit": return <Truck className="w-5 h-5 text-primary/70" />
      case "expected": return <Clock className="w-5 h-5 text-muted-foreground" />
      case "on_hold": return <AlertCircle className="w-5 h-5 text-amber-500" />
      default: return <CircleDashed className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: ShipmentStatus) => {
    switch (status) {
      case "received": return "Received"
      case "in_transit": return "In Transit"
      case "expected": return "Awaiting Shipment"
      case "on_hold": return "On Hold"
      default: return status
    }
  }

  const getStatusStyle = (status: ShipmentStatus) => {
    switch (status) {
      case "received": return "border-l-primary"
      case "in_transit": return "border-l-primary/50"
      case "expected": return "border-l-border"
      case "on_hold": return "border-l-amber-400"
      default: return "border-l-border"
    }
  }

  const renderShipmentCard = (shipment: Shipment) => {
    const isExpanded = expandedShipment === shipment.id
    const hasOpenNCR = shipment.ncrs?.some(n => n.status === "open")
    const hasVariance = shipment.payable?.type === "variance"
    const totalUnits = shipment.lines.reduce((sum, l) => sum + l.qtyShipped, 0)
    const lineCount = shipment.lines.length

    return (
      <div
        key={shipment.id}
        className={`border border-border rounded-lg overflow-hidden border-l-2 bg-background ${getStatusStyle(shipment.status)}`}
      >
        {/* Header - Always visible */}
        <button
          onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
          className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
        >
          {/* Status Icon */}
          <div className="flex-shrink-0">
            {getStatusIcon(shipment.status)}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-medium">{shipment.id}</span>
              <span className="text-sm text-muted-foreground">
                {lineCount} {lineCount === 1 ? "line" : "lines"} · {totalUnits} units
              </span>
              <Badge variant="outline" className="text-xs">
                {getStatusLabel(shipment.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {shipment.status === "received" ? (
                <>Received {shipment.receivedDate} at {shipment.location}</>
              ) : shipment.status === "in_transit" ? (
                <>Shipped {shipment.shipDate} · Expected {shipment.expectedDate}</>
              ) : shipment.status === "on_hold" ? (
                <>Expected {shipment.expectedDate} · {shipment.holdReason}</>
              ) : (
                <>Expected {shipment.expectedDate}</>
              )}
            </p>
          </div>

          {/* Issue Indicators */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasOpenNCR && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileWarning className="w-3.5 h-3.5 text-destructive" />
              </span>
            )}
            {hasVariance && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </span>
            )}
          </div>

          {/* Tracking */}
          {shipment.tracking && (
            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
              {shipment.tracking}
            </span>
          )}

          {/* Expand Icon */}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-border bg-muted/20">
            {/* Line Items Detail */}
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-center font-medium pb-2 w-12">#</th>
                    <th className="text-left font-medium pb-2 pl-2">Line</th>
                    <th className="text-right font-medium pb-2">Shipped</th>
                    <th className="text-right font-medium pb-2">Received</th>
                    <th className="text-right font-medium pb-2">Accepted</th>
                    <th className="text-right font-medium pb-2 pr-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.lines.map((line) => (
                    <tr key={line.sku} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                          {line.lineNumber}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2">
                        <span className="font-medium text-primary">{line.sku}</span>
                        <span className="text-muted-foreground ml-2">{line.name}</span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{line.qtyShipped}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        {line.qtyReceived !== undefined ? line.qtyReceived : "—"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {line.qtyAccepted !== undefined ? line.qtyAccepted : "—"}
                      </td>
                      <td className="py-2.5 pr-2 text-right">
                        {(() => {
                          const lineIssues = getIssuesForLine(line.lineNumber)
                          const hasHold = line.qtyOnHold && line.qtyOnHold > 0
                          const hasRejected = line.qtyRejected && line.qtyRejected > 0

                          if (hasHold || hasRejected || lineIssues.length > 0) {
                            return (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {hasHold && <span className="text-amber-600 text-xs">{line.qtyOnHold} hold</span>}
                                {hasRejected && <span className="text-destructive text-xs">{line.qtyRejected} rejected</span>}
                                {lineIssues.slice(0, 2).map(issue => (
                                  <IssueRef
                                    key={issue.id}
                                    issueId={issue.id}
                                    issueNumber={issue.issueNumber || issue.id}
                                    severity={issue.priority as "critical" | "high" | "medium" | "low"}
                                  />
                                ))}
                              </div>
                            )
                          }
                          return line.qtyReceived !== undefined ? (
                            <span className="text-muted-foreground">—</span>
                          ) : null
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NCRs */}
            {shipment.ncrs && shipment.ncrs.length > 0 && (
              <div className="px-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FileWarning className="w-3 h-3" /> Quality Issues
                </div>
                <div className="space-y-2">
                  {shipment.ncrs.map((ncr) => (
                    <div
                      key={ncr.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background"
                    >
                      <FileWarning className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ncr.status === "open" ? "text-destructive" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-xs font-medium">
                            {ncr.lineNumber}
                          </span>
                          <span className="text-sm font-medium">{ncr.id}</span>
                          {/* Link to associated issue */}
                          {(() => {
                            const lineIssues = getIssuesForLine(ncr.lineNumber)
                            const ncrIssue = lineIssues.find(i => i.category === "ncr" || i.category === "quality_hold")
                            return ncrIssue ? (
                              <IssueRef
                                issueId={ncrIssue.id}
                                issueNumber={ncrIssue.issueNumber || ncrIssue.id}
                                severity={ncrIssue.priority as "critical" | "high" | "medium" | "low"}
                              />
                            ) : null
                          })()}
                          <Badge variant="outline" className="text-xs">
                            {ncr.status}
                          </Badge>
                          {ncr.severity === "high" && (
                            <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                              {ncr.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{ncr.description}</p>
                        {ncr.qtyAffected > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{ncr.qtyAffected} unit affected</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payable */}
            {shipment.payable && (
              <div className="px-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Payables
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  {shipment.payable.type === "matched" ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : shipment.payable.type === "variance" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{shipment.payable.description}</p>
                  </div>
                  {/* Link to invoice issue if variance */}
                  {shipment.payable.type === "variance" && (() => {
                    const invoiceIssue = allIssues.find(i => i.category === "invoice" || i.category === "payable")
                    return invoiceIssue ? (
                      <IssueRef
                        issueId={invoiceIssue.id}
                        issueNumber={invoiceIssue.issueNumber || invoiceIssue.id}
                        severity={invoiceIssue.priority as "critical" | "high" | "medium" | "low"}
                      />
                    ) : null
                  })()}
                  {shipment.payable.amount && (
                    <span className="font-medium text-foreground">
                      ${shipment.payable.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Footer with tracking link */}
            {shipment.tracking && (
              <div className="px-4 pb-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {shipment.carrier} · {shipment.receivedBy ? `Received by ${shipment.receivedBy}` : ""}
                </span>
                <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Track Shipment <ExternalLink className="w-3 h-3" />
                </a>
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
        <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
          <p className="text-2xl font-semibold">{stats.totalAccepted}</p>
          <p className="text-xs text-muted-foreground">Accepted</p>
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

      {/* Completed Shipments */}
      {completedShipments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Received ({completedShipments.length})
          </h3>
          <div className="space-y-2">
            {completedShipments.map(renderShipmentCard)}
          </div>
        </div>
      )}

      {/* Upcoming Shipments */}
      {upcomingShipments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Upcoming ({upcomingShipments.length})
          </h3>
          <div className="space-y-2">
            {upcomingShipments.map(renderShipmentCard)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {shipments.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No shipments yet</p>
          <p className="text-xs text-muted-foreground mt-1">Shipments will appear here once the vendor ships items</p>
        </div>
      )}
    </div>
  )
}
