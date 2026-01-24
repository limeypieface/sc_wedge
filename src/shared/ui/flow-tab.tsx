"use client"

import { useState } from "react"
import {
  CircleDashed,
  ChevronDown,
  ChevronRight,
  GitBranch,
  AlertCircle,
  Factory,
  ShoppingCart,
  Calendar,
  Send,
  ClipboardList,
} from "lucide-react"
import { shipments, invoices, lineItems, peggedNeeds, isNeedAtRisk } from "@/lib/mock-data"

/*
 * Color System:
 * - Green (#18794E): Complete, success, approved
 * - Red (#DC2626): Issues, problems, disputed
 * - Amber (#D97706): At risk, warnings, needs attention
 * - Blue (#2563EB): Vendor actions (external)
 * - Purple (#7C3AED): Internal tasks (internal)
 * - Gray: Pending, future, muted
 */

// Status circle component
function StatusCircle({ percent, hasIssue }: { percent: number; hasIssue?: boolean }) {
  const normalizedPercent = Math.max(0, Math.min(1, percent))

  const colors = {
    complete: "#18794E",
    issue: "#DC2626",
    stroke: "#D4D4D4",
  }

  const fillColor = hasIssue ? colors.issue : colors.complete

  const angle = normalizedPercent * 360
  const angleRad = (angle - 90) * Math.PI / 180
  const x = 10 + 6 * Math.cos(angleRad)
  const y = 10 + 6 * Math.sin(angleRad)
  const largeArcFlag = angle > 180 ? 1 : 0

  let piePath = ''
  if (normalizedPercent > 0 && normalizedPercent < 1) {
    piePath = `M10 10 L10 4 A6 6 0 ${largeArcFlag} 1 ${x} ${y} Z`
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
      <circle cx="10" cy="10" r="8" fill="none" stroke={colors.stroke} strokeWidth="1.5" />
      {normalizedPercent > 0 && normalizedPercent < 1 && (
        <path d={piePath} fill={fillColor} />
      )}
      {normalizedPercent >= 1 && (
        <circle cx="10" cy="10" r="6" fill={fillColor} />
      )}
      {hasIssue && normalizedPercent < 1 && (
        <circle cx="10" cy="10" r="3" fill={colors.issue} />
      )}
    </svg>
  )
}

// Lifecycle phases
const PHASES = [
  { id: "ordered", label: "Ordered" },
  { id: "acknowledged", label: "Ack'd" },
  { id: "shipped", label: "Shipped" },
  { id: "received", label: "Received" },
  { id: "accepted", label: "Accepted" },
  { id: "invoiced", label: "Invoiced" },
] as const

type PhaseId = typeof PHASES[number]["id"]

interface PhaseData {
  qty: number
  date?: string
  details?: string
  hasIssue?: boolean
  issueId?: string
  issueLabel?: string
  invoiceId?: string
  invoiceAmount?: number
  invoiceStatus?: string
  action?: { label: string; type: "vendor" | "internal" }
}

interface DemandData {
  id: string
  type: "MO" | "SO"
  reference: string
  customer: string
  needDate: string
  qtyNeeded: number
  atRisk: boolean
  riskReason?: string
}

interface LineFlowData {
  lineNumber: number
  sku: string
  name: string
  qtyOrdered: number
  phases: { [key in PhaseId]: PhaseData }
  demand: DemandData[]
  revision?: {
    version: string
    previousQty: number
    note: string
  }
  isHistorical?: boolean
}

const PO_REVISIONS = [
  { version: "v1.0", date: "Dec 22", description: "Created" },
  { version: "v2.0", date: "Jan 3", description: "Acknowledged" },
  { version: "v2.1", date: "Jan 10", description: "Line 1 qty +2" },
]

