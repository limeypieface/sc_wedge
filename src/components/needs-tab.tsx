"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Factory,
  ShoppingCart,
  ExternalLink,
  Users,
  Calendar,
  Package,
} from "lucide-react"
import {
  peggedNeeds,
  lineItems,
  computeNeedsStats,
  isNeedAtRisk,
  getNeedsForLine,
  type PeggedNeed,
} from "@/lib/mock-data"

export function NeedsTab() {
  const [expandedLine, setExpandedLine] = useState<number | null>(1)

  const stats = computeNeedsStats()

  // Group needs by line
  const linesWithNeeds = lineItems
    .filter(line => getNeedsForLine(line.lineNumber).length > 0)
    .map(line => {
      const needs = getNeedsForLine(line.lineNumber)
      const firstNeed = needs.sort((a, b) => {
        // Sort by need date to find first need
        const monthMap: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 }
        const aDateParts = a.needDate.split(" ")
        const bDateParts = b.needDate.split(" ")
        const aNum = monthMap[aDateParts[0]] * 100 + parseInt(aDateParts[1].replace(",", ""))
        const bNum = monthMap[bDateParts[0]] * 100 + parseInt(bDateParts[1].replace(",", ""))
        return aNum - bNum
      })[0]
      const hasAtRisk = needs.some(n => isNeedAtRisk(n).atRisk)
      const hasCritical = needs.some(n => n.priority === "critical")
      const totalQtyNeeded = needs.reduce((sum, n) => sum + n.qtyNeeded, 0)
      const totalQtyAllocated = needs.reduce((sum, n) => sum + n.qtyAllocated, 0)

      return {
        line,
        needs,
        firstNeed,
        hasAtRisk,
        hasCritical,
        totalQtyNeeded,
        totalQtyAllocated,
      }
    })

  const getPriorityStyle = (priority: PeggedNeed["priority"]) => {
    switch (priority) {
      case "critical": return "border-destructive/30 text-destructive bg-destructive/5"
      case "high": return "border-amber-300 text-amber-700 bg-amber-50"
      case "medium": return "border-border text-muted-foreground"
      case "low": return "border-border text-muted-foreground"
      default: return "border-border text-muted-foreground"
    }
  }

  const getLineStatusStyle = (hasAtRisk: boolean, hasCritical: boolean) => {
    if (hasCritical) return "border-l-destructive"
    if (hasAtRisk) return "border-l-amber-400"
    return "border-l-primary"
  }

  const renderLineCard = (data: typeof linesWithNeeds[0]) => {
    const isExpanded = expandedLine === data.line.lineNumber
    const allFulfilled = data.needs.every(n => n.qtyAllocated >= n.qtyNeeded)

    return (
      <div
        key={data.line.lineNumber}
        className={`border border-border rounded-lg overflow-hidden border-l-2 bg-background ${getLineStatusStyle(data.hasAtRisk, data.hasCritical)}`}
      >
        {/* Header */}
        <button
          onClick={() => setExpandedLine(isExpanded ? null : data.line.lineNumber)}
          className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
        >
          {/* Line Number */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-sm font-medium">
              {data.line.lineNumber}
            </span>
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-medium text-primary">{data.line.sku}</span>
              <span className="text-sm text-muted-foreground truncate">{data.line.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.needs.length} {data.needs.length === 1 ? "need" : "needs"} · First need: {data.firstNeed.needDate}
            </p>
          </div>

          {/* Allocation Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {allFulfilled ? (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Fulfilled
              </Badge>
            ) : data.hasAtRisk ? (
              <Badge variant="outline" className={`text-xs ${getPriorityStyle(data.hasCritical ? "critical" : "high")}`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                At Risk
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>

          {/* Qty Summary */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-medium tabular-nums">
              {data.totalQtyAllocated}/{data.totalQtyNeeded}
            </p>
            <p className="text-xs text-muted-foreground">allocated</p>
          </div>

          {/* Expand Icon */}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-border bg-muted/20">
            {/* Needs Table */}
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left font-medium pb-2 w-20">Type</th>
                    <th className="text-left font-medium pb-2">Reference</th>
                    <th className="text-left font-medium pb-2">Project / Customer</th>
                    <th className="text-center font-medium pb-2">Need Date</th>
                    <th className="text-right font-medium pb-2">Qty</th>
                    <th className="text-right font-medium pb-2 pr-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.needs.map((need) => {
                    const riskStatus = isNeedAtRisk(need)
                    return (
                      <tr key={need.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                            need.type === "MO" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                          }`}>
                            {need.type === "MO" ? (
                              <Factory className="w-3 h-3" />
                            ) : (
                              <ShoppingCart className="w-3 h-3" />
                            )}
                            {need.type}
                          </span>
                        </td>
                        <td className="py-3">
                          <div>
                            <a href="#" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                              {need.referenceNumber}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {need.parentSO && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                for {need.parentSO.number}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-sm">{need.projectName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              {need.customer || need.parentSO?.customer || "Internal"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div>
                            <p className={`text-sm ${riskStatus.atRisk ? "text-destructive font-medium" : ""}`}>
                              {need.needDate}
                            </p>
                            {need.parentSO && (
                              <p className="text-xs text-muted-foreground">
                                SO due: {need.parentSO.dueDate}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="tabular-nums">
                            <p className="text-sm font-medium">
                              {need.qtyAllocated}/{need.qtyNeeded}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {need.qtyNeeded - need.qtyAllocated > 0
                                ? `${need.qtyNeeded - need.qtyAllocated} short`
                                : "complete"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-2 text-right">
                          {riskStatus.atRisk ? (
                            <div>
                              <Badge variant="outline" className={`text-xs ${getPriorityStyle(need.priority)}`}>
                                {need.priority}
                              </Badge>
                              <p className="text-xs text-destructive mt-1 max-w-32">
                                {riskStatus.reason}
                              </p>
                            </div>
                          ) : need.qtyAllocated >= need.qtyNeeded ? (
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                              Fulfilled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`text-xs ${getPriorityStyle(need.priority)}`}>
                              {need.priority}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Notes section if any need has notes */}
            {data.needs.some(n => n.notes) && (
              <div className="px-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Notes</div>
                <div className="space-y-2">
                  {data.needs.filter(n => n.notes).map(need => (
                    <div key={need.id} className="flex items-start gap-2 p-2 rounded bg-muted/50 text-xs">
                      <span className="font-medium text-primary">{need.referenceNumber}:</span>
                      <span className="text-muted-foreground">{need.notes}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {data.hasAtRisk && (
              <div className="px-4 pb-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Actions:</span>
                <button className="text-xs text-primary hover:underline">
                  Expedite Receiving
                </button>
                <span className="text-muted-foreground">·</span>
                <button className="text-xs text-primary hover:underline">
                  Contact Vendor
                </button>
                <span className="text-muted-foreground">·</span>
                <button className="text-xs text-primary hover:underline">
                  Notify Planning
                </button>
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
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
          <p className="text-2xl font-semibold">{stats.totalNeeds}</p>
          <p className="text-xs text-muted-foreground">Total Needs</p>
        </div>
        <div className={`rounded-lg px-4 py-3 border text-center ${
          stats.atRisk > 0 ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border"
        }`}>
          <p className={`text-2xl font-semibold ${stats.atRisk > 0 ? "text-amber-600" : ""}`}>
            {stats.atRisk}
          </p>
          <p className={`text-xs ${stats.atRisk > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
            At Risk
          </p>
        </div>
        <div className={`rounded-lg px-4 py-3 border text-center ${
          stats.critical > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border"
        }`}>
          <p className={`text-2xl font-semibold ${stats.critical > 0 ? "text-destructive" : ""}`}>
            {stats.critical}
          </p>
          <p className={`text-xs ${stats.critical > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            Critical
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
          <p className="text-2xl font-semibold text-primary">{stats.fulfilled}</p>
          <p className="text-xs text-muted-foreground">Fulfilled</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Needs pegged to this PO by line item</span>
      </div>

      {/* Line Cards with Needs */}
      <div className="space-y-2">
        {linesWithNeeds.map(renderLineCard)}
      </div>

      {/* Empty State */}
      {linesWithNeeds.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No pegged needs</p>
          <p className="text-xs text-muted-foreground mt-1">
            No manufacturing orders or sales orders are pegged to this PO
          </p>
        </div>
      )}
    </div>
  )
}
