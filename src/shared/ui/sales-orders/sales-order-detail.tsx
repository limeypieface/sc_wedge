"use client"

/**
 * SalesOrderDetail Component
 *
 * Sales Order uses a direct-edit model (like NetSuite/SAP/Costpoint):
 * - Direct editing based on order status
 * - Change history tracking
 * - No draft/revision workflow (that's for PO vendor negotiations)
 */

import { useState } from "react"
import { Edit, Download, ChevronDown, Phone, Mail, AlertCircle, FileText, MessageSquare, Zap, Sparkles, Truck, Package, CheckCircle2, AlertTriangle, History, X, ChevronsRight } from "lucide-react"
import { ExpandableToolbar } from "@/components/ui/expandable-toolbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatTaxRateFromDecimal } from "@/lib/tax-config"

// Reuse PO components
import { FinancialBreakdown } from "@/components/financial-breakdown"
import { FinancialsTab } from "@/components/financials-tab"
import { QualityTab } from "@/components/quality-tab"
import { ReceivingTab } from "@/components/receiving-tab"
import { SOLineDisplaySelector } from "@/components/so-line-display-selector"
import { SOLineStatusPill } from "@/components/so-line-status-pill"
import { ActivityTimeline } from "@/components/activity-timeline"
import { DocumentsPanel } from "@/components/documents-panel"

// SO-specific modals
import { LineDetailModal } from "@/components/line-detail-modal"
import { SOEditHeaderModal, type SOHeaderEditData } from "@/components/so-edit-header-modal"
import { SOStatusSelect } from "@/components/so-status-select"
import { SalesOrderStatus } from "@/types/sales-order-status"
import { SOEditLineModal, type SOLineEditData } from "@/components/so-edit-line-modal"
import { SOCreateShipmentModal, type ShipmentData } from "@/components/so-create-shipment-modal"
import { IssuesTab } from "@/components/issues-tab"
import { useIssuePanel } from "@/context/IssuePanelContext"
import { useEmailContext } from "@/context/EmailContext"
import { VoipCallModal } from "@/components/voip-call-modal"

// Reuse PO mock data structures and functions
import {
  computePOTotals,
  getPOData,
  detectSOIssuesForSO,
  getIssuesForEntity,
  type LineItem,
  type POCharge,
} from "@/lib/mock-data"
import { IssueCountBadge, LineIssuesBadge } from "@/components/issue-count-badge"

// ============================================================================
// CHANGE HISTORY TYPE
// ============================================================================

interface ChangeHistoryEntry {
  id: string
  timestamp: Date
  user: string
  type: "header" | "line" | "status"
  description: string
  changes: { field: string; oldValue: string | number; newValue: string | number }[]
}

// ============================================================================
// SO STATUS TYPE (legacy - kept for reference, use SalesOrderStatus enum)
// ============================================================================

type SOStatus = "pending" | "confirmed" | "partially_shipped" | "shipped" | "partially_invoiced" | "invoiced" | "closed"

// Map legacy status strings to new enum
const mapLegacyStatus = (status: SOStatus): SalesOrderStatus => {
  const map: Record<SOStatus, SalesOrderStatus> = {
    pending: SalesOrderStatus.Pending,
    confirmed: SalesOrderStatus.Confirmed,
    partially_shipped: SalesOrderStatus.PartiallyShipped,
    shipped: SalesOrderStatus.Shipped,
    partially_invoiced: SalesOrderStatus.PartiallyInvoiced,
    invoiced: SalesOrderStatus.Invoiced,
    closed: SalesOrderStatus.Closed,
  }
  return map[status]
}

// ============================================================================
// SO DATA FROM SHARED MOCK DATA
// ============================================================================

const soData = getPOData("SO-2024-00142")!
const soHeader = soData.header
const customerContact = soData.vendorContact
const soLineItems = soData.lineItems
const soCharges = soData.charges
const soShipments = soData.shipments

// ============================================================================
// TERMINOLOGY MAPPING
// ============================================================================

