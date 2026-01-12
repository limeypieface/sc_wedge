"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { LineStatusSelect } from "@/components/line-status-select"
import {
  AlertCircle,
  CheckCircle2,
  FileWarning,
  AlertTriangle,
  ShieldAlert,
  Truck,
  Package,
  ArrowRight,
  FileText,
  Search,
  FileCheck,
  ShieldCheck,
  FlaskConical,
  Eye
} from "lucide-react"
import { type LineItem, getPOData, detectPOIssuesForPO, computeLineFinancials, getChargesByLine } from "@/lib/mock-data"
import { getTaxLabel, formatTaxRate } from "@/lib/tax-config"
import { IssueRef } from "@/components/issue-ref"

interface SOLineItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: LineItem
  soNumber: string
}

export function SOLineItemModal({ isOpen, onClose, item, soNumber }: SOLineItemModalProps) {
  const [lineStatus, setLineStatus] = useState(item.status || item.lineStatus || "open")
  const [activeTab, setActiveTab] = useState<"overview" | "issues">("overview")

  // Get SO data
  const soData = getPOData(soNumber)
  const shipments = soData?.shipments || []
  const invoices = soData?.invoices || []

  // Get all issues for this SO
  const allIssues = detectPOIssuesForPO(soNumber)

  // Get shipment IDs that include this line
  const lineShipmentIds = shipments
    .filter(s => s.lines.some(l => l.lineNumber === item.lineNumber))
    .map(s => s.id)

  // Get line-specific issues
  const lineIssues = allIssues.filter(issue =>
    issue.lineNumber === item.lineNumber ||
    (issue.shipmentId && lineShipmentIds.includes(issue.shipmentId))
  )

  // Get financial data
  const allLineFinancialsData = computeLineFinancials()
  const lineFinancials = Array.isArray(allLineFinancialsData)
    ? allLineFinancialsData.find((f) => f.lineNumber === item.lineNumber)
    : allLineFinancialsData?.lineNumber === item.lineNumber ? allLineFinancialsData : null

  // Get charges that apply to this line
  const lineCharges = getChargesByLine(item.lineNumber)

  // Get invoices that include this line
  const lineInvoices = invoices
    .filter(inv => inv.lines.some(l => l.lineNumber === item.lineNumber))
    .map(inv => {
      const lineData = inv.lines.find(l => l.lineNumber === item.lineNumber)
      return {
        id: inv.id,
        status: inv.status,
        invoiceDate: inv.date,
        dueDate: inv.dueDate,
        qtyInvoiced: lineData?.qtyInvoiced || 0,
        unitPrice: lineData?.unitPrice || 0,
        lineTotal: lineData?.lineTotal || 0,
      }
    })

  // Calculate totals for this line across all invoices
  const totalInvoiced = lineInvoices.reduce((sum, inv) => sum + inv.lineTotal, 0)
  const totalInvoicedQty = lineInvoices.reduce((sum, inv) => sum + inv.qtyInvoiced, 0)
  const paidInvoices = lineInvoices.filter(inv => inv.status === "paid")
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.lineTotal, 0)
  const totalPaidQty = paidInvoices.reduce((sum, inv) => sum + inv.qtyInvoiced, 0)

  // Get upcoming events for this line
  const upcomingEvents = shipments
    .filter(s => s.status === "in_transit" || s.status === "expected")
    .filter(s => s.lines.some(l => l.lineNumber === item.lineNumber))
    .map(s => {
      const lineData = s.lines.find(l => l.lineNumber === item.lineNumber)
      const relatedIssue = allIssues.find(issue => issue.shipmentId === s.id)
      return {
        id: s.id,
        type: s.status === "in_transit" ? "in_transit" : "expected",
        date: s.expectedDate,
        qty: lineData?.qtyShipped || 0,
        carrier: s.carrier,
        tracking: s.tracking,
        issue: relatedIssue
      }
    })

  // Find quality hold issue for this line
  const qualityHoldIssue = allIssues.find(
    issue => issue.category === "quality_hold" && issue.lineNumber === item.lineNumber
  )

  // Count issues
  const issueCount = lineIssues.length
  const hasVariance = lineFinancials && typeof lineFinancials.variance === 'number' && lineFinancials.variance !== 0

  // SO only has Overview and Issues tabs (no Needs - that's PO specific)
  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "issues" as const, label: "Issues", count: issueCount + (hasVariance ? 1 : 0) },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-border pr-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 pr-4">
              <DialogTitle className="text-lg font-semibold mb-1">
                {item.name}
              </DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-primary">{item.sku}</span>
                <span className="text-border">|</span>
                <span>Line {item.lineNumber}</span>
                {item.itemRevision && (
                  <>
                    <span className="text-border">|</span>
                    <span>Rev {item.itemRevision}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums">${item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">{item.quantityOrdered || item.quantity} × ${item.unitPrice.toFixed(2)}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="border-b border-border -mx-6 px-6">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 text-sm font-medium relative transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          {/* Upcoming Shipments - Always visible when present */}
          {upcomingEvents.length > 0 && (
            <div className="mb-6 p-4 bg-muted/30 border border-border rounded-lg">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Upcoming Shipments
              </h4>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 text-sm">
                    {event.type === "in_transit" ? (
                      <Truck className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{event.qty} units</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    <span>{event.date}</span>
                    {event.carrier && (
                      <span className="text-muted-foreground text-xs">via {event.carrier}</span>
                    )}
                    {event.issue && (
                      <IssueRef issueId={event.issue.id} issueNumber={event.issue.issueNumber || event.issue.id} />
                    )}
                    <Badge variant="outline" className="text-xs ml-auto">
                      {event.type === "in_transit" ? "In Transit" : "Scheduled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Status Row */}
              <div className="flex items-center gap-6">
                <LineStatusSelect
                  value={lineStatus}
                  onChange={setLineStatus}
                  label="Status"
                  showLabel={true}
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Promise Date</p>
                  <p className="text-sm font-medium">{item.promisedDate || item.originalDueDate || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
                  <p className="text-sm font-medium">{item.leadTimeDays ? `${item.leadTimeDays} days` : "—"}</p>
                </div>
              </div>

              {/* Quantity Flow - SO specific: Ordered → Issued → Shipped → Delivered → Accepted → Invoiced → Paid */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Fulfillment Status</h4>
                <div className="flex items-center gap-2">
                  {[
                    { label: "Ordered", value: item.quantityOrdered || (item as any).quantity || 0 },
                    { label: "Issued", value: (item as any).quantityReleased || item.quantityShipped || 0 },
                    { label: "Shipped", value: item.quantityShipped || 0 },
                    { label: "Delivered", value: item.quantityReceived || 0 },
                    { label: "Accepted", value: item.quantityAccepted || 0 },
                    { label: "Paid", value: (item as any).quantityPaid || 0 },
                  ].map((stat, i, arr) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-center min-w-[70px]">
                        <p className="text-lg font-semibold tabular-nums">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                      )}
                    </div>
                  ))}
                </div>
                {item.quantityInQualityHold > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{item.quantityInQualityHold} unit{item.quantityInQualityHold !== 1 ? "s" : ""} in quality hold</span>
                    {qualityHoldIssue && (
                      <IssueRef issueId={qualityHoldIssue.id} issueNumber={qualityHoldIssue.issueNumber || qualityHoldIssue.id} />
                    )}
                  </div>
                )}
              </div>

              {/* Financial Info */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Financial Breakdown</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      <tr className="bg-muted/20">
                        <td className="py-2 px-3 text-muted-foreground">
                          {item.quantityOrdered || item.quantity} × {item.unitPrice.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">
                          {item.subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </td>
                      </tr>

                      {item.discountAmount > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">
                            Discount ({item.discountPercent}%)
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                            ({item.discountAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })})
                          </td>
                        </tr>
                      )}

                      {item.expediteFee && item.expediteFee > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">
                            Expedite Fee
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {item.expediteFee.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                          </td>
                        </tr>
                      )}

                      {lineCharges.map(charge => (
                        <tr key={charge.id}>
                          <td className="py-2 px-3 text-muted-foreground">
                            {charge.description}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {charge.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                          </td>
                        </tr>
                      ))}

                      <tr>
                        <td className="py-2 px-3 text-muted-foreground">
                          {getTaxLabel(item.taxCode)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                          {item.taxCode === "EXEMPT" ? "—" : item.taxAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </td>
                      </tr>

                      <tr className="bg-foreground/5">
                        <td className="py-3 px-3 font-semibold">
                          Line Total
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-semibold">
                          {(item.lineTotalWithTax + (item.expediteFee || 0) + lineCharges.reduce((sum, c) => sum + c.amount, 0)).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {item.taxCode === "EXEMPT" && (
                  <p className="text-xs text-muted-foreground mt-2">Tax exempt item</p>
                )}
              </div>

              {/* Quality Requirements - Outbound focused */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Quality Requirements</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="divide-y divide-border">
                    {/* Outgoing Inspection */}
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${(item as any).qualityRequirements?.inspectionRequired ? "" : "opacity-50"}`}>
                      <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm">Outgoing Inspection</span>
                      </div>
                      {(item as any).qualityRequirements?.inspectionRequired ? (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">Required</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not required</span>
                      )}
                    </div>

                    {/* Certificate of Conformance */}
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${(item as any).qualityRequirements?.cocRequired ? "" : "opacity-50"}`}>
                      <FileCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm">Certificate of Conformance (CoC)</span>
                      </div>
                      {(item as any).qualityRequirements?.cocRequired ? (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">Required</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not required</span>
                      )}
                    </div>

                    {/* First Article Inspection */}
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${(item as any).qualityRequirements?.faiRequired ? "bg-amber-50/50" : "opacity-50"}`}>
                      <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${(item as any).qualityRequirements?.faiRequired ? "text-amber-500" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <span className="text-sm">First Article Inspection (FAI)</span>
                      </div>
                      {(item as any).qualityRequirements?.faiRequired ? (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Required</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not required</span>
                      )}
                    </div>

                    {/* Material Test Report */}
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${(item as any).qualityRequirements?.mtrRequired ? "" : "opacity-50"}`}>
                      <FlaskConical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm">Material Test Report (MTR)</span>
                      </div>
                      {(item as any).qualityRequirements?.mtrRequired ? (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">Required</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not required</span>
                      )}
                    </div>

                    {/* Customer Inspection */}
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${(item as any).qualityRequirements?.sourceInspection ? "" : "opacity-50"}`}>
                      <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm">Customer Inspection</span>
                      </div>
                      {(item as any).qualityRequirements?.sourceInspection ? (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">Required</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not required</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices & Payments */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Invoices & Receivables</h4>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">{totalInvoicedQty}</p>
                    <p className="text-xs text-muted-foreground">Invoiced</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">{totalPaidQty}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">
                      {totalInvoiced.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </p>
                    <p className="text-xs text-muted-foreground">Invoiced $</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">
                      {totalPaid.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </p>
                    <p className="text-xs text-muted-foreground">Received $</p>
                  </div>
                </div>

                {lineInvoices.length > 0 ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoice</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Qty</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lineInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="font-medium">{inv.id}</span>
                              </div>
                              <p className="text-xs text-muted-foreground ml-5.5">Due {inv.dueDate}</p>
                            </td>
                            <td className="py-2 px-3">
                              <Badge
                                variant="outline"
                                className={
                                  inv.status === "paid" ? "text-primary border-primary/30" :
                                  inv.status === "approved" ? "text-primary/70 border-primary/20" :
                                  inv.status === "disputed" ? "text-amber-600 border-amber-300" :
                                  "text-muted-foreground"
                                }
                              >
                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums">{inv.qtyInvoiced}</td>
                            <td className="py-2 px-3 text-right tabular-nums font-medium">
                              {inv.lineTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/20 rounded-lg border border-border">
                    <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No invoices for this line yet</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              )}

              {/* Logistics */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ship To</p>
                  <p className="font-medium">{item.shipToLocationId || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Warehouse</p>
                  <p className="font-medium">{item.warehouseId || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Commodity</p>
                  <p className="font-medium">{(item as any).commodityCode || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === "issues" && (
            <div className="space-y-4">
              {lineIssues.length === 0 && !hasVariance ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No Issues</p>
                  <p className="text-sm text-muted-foreground mt-1">This line is clear of exceptions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Invoice Variance */}
                  {hasVariance && lineFinancials && (
                    <div className="rounded-lg p-4 border border-border">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Invoice Variance</span>
                            <span className="text-sm text-muted-foreground">
                              ${Math.abs(lineFinancials.variance).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {lineFinancials.variance > 0 ? "Invoiced more than accepted" : "Invoiced less than accepted"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Line Issues */}
                  {lineIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-lg p-4 border border-border"
                    >
                      <div className="flex items-start gap-3">
                        {issue.category === "quality_hold" || issue.category === "ncr" ? (
                          <FileWarning className="w-4 h-4 text-muted-foreground mt-0.5" />
                        ) : issue.category === "shipment" ? (
                          <Truck className="w-4 h-4 text-muted-foreground mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">{issue.title}</span>
                            <IssueRef issueId={issue.id} issueNumber={issue.issueNumber || issue.id} />
                            {issue.priority === "critical" && (
                              <Badge variant="outline" className="text-xs">
                                {issue.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                          {issue.suggestedAction && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              <span>Action:</span>{" "}
                              <span className="text-foreground">{issue.suggestedAction}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
