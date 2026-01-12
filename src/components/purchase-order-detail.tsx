"use client"

import { useState, useEffect } from "react"
import { Edit, Download, ChevronDown, ChevronUp, Phone, Mail, Inbox, Sparkles, AlertCircle, FileText, MessageSquare, ChevronsRight, AlertTriangle, CheckCircle2, Clock, FileWarning, ShieldCheck, GitBranch, Zap, Search, FileCheck, FlaskConical, Eye, Truck, Package, CircleDot } from "lucide-react"
import { ExpandableToolbar } from "@/components/ui/expandable-toolbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActivityTimeline } from "@/components/activity-timeline"
import { IssuesTab } from "@/components/issues-tab"
import { DocumentsPanel } from "@/components/documents-panel"
import { QualityTab } from "@/components/quality-tab"
import { LineDisplaySelector } from "@/components/line-display-selector"
import { FinancialsTab } from "@/components/financials-tab"
import { ComplianceTab } from "@/components/compliance-tab"
import { LineDetailModal } from "@/components/line-detail-modal"
import { LineStatusPill } from "@/components/line-status-pill"
import { useChatContext } from "@/context/ChatContext"
import { POStatusSelect } from "@/components/po-status-select"
import { PurchaseOrderStatus, PurchaseOrderStatusMeta } from "@/types/purchase-order-status"
import { ReceivingTab } from "@/components/receiving-tab"
import { VoipCallModal } from "@/components/voip-call-modal"
import { EmailComposeModal } from "@/components/email-compose-modal"
import { cn } from "@/lib/utils"
import { getTaxRate, calculateLineFinancials } from "@/lib/tax-config"
import {
  lineItems as defaultLineItems,
  vendorContact as defaultVendorContact,
  poHeader as defaultPoHeader,
  computePOTotals,
  getActionRequiredIssues,
  getLineNeedStatus,
  shipments as defaultShipments,
  detectPOIssues,
  detectPOIssuesForPO,
  getIssuesForEntity,
  poCharges as defaultPoCharges,
  purchaseOrdersData,
  getPOData,
  checkLineReqAuthorization,
  type LineItem,
  type POCharge,
  type POData,
  type ToleranceStatus,
  type POIssue,
} from "@/lib/mock-data"
import { IssueCountBadge, LineIssuesBadge } from "@/components/issue-count-badge"
import { ExpediteModal, type ExpediteLineData } from "@/components/expedite-modal"
import { EditLineModal, type LineEditData } from "@/components/edit-line-modal"
import { EditChargeModal, type ChargeUpdates } from "@/components/edit-charge-modal"
import { EditHeaderModal, type HeaderEditData } from "@/components/edit-header-modal"
import { AddLineModal, type NewLineData } from "@/components/add-line-modal"
import { useEmailContext } from "@/context/EmailContext"
import { useIssuePanel } from "@/context/IssuePanelContext"
import { RevisionProvider, useRevision } from "@/context/RevisionContext"
import { RevisionBadge } from "@/components/revision-badge"
import { RevisionTabs } from "@/components/revision-tabs"
import { RevisionStatusPanel } from "@/components/revision-status-panel"
import { ApprovalActionButtons } from "@/components/approval-action-buttons"
import { UserSwitcher } from "@/components/user-switcher"
import { RevisionHistory } from "@/components/revision-history"
import { RevisionStatus } from "@/types/revision-status"
import { ReqAuthorizationSummary } from "@/components/req-authorization-summary"
import { POPDFDownload } from "@/components/po-pdf-download"
import { FinancialBreakdown, type FinancialBreakdownData, type FinancialCharge, type FinancialDiscount } from "@/components/financial-breakdown"

const LINE_STATUSES = ["draft", "issued", "open", "partially received", "received", "closed", "on hold", "canceled"]

const STATUS_COLORS = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-primary/10 text-primary",
  open: "bg-primary/5 text-primary",
  "partially received": "bg-accent text-accent-foreground",
  received: "bg-primary/5 text-primary",
  closed: "bg-muted text-muted-foreground",
  "on hold": "bg-accent text-accent-foreground",
  canceled: "bg-destructive text-destructive-foreground",
}

// Map revision status to PO status for display
function mapRevisionStatusToPOStatus(revisionStatus?: RevisionStatus): PurchaseOrderStatus {
  switch (revisionStatus) {
    case RevisionStatus.Draft:
    case RevisionStatus.Rejected:
      return PurchaseOrderStatus.Draft
    case RevisionStatus.PendingApproval:
      return PurchaseOrderStatus.Submitted
    case RevisionStatus.Approved:
    case RevisionStatus.Sent:
    case RevisionStatus.Acknowledged:
      return PurchaseOrderStatus.Approved
    default:
      return PurchaseOrderStatus.Draft
  }
}

interface PurchaseOrderDetailProps {
  poNumber?: string
}

// Wrapper component that provides RevisionContext
export function PurchaseOrderDetail({ poNumber }: PurchaseOrderDetailProps) {
  // Get PO data - use provided poNumber or default to PO-0861
  const poData = poNumber ? getPOData(poNumber) : null
  const currentPONumber = poData?.header.poNumber || defaultPoHeader.poNumber

  return (
    <RevisionProvider poNumber={currentPONumber}>
      <PurchaseOrderDetailContent poNumber={poNumber} />
    </RevisionProvider>
  )
}