function buildLineFlowData(): LineFlowData[] {
  const result: LineFlowData[] = []

  // Historical Line 1
  const line1 = lineItems.find(l => l.lineNumber === 1)
  if (line1) {
    result.push({
      lineNumber: 1,
      sku: line1.sku,
      name: line1.name,
      qtyOrdered: 10,
      isHistorical: true,
      demand: [],
      phases: {
        ordered: { qty: 10, date: "Dec 22" },
        acknowledged: { qty: 10, date: "Jan 5" },
        shipped: { qty: 6, details: "SHP-001" },
        received: { qty: 6, date: "Jan 17" },
        accepted: { qty: 6 },
        invoiced: { qty: 6, invoiceId: "INV-0089", invoiceAmount: 646.92, invoiceStatus: "approved" },
      },
    })
  }

  // Current lines
  lineItems.forEach(line => {
    const lineShipments = shipments.filter(s =>
      s.lines.some(l => l.lineNumber === line.lineNumber)
    )
    const lineInvoices = invoices.filter(inv =>
      inv.lines.some(l => l.lineNumber === line.lineNumber)
    )

    // Get demand for this line
    const lineNeeds = peggedNeeds.filter(n => n.lineNumber === line.lineNumber)
    const demand: DemandData[] = lineNeeds.map(need => {
      const risk = isNeedAtRisk(need)
      return {
        id: need.id,
        type: need.type,
        reference: need.referenceNumber,
        customer: need.customer || need.parentSO?.customer || "Internal",
        needDate: need.needDate,
        qtyNeeded: need.qtyNeeded,
        atRisk: risk.atRisk,
        riskReason: risk.reason,
      }
    })

    // Calculate quantities
    const qtyShipped = lineShipments
      .filter(s => s.status !== "expected")
      .reduce((sum, s) => sum + (s.lines.find(l => l.lineNumber === line.lineNumber)?.qtyShipped || 0), 0)

    const qtyReceived = lineShipments
      .filter(s => s.status === "received")
      .reduce((sum, s) => sum + (s.lines.find(l => l.lineNumber === line.lineNumber)?.qtyReceived || 0), 0)

    const qtyAccepted = lineShipments
      .filter(s => s.status === "received")
      .reduce((sum, s) => sum + (s.lines.find(l => l.lineNumber === line.lineNumber)?.qtyAccepted || 0), 0)

    const qtyOnHold = lineShipments
      .reduce((sum, s) => sum + (s.lines.find(l => l.lineNumber === line.lineNumber)?.qtyOnHold || 0), 0)

    const qtyInTransit = lineShipments
      .filter(s => s.status === "in_transit")
      .reduce((sum, s) => sum + (s.lines.find(l => l.lineNumber === line.lineNumber)?.qtyShipped || 0), 0)

    const qtyExpected = lineShipments
      .filter(s => s.status === "expected")
      .reduce((sum, s) => sum + (s.lines.find(l => l.lineNumber === line.lineNumber)?.qtyShipped || 0), 0)

    const lineInvoice = lineInvoices[0]
    const invLine = lineInvoice?.lines.find(l => l.lineNumber === line.lineNumber)
    const qtyInvoiced = invLine?.qtyInvoiced || 0

    const lineNCRs = lineShipments.flatMap(s =>
      (s.ncrs || []).filter(ncr => ncr.lineNumber === line.lineNumber && ncr.status === "open")
    )

    const lineData: LineFlowData = {
      lineNumber: line.lineNumber,
      sku: line.sku,
      name: line.name,
      qtyOrdered: line.quantityOrdered,
      demand,
      phases: {
        ordered: {
          qty: line.quantityOrdered,
          date: "Dec 22",
        },
        acknowledged: {
          qty: line.quantityOrdered,
          date: line.acknowledgedDate ? line.acknowledgedDate.split(",")[0] : undefined,
          details: line.promisedDate ? `Due ${line.promisedDate.split(",")[0]}` : undefined,
        },
        shipped: {
          qty: qtyShipped,
          details: qtyInTransit > 0 ? `${qtyInTransit} in transit` : qtyExpected > 0 ? `${qtyExpected} pending` : undefined,
          action: qtyExpected > 0 ? { label: "Confirm shipment", type: "vendor" } : undefined,
        },
        received: {
          qty: qtyReceived,
          details: qtyInTransit > 0 ? `${qtyInTransit} arriving` : undefined,
          action: qtyInTransit > 0 ? { label: "Expedite receiving", type: "internal" } : undefined,
        },
        accepted: {
          qty: qtyAccepted,
          hasIssue: qtyOnHold > 0 || lineNCRs.length > 0,
          issueId: lineNCRs[0]?.id,
          issueLabel: qtyOnHold > 0 ? `${qtyOnHold} on hold` : lineNCRs.length > 0 ? "NCR open" : undefined,
          details: lineNCRs[0]?.description,
          action: qtyOnHold > 0 ? { label: "Resolve QA hold", type: "internal" } : undefined,
        },
        invoiced: {
          qty: qtyInvoiced,
          invoiceId: lineInvoice?.id,
          invoiceAmount: invLine?.lineTotal,
          invoiceStatus: lineInvoice?.status,
          hasIssue: lineInvoice?.status === "disputed",
          issueLabel: lineInvoice?.status === "disputed" ? "Qty variance" : undefined,
          action: lineInvoice?.status === "disputed" ? { label: "Resolve variance", type: "internal" } : undefined,
        },
      },
    }

    if (line.lineNumber === 1) {
      lineData.revision = {
        version: "v2.1",
        previousQty: 10,
        note: "+2 units",
      }
    }

    result.push(lineData)
  })

  return result
}

