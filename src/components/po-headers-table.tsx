"use client"

import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Truck,
  Clock,
  Zap,
  Package,
  ExternalLink,
  Mail,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { POViewMode } from "@/components/po-view-selector"

// Extended PO type for cross-PO views with all necessary fields
export interface ExtendedPO {
  id: string
  vendor: string
  vendorCode: string
  status: "open" | "partially_received" | "received" | "closed" | "cancelled"
  urgency: "standard" | "high" | "critical"
  // Financial
  total: number
  invoiced: number
  paid: number
  openBalance: number
  paymentTerms: string
  paymentDueDate: string
  // Lines
  linesCount: number
  openLines: number
  linesReceived: number
  // Issues
  issuesCount: number
  criticalIssues: number
  qualityHolds: number
  // Dates
  created: string
  expected: string
  lastReceipt?: string
  // Delivery
  shipMethod: string
  destination: string
  shipmentsInTransit: number
  shipmentsComplete: number
  carrier?: string
  // Fulfillment
  qtyOrdered: number
  qtyReceived: number
  valueReceived: number
  daysOpen: number
  // Risk
  lateRisk: "none" | "low" | "medium" | "high"
  vendorOnTime: number
  daysToDue: number
}

interface POHeadersTableProps {
  purchaseOrders: ExtendedPO[]
  viewMode: POViewMode
  onPOClick?: (po: ExtendedPO) => void
  className?: string
}

// Utility functions
const getStatusDisplay = (status: string) => {
  switch (status) {
    case "open":
      return { label: "Open", className: "bg-primary/10 text-primary" }
    case "partially_received":
      return { label: "Partial", className: "bg-amber-100 text-amber-800" }
    case "received":
      return { label: "Received", className: "bg-primary/10 text-primary" }
    case "closed":
      return { label: "Closed", className: "bg-muted text-muted-foreground" }
    case "cancelled":
      return { label: "Cancelled", className: "bg-destructive/10 text-destructive" }
    default:
      return { label: status, className: "bg-muted text-muted-foreground" }
  }
}

const getUrgencyDisplay = (urgency: string) => {
  switch (urgency) {
    case "critical":
      return { label: "Critical", className: "bg-destructive/10 text-destructive" }
    case "high":
      return { label: "High", className: "bg-amber-100 text-amber-800" }
    default:
      return null
  }
}

const getLateRiskDisplay = (risk: string) => {
  switch (risk) {
    case "high":
      return { label: "High", className: "text-destructive", icon: AlertTriangle }
    case "medium":
      return { label: "Medium", className: "text-amber-600", icon: AlertTriangle }
    case "low":
      return { label: "Low", className: "text-muted-foreground", icon: Clock }
    default:
      return { label: "None", className: "text-primary", icon: CheckCircle2 }
  }
}

