"use client"

import { useMemo } from "react"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  Package,
  Zap,
  ChevronRight,
} from "lucide-react"
import { LineStatusPill } from "@/components/line-status-pill"
import {
  type LineItem,
  getLineNeedStatus,
  shipments,
  detectPOIssues,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export type LineViewMode = "basic" | "quantity" | "logistics" | "needs" | "quality" | "sourcing"

// Extended line item with optional PO info for cross-PO views
export interface ExtendedLineItem extends LineItem {
  poNumber?: string
  vendorName?: string
  vendorCode?: string
}

interface LineItemsTableProps {
  lines: ExtendedLineItem[]
  viewMode: LineViewMode
  onLineClick?: (item: ExtendedLineItem) => void
  showPOColumn?: boolean
  className?: string
}

export function LineItemsTable({
  lines,
  viewMode,
  onLineClick,
  showPOColumn = false,
  className,
}: LineItemsTableProps) {
  // Helper functions for logistics view
  const parseDate = (dateStr: string) => {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
    const parts = dateStr.replace(",", "").split(" ")
    return new Date(parseInt(parts[2]), months[parts[0]], parseInt(parts[1]))
  }

  const getLineShipments = (lineNumber: number) => {
    return shipments
      .filter(s => s.lines.some(l => l.lineNumber === lineNumber))
      .map(s => ({
        ...s,
        lineQty: s.lines.find(l => l.lineNumber === lineNumber)?.qtyShipped || 0
      }))
  }

  const getExpectedDateInfo = (item: LineItem) => {
    const lineShipments = getLineShipments(item.lineNumber)
    const allReceived = item.quantityReceived >= item.quantityOrdered
    const promisedDate = parseDate(item.promisedDate)

    if (allReceived) {
      const lastReceived = lineShipments
        .filter(s => s.status === "received" && s.receivedDate)
        .sort((a, b) => parseDate(b.receivedDate!).getTime() - parseDate(a.receivedDate!).getTime())[0]
      return { date: lastReceived?.receivedDate || "", status: "delivered" as const }
    }

    const inTransit = lineShipments.find(s => s.status === "in_transit")
    const expectedShipment = lineShipments.find(s => s.status === "expected")
    const nextExpectedDate = inTransit?.expectedDate || expectedShipment?.expectedDate

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

  const getLineDeliveryStatus = (item: LineItem) => {
    const allReceived = item.quantityReceived >= item.quantityOrdered
    if (allReceived) {
      return { label: "Delivered", color: "text-primary", bgColor: "bg-primary/10", icon: "check" }
    }

    const expectedInfo = getExpectedDateInfo(item)
    if (expectedInfo.status === "delayed") {
      return { label: "Late", color: "text-destructive", bgColor: "bg-destructive/10", icon: "alert" }
    }

    return { label: "On Track", color: "text-foreground", bgColor: "bg-muted", icon: "check" }
  }

  const getShipmentPillInfo = (status: string) => {
    switch (status) {
      case "received":
        return { label: "Delivered", style: "bg-primary/10 text-primary border-primary/20", icon: "check" }
      case "in_transit":
        return { label: "In Transit", style: "bg-blue-50 text-blue-600 border-blue-200", icon: "truck" }
      default:
        return { label: "Expected", style: "bg-muted text-muted-foreground border-border", icon: "package" }
    }
  }

  // PO Column header cell
  const POColumnHeader = () => (
    <th className="text-left py-2 px-4 font-medium text-muted-foreground">PO</th>
  )

  // PO Column data cell
  const POColumnCell = ({ item }: { item: ExtendedLineItem }) => (
    <td className="py-3 px-4">
      <span className="text-primary font-medium">{item.poNumber || "—"}</span>
    </td>
  )

  // All issues for quality view
  const allIssues = useMemo(() => detectPOIssues(), [])

  switch (viewMode) {
    case "basic":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {showPOColumn && <POColumnHeader />}
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
              {lines.map((item) => (
                <tr
                  key={`${item.poNumber || ""}-${item.id}`}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => onLineClick?.(item)}
                >
                  {showPOColumn && <POColumnCell item={item} />}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                      {item.lineNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-primary font-medium">{item.sku}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.expedite && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                          <Zap className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {item.projectCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <LineStatusPill status={item.status} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantityOrdered}</td>
                  <td className="py-3 px-4 text-right tabular-nums">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-medium">${item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "quantity":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {showPOColumn && <POColumnHeader />}
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
              {lines.map((item) => (
                <tr
                  key={`${item.poNumber || ""}-${item.id}`}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onLineClick?.(item)}
                >
                  {showPOColumn && <POColumnCell item={item} />}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                      {item.lineNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-primary font-medium">{item.sku}</span>
                  </td>
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <LineStatusPill status={item.status} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantityOrdered}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantityShipped}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantityReceived}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantityAccepted || "—"}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantityInQualityHold}</td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantityPaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "logistics":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {showPOColumn && <POColumnHeader />}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-16">Qty</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Promised</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Expected</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Shipments</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => {
                const lineShipments = getLineShipments(item.lineNumber)
                const expectedInfo = getExpectedDateInfo(item)
                const lineStatus = getLineDeliveryStatus(item)

                return (
                  <tr
                    key={`${item.poNumber || ""}-${item.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onLineClick?.(item)}
                  >
                    {showPOColumn && <POColumnCell item={item} />}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {item.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-medium">{item.sku}</span>
                        {item.expedite && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Zap className="w-2.5 h-2.5" />
                            EXPEDITE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center tabular-nums text-xs leading-tight">
                        <span className={item.quantityReceived >= item.quantityOrdered ? "text-primary font-medium" : ""}>
                          {item.quantityReceived}
                        </span>
                        <span className="text-muted-foreground text-[10px]">of {item.quantityOrdered}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-xs">{item.promisedDate}</td>
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
                        {lineShipments.length > 0 ? (
                          lineShipments.map((shipment) => {
                            const pillInfo = getShipmentPillInfo(shipment.status)
                            return (
                              <span
                                key={shipment.id}
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${pillInfo.style}`}
                              >
                                {pillInfo.icon === "check" && <CheckCircle2 className="w-2.5 h-2.5" />}
                                {pillInfo.icon === "truck" && <Truck className="w-2.5 h-2.5" />}
                                {pillInfo.icon === "package" && <Package className="w-2.5 h-2.5" />}
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
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${lineStatus.color} ${lineStatus.bgColor}`}>
                        {lineStatus.icon === "check" && <CheckCircle2 className="w-3 h-3" />}
                        {lineStatus.icon === "alert" && <AlertTriangle className="w-3 h-3" />}
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

    case "needs":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {showPOColumn && <POColumnHeader />}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Project</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">MO / Customer</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Need Date</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Needed</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Accepted</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => {
                const needStatus = getLineNeedStatus(item)
                return (
                  <tr
                    key={`${item.poNumber || ""}-${item.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onLineClick?.(item)}
                  >
                    {showPOColumn && <POColumnCell item={item} />}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {item.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{item.sku}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {item.projectCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.need.moNumber}</p>
                          {item.needs.length > 1 && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              +{item.needs.length - 1} more
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.need.customer}</p>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-center ${needStatus.atRisk && !needStatus.fulfilled ? "text-amber-600" : ""}`}>
                      <div className="flex flex-col items-center">
                        <span>{item.need.needDate}</span>
                        {item.needs.length > 1 && (
                          <span className="text-[10px] text-muted-foreground">Next need</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">
                      <div className="flex flex-col items-center">
                        <span>{item.need.qtyNeeded}</span>
                        {item.needs.length > 1 && (
                          <span className="text-[10px] text-muted-foreground">of {item.needs.reduce((sum, n) => sum + n.qtyNeeded, 0)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">{item.quantityAccepted}</td>
                    <td className="py-3 px-4 text-center">
                      {needStatus.fulfilled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Fulfilled
                        </span>
                      ) : needStatus.atRisk ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          At Risk
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

    case "quality":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {showPOColumn && <POColumnHeader />}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="Incoming Inspection">Insp</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="Certificate of Conformance">CoC</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="First Article Inspection">FAI</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="Material Test Report">MTR</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="Source Inspection">Source</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Received</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Accepted</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">On Hold</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">NCRs</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => {
                const lineNCRs = shipments.flatMap(s => s.ncrs || []).filter(ncr => ncr.lineNumber === item.lineNumber)
                const openNCRs = lineNCRs.filter(ncr => ncr.status === "open")
                const hasQualityIssue = item.quantityInQualityHold > 0 || openNCRs.length > 0
                const qr = item.qualityRequirements

                return (
                  <tr
                    key={`${item.poNumber || ""}-${item.id}`}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onLineClick?.(item)}
                  >
                    {showPOColumn && <POColumnCell item={item} />}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {item.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{item.sku}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr.inspectionRequired ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr.cocRequired ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr.faiRequired ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr.mtrRequired ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr.sourceInspection ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">{item.quantityReceived}</td>
                    <td className="py-3 px-4 text-center tabular-nums">{item.quantityAccepted}</td>
                    <td className="py-3 px-4 text-center tabular-nums">
                      {item.quantityInQualityHold > 0 ? (
                        <span className="text-amber-600 font-medium">{item.quantityInQualityHold}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {openNCRs.length > 0 ? (
                        <span className="text-destructive font-medium">{openNCRs.length}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasQualityIssue ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Issue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="w-3.5 h-3.5" />
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

    case "sourcing":
      return (
        <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {showPOColumn && <POColumnHeader />}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Commodity</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Requisition</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Req Line</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => (
                <tr
                  key={`${item.poNumber || ""}-${item.id}`}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onLineClick?.(item)}
                >
                  {showPOColumn && <POColumnCell item={item} />}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                      {item.lineNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-primary font-medium">{item.sku}</span>
                  </td>
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium font-mono">
                      {item.commodityCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-mono text-primary">{item.requisitionNumber}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                      {item.requisitionLineNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <LineStatusPill status={item.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    default:
      return null
  }
}