const SO_TERMINOLOGY = {
  orderType: "Sales Order",
  orderCode: "SO",
  externalParty: "Customer",
  internalOwner: "Sales Rep",
  sendAction: "Send to Customer",
  receiveAction: "Ship",
  acknowledgeAction: "Confirmed by Customer",
  payablesTab: "Receivables",
  receivingTab: "Shipping",
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SalesOrderDetailProps {
  soNumber?: string
}

export function SalesOrderDetail({ soNumber }: SalesOrderDetailProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [lineDisplayMode, setLineDisplayMode] = useState("basic")
  const [isGeneralInfoExpanded, setIsGeneralInfoExpanded] = useState(false)
  const [lines, setLines] = useState(soLineItems)
  const [charges, setCharges] = useState(soCharges)
  const [documentsSidebarOpen, setDocumentsSidebarOpen] = useState(false)
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [changeHistorySidebarOpen, setChangeHistorySidebarOpen] = useState(false)

  // Issues panel
  const { isOpen: issuesSidebarOpen, openPanel: openIssuesPanel, closePanel: closeIssuesPanel } = useIssuePanel()

  // Email
  const { openEmailModal } = useEmailContext()

  // Call modal
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)

  // Edit mode - direct editing based on status
  const [isEditMode, setIsEditMode] = useState(false)
  const [orderStatus, setOrderStatus] = useState<SalesOrderStatus>(SalesOrderStatus.Confirmed)

  // Change history
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([
    {
      id: "ch-1",
      timestamp: new Date("2024-01-15T10:30:00"),
      user: "Sarah Chen",
      type: "header",
      description: "Updated shipping method",
      changes: [{ field: "Shipping Method", oldValue: "Ground", newValue: "Air" }]
    },
    {
      id: "ch-2",
      timestamp: new Date("2024-01-14T14:15:00"),
      user: "Mike Johnson",
      type: "line",
      description: "Modified line 2 quantity",
      changes: [{ field: "Quantity", oldValue: 100, newValue: 150 }]
    }
  ])

  // Modal state
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null)
  const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = useState(false)
  const [isEditLineModalOpen, setIsEditLineModalOpen] = useState(false)
  const [editingLineItem, setEditingLineItem] = useState<LineItem | null>(null)
  const [isCreateShipmentModalOpen, setIsCreateShipmentModalOpen] = useState(false)

  // Compute totals
  const orderTotals = computePOTotals(lines, charges || [])

  // Compute line-level expedite fees (separate from charge-level expedite)
  const lineExpediteFees = lines.reduce((sum, l) => sum + (l.expediteFee || 0), 0)

  // Compute issue counts
  const soIssues = detectSOIssuesForSO(soNumber || soHeader.poNumber)
  const actionRequiredIssues = soIssues.filter(i => i.priority === "critical" || i.priority === "high")
  const criticalCount = actionRequiredIssues.length

  // Check if editing is allowed based on status
  const canEdit = orderStatus === SalesOrderStatus.Pending || orderStatus === SalesOrderStatus.Confirmed
  const canEditLines = canEdit && orderStatus !== SalesOrderStatus.PartiallyShipped

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)

  // Handle line item click - open view modal
  const handleLineClick = (item: LineItem) => {
    setSelectedLineItem(item)
  }

  // Handle edit line click
  const handleEditLineClick = (item: LineItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canEditLines) return

    // Check if this specific line can be edited (not shipped)
    if (item.quantityShipped > 0) {
      // Could show a toast here: "Cannot edit shipped lines"
      return
    }

    setEditingLineItem(item)
    setIsEditLineModalOpen(true)
  }

  // Handle edit header click
  const handleEditHeaderClick = () => {
    if (!canEdit) return
    setIsEditHeaderModalOpen(true)
  }

  // Handle header save
  const handleHeaderSave = (editData: SOHeaderEditData) => {
    // Add to change history
    if (editData.changes.length > 0 || editData.chargeChanges.length > 0) {
      const newEntry: ChangeHistoryEntry = {
        id: `ch-${Date.now()}`,
        timestamp: new Date(),
        user: "Current User", // Would come from auth context
        type: "header",
        description: `Updated ${editData.changes.map(c => c.label).join(", ")}`,
        changes: editData.changes.map(c => ({
          field: c.label,
          oldValue: c.oldValue || "",
          newValue: c.newValue || ""
        }))
      }
      setChangeHistory(prev => [newEntry, ...prev])
    }

    // Apply changes would happen here
    console.log("Header changes saved:", editData)
  }

  // Handle line save
  const handleLineSave = (editData: SOLineEditData) => {
    // Add to change history
    if (editData.changes.length > 0 || editData.chargeChanges.length > 0) {
      const newEntry: ChangeHistoryEntry = {
        id: `ch-${Date.now()}`,
        timestamp: new Date(),
        user: "Current User",
        type: "line",
        description: `Updated line ${editData.lineNumber} (${editData.sku})`,
        changes: editData.changes.map(c => ({
          field: c.label,
          oldValue: c.oldValue || "",
          newValue: c.newValue || ""
        }))
      }
      setChangeHistory(prev => [newEntry, ...prev])
    }

    // Apply changes would happen here
    console.log("Line changes saved:", editData)
  }

  // Handle shipment creation complete
  const handleShipmentComplete = (shipmentData: ShipmentData) => {
    // Update line quantities - mark as shipped
    setLines(prev => prev.map(line => {
      const shippedLine = shipmentData.lines.find(l => l.lineNumber === line.lineNumber)
      if (shippedLine) {
        return {
          ...line,
          quantityShipped: line.quantityShipped + shippedLine.qty
        }
      }
      return line
    }))

    // Add to change history
    const newEntry: ChangeHistoryEntry = {
      id: `ch-${Date.now()}`,
      timestamp: new Date(),
      user: "Current User",
      type: "status",
      description: `Created shipment ${shipmentData.shipmentId}`,
      changes: shipmentData.lines.map(l => ({
        field: `Line ${l.lineNumber} (${l.sku})`,
        oldValue: "—",
        newValue: `Shipped ${l.qty} units`
      }))
    }
    setChangeHistory(prev => [newEntry, ...prev])

    setIsCreateShipmentModalOpen(false)
    console.log("Shipment created:", shipmentData)
  }

  // Get header charges (charges without appliesToLines)
  const headerCharges = charges.filter(c => !c.appliesToLines)

  // Get charges for a specific line
  const getLineCharges = (lineNumber: number) => {
    return charges.filter(c => c.appliesToLines?.includes(lineNumber))
  }

  // Get status badge color
  const getStatusBadge = (status: SOStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "confirmed":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Confirmed</Badge>
      case "partially_shipped":
        return <Badge className="bg-blue-100 text-blue-700">Partially Shipped</Badge>
      case "shipped":
        return <Badge className="bg-blue-100 text-blue-700">Shipped</Badge>
      case "partially_invoiced":
        return <Badge className="bg-amber-100 text-amber-700">Partially Invoiced</Badge>
      case "invoiced":
        return <Badge className="bg-green-100 text-green-700">Invoiced</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // ============================================================================
  // LINE DISPLAY RENDER FUNCTION
  // ============================================================================

  const renderLineDisplay = () => {
    switch (lineDisplayMode) {
      case "basic":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Ext. Price</th>
                {isEditMode && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => {
                const lineCanEdit = canEditLines && item.quantityShipped === 0
                return (
                  <tr
                    key={item.id}
                    onClick={() => handleLineClick(item)}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
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
                        <div className="w-5 h-5 rounded bg-muted" />
                        <span>{item.name}</span>
                        {(() => {
                          const lineIssues = soIssues.filter(i => i.lineNumber === item.lineNumber || i.sku === item.sku)
                          if (lineIssues.length === 0) return null
                          return (
                            <LineIssuesBadge
                              issues={lineIssues.map(i => ({
                                id: i.id,
                                issueNumber: i.issueNumber,
                                priority: i.priority,
                              }))}
                            />
                          )
                        })()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        <SOLineStatusPill status={item.status} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{item.quantityOrdered}</td>
                    <td className="py-3 px-4 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium">${item.lineTotal.toFixed(2)}</td>
                    {isEditMode && (
                      <td className="py-3 px-2">
                        <button
                          onClick={(e) => handleEditLineClick(item, e)}
                          className={cn(
                            "p-1.5 rounded transition-opacity",
                            lineCanEdit
                              ? "hover:bg-muted opacity-0 group-hover:opacity-100"
                              : "opacity-30 cursor-not-allowed"
                          )}
                          title={lineCanEdit ? "Edit line" : "Cannot edit shipped lines"}
                          disabled={!lineCanEdit}
                        >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
              <tr className="bg-muted/30 font-medium">
                <td colSpan={isEditMode ? 6 : 5} className="py-3 px-4 text-right">Extended Total</td>
                <td className="py-3 px-4 text-right">{formatCurrency(orderTotals.linesSubtotal)}</td>
                {isEditMode && <td></td>}
              </tr>
            </tbody>
          </table>
        )

      case "financials":
        const lineExpediteFees = lines.reduce((sum, l) => sum + (l.expediteFee || 0), 0)
        const totalLineDiscounts = lines.reduce((sum, l) => sum + l.discountAmount, 0)
        const allDiscounts = totalLineDiscounts + orderTotals.discounts.applied
        const totalOtherFees = orderTotals.charges.total

        const getLineOtherFees = (lineNumber: number) => {
          return charges
            .filter(c => c.appliesToLines?.includes(lineNumber))
            .reduce((sum, c) => sum + c.amount, 0)
        }

        const financialsHeaderCharges = charges.filter(c => !c.appliesToLines)
        const headerChargesTotal = financialsHeaderCharges.reduce((sum, c) => sum + c.amount, 0)

        return (
          <div className="space-y-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-10">#</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Item</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtotal</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Discount</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Expedite</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Other Fees</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tax</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((item) => {
                  const lineOtherFees = getLineOtherFees(item.lineNumber)
                  const lineTotal = item.lineTotalWithTax + (item.expediteFee || 0) + lineOtherFees
                  return (
                    <tr key={item.id} onClick={() => handleLineClick(item)} className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-xs text-muted-foreground">{item.lineNumber}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{item.sku}</span>
                          <span className="text-xs text-muted-foreground">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                        {item.subtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {item.discountAmount > 0 ? (
                          <span className="text-muted-foreground">({item.discountAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })})</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {item.expediteFee && item.expediteFee > 0 ? (
                          <span className="text-foreground">{item.expediteFee.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {lineOtherFees > 0 ? (
                          <span className="text-foreground">{lineOtherFees.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                        {item.taxAmount > 0 ? item.taxAmount.toLocaleString("en-US", { style: "currency", currency: "USD" }) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium text-foreground">
                        {lineTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </td>
                    </tr>
                  )
                })}

                {/* Lines Subtotal */}
                <tr className="bg-muted/20">
                  <td colSpan={2} className="py-2 px-3 text-right text-xs text-muted-foreground font-medium">Lines</td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {lines.reduce((sum, l) => sum + l.subtotal, 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {totalLineDiscounts > 0 ? `(${totalLineDiscounts.toLocaleString("en-US", { style: "currency", currency: "USD" })})` : "—"}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {lineExpediteFees > 0 ? lineExpediteFees.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {charges.filter(c => c.appliesToLines).reduce((sum, c) => sum + c.amount, 0) > 0
                      ? charges.filter(c => c.appliesToLines).reduce((sum, c) => sum + c.amount, 0).toLocaleString("en-US", { style: "currency", currency: "USD" })
                      : "—"}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {orderTotals.linesTax.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-medium text-muted-foreground">
                    {(lines.reduce((sum, l) => sum + l.lineTotalWithTax, 0) + lineExpediteFees + charges.filter(c => c.appliesToLines).reduce((sum, c) => sum + c.amount, 0)).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>

                {/* Header-Level Charges */}
                {headerChargesTotal > 0 && (
                  <tr className="bg-muted/10">
                    <td colSpan={2} className="py-2 px-3 text-right text-xs text-muted-foreground font-medium">
                      Order Charges
                      <span className="ml-2 font-normal">({financialsHeaderCharges.map(c => c.name).join(", ")})</span>
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground/50">—</td>
                    <td className="py-2 px-3 text-right text-muted-foreground/50">—</td>
                    <td className="py-2 px-3 text-right text-muted-foreground/50">—</td>
                    <td className="py-2 px-3 text-right tabular-nums text-foreground">
                      {headerChargesTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                      {orderTotals.chargesTax > 0 ? orderTotals.chargesTax.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium text-foreground">
                      {(headerChargesTotal + orderTotals.chargesTax).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </td>
                  </tr>
                )}

                {/* Grand Total */}
                <tr className="bg-foreground/5 border-t-2 border-border">
                  <td colSpan={2} className="py-3 px-3 text-right font-semibold text-foreground">Order Total</td>
                  <td className="py-3 px-3 text-right tabular-nums text-foreground">
                    {orderTotals.linesSubtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                    {allDiscounts > 0 ? `(${allDiscounts.toLocaleString("en-US", { style: "currency", currency: "USD" })})` : "—"}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-foreground">
                    {lineExpediteFees > 0 ? lineExpediteFees.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-foreground">
                    {totalOtherFees > 0 ? totalOtherFees.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-foreground">
                    {orderTotals.totalTax.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                    {(orderTotals.grandTotal + lineExpediteFees).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )

      case "quantity":
        const getOpenQty = (item: LineItem) => item.quantityOrdered - item.quantityShipped

        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Ordered</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Allocated</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Shipped</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Delivered</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Invoiced</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Collected</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Backorder</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => {
                const openQty = getOpenQty(item)
                const isFullyShipped = item.quantityShipped >= item.quantityOrdered
                // For SO: allocated qty represents inventory reserved for this order
                const allocatedQty = item.quantityShipped || 0

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleLineClick(item)}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {item.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{item.sku}</span>
                    </td>
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-3 text-center tabular-nums font-medium">{item.quantityOrdered}</td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {allocatedQty > 0 ? allocatedQty : "—"}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {item.quantityShipped > 0 ? (
                        <span className={isFullyShipped ? "text-primary font-medium" : ""}>
                          {item.quantityShipped}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {item.quantityReceived > 0 ? (
                        <span className="text-primary">{item.quantityReceived}</span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {item.quantityAccepted > 0 ? item.quantityAccepted : "—"}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {item.quantityPaid > 0 ? (
                        <span className="text-primary">{item.quantityPaid}</span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {openQty > 0 ? (
                        <span className="text-amber-600 font-medium">{openQty}</span>
                      ) : (
                        <span className="text-primary">0</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )

      case "logistics":
        const parseDate = (dateStr: string) => {
          const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
          const parts = dateStr.replace(",", "").split(" ")
          return new Date(parseInt(parts[2]), months[parts[0]], parseInt(parts[1]))
        }

        const getLineShipments = (lineNumber: number) => {
          return soShipments
            .filter(s => s.lines.some(l => l.lineNumber === lineNumber))
            .map(s => ({
              ...s,
              lineQty: s.lines.find(l => l.lineNumber === lineNumber)?.qtyShipped || 0
            }))
        }

        const getExpectedDateInfo = (item: LineItem) => {
          const lineShipments = getLineShipments(item.lineNumber)
          // For SO: "delivered" means shipped and confirmed received by customer
          const allShipped = item.quantityShipped >= item.quantityOrdered
          const promisedDate = parseDate(item.promisedDate)

          if (allShipped) {
            const lastShipped = lineShipments
              .filter(s => s.status === "received" && s.receivedDate)
              .sort((a, b) => parseDate(b.receivedDate!).getTime() - parseDate(a.receivedDate!).getTime())[0]
            return { date: lastShipped?.receivedDate || "", status: "delivered" as const }
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
          const allShipped = item.quantityShipped >= item.quantityOrdered
          if (allShipped) {
            return { label: "Shipped", color: "text-primary", bgColor: "bg-primary/10", icon: "check" }
          }

          const partiallyShipped = item.quantityShipped > 0
          if (partiallyShipped) {
            return { label: "Partial", color: "text-blue-600", bgColor: "bg-blue-50", icon: "check" }
          }

          const expectedInfo = getExpectedDateInfo(item)
          if (expectedInfo.status === "delayed") {
            return { label: "Late", color: "text-destructive", bgColor: "bg-destructive/10", icon: "alert" }
          }

          return { label: "Pending", color: "text-foreground", bgColor: "bg-muted", icon: "check" }
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

        return (
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
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
                      key={item.id}
                      onClick={() => handleLineClick(item)}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
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
                          <span className={item.quantityShipped >= item.quantityOrdered ? "text-primary font-medium" : ""}>
                            {item.quantityShipped}
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
            {/* Legend */}
            <div className="flex items-center divide-x divide-border px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2 pr-6">
                <span className="font-medium">Expected:</span>
                <span className="text-primary">Delivered</span>
                <span className="text-destructive">Delayed</span>
                <span>On Track</span>
              </div>
              <div className="flex items-center gap-2 px-6">
                <span className="font-medium">Shipments:</span>
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-primary" /> Delivered</span>
                <span className="inline-flex items-center gap-1"><Truck className="w-2.5 h-2.5 text-blue-600" /> In Transit</span>
                <span className="inline-flex items-center gap-1"><Package className="w-2.5 h-2.5" /> Expected</span>
              </div>
            </div>
          </div>
        )

      case "quality":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="Inspection Required">Insp</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="Certificate of Conformance">CoC</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground" title="First Article Inspection">FAI</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Shipped</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Verified</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">On Hold</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Returns</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => {
                const lineNCRs = soShipments.flatMap(s => s.ncrs || []).filter(ncr => ncr.lineNumber === item.lineNumber)
                const openNCRs = lineNCRs.filter(ncr => ncr.status === "open")
                const hasQualityIssue = item.quantityInQualityHold > 0 || openNCRs.length > 0
                const qr = item.qualityRequirements

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleLineClick(item)}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                        {item.lineNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-primary font-medium">{item.sku}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr?.inspectionRequired ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr?.cocRequired ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {qr?.faiRequired ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">{item.quantityShipped}</td>
                    <td className="py-3 px-4 text-center text-primary">{item.quantityAccepted || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      {item.quantityInQualityHold > 0 ? (
                        <span className="text-amber-600 font-medium">{item.quantityInQualityHold}</span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {openNCRs.length > 0 ? (
                        <span className="text-destructive font-medium">{openNCRs.length} RMA</span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasQualityIssue ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded text-amber-600 bg-amber-50">
                          <AlertTriangle className="w-3 h-3" />
                          Issue
                        </span>
                      ) : item.quantityAccepted > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded text-primary bg-primary/10">
                          <CheckCircle2 className="w-3 h-3" />
                          OK
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - spans full width */}
      <div className="bg-muted/30 border-b shrink-0 z-10">
          <div className="px-6 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                <span>Home</span>
                <span className="mx-2">/</span>
                <span>Sales Orders</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-foreground">{soHeader.poNumber}</span>
              </div>
            </div>

            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
                  {SO_TERMINOLOGY.orderType} {soHeader.poNumber}
                  {isEditMode && (
                    <span className="text-sm font-medium px-2 py-1 rounded bg-amber-100 text-amber-800">
                      Editing
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-6 text-sm">
                  <div onClick={(e) => e.stopPropagation()}>
                    <SOStatusSelect
                      value={orderStatus}
                      onChange={setOrderStatus}
                      label="Status"
                      showLabel={true}
                    />
                  </div>
                  {/* Issue Count Badge */}
                  {criticalCount > 0 && (
                    <div>
                      <div className="text-muted-foreground mb-1">Action Required</div>
                      <IssueCountBadge
                        count={criticalCount}
                        criticalCount={criticalCount}
                        size="md"
                        label={criticalCount === 1 ? "issue" : "issues"}
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="text-foreground font-medium">{soHeader.dates.created}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Required</div>
                    <div className="text-foreground font-medium">{soHeader.dates.expectedCompletion}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{SO_TERMINOLOGY.acknowledgeAction}</div>
                    <div className="text-foreground font-medium">{soHeader.dates.acknowledged}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  title="Issues"
                  className={cn("gap-1.5", issuesSidebarOpen && "bg-muted")}
                  onClick={() => {
                    if (issuesSidebarOpen) {
                      closeIssuesPanel()
                    } else {
                      setDocumentsSidebarOpen(false)
                      setActivitySidebarOpen(false)
                      setChangeHistorySidebarOpen(false)
                      openIssuesPanel()
                    }
                  }}
                >
                  <AlertCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title={`Call ${SO_TERMINOLOGY.externalParty.toLowerCase()}`}
                  onClick={() => setIsCallModalOpen(true)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title={`Email ${SO_TERMINOLOGY.externalParty.toLowerCase()}`}
                  onClick={() => openEmailModal({ variant: "so", orderNumber: soNumber || soHeader.poNumber })}
                >
                  <Mail className="w-4 h-4" />
                </Button>

                <ExpandableToolbar>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      closeIssuesPanel()
                      setActivitySidebarOpen(false)
                      setChangeHistorySidebarOpen(false)
                      setDocumentsSidebarOpen(!documentsSidebarOpen)
                    }}
                    title="Documents"
                    className={cn(documentsSidebarOpen && "bg-muted")}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      closeIssuesPanel()
                      setDocumentsSidebarOpen(false)
                      setChangeHistorySidebarOpen(false)
                      setActivitySidebarOpen(!activitySidebarOpen)
                    }}
                    title="Communications"
                    className={cn(activitySidebarOpen && "bg-muted")}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      closeIssuesPanel()
                      setDocumentsSidebarOpen(false)
                      setActivitySidebarOpen(false)
                      setChangeHistorySidebarOpen(!changeHistorySidebarOpen)
                    }}
                    title="Change History"
                    className={cn(changeHistorySidebarOpen && "bg-muted")}
                  >
                    <History className="w-4 h-4" />
                  </Button>

                  <div className="w-px h-5 bg-border mx-1" />

                  <Button
                    size="sm"
                    variant="ghost"
                    title="Create Shipment"
                    className="gap-1"
                    onClick={() => setIsCreateShipmentModalOpen(true)}
                  >
                    <Truck className="w-4 h-4" />
                  </Button>
                  {isEditMode ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditMode(false)}
                      title="Exit Edit Mode"
                      className="text-amber-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditMode(true)}
                      title={canEdit ? "Edit" : "Cannot edit - order has shipped"}
                      disabled={!canEdit}
                      className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" title="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" title="AI Summary">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </ExpandableToolbar>

                <Button className="bg-primary text-primary-foreground">{SO_TERMINOLOGY.receiveAction}</Button>
              </div>
            </div>

            {/* Edit Mode Banner */}
            {isEditMode && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <Edit className="w-4 h-4" />
                  <span className="font-medium">Edit Mode</span>
                  <span className="text-amber-600">— Click on sections to edit. Changes are saved immediately.</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Done Editing
                </Button>
              </div>
            )}
          </div>
        </div>

      {/* Tab Navigation - spans full width */}
      <div className="border-b border-border shrink-0 bg-background z-10">
          <div className="px-6 flex gap-8">
            {[
              { id: "details", label: "Overview" },
              { id: "shipping", label: SO_TERMINOLOGY.receivingTab },
              { id: "issues", label: "Issues", badge: actionRequiredIssues.length, isCritical: criticalCount > 0 },
              { id: "financials", label: SO_TERMINOLOGY.payablesTab },
              { id: "quality", label: "Quality" },
            ].map((tab) => (
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
                {(tab as { badge?: number }).badge !== undefined && (tab as { badge?: number }).badge! > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-medium rounded-full px-1.5",
                    (tab as { isCritical?: boolean }).isCritical
                      ? "bg-red-100 text-red-700"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {(tab as { badge?: number }).badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      {/* Content row - Tab Content and Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tab Content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6">
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* General Information Card */}
                <Card className="border border-border">
                  <div className={`px-6 py-3 ${isGeneralInfoExpanded ? "border-b border-border" : ""}`}>
                    <div
                      className="flex items-center justify-between mb-2 cursor-pointer hover:bg-muted/30 transition-colors p-2 -m-2"
                      onClick={() => setIsGeneralInfoExpanded(!isGeneralInfoExpanded)}
                    >
                      <div className="text-sm font-semibold text-foreground">General Information</div>
                      <div className="flex items-center gap-2">
                        {isEditMode && canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditHeaderClick()
                            }}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isGeneralInfoExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    {/* Always visible row */}
                    <div className="grid grid-cols-4 gap-6">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">{SO_TERMINOLOGY.externalParty}</div>
                        <div className="text-sm font-medium">{soHeader.supplier.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">{SO_TERMINOLOGY.internalOwner}</div>
                        <div className="text-sm font-medium">{soHeader.buyer.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Ordered</div>
                        <div className="text-sm font-medium">{soHeader.dates.created}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Priority</div>
                        <Badge className={`text-xs w-fit ${
                          soHeader.urgency === "critical" ? "bg-destructive/10 text-destructive" :
                          soHeader.urgency === "high" ? "bg-amber-100 text-amber-800" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {soHeader.urgency === "standard" ? "Normal" : soHeader.urgency.charAt(0).toUpperCase() + soHeader.urgency.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    {/* Related documents */}
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Related:</span>
                        <button className="inline-flex items-center gap-1 text-xs font-medium font-mono px-2 py-0.5 rounded border border-border bg-muted text-foreground hover:bg-accent transition-colors">
                          Customer PO: ACME-PO-2024-089
                        </button>
                      </div>
                    </div>
                  </div>
                  {isGeneralInfoExpanded && (
                    <div className="px-6 py-4 space-y-4">
                      <div className="grid grid-cols-4 gap-6">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Contact</div>
                          <div className="text-sm">{customerContact.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Email</div>
                          <div className="text-sm">{customerContact.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Phone</div>
                          <div className="text-sm">{customerContact.phone}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Payment Terms</div>
                          <div className="text-sm">{soHeader.payment.terms}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-6">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Ship To</div>
                          <div className="text-sm">{soHeader.shipping.destination}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Shipping Method</div>
                          <div className="text-sm">{soHeader.shipping.method}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Freight Terms</div>
                          <div className="text-sm">{soHeader.shipping.terms}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Currency</div>
                          <div className="text-sm">{soHeader.payment.currency}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Line Items Card */}
                <Card className="border border-border">
                  <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">
                      Line Items ({lines.length})
                    </div>
                    <div className="flex items-center gap-2">
                      <SOLineDisplaySelector
                        value={lineDisplayMode}
                        onChange={setLineDisplayMode}
                      />
                      {isEditMode && canEditLines && (
                        <Button size="sm" variant="outline" className="gap-1">
                          <Edit className="w-3.5 h-3.5" />
                          Add Line
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {renderLineDisplay()}
                  </div>
                </Card>

                {/* Financials & Notes section */}
                <Card className="border border-border">
                  <div className="px-6 py-4">
                    <h2 className="text-lg font-semibold mb-6">Financials & Notes</h2>

                    <div className="space-y-4">
                      {/* Financial Summary - Matching table structure */}
                      <div className="flex justify-end">
                        <div className="w-96 space-y-2">
                          {/* Lines Subtotal */}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Lines Subtotal</span>
                            <span className="tabular-nums">{formatCurrency(orderTotals.linesSubtotal)}</span>
                          </div>

                          {/* Discounts */}
                          {orderTotals.discounts.applied > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Discounts</span>
                              <span className="tabular-nums text-green-600">({formatCurrency(orderTotals.discounts.applied)})</span>
                            </div>
                          )}

                          {/* Expedite Fees */}
                          {(orderTotals.charges.expedite + lineExpediteFees) > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Expedite Fees</span>
                              <span className="tabular-nums">{formatCurrency(orderTotals.charges.expedite + lineExpediteFees)}</span>
                            </div>
                          )}

                          {/* Other Charges (shipping, handling, duties, other) */}
                          {(orderTotals.charges.shipping + orderTotals.charges.handling + orderTotals.charges.duties + orderTotals.charges.other) > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Other Charges</span>
                              <span className="tabular-nums">{formatCurrency(orderTotals.charges.shipping + orderTotals.charges.handling + orderTotals.charges.duties + orderTotals.charges.other)}</span>
                            </div>
                          )}

                          {/* Tax */}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax ({(orderTotals.taxRate * 100).toFixed(2)}%)</span>
                            <span className="tabular-nums">{formatCurrency(orderTotals.totalTax)}</span>
                          </div>

                          {/* Grand Total */}
                          <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                            <span>Grand Total</span>
                            <span className="tabular-nums">{formatCurrency(orderTotals.grandTotal + lineExpediteFees)}</span>
                          </div>

                          {/* Potential savings hint */}
                          {orderTotals.discounts.potential > 0 && (
                            <div className="flex justify-between text-xs pt-2 text-muted-foreground">
                              <span>Early payment discount available</span>
                              <span className="text-green-600 font-medium">Save {formatCurrency(orderTotals.discounts.potential)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Shipping Tab */}
            {activeTab === "shipping" && (
              <ReceivingTab lines={lines} poNumber={soHeader.poNumber} />
            )}

            {/* Issues Tab */}
            {activeTab === "issues" && (
              <IssuesTab variant="so" orderNumber={soNumber || soHeader.poNumber} />
            )}

            {/* Receivables Tab */}
            {activeTab === "financials" && (
              <FinancialsTab lines={lines} poNumber={soHeader.poNumber} variant="receivables" />
            )}

            {/* Quality Tab */}
            {activeTab === "quality" && (
              <QualityTab lines={lines} poNumber={soHeader.poNumber} />
            )}
          </div>
        </div>

        {/* Right Side Panels - Push layout */}
        <div
          className={cn(
            "flex-shrink-0 bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-200 ease-out",
            issuesSidebarOpen ? "w-[400px]" : documentsSidebarOpen ? "w-[400px]" : activitySidebarOpen ? "w-[440px]" : changeHistorySidebarOpen ? "w-[400px]" : "w-0 border-l-0"
          )}
        >
          {/* Issues Panel */}
          {issuesSidebarOpen && (
            <>
              <div className="flex items-center justify-between h-12 px-3 border-b border-border flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground">Issues</span>
                <button
                  onClick={closeIssuesPanel}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Close panel"
                >
                  <ChevronsRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <IssuesTab variant="so" orderNumber={soNumber || soHeader.poNumber} />
              </div>
            </>
          )}

          {/* Documents Panel */}
          {documentsSidebarOpen && (
            <DocumentsPanel
              orderNumber={soNumber || soHeader.poNumber}
              orderType="so"
              onClose={() => setDocumentsSidebarOpen(false)}
            />
          )}

          {/* Activity/Communications Panel */}
          {activitySidebarOpen && (
            <>
              <div className="flex items-center justify-between h-12 px-3 border-b border-border flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground">Communications</span>
                <button
                  onClick={() => setActivitySidebarOpen(false)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Close panel"
                >
                  <ChevronsRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ActivityTimeline />
              </div>
            </>
          )}

          {/* Change History Panel */}
          {changeHistorySidebarOpen && (
            <>
              <div className="flex items-center justify-between h-12 px-3 border-b border-border flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground">Change History</span>
                <button
                  onClick={() => setChangeHistorySidebarOpen(false)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Close panel"
                >
                  <ChevronsRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {changeHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No changes recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {changeHistory.map((entry) => (
                      <div key={entry.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {entry.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">by {entry.user}</p>
                        {entry.changes.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                            {entry.changes.map((change, i) => (
                              <div key={i} className="text-xs text-muted-foreground">
                                {change.field}: <span className="line-through">{change.oldValue}</span> → <span className="text-foreground">{change.newValue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Line Item View Modal */}
      {selectedLineItem && (
        <LineDetailModal
          isOpen={!!selectedLineItem}
          onClose={() => setSelectedLineItem(null)}
          item={selectedLineItem}
          orderNumber={soHeader.poNumber}
          variant="sales"
        />
      )}

      {/* Edit Header Modal */}
      <SOEditHeaderModal
        isOpen={isEditHeaderModalOpen}
        onClose={() => setIsEditHeaderModalOpen(false)}
        onSave={handleHeaderSave}
        header={soHeader}
        headerCharges={headerCharges}
      />

      {/* Edit Line Modal */}
      <SOEditLineModal
        isOpen={isEditLineModalOpen}
        onClose={() => {
          setIsEditLineModalOpen(false)
          setEditingLineItem(null)
        }}
        onSave={handleLineSave}
        line={editingLineItem}
        lineCharges={editingLineItem ? getLineCharges(editingLineItem.lineNumber) : []}
      />

      {/* Create Shipment Modal */}
      <SOCreateShipmentModal
        isOpen={isCreateShipmentModalOpen}
        onClose={() => setIsCreateShipmentModalOpen(false)}
        onComplete={handleShipmentComplete}
        lines={lines}
        soNumber={soNumber || soHeader.poNumber}
        customerName={customerContact.name}
      />

      {/* Call Modal */}
      <VoipCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        vendorContact={customerContact}
        poNumber={soNumber || soHeader.poNumber}
        variant="so"
      />
    </div>
  )
}