export function POHeadersTable({
  purchaseOrders,
  viewMode,
  onPOClick,
  className,
}: POHeadersTableProps) {
  switch (viewMode) {
    case "overview":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO Number</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Vendor</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Value</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Lines</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Issues</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Expected</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const statusDisplay = getStatusDisplay(po.status)
                const urgencyDisplay = getUrgencyDisplay(po.urgency)

                return (
                  <tr
                    key={po.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => onPOClick?.(po)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">{po.id}</span>
                        {urgencyDisplay && (
                          <Badge className={cn("text-[10px] px-1.5 py-0", urgencyDisplay.className)}>
                            {urgencyDisplay.label}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{po.vendor}</div>
                      <div className="text-xs text-muted-foreground">{po.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={cn("text-xs", statusDisplay.className)}>{statusDisplay.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">
                      ${po.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={po.openLines > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                        {po.openLines}/{po.linesCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.issuesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {po.issuesCount}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{po.expected}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    case "financial":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO Number</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Vendor</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">PO Value</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Invoiced</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Paid</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Open Balance</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Terms</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const invoiceProgress = po.total > 0 ? (po.invoiced / po.total) * 100 : 0
                const paidProgress = po.invoiced > 0 ? (po.paid / po.invoiced) * 100 : 0

                return (
                  <tr
                    key={po.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onPOClick?.(po)}
                  >
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{po.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{po.vendor}</div>
                      <div className="text-xs text-muted-foreground">{po.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">
                      ${po.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="tabular-nums">
                        ${po.invoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full mt-1 ml-auto">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(invoiceProgress, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="tabular-nums">
                        ${po.paid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full mt-1 ml-auto">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(paidProgress, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "tabular-nums font-medium",
                        po.openBalance > 0 ? "text-amber-600" : "text-primary"
                      )}>
                        ${po.openBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {po.paymentTerms}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{po.paymentDueDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )

    case "delivery":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO Number</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Vendor</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Ship Method</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Destination</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Expected</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Shipments</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Carrier</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const totalShipments = po.shipmentsInTransit + po.shipmentsComplete
                const allDelivered = po.status === "received" || (totalShipments > 0 && po.shipmentsComplete === totalShipments && po.openLines === 0)

                return (
                  <tr
                    key={po.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onPOClick?.(po)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">{po.id}</span>
                        {po.urgency === "critical" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                            <Zap className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{po.vendor}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {po.shipMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{po.destination}</td>
                    <td className="py-3 px-4 text-foreground">{po.expected}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {po.shipmentsInTransit > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            <Truck className="w-2.5 h-2.5" />
                            {po.shipmentsInTransit}
                          </span>
                        )}
                        {po.shipmentsComplete > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            <Package className="w-2.5 h-2.5" />
                            {po.shipmentsComplete}
                          </span>
                        )}
                        {totalShipments === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{po.carrier || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      {allDelivered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Delivered
                        </span>
                      ) : po.shipmentsInTransit > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <Truck className="w-3 h-3" />
                          In Transit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
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

    case "fulfillment":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO Number</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Vendor</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Lines</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Qty %</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Value %</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Last Receipt</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Days Open</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const qtyPercent = po.qtyOrdered > 0 ? Math.round((po.qtyReceived / po.qtyOrdered) * 100) : 0
                const valuePercent = po.total > 0 ? Math.round((po.valueReceived / po.total) * 100) : 0
                const isComplete = qtyPercent >= 100

                return (
                  <tr
                    key={po.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onPOClick?.(po)}
                  >
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{po.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{po.vendor}</div>
                      <div className="text-xs text-muted-foreground">{po.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center tabular-nums text-xs leading-tight">
                        <span className={po.linesReceived >= po.linesCount ? "text-primary font-medium" : ""}>
                          {po.linesReceived}
                        </span>
                        <span className="text-muted-foreground text-[10px]">of {po.linesCount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "text-xs font-medium tabular-nums",
                          qtyPercent >= 100 ? "text-primary" : qtyPercent >= 50 ? "text-foreground" : "text-amber-600"
                        )}>
                          {qtyPercent}%
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              qtyPercent >= 100 ? "bg-primary" : qtyPercent >= 50 ? "bg-amber-500" : "bg-amber-400"
                            )}
                            style={{ width: `${Math.min(qtyPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "text-xs font-medium tabular-nums",
                          valuePercent >= 100 ? "text-primary" : valuePercent >= 50 ? "text-foreground" : "text-amber-600"
                        )}>
                          {valuePercent}%
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              valuePercent >= 100 ? "bg-primary" : valuePercent >= 50 ? "bg-amber-500" : "bg-amber-400"
                            )}
                            style={{ width: `${Math.min(valuePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{po.lastReceipt || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        "tabular-nums",
                        po.daysOpen > 30 ? "text-amber-600 font-medium" : "text-muted-foreground"
                      )}>
                        {po.daysOpen}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Complete
                        </span>
                      ) : qtyPercent > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
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

    case "risk":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO Number</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Vendor</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Critical</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Quality Holds</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Late Risk</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Vendor On-Time</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Days to Due</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const riskDisplay = getLateRiskDisplay(po.lateRisk)
                const RiskIcon = riskDisplay.icon
                const hasIssues = po.criticalIssues > 0 || po.qualityHolds > 0 || po.lateRisk === "high"

                return (
                  <tr
                    key={po.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onPOClick?.(po)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">{po.id}</span>
                        {po.urgency === "critical" && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive">
                            Critical
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{po.vendor}</div>
                      <div className="text-xs text-muted-foreground">{po.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.criticalIssues > 0 ? (
                        <span className="inline-flex items-center gap-1 text-destructive font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {po.criticalIssues}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.qualityHolds > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {po.qualityHolds}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", riskDisplay.className)}>
                        <RiskIcon className="w-3.5 h-3.5" />
                        {riskDisplay.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              po.vendorOnTime >= 90 ? "bg-primary" : po.vendorOnTime >= 80 ? "bg-amber-500" : "bg-destructive"
                            )}
                            style={{ width: `${po.vendorOnTime}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums">{po.vendorOnTime}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        "tabular-nums font-medium",
                        po.daysToDue <= 7 ? "text-destructive" : po.daysToDue <= 14 ? "text-amber-600" : "text-muted-foreground"
                      )}>
                        {po.daysToDue}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasIssues ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          At Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          OK
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

    default:
      return null
  }
}