export function FlowTab() {
  const [expandedLine, setExpandedLine] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(true)
  const lineData = buildLineFlowData()

  const currentLines = lineData.filter(l => !l.isHistorical)
  const historicalLines = lineData.filter(l => l.isHistorical)

  // Count by type
  const issueCount = currentLines.reduce((sum, line) =>
    sum + Object.values(line.phases).filter(p => p.hasIssue).length, 0)
  const vendorActionCount = currentLines.reduce((sum, line) =>
    sum + Object.values(line.phases).filter(p => p.action?.type === "vendor").length, 0)
  const internalTaskCount = currentLines.reduce((sum, line) =>
    sum + Object.values(line.phases).filter(p => p.action?.type === "internal").length, 0)
  const atRiskCount = currentLines.reduce((sum, line) =>
    sum + line.demand.filter(d => d.atRisk).length, 0)

  const renderLineRow = (line: LineFlowData, isHistorical: boolean = false) => {
    const isExpanded = expandedLine === line.lineNumber && !isHistorical
    const hasAnyIssue = Object.values(line.phases).some(p => p.hasIssue)
    const hasVendorAction = Object.values(line.phases).some(p => p.action?.type === "vendor")
    const hasInternalTask = Object.values(line.phases).some(p => p.action?.type === "internal")
    const hasAtRiskDemand = line.demand.some(d => d.atRisk)
    const firstNeed = line.demand[0]

    return (
      <div
        key={`${line.lineNumber}-${isHistorical ? 'old' : 'current'}`}
        className={`border rounded-lg overflow-hidden ${
          isHistorical ? "border-dashed border-border/50" :
          hasAnyIssue ? "border-red-300" :
          hasAtRiskDemand ? "border-amber-300" :
          "border-border"
        }`}
      >
        {/* Revision indicator */}
        {line.revision && !isHistorical && (
          <div className="px-4 py-1.5 border-b border-border/50 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30">
            <GitBranch className="w-3 h-3" />
            <span>Revised {line.revision.version}</span>
            <span className="text-foreground font-medium">{line.revision.note}</span>
          </div>
        )}

        {/* Historical indicator */}
        {isHistorical && (
          <div className="px-4 py-1.5 border-b border-dashed border-border/50 flex items-center gap-2 text-xs text-muted-foreground bg-muted/20">
            <CircleDashed className="w-3 h-3" />
            <span>Before v2.1 (qty: {line.qtyOrdered})</span>
            <ChevronRight className="w-3 h-3 ml-auto" />
            <span>Superseded</span>
          </div>
        )}

        {/* Main row */}
        <button
          onClick={() => !isHistorical && setExpandedLine(isExpanded ? null : line.lineNumber)}
          disabled={isHistorical}
          className={`w-full flex items-center px-4 py-3 text-left ${!isHistorical ? "hover:bg-muted/30" : "opacity-50 bg-muted/10"}`}
        >
          {/* Line info */}
          <div className="w-40 flex-shrink-0 flex items-center gap-3">
            <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-medium">
              {line.lineNumber}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{line.sku}</p>
              <p className="text-xs text-muted-foreground truncate">{line.name}</p>
            </div>
          </div>

          {/* Demand summary */}
          {!isHistorical && firstNeed && (
            <div className="w-32 flex-shrink-0 pr-3">
              <div className="flex items-center gap-1.5 text-xs">
                {firstNeed.type === "MO" ? (
                  <Factory className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="truncate text-muted-foreground">{firstNeed.customer}</span>
              </div>
              <div className={`text-xs ${hasAtRiskDemand ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                {firstNeed.needDate.split(",")[0]}
              </div>
            </div>
          )}
          {!isHistorical && !firstNeed && (
            <div className="w-32 flex-shrink-0 pr-3">
              <span className="text-xs text-muted-foreground">—</span>
            </div>
          )}

          {/* Phase columns */}
          <div className="flex-1 grid grid-cols-6 gap-1">
            {PHASES.map((phase) => {
              const data = line.phases[phase.id]
              const percent = data.qty / line.qtyOrdered

              return (
                <div key={phase.id} className="flex flex-col items-center gap-0.5 py-1">
                  <StatusCircle percent={percent} hasIssue={data.hasIssue} />
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {data.qty}/{line.qtyOrdered}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Status indicators */}
          {!isHistorical && (
            <div className="w-32 flex-shrink-0 flex items-center justify-end gap-1.5">
              {hasAnyIssue && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  Issue
                </span>
              )}
              {hasVendorAction && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700">
                  <Send className="w-3 h-3" />
                  Vendor
                </span>
              )}
              {hasInternalTask && !hasAnyIssue && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-violet-100 text-violet-700">
                  <ClipboardList className="w-3 h-3" />
                  Task
                </span>
              )}
            </div>
          )}

          {!isHistorical && (
            <ChevronDown className={`w-4 h-4 text-muted-foreground ml-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          )}
        </button>

        {/* Expanded detail */}
        {isExpanded && !isHistorical && (
          <div className="border-t border-border">
            {/* Demand section */}
            {line.demand.length > 0 && (
              <div className="px-4 py-3 bg-muted/20 border-b border-border">
                <div className="text-xs font-medium text-muted-foreground mb-2">Driving Demand</div>
                <div className="space-y-2">
                  {line.demand.map(d => (
                    <div
                      key={d.id}
                      className={`flex items-center gap-4 p-2 rounded border ${
                        d.atRisk ? "bg-amber-50 border-amber-300" : "bg-background border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {d.type === "MO" ? (
                          <Factory className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{d.reference}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{d.customer}</span>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={d.atRisk ? "text-amber-700 font-medium" : ""}>{d.needDate}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Qty: {d.qtyNeeded}</span>
                      {d.atRisk && (
                        <span className="ml-auto text-[11px] font-medium text-amber-700 bg-amber-200 px-2 py-0.5 rounded">
                          At Risk
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phases detail */}
            <div className="px-4 py-4 bg-muted/10">
              <div className="grid grid-cols-6 gap-4 text-xs">
                {PHASES.map((phase) => {
                  const data = line.phases[phase.id]
                  const percent = (data.qty / line.qtyOrdered) * 100

                  return (
                    <div key={phase.id} className="space-y-2">
                      <div className="font-medium text-muted-foreground">{phase.label}</div>

                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${data.hasIssue ? "bg-red-500" : "bg-[#18794E]"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="space-y-1 text-muted-foreground">
                        <div>{data.qty} of {line.qtyOrdered}</div>
                        {data.date && <div>{data.date}</div>}
                        {data.details && <div className="text-foreground">{data.details}</div>}

                        {/* Invoice info */}
                        {data.invoiceId && (
                          <div className="pt-1.5 mt-1.5 border-t border-border">
                            <div className="text-foreground font-medium">{data.invoiceId}</div>
                            {data.invoiceAmount && (
                              <div>${data.invoiceAmount.toFixed(2)}</div>
                            )}
                            {data.invoiceStatus && (
                              <div className={data.invoiceStatus === "disputed" ? "text-red-600 font-medium" : "text-[#18794E]"}>
                                {data.invoiceStatus}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Issue - Red */}
                        {data.hasIssue && (
                          <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                            <div className="font-medium text-red-700">{data.issueLabel}</div>
                            {data.issueId && <div className="text-red-600">{data.issueId}</div>}
                          </div>
                        )}

                        {/* Action buttons - differentiated by type */}
                        {data.action && (
                          <button className={`mt-2 w-full px-2 py-1.5 text-[11px] font-medium rounded border transition-colors flex items-center justify-center gap-1.5 ${
                            data.action.type === "vendor"
                              ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                              : "bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100"
                          }`}>
                            {data.action.type === "vendor" ? (
                              <Send className="w-3 h-3" />
                            ) : (
                              <ClipboardList className="w-3 h-3" />
                            )}
                            {data.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Revision summary */}
              {line.revision && (
                <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>v2.0: {line.revision.previousQty} units</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-foreground font-medium">v2.1: {line.qtyOrdered} units</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Order Flow</h2>
          <p className="text-sm text-muted-foreground">Line progression through fulfillment</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {atRiskCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {atRiskCount} at risk
            </span>
          )}
          {issueCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {issueCount} issue{issueCount !== 1 ? "s" : ""}
            </span>
          )}
          {vendorActionCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
              <Send className="w-3.5 h-3.5" />
              {vendorActionCount} vendor
            </span>
          )}
          {internalTaskCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-violet-100 text-violet-700 font-medium">
              <ClipboardList className="w-3.5 h-3.5" />
              {internalTaskCount} task{internalTaskCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Revision timeline */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Revisions:</span>
        {PO_REVISIONS.map((rev, idx) => (
          <div key={rev.version} className="flex items-center gap-1">
            <span className={idx === PO_REVISIONS.length - 1 ? "font-medium" : "text-muted-foreground"}>
              {rev.version}
            </span>
            {idx < PO_REVISIONS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            )}
          </div>
        ))}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          {showHistory ? "Hide history" : "Show history"}
        </button>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 border-b border-border pb-2">
        <div className="w-40 flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Line</span>
        </div>
        <div className="w-32 flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Demand</span>
        </div>
        <div className="flex-1 grid grid-cols-6 gap-1">
          {PHASES.map((phase) => (
            <div key={phase.id} className="text-center">
              <span className="text-xs font-medium text-muted-foreground">{phase.label}</span>
            </div>
          ))}
        </div>
        <div className="w-32 flex-shrink-0 text-right">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 rounded-lg text-xs">
        <span className="text-muted-foreground font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Issue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">At Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
            <Send className="w-3 h-3" />
          </span>
          <span className="text-muted-foreground">Vendor Action</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
            <ClipboardList className="w-3 h-3" />
          </span>
          <span className="text-muted-foreground">Internal Task</span>
        </div>
      </div>

      {/* Lines */}
      <div className="space-y-2">
        {showHistory && historicalLines.map(line => renderLineRow(line, true))}

        {showHistory && historicalLines.length > 0 && (
          <div className="flex items-center gap-2 pl-4 py-1 text-xs text-muted-foreground">
            <div className="w-px h-3 bg-border" />
            <GitBranch className="w-3 h-3 rotate-180" />
            <span>v2.1</span>
          </div>
        )}

        {currentLines.map(line => renderLineRow(line, false))}
      </div>

      {/* Bottom legend */}
      <div className="flex items-center gap-6 pt-4 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <StatusCircle percent={1} />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusCircle percent={0.5} />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusCircle percent={0.5} hasIssue />
          <span>Has Issue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusCircle percent={0} />
          <span>Pending</span>
        </div>
      </div>
    </div>
  )
}