// Main content component that uses revision context
function PurchaseOrderDetailContent({ poNumber }: { poNumber?: string }) {
  // Get PO data - use provided poNumber or default to PO-0861
  const currentPOData = poNumber ? getPOData(poNumber) : null
  const lineItems = currentPOData?.lineItems || defaultLineItems
  const vendorContact = currentPOData?.vendorContact || defaultVendorContact
  const poHeader = currentPOData?.header || defaultPoHeader
  const shipments = currentPOData?.shipments || defaultShipments
  const poCharges = currentPOData?.charges || defaultPoCharges

  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null)
  const [isLineModalOpen, setIsLineModalOpen] = useState(false)
  const [isExpediteModalOpen, setIsExpediteModalOpen] = useState(false)
  const [isEditLineModalOpen, setIsEditLineModalOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<LineItem | null>(null)
  const [isEditChargeModalOpen, setIsEditChargeModalOpen] = useState(false)
  const [editingCharge, setEditingCharge] = useState<POCharge | null>(null)
  const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = useState(false)
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false)
  const [charges, setCharges] = useState(poCharges)
  const [lines, setLines] = useState(lineItems)
  const [headerData, setHeaderData] = useState(poHeader)
  const [editingLineId, setEditingLineId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [lineDisplayMode, setLineDisplayMode] = useState("basic")
  const [isGeneralInfoExpanded, setIsGeneralInfoExpanded] = useState(false)
  const [poStatus, setPoStatus] = useState<PurchaseOrderStatus>(PurchaseOrderStatus.Approved)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [documentsSidebarOpen, setDocumentsSidebarOpen] = useState(false)
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [revisionSidebarOpen, setRevisionSidebarOpen] = useState(false)
  const { requestPOSummary } = useChatContext()
  const { openEmailModal } = useEmailContext()
  const { isOpen: issuesSidebarOpen, openPanel: openIssuesPanel, closePanel: closeIssuesPanel } = useIssuePanel()

  // Revision context
  const {
    activeRevision,
    pendingDraftRevision,
    selectedRevision,
    isViewingDraft,
    isEditMode,
    requiresApproval,
    costDeltaInfo,
    updateCurrentTotal,
    enterEditMode,
    exitEditMode,
    createDraft,
    addChangeToDraft,
    hasPendingDraft,
    sendToSupplier,
    skipApprovalAndSend,
    recordAcknowledgment,
    canApprove,
    canSkipApproval,
  } = useRevision()

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)

  // Unified edit handler - creates draft directly, no type selection needed
  const handleEditClick = () => {
    if (!hasPendingDraft) {
      createDraft()
    } else {
      enterEditMode()
    }
    closeIssuesPanel()
    setDocumentsSidebarOpen(false)
    setActivitySidebarOpen(false)
    setRevisionSidebarOpen(true)
  }

  const handleSendToSupplier = () => {
    // Open email modal with revision details
    const changes = pendingDraftRevision?.changes.map(c => c.description) || []
    openEmailModal({
      contextType: "revision_send",
      poNumber: poHeader.poNumber,
      revisionVersion: pendingDraftRevision?.version || "3.0",
      changesSummary: changes,
    })
    // Update revision status to Sent
    sendToSupplier()
  }

  const handleSkipApprovalAndSend = () => {
    // Open email modal with revision details (same as regular send)
    const changes = pendingDraftRevision?.changes.map(c => c.description) || []
    openEmailModal({
      contextType: "revision_send",
      poNumber: poHeader.poNumber,
      revisionVersion: pendingDraftRevision?.version || "3.0",
      changesSummary: changes,
    })
    // Skip approval and update revision status to Sent
    skipApprovalAndSend()
  }

  const handleRecordAcknowledgment = () => {
    recordAcknowledgment(vendorContact.name)
    setRevisionSidebarOpen(false)
  }

  const handleExpediteLines = (expeditedLines: ExpediteLineData[]) => {
    // Create or resume draft - unified flow (no type selection)
    const draft = hasPendingDraft ? pendingDraftRevision : createDraft()
    if (!draft) return

    // Update the lines with expedite status and new promise date
    setLines(prev => prev.map(line => {
      const expediteData = expeditedLines.find(e => e.lineId === line.id)
      if (expediteData) {
        return {
          ...line,
          expedite: true,
          expediteFee: expediteData.expediteFee,
          promisedDate: expediteData.newPromiseDate || line.promisedDate
        }
      }
      return line
    }))

    // Add expedite fees as charges to trigger cost delta calculation
    const totalExpediteCharges = expeditedLines.reduce((sum, e) => sum + e.expediteFee, 0)
    if (totalExpediteCharges > 0) {
      const expediteCharge = {
        id: `CHG-EXP-${Date.now()}`,
        type: "expedite" as const,
        name: `Expedite Fees (${expeditedLines.length} line${expeditedLines.length > 1 ? 's' : ''})`,
        calculation: "fixed" as const,
        rate: totalExpediteCharges,
        amount: totalExpediteCharges,
        appliesToLines: expeditedLines.map(e => e.lineNumber),
        taxable: false,
        billable: true,
      }
      setCharges(prev => [...prev, expediteCharge])
    }

    // Add changes to the draft for each expedited line
    expeditedLines.forEach(expediteData => {
      const dateChanged = expediteData.newPromiseDate && expediteData.newPromiseDate !== expediteData.originalPromiseDate
      const parts = []
      if (dateChanged) {
        parts.push(`new date: ${expediteData.newPromiseDate}`)
      }
      if (expediteData.expediteFee > 0) {
        parts.push(`$${expediteData.expediteFee.toFixed(2)} fee`)
      }
      const details = parts.length > 0 ? ` (${parts.join(', ')})` : ''

      addChangeToDraft({
        field: "expedite",
        previousValue: dateChanged ? `Promise: ${expediteData.originalPromiseDate}` : "Not expedited",
        newValue: `Expedited${details}`,
        editType: "non_critical",
        description: `Expedite Line ${expediteData.lineNumber} (${expediteData.sku})${details}`,
        lineNumber: expediteData.lineNumber,
      })
    })

    // Open the revision sidebar
    closeIssuesPanel()
    setDocumentsSidebarOpen(false)
    setActivitySidebarOpen(false)
    setRevisionSidebarOpen(true)
  }

  // Handler for editing a line item
  const handleEditLine = (line: LineItem) => {
    setEditingLine(line)
    setIsEditLineModalOpen(true)
  }

  // Handler for saving line edits
  const handleSaveLineEdit = (editData: LineEditData) => {
    // Create or resume draft - unified flow
    const draft = hasPendingDraft ? pendingDraftRevision : createDraft()
    if (!draft) return

    // Update the line with new values
    setLines(prev => prev.map(line => {
      if (line.id !== editData.lineId) return line

      const newQty = editData.quantity ?? line.quantityOrdered
      const newPrice = editData.unitPrice ?? line.unitPrice
      const newDiscount = editData.discountPercent ?? line.discountPercent ?? 0

      // Use centralized tax calculation with custom tax rate support
      const financials = calculateLineFinancials({
        quantity: newQty,
        unitPrice: newPrice,
        discountPercent: newDiscount,
        customTaxRate: editData.taxRate, // Use the custom tax rate from the edit modal
      })

      return {
        ...line,
        quantityOrdered: newQty,
        quantity: newQty,
        unitPrice: newPrice,
        promisedDate: editData.promisedDate ?? line.promisedDate,
        discountPercent: newDiscount,
        discountAmount: financials.discountAmount,
        netAmount: financials.netAmount,
        subtotal: financials.subtotal,
        taxRate: financials.taxRate,
        taxAmount: financials.taxAmount,
        lineTotal: financials.lineTotal,
        lineTotalWithTax: financials.lineTotalWithTax,
      }
    }))

    // Handle charge changes
    if (editData.chargeChanges && editData.chargeChanges.length > 0) {
      setCharges(prev => {
        let updated = [...prev]

        editData.chargeChanges.forEach(change => {
          if (change.action === "delete") {
            updated = updated.filter(c => c.id !== change.id)
          } else if (change.action === "add") {
            updated.push({
              id: change.id,
              type: change.type,
              name: change.name,
              calculation: "fixed",
              rate: change.amount,
              amount: change.amount,
              appliesToLines: [editData.lineNumber],
              taxable: false,
              billable: true,
            })
          } else if (change.action === "edit") {
            updated = updated.map(c =>
              c.id === change.id ? { ...c, amount: change.amount, name: change.name } : c
            )
          }
        })

        return updated
      })

      // Add charge changes to draft
      editData.chargeChanges.forEach(change => {
        if (change.action === "add") {
          addChangeToDraft({
            field: "line_charge",
            previousValue: null,
            newValue: `${change.name}: $${change.amount.toFixed(2)}`,
            editType: "critical",
            description: `Line ${editData.lineNumber}: Added ${change.name} charge $${change.amount.toFixed(2)}`,
            lineNumber: editData.lineNumber,
          })
        } else if (change.action === "edit" && change.originalAmount !== undefined) {
          addChangeToDraft({
            field: "line_charge",
            previousValue: `$${change.originalAmount.toFixed(2)}`,
            newValue: `$${change.amount.toFixed(2)}`,
            editType: "critical",
            description: `Line ${editData.lineNumber}: ${change.name} $${change.originalAmount.toFixed(2)} → $${change.amount.toFixed(2)}`,
            lineNumber: editData.lineNumber,
          })
        } else if (change.action === "delete") {
          addChangeToDraft({
            field: "line_charge",
            previousValue: `${change.name}: $${change.amount.toFixed(2)}`,
            newValue: null,
            editType: "critical",
            description: `Line ${editData.lineNumber}: Removed ${change.name} charge $${change.amount.toFixed(2)}`,
            lineNumber: editData.lineNumber,
          })
        }
      })
    }

    // Add field changes to the draft
    editData.changes.forEach(change => {
      const formattedOld = typeof change.oldValue === 'number' && change.field === 'unitPrice'
        ? `$${change.oldValue.toFixed(2)}`
        : change.oldValue
      const formattedNew = typeof change.newValue === 'number' && change.field === 'unitPrice'
        ? `$${change.newValue.toFixed(2)}`
        : change.newValue

      addChangeToDraft({
        field: change.field,
        previousValue: String(formattedOld),
        newValue: String(formattedNew),
        editType: change.field === 'promisedDate' ? 'non_critical' : 'critical',
        description: `Line ${editData.lineNumber} (${editData.sku}): ${change.label} ${formattedOld} → ${formattedNew}`,
        lineNumber: editData.lineNumber,
      })
    })

    // Open the revision sidebar
    closeIssuesPanel()
    setDocumentsSidebarOpen(false)
    setActivitySidebarOpen(false)
    setRevisionSidebarOpen(true)
  }

  // Handler for editing a charge
  const handleEditCharge = (charge: POCharge) => {
    setEditingCharge(charge)
    setIsEditChargeModalOpen(true)
  }

  // Handler for saving charge edits
  const handleSaveChargeEdit = (chargeId: string, updates: ChargeUpdates) => {
    // Create or resume draft - unified flow
    const draft = hasPendingDraft ? pendingDraftRevision : createDraft()
    if (!draft) return

    const oldCharge = charges.find(c => c.id === chargeId)
    if (!oldCharge) return

    // Update the charge
    setCharges(prev => prev.map(charge => {
      if (charge.id !== chargeId) return charge
      return {
        ...charge,
        type: updates.type,
        name: updates.name,
        amount: updates.amount,
        appliesToLines: updates.appliesToLines,
        taxable: updates.taxable,
      }
    }))

    // Track the change in the draft
    const changes: string[] = []
    if (oldCharge.amount !== updates.amount) {
      changes.push(`amount $${oldCharge.amount.toFixed(2)} → $${updates.amount.toFixed(2)}`)
    }
    if (oldCharge.name !== updates.name) {
      changes.push(`description "${oldCharge.name}" → "${updates.name}"`)
    }
    if (oldCharge.type !== updates.type) {
      changes.push(`type ${oldCharge.type} → ${updates.type}`)
    }

    if (changes.length > 0) {
      addChangeToDraft({
        field: "charge",
        previousValue: `${oldCharge.name}: $${oldCharge.amount.toFixed(2)}`,
        newValue: `${updates.name}: $${updates.amount.toFixed(2)}`,
        editType: "critical",
        description: `Updated ${oldCharge.name} fee: ${changes.join(', ')}`,
      })
    }

    // Open the revision sidebar
    closeIssuesPanel()
    setDocumentsSidebarOpen(false)
    setActivitySidebarOpen(false)
    setRevisionSidebarOpen(true)
  }

  // Handler for removing a charge
  const handleRemoveCharge = (chargeId: string) => {
    // Create or resume draft - unified flow
    const draft = hasPendingDraft ? pendingDraftRevision : createDraft()
    if (!draft) return

    const removedCharge = charges.find(c => c.id === chargeId)
    if (!removedCharge) return

    // Remove the charge
    setCharges(prev => prev.filter(c => c.id !== chargeId))

    // Track the change in the draft
    addChangeToDraft({
      field: "charge",
      previousValue: `${removedCharge.name}: $${removedCharge.amount.toFixed(2)}`,
      newValue: null,
      editType: "critical",
      description: `Removed ${removedCharge.name} fee: -$${removedCharge.amount.toFixed(2)}`,
    })

    // Open the revision sidebar
    closeIssuesPanel()
    setDocumentsSidebarOpen(false)
    setActivitySidebarOpen(false)
    setRevisionSidebarOpen(true)
  }

  // Handler for saving header edits
  const handleSaveHeaderEdit = (editData: HeaderEditData) => {
    // Create or resume draft - unified flow
    const draft = hasPendingDraft ? pendingDraftRevision : createDraft()
    if (!draft) return

    // Update header data with new values
    setHeaderData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        method: editData.shippingMethod ?? prev.shipping.method,
        terms: editData.shippingTerms ?? prev.shipping.terms,
      },
      payment: {
        ...prev.payment,
        terms: editData.paymentTerms ?? prev.payment.terms,
      },
      notes: editData.notes ?? prev.notes,
    }))

    // Handle charge changes
    if (editData.chargeChanges && editData.chargeChanges.length > 0) {
      setCharges(prev => {
        let updated = [...prev]

        editData.chargeChanges.forEach(change => {
          if (change.action === "delete") {
            updated = updated.filter(c => c.id !== change.id)
          } else if (change.action === "add") {
            updated.push({
              id: change.id,
              type: change.type,
              name: change.name,
              calculation: "fixed",
              rate: change.amount,
              amount: change.amount,
              taxable: false,
              billable: true,
            })
          } else if (change.action === "edit") {
            updated = updated.map(c =>
              c.id === change.id ? { ...c, amount: change.amount, name: change.name } : c
            )
          }
        })

        return updated
      })

      // Add charge changes to draft
      editData.chargeChanges.forEach(change => {
        if (change.action === "add") {
          addChangeToDraft({
            field: "header_charge",
            previousValue: null,
            newValue: `${change.name}: $${change.amount.toFixed(2)}`,
            editType: "critical",
            description: `Added order charge: ${change.name} $${change.amount.toFixed(2)}`,
          })
        } else if (change.action === "edit" && change.originalAmount !== undefined) {
          addChangeToDraft({
            field: "header_charge",
            previousValue: `$${change.originalAmount.toFixed(2)}`,
            newValue: `$${change.amount.toFixed(2)}`,
            editType: "critical",
            description: `${change.name}: $${change.originalAmount.toFixed(2)} → $${change.amount.toFixed(2)}`,
          })
        } else if (change.action === "delete") {
          addChangeToDraft({
            field: "header_charge",
            previousValue: `${change.name}: $${change.amount.toFixed(2)}`,
            newValue: null,
            editType: "critical",
            description: `Removed order charge: ${change.name} $${change.amount.toFixed(2)}`,
          })
        }
      })
    }

    // Add field changes to the draft
    editData.changes.forEach(change => {
      addChangeToDraft({
        field: change.field,
        previousValue: change.oldValue,
        newValue: change.newValue,
        editType: change.field === 'notes' ? 'non_critical' : 'critical',
        description: `${change.label}: ${change.oldValue} → ${change.newValue}`,
      })
    })

    // Open the revision sidebar
    closeIssuesPanel()
    setDocumentsSidebarOpen(false)
    setActivitySidebarOpen(false)
    setRevisionSidebarOpen(true)
  }

  // Handler for adding a new line
  const handleAddNewLine = (newLineData: NewLineData) => {
    // Create or resume draft - unified flow
    const draft = hasPendingDraft ? pendingDraftRevision : createDraft()
    if (!draft) return

    const subtotal = newLineData.quantity * newLineData.unitPrice
    const discountAmount = subtotal * (newLineData.discountPercent / 100)
    const netAmount = subtotal - discountAmount
    const taxAmount = netAmount * newLineData.taxRate

    // Build the need object
    const lineNeed = {
      moNumber: newLineData.need?.moNumber || "",
      moLineNumber: 1,
      customerName: newLineData.need?.customer || "",
      qtyNeeded: newLineData.quantity,
      needDate: newLineData.need?.needDate || newLineData.promisedDate,
      priority: "standard" as const,
    }

    // Create the new line item matching LineItem interface
    const newLine: LineItem = {
      id: Date.now(),
      lineNumber: newLineData.lineNumber,
      sku: newLineData.sku,
      name: newLineData.name,
      description: newLineData.description,
      quantity: newLineData.quantity,
      unitOfMeasure: newLineData.unitOfMeasure,
      unitPrice: newLineData.unitPrice,
      lineTotal: netAmount,
      status: "open",
      lineStatus: "open",
      shipToLocationId: "LOC-001",
      warehouseId: "WH-001",
      promisedDate: newLineData.promisedDate,
      originalDueDate: newLineData.promisedDate,
      projectCode: newLineData.projectCode,
      commodityCode: newLineData.commodityCode,
      requisitionNumber: newLineData.requisitionNumber || "",
      requisitionLineNumber: newLineData.requisitionLineNumber || 0,
      itemRevision: newLineData.itemRevision,
      leadTimeDays: String(newLineData.leadTimeDays),
      reqAuthorizedQty: newLineData.quantity,
      reqAuthorizedUnitPrice: newLineData.unitPrice,
      reqAuthorizedTotal: netAmount,
      quantityOrdered: newLineData.quantity,
      quantityShipped: 0,
      quantityReceived: 0,
      quantityAccepted: 0,
      quantityPaid: 0,
      quantityInQualityHold: 0,
      needs: [lineNeed],
      need: lineNeed,
      discountPercent: newLineData.discountPercent,
      discountAmount,
      taxCode: newLineData.taxCode,
      taxRate: newLineData.taxRate,
      taxAmount,
      expedite: false,
      expediteFee: undefined,
      qualityRequirements: newLineData.qualityRequirements,
      subtotal,
      netAmount,
      lineTotalWithTax: netAmount + taxAmount,
    }

    // Add the new line
    setLines(prev => [...prev, newLine])

    // Track the change in the draft
    addChangeToDraft({
      field: "add_line",
      previousValue: null,
      newValue: `Line ${newLineData.lineNumber}: ${newLineData.sku}`,
      editType: "critical",
      description: `Added Line ${newLineData.lineNumber}: ${newLineData.sku} - ${newLineData.name} (${newLineData.quantity} × $${newLineData.unitPrice.toFixed(2)} = $${newLineData.lineTotal.toFixed(2)})`,
      lineNumber: newLineData.lineNumber,
    })

    // Open the revision sidebar
    closeIssuesPanel()
    setDocumentsSidebarOpen(false)
    setActivitySidebarOpen(false)
    setRevisionSidebarOpen(true)
  }

  // All data comes from @/lib/mock-data
  // Pass local charges and lines state so totals update when fees or qty/price are changed
  const poTotals = computePOTotals(lines, charges || [])

  // Compute line-level expedite fees (separate from charge-level expedite)
  const lineExpediteFees = lines.reduce((sum, l) => sum + (l.expediteFee || 0), 0)

  const actionRequiredIssues = getActionRequiredIssues()
  const criticalCount = actionRequiredIssues.length

  // Update RevisionContext when totals change (for cost delta calculation)
  useEffect(() => {
    updateCurrentTotal(poTotals.grandTotal)
  }, [poTotals.grandTotal, updateCurrentTotal])

  const handleLineItemClick = (item: LineItem) => {
    setSelectedLineItem(item)
    setIsLineModalOpen(true)
  }

  // Update line item financial fields with recalculation
  const updateLineFinancials = (
    lineId: number,
    field: "discountPercent" | "taxCode" | "expedite" | "expediteFee",
    value: number | string | boolean
  ) => {
    setLines(prev => prev.map(line => {
      if (line.id !== lineId) return line

      let updated = { ...line }

      if (field === "discountPercent") {
        const discountPercent = Math.max(0, Math.min(100, Number(value) || 0))
        const discountAmount = (line.subtotal * discountPercent) / 100
        const netAmount = line.subtotal - discountAmount
        const taxAmount = netAmount * line.taxRate
        const lineTotalWithTax = netAmount + taxAmount

        updated = {
          ...updated,
          discountPercent,
          discountAmount,
          netAmount,
          taxAmount,
          lineTotalWithTax,
          lineTotal: netAmount, // Keep lineTotal in sync
        }
      } else if (field === "taxCode") {
        const taxCode = value as "STANDARD" | "EXEMPT" | "REDUCED"
        const taxRate = getTaxRate(taxCode)
        const netAmount = line.netAmount || line.lineTotal || 0
        const taxAmount = Math.round(netAmount * taxRate * 100) / 100
        const lineTotalWithTax = Math.round((netAmount + taxAmount) * 100) / 100

        updated = {
          ...updated,
          taxCode,
          taxRate,
          taxAmount,
          lineTotalWithTax,
        }
      } else if (field === "expedite") {
        updated = {
          ...updated,
          expedite: value as boolean,
          expediteFee: value ? (line.expediteFee || 0) : undefined,
        }
      } else if (field === "expediteFee") {
        updated = {
          ...updated,
          expediteFee: Math.max(0, Number(value) || 0),
        }
      }

      // Track change if in draft mode
      if (isViewingDraft && pendingDraftRevision) {
        addChangeToDraft({
          field: field === "discountPercent" ? "line_discount" : "line_tax",
          previousValue: String(line[field]),
          newValue: String(value),
          editType: "critical",
          description: field === "discountPercent"
            ? `Updated Line ${line.lineNumber} discount to ${value}%`
            : `Changed Line ${line.lineNumber} tax code to ${value}`,
        })
      }

      return updated
    }))
    setEditingLineId(null)
  }

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
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Project</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Rev</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Ext. Cost</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground w-16">Auth</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => handleLineItemClick(item)}
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
                        const lineIssues = getIssuesForEntity("line", item.lineNumber)
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
                  <td className="py-3 px-4">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {item.projectCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{item.itemRevision}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <LineStatusPill status={item.status} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{item.quantityOrdered}</td>
                  <td className="py-3 px-4 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium">${item.lineTotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    {(() => {
                      const auth = checkLineReqAuthorization(item)
                      const statusColors: Record<ToleranceStatus, string> = {
                        within: "bg-green-100 text-green-700 border-green-200",
                        warning: "bg-amber-100 text-amber-700 border-amber-200",
                        exceeded: "bg-red-100 text-red-700 border-red-200",
                      }
                      const statusIcons: Record<ToleranceStatus, string> = {
                        within: "✓",
                        warning: "⚠",
                        exceeded: "!",
                      }
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border",
                            statusColors[auth.status]
                          )}
                          title={`${auth.message}\nAuthorized: $${auth.authorizedTotal.toFixed(2)}\nActual: $${auth.actualTotal.toFixed(2)}\nVariance: ${auth.totalVariancePercent >= 0 ? '+' : ''}${auth.totalVariancePercent.toFixed(1)}%`}
                        >
                          {statusIcons[auth.status]}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditLine(item)
                      }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit line"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Simple Subtotal Row */}
              <tr className="bg-muted/30 font-medium">
                <td colSpan={8} className="py-3 px-4 text-right">Extended Total</td>
                <td className="py-3 px-4 text-right">${poTotals.linesSubtotal.toFixed(2)}</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )

      case "financials":
        // Calculate totals
        const lineExpediteFees = lines.reduce((sum, l) => sum + (l.expediteFee || 0), 0)
        const totalLineDiscounts = lines.reduce((sum, l) => sum + l.discountAmount, 0)
        const allDiscounts = totalLineDiscounts + poTotals.discounts.applied
        const totalOtherFees = poTotals.charges.total

        // Helper to get other fees for a line (charges that apply to specific lines)
        const getLineOtherFees = (lineNumber: number) => {
          return charges
            .filter(c => c.appliesToLines?.includes(lineNumber))
            .reduce((sum, c) => sum + c.amount, 0)
        }

        // Header-level charges (apply to all lines, prorated)
        const headerCharges = charges.filter(c => !c.appliesToLines)
        const headerChargesTotal = headerCharges.reduce((sum, c) => sum + c.amount, 0)

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
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleLineItemClick(item)}
                    >
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
                    {poTotals.linesTax.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-medium text-muted-foreground">
                    {(lines.reduce((sum, l) => sum + l.lineTotalWithTax, 0) + lineExpediteFees + charges.filter(c => c.appliesToLines).reduce((sum, c) => sum + c.amount, 0)).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>

                {/* Header-Level Charges (if any) */}
                {headerChargesTotal > 0 && (
                  <tr className="bg-muted/10">
                    <td colSpan={2} className="py-2 px-3 text-right text-xs text-muted-foreground font-medium">
                      Order Charges
                      <span className="ml-2 font-normal">({headerCharges.map(c => c.name).join(", ")})</span>
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground/50">—</td>
                    <td className="py-2 px-3 text-right text-muted-foreground/50">—</td>
                    <td className="py-2 px-3 text-right text-muted-foreground/50">—</td>
                    <td className="py-2 px-3 text-right tabular-nums text-foreground">
                      {headerChargesTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                      {poTotals.chargesTax > 0 ? poTotals.chargesTax.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium text-foreground">
                      {(headerChargesTotal + poTotals.chargesTax).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </td>
                  </tr>
                )}

                {/* PO-Level Discounts */}
                {poTotals.discounts.applied > 0 && (
                  <tr className="bg-muted/10">
                    <td colSpan={2} className="py-2 px-3 text-right text-xs text-muted-foreground font-medium">Volume Discount</td>
                    <td className="py-2 px-3 text-right text-muted-foreground/50">—</td>
                    <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                      ({poTotals.discounts.applied.toLocaleString("en-US", { style: "currency", currency: "USD" })})
                    </td>
                    <td colSpan={4} className="py-2 px-3"></td>
                  </tr>
                )}

                {/* Grand Total */}
                <tr className="bg-foreground/5 border-t-2 border-border">
                  <td colSpan={2} className="py-3 px-3 text-right font-semibold text-foreground">Order Total</td>
                  <td className="py-3 px-3 text-right tabular-nums text-foreground">
                    {poTotals.linesSubtotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
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
                    {poTotals.totalTax.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                    {(poTotals.grandTotal + lineExpediteFees).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        )

      case "quantity":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Item</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Project</th>
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
              {lineItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleLineItemClick(item)}
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
                  <td className="py-3 px-4 text-center">{item.quantityOrdered}</td>
                  <td className="py-3 px-4 text-center">{item.quantityShipped}</td>
                  <td className="py-3 px-4 text-center">{item.quantityReceived}</td>
                  <td className="py-3 px-4 text-center">{item.quantityAccepted || "-"}</td>
                  <td className="py-3 px-4 text-center">{item.quantityInQualityHold}</td>
                  <td className="py-3 px-4 text-center">{item.quantityPaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "logistics":
        // Parse date helper
        const parseLogisticsDate = (dateStr: string) => {
          const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
          const parts = dateStr.replace(",", "").split(" ")
          return new Date(parseInt(parts[2]), months[parts[0]], parseInt(parts[1]))
        }

        // Helper to get shipments for a line
        const getLineShipments = (lineNumber: number) => {
          return shipments
            .filter(s => s.lines.some(l => l.lineNumber === lineNumber))
            .map(s => ({
              ...s,
              lineQty: s.lines.find(l => l.lineNumber === lineNumber)?.qtyShipped || 0
            }))
        }

        // Get expected date info: delivered (green), delayed (red), on track (black)
        const getExpectedDateInfo = (item: LineItem) => {
          const lineShipments = getLineShipments(item.lineNumber)
          const allReceived = item.quantityReceived >= item.quantityOrdered
          const promisedDate = parseLogisticsDate(item.promisedDate)

          // If all received, show last received date in green
          if (allReceived) {
            const lastReceived = lineShipments
              .filter(s => s.status === "received" && s.receivedDate)
              .sort((a, b) => parseLogisticsDate(b.receivedDate!).getTime() - parseLogisticsDate(a.receivedDate!).getTime())[0]
            return { date: lastReceived?.receivedDate || "", status: "delivered" as const }
          }

          // Find next expected arrival date
          const inTransit = lineShipments.find(s => s.status === "in_transit")
          const expectedShipment = lineShipments.find(s => s.status === "expected")

          const nextExpectedDate = inTransit?.expectedDate || expectedShipment?.expectedDate
          if (nextExpectedDate) {
            const expectedDate = parseLogisticsDate(nextExpectedDate)
            const isDelayed = expectedDate > promisedDate
            return { date: nextExpectedDate, status: isDelayed ? "delayed" as const : "on_track" as const }
          }

          // No shipment - check if past promised
          const today = new Date()
          if (today > promisedDate) {
            return { date: "", status: "delayed" as const }
          }

          return { date: "", status: "on_track" as const }
        }

        // Get line status: Delivered, On Track, Late
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

        // Shipment pill info: Delivered, In Transit, Expected
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
                {lineItems.map((item) => {
                  const lineShipments = getLineShipments(item.lineNumber)
                  const expectedInfo = getExpectedDateInfo(item)
                  const lineStatus = getLineDeliveryStatus(item)

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleLineItemClick(item)}
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
                                <button
                                  key={shipment.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLineItemClick(item)
                                  }}
                                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors hover:opacity-80 ${pillInfo.style}`}
                                >
                                  {pillInfo.icon === "check" && <CheckCircle2 className="w-2.5 h-2.5" />}
                                  {pillInfo.icon === "truck" && <Truck className="w-2.5 h-2.5" />}
                                  {pillInfo.icon === "package" && <Package className="w-2.5 h-2.5" />}
                                  {shipment.id}
                                </button>
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
              <div className="flex items-center gap-2 pl-6">
                <span className="font-medium">Status:</span>
                <span className="text-primary">Delivered</span>
                <span>On Track</span>
                <span className="text-destructive">Late</span>
              </div>
            </div>
          </div>
        )

      case "sourcing":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
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
              {lineItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleLineItemClick(item)}
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
                  <td className="py-3 px-4">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium font-mono">
                      {item.commodityCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center text-xs font-medium font-mono px-2 py-0.5 rounded border border-border bg-muted text-foreground">
                      {item.requisitionNumber}
                    </span>
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
        )

      case "needs":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
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
              {lineItems.map((item) => {
                const needStatus = getLineNeedStatus(item)
                const primaryNeed = item.needs?.[0]
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleLineItemClick(item)}
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
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {item.projectCode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {primaryNeed ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{primaryNeed.moNumber}</p>
                            {(item.needs?.length || 0) > 1 && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                +{(item.needs?.length || 0) - 1} more
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{primaryNeed.customer}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 text-center ${needStatus.atRisk && !needStatus.fulfilled ? "text-amber-600" : ""}`}>
                      {primaryNeed ? (
                        <div className="flex flex-col items-center">
                          <span>{primaryNeed.dateNeeded}</span>
                          {(item.needs?.length || 0) > 1 && (
                            <span className="text-[10px] text-muted-foreground">Next need</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">
                      {primaryNeed ? (
                        <div className="flex flex-col items-center">
                          <span>{primaryNeed.qtyNeeded}</span>
                          {(item.needs?.length || 0) > 1 && (
                            <span className="text-[10px] text-muted-foreground">of {(item.needs || []).reduce((sum, n) => sum + n.qtyNeeded, 0)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
        )

      case "source":
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">SKU / Item</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Requisition</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Requester</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Req Date</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Project</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Cost Center</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleLineItemClick(item)}
                >
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                      {item.lineNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-primary font-medium">{item.sku}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium font-mono">{item.requisitionNumber || "—"}</p>
                      <p className="text-xs text-muted-foreground">Line 1</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium">John Smith</p>
                      <p className="text-xs text-muted-foreground">Engineering</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm">Jan 3, 2026</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {item.projectCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-muted-foreground">CC-4500</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case "quality":
        const allIssues = poNumber ? detectPOIssuesForPO(poNumber) : detectPOIssues()
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
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
              {lineItems.map((item) => {
                // Count NCRs for this line from shipments
                const lineNCRs = shipments.flatMap(s => s.ncrs || []).filter(ncr => ncr.lineNumber === item.lineNumber)
                const openNCRs = lineNCRs.filter(ncr => ncr.status === "open")
                const hasQualityIssue = item.quantityInQualityHold > 0 || openNCRs.length > 0
                const qr = item.qualityRequirements

                return (
                  <tr
                    key={item.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleLineItemClick(item)}
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
                    <td className="py-3 px-4 text-center">
                      {item.quantityInQualityHold > 0 ? (
                        <span className="text-amber-600 tabular-nums">{item.quantityInQualityHold}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {lineNCRs.length > 0 ? (
                        <span className={openNCRs.length > 0 ? "text-destructive tabular-nums" : "text-muted-foreground tabular-nums"}>
                          {openNCRs.length > 0 ? `${openNCRs.length} open` : `${lineNCRs.length} closed`}
                        </span>
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
                      ) : item.quantityReceived > 0 ? (
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
        )

      default:
        return null
    }
  }

  const poData = {
    poNumber: poHeader.poNumber,
    status: PurchaseOrderStatusMeta.label(poStatus),
    supplier: poHeader.supplier.name,
    orderDate: poHeader.dates.created,
    totalAmount: poTotals.total,
    lineItems: lineItems.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      status: item.status,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
      quantityInQualityHold: item.quantityInQualityHold,
      promisedDate: item.promisedDate,
    })),
    urgency: poHeader.urgency,
    tasks: actionRequiredIssues.map((issue, idx) => ({
      id: idx + 1,
      title: issue.title,
      status: issue.priority === "critical" ? "critical" : "high",
      reason: issue.description,
      createdBy: issue.assignee,
      suggestedAction: issue.suggestedAction,
      category: issue.category,
      sku: issue.sku,
      amount: issue.amount,
      ncrId: issue.ncrId,
      invoiceId: issue.invoiceId,
    })),
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - spans full width */}
      <div className="bg-muted/30 border-b shrink-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span>Purchase Orders</span>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">{poHeader.poNumber}</span>
            </div>
            <div className="text-xs bg-primary text-white px-3 py-1 rounded font-medium">JD</div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
                Purchase Order {poHeader.poNumber}
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  isViewingDraft
                    ? "bg-amber-100 text-amber-800"
                    : "bg-muted text-muted-foreground"
                )}>
                  v{selectedRevision?.version || activeRevision?.version || "2.0"}
                  {isViewingDraft && " (Draft)"}
                </span>
              </h1>
              <div className="flex items-center gap-6 text-sm">
                <div className="w-48">
                  <POStatusSelect
                    value={isViewingDraft ? mapRevisionStatusToPOStatus(selectedRevision?.status) : poStatus}
                    onChange={setPoStatus}
                    label="Status"
                    showLabel={true}
                    disabled={isViewingDraft}
                  />
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="text-foreground font-medium">16 days ago</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Updated</div>
                  <div className="text-foreground font-medium">16 days ago</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Acknowledged</div>
                  <div className="text-foreground font-medium">{activeRevision?.acknowledgedAt || poHeader.dates.acknowledged}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Primary Actions - Always Visible */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDocumentsSidebarOpen(false)
                  setActivitySidebarOpen(false)
                  if (issuesSidebarOpen) {
                    closeIssuesPanel()
                  } else {
                    openIssuesPanel()
                  }
                }}
                title="Issues"
                className={cn("gap-1.5", issuesSidebarOpen && "bg-muted")}
              >
                <AlertCircle className="w-4 h-4" />
                {criticalCount > 0 && (
                  <span className="text-xs tabular-nums text-destructive">{criticalCount}</span>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsCallModalOpen(true)} title="Call vendor">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEmailModalOpen(true)} title="Email vendor">
                <Mail className="w-4 h-4" />
              </Button>

              {/* Expandable Toolbar */}
              <ExpandableToolbar>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    closeIssuesPanel()
                    setActivitySidebarOpen(false)
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
                    setActivitySidebarOpen(!activitySidebarOpen)
                  }}
                  title="Communications"
                  className={cn(activitySidebarOpen && "bg-muted")}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>

                <div className="w-px h-5 bg-border mx-1" />

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpediteModalOpen(true)}
                  title="Expedite Delivery"
                  className="gap-1"
                >
                  <Zap className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleEditClick} title="Edit">
                  <Edit className="w-4 h-4" />
                </Button>
                <POPDFDownload
                  poHeader={poHeader}
                  lineItems={lines}
                  charges={charges}
                  vendorContact={vendorContact}
                  version={selectedRevision?.version || activeRevision?.version || "1.0"}
                  variant="ghost"
                  size="sm"
                  showLabel={false}
                />
                <Button size="sm" variant="ghost" onClick={() => requestPOSummary(poData)} title="AI Summary">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </ExpandableToolbar>

              <Button className="bg-primary text-primary-foreground">Receive</Button>
            </div>
          </div>

          {/* User Switcher for Demo */}
          <div className="mt-3 flex items-center justify-between">
            <UserSwitcher />
            {hasPendingDraft && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDocumentsSidebarOpen(false)
                  setActivitySidebarOpen(false)
                  closeIssuesPanel()
                  setRevisionSidebarOpen(!revisionSidebarOpen)
                }}
                className={cn("gap-1.5", revisionSidebarOpen && "bg-muted")}
              >
                <GitBranch className="h-4 w-4" />
                Revision Status
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Revision Tabs - Show when there's a pending draft */}
      {hasPendingDraft && <RevisionTabs />}

      {/* Approval Action Buttons - Show when user can approve */}
      {canApprove && (
        <div className="px-6 py-3 border-b border-border bg-background">
          <ApprovalActionButtons />
        </div>
      )}

      {/* Tab Navigation - spans full width */}
      <div className="border-b border-border shrink-0 bg-background z-10">
        <div className="px-6 flex gap-8">
          {[
            { id: "details", label: "Overview" },
            { id: "receiving", label: "Receiving" },
            { id: "financials", label: "Payables" },
            {
              id: "quality",
              label: "Quality",
              badge: 2,
            },
            { id: "compliance", label: "Compliance" },
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
              {(tab as { isNew?: boolean }).isNew && (
                <span className="inline-flex items-center justify-center px-1.5 h-4 text-[10px] font-medium rounded bg-primary text-primary-foreground">
                  New
                </span>
              )}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-medium rounded-full px-1.5",
                  (tab as { isCritical?: boolean }).isCritical
                    ? "bg-red-100 text-red-700"
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.badge}
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
              {/* General Information - Collapsible */}
              <Card className="border border-border">
                <div className={`px-6 py-3 ${isGeneralInfoExpanded ? "border-b border-border" : ""}`}>
                  <div
                    className="flex items-center justify-between mb-2 cursor-pointer hover:bg-muted/30 transition-colors p-2 -m-2"
                    onClick={() => setIsGeneralInfoExpanded(!isGeneralInfoExpanded)}
                  >
                    <div className="text-sm font-semibold text-foreground">General Information</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditHeaderModalOpen(true)
                        }}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit PO details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isGeneralInfoExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                  {/* Always visible: Top row */}
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Supplier</div>
                      <div className="text-sm font-medium">{poHeader.supplier.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Owner</div>
                      <div className="text-sm font-medium">{poHeader.buyer.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Ordered</div>
                      <div className="text-sm font-medium">{poHeader.dates.created}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Urgency</div>
                      <Badge className={`text-xs w-fit ${poHeader.urgency === "critical" ? "bg-destructive/10 text-destructive" : poHeader.urgency === "high" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}>
                        {poHeader.urgency === "standard" ? "Not urgent" : poHeader.urgency.charAt(0).toUpperCase() + poHeader.urgency.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {/* Related Documents */}
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Related:</span>
                      {/* Requisitions */}
                      {Array.from(new Set(lines.map(l => l.requisitionNumber))).map(req => (
                        <button
                          key={req}
                          className="inline-flex items-center gap-1 text-xs font-medium font-mono px-2 py-0.5 rounded border border-border bg-muted text-foreground hover:bg-accent transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {req}
                        </button>
                      ))}
                      {/* Manufacturing Orders */}
                      {Array.from(new Set(lines.flatMap(l => (l.needs || []).map(n => n.moNumber)))).slice(0, 3).map(mo => (
                        <button
                          key={mo}
                          className="inline-flex items-center gap-1 text-xs font-medium font-mono px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {mo}
                        </button>
                      ))}
                      {Array.from(new Set(lines.flatMap(l => (l.needs || []).map(n => n.moNumber)))).length > 3 && (
                        <span className="text-xs text-muted-foreground">+{Array.from(new Set(lines.flatMap(l => (l.needs || []).map(n => n.moNumber)))).length - 3} more</span>
                      )}
                      {/* Sales Orders - derived from customers */}
                      {Array.from(new Set(lines.flatMap(l => (l.needs || []).map(n => n.customer)))).slice(0, 2).map((customer, idx) => (
                        <button
                          key={customer}
                          className="inline-flex items-center gap-1 text-xs font-medium font-mono px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          SO-{2026}-{String(idx + 1).padStart(4, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded: Additional details + Supplier & Shipping info */}
                {isGeneralInfoExpanded && (
                  <div className="px-6 py-4 bg-muted/5 space-y-6">
                    {/* Additional PO details row */}
                    <div className="grid grid-cols-4 gap-6">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">PO Type</div>
                        <div className="text-sm font-medium">Standard</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Payment Terms</div>
                        <div className="text-sm font-medium">{headerData.payment.terms}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Currency</div>
                        <div className="text-sm font-medium">{headerData.payment.currency}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">FOB Terms</div>
                        <div className="text-sm font-medium">{headerData.shipping.terms}</div>
                      </div>
                    </div>

                    {/* Supplier Information & Shipping / Receiving - Two Column Layout */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Supplier Information */}
                      <div className="bg-background border border-border rounded-lg p-5">
                        <h3 className="text-sm font-semibold mb-4">Supplier Information</h3>

                        <div className="space-y-4">
                          {/* Contact Person */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Contact Person</div>
                            <div className="border border-border rounded-lg p-3 bg-muted/30">
                              <div className="font-medium text-sm">Daniel Thomas</div>
                              <div className="text-xs text-muted-foreground mb-2">Sales Manager</div>
                              <div className="flex items-center text-xs mb-1">
                                <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                                <span>+1-278-437-1129</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEmailModal({ contextType: "general", poNumber: poHeader.poNumber })
                                }}
                                className="flex items-center text-xs text-primary hover:underline cursor-pointer"
                              >
                                <Mail className="w-3 h-3 mr-2" />
                                <span>daniel.thomas@flightechcontrollers.com</span>
                              </button>
                            </div>
                          </div>

                          {/* Address */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Address</div>
                            <div className="border border-border rounded-lg p-3 bg-muted/30">
                              <div className="font-medium text-sm mb-1">6437 Commerce Street</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Portland, OR, 97201, US
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Shipping</Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Billing</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shipping / Receiving */}
                      <div className="bg-background border border-border rounded-lg p-5">
                        <h3 className="text-sm font-semibold mb-4">Shipping / Receiving</h3>

                        <div className="space-y-4">
                          {/* Receive Into */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Receive Into</div>
                            <div className="flex items-center text-sm font-medium gap-2">
                              <Inbox className="w-4 h-4" />
                              <span>—</span>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Shipping Address</div>
                            <div className="border border-border rounded-lg p-3 bg-muted/30">
                              <div className="font-medium text-sm mb-1">Main Office</div>
                              <div className="text-xs text-muted-foreground">
                                555 Innovation Dr, San Diego, CA, 92101, US
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Requisition Authorization - Full View */}
                    <ReqAuthorizationSummary lines={lines} />
                  </div>
                )}
              </Card>

              {/* Line Items Display */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Order Lines</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddLineModalOpen(true)}
                      className="h-7 text-xs"
                    >
                      + Add Line
                    </Button>
                  </div>
                  <LineDisplaySelector value={lineDisplayMode} onChange={setLineDisplayMode} />
                </div>

                {/* Line Items Table */}
                <div className="border border-border rounded-lg overflow-hidden">{renderLineDisplay()}</div>
              </div>

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
                          <span className="tabular-nums">{formatCurrency(poTotals.linesSubtotal)}</span>
                        </div>

                        {/* Discounts */}
                        {poTotals.discounts.applied > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discounts</span>
                            <span className="tabular-nums text-green-600">({formatCurrency(poTotals.discounts.applied)})</span>
                          </div>
                        )}

                        {/* Expedite Fees */}
                        {(poTotals.charges.expedite + lineExpediteFees) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expedite Fees</span>
                            <span className="tabular-nums">{formatCurrency(poTotals.charges.expedite + lineExpediteFees)}</span>
                          </div>
                        )}

                        {/* Other Charges (shipping, handling, duties, other) */}
                        {(poTotals.charges.shipping + poTotals.charges.handling + poTotals.charges.duties + poTotals.charges.other) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Other Charges</span>
                            <span className="tabular-nums">{formatCurrency(poTotals.charges.shipping + poTotals.charges.handling + poTotals.charges.duties + poTotals.charges.other)}</span>
                          </div>
                        )}

                        {/* Tax */}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax ({(poTotals.taxRate * 100).toFixed(2)}%)</span>
                          <span className="tabular-nums">{formatCurrency(poTotals.totalTax)}</span>
                        </div>

                        {/* Grand Total */}
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                          <span>Grand Total</span>
                          <span className="tabular-nums">{formatCurrency(poTotals.grandTotal + lineExpediteFees)}</span>
                        </div>

                        {/* Potential savings hint */}
                        {poTotals.discounts.potential > 0 && (
                          <div className="flex justify-between text-xs pt-2 text-muted-foreground">
                            <span>Early payment discount available</span>
                            <span className="text-green-600 font-medium">Save {formatCurrency(poTotals.discounts.potential)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "activity" && <ActivityTimeline />}
          {activeTab === "receiving" && <ReceivingTab lines={lines} poNumber={poNumber} />}
          {activeTab === "documents" && <DocumentsPanel orderNumber={poNumber} orderType="po" />}
          {activeTab === "quality" && <QualityTab lines={lines} poNumber={poNumber} />}
          {activeTab === "financials" && <FinancialsTab lines={lines} charges={charges} poNumber={poNumber} />}
          {activeTab === "compliance" && <ComplianceTab lines={lines} />}
        </div>
        </div>

        {/* Right Side Panels - Push layout */}
        <div
          className={cn(
            "flex-shrink-0 bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-200 ease-out",
            issuesSidebarOpen ? "w-[400px]" : documentsSidebarOpen ? "w-[400px]" : activitySidebarOpen ? "w-[440px]" : revisionSidebarOpen ? "w-[400px]" : "w-0 border-l-0"
          )}
        >
        {/* Issues Panel */}
        {issuesSidebarOpen && (
          <>
            <div className="flex items-center justify-between h-12 px-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-medium text-muted-foreground">Issues</span>
              <button
                onClick={() => closeIssuesPanel()}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="Close panel"
              >
                <ChevronsRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <IssuesTab poNumber={poNumber} />
            </div>
          </>
        )}

        {/* Documents Panel */}
        {documentsSidebarOpen && (
          <DocumentsPanel
            orderNumber={poNumber}
            orderType="po"
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

        {/* Revision Status Panel */}
        {revisionSidebarOpen && (
          <>
            <div className="flex items-center justify-between h-12 px-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-medium text-muted-foreground">Revision Workflow</span>
              <button
                onClick={() => setRevisionSidebarOpen(false)}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                title="Close panel"
              >
                <ChevronsRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <RevisionStatusPanel
                poNumber={poNumber}
                onSendToSupplier={handleSendToSupplier}
              />
              {pendingDraftRevision?.status === RevisionStatus.Sent && (
                <Button
                  onClick={handleRecordAcknowledgment}
                  className="w-full"
                  variant="outline"
                >
                  Simulate: Record Acknowledgment
                </Button>
              )}
              <RevisionHistory />
            </div>
          </>
        )}
        </div>
      </div>

      {/* Modals - Outside the content row */}
      {selectedLineItem && (
        <LineDetailModal
          isOpen={isLineModalOpen}
          onClose={() => {
            setIsLineModalOpen(false)
            setSelectedLineItem(null)
          }}
          item={selectedLineItem}
          orderNumber={poHeader.poNumber}
          variant="purchase"
        />
      )}

      <VoipCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        vendorContact={vendorContact}
        poNumber={poHeader.poNumber}
      />

      <EmailComposeModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        vendorContact={vendorContact}
        poNumber={poHeader.poNumber}
      />

      <ExpediteModal
        isOpen={isExpediteModalOpen}
        onClose={() => setIsExpediteModalOpen(false)}
        onSave={handleExpediteLines}
        lines={lines}
      />

      <EditLineModal
        isOpen={isEditLineModalOpen}
        onClose={() => {
          setIsEditLineModalOpen(false)
          setEditingLine(null)
        }}
        onSave={handleSaveLineEdit}
        line={editingLine}
        lineCharges={editingLine ? charges.filter(c => c.appliesToLines?.includes(editingLine.lineNumber)) : []}
      />

      <EditHeaderModal
        isOpen={isEditHeaderModalOpen}
        onClose={() => setIsEditHeaderModalOpen(false)}
        onSave={handleSaveHeaderEdit}
        header={headerData}
        headerCharges={charges.filter(c => !c.appliesToLines || c.appliesToLines.length === 0)}
      />

      <AddLineModal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        onAdd={handleAddNewLine}
        vendorId="VEND-001"
        nextLineNumber={Math.max(...lines.map(l => l.lineNumber), 0) + 1}
      />

      <EditChargeModal
        isOpen={isEditChargeModalOpen}
        onClose={() => {
          setIsEditChargeModalOpen(false)
          setEditingCharge(null)
        }}
        onSave={handleSaveChargeEdit}
        onDelete={handleRemoveCharge}
        charge={editingCharge}
        lines={lines}
      />
    </div>
  )
}
