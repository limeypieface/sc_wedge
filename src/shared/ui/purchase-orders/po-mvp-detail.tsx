// @ts-nocheck
"use client"

/**
 * POMVPDetail - Simplified Purchase Order MVP View
 *
 * A streamlined PO view with:
 * - Order Details card with edit capability
 * - Line Items table with display modes (basic/quantity/financial)
 * - Fees & Compliance Clauses sections
 * - Financial summary
 * - Attachments
 * - Supplier acknowledgment tracking
 * - Revision workflow sidebar
 */

import { useState, useRef } from "react"
import { Edit, Download, Upload, Trash2, Plus, Eye, FileText, GripVertical, CalendarIcon, CheckCircle2, History, ChevronsRight, Ban, AlertTriangle, Phone, Mail, Inbox, ChevronDown, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/shared/ui/button"
import { usePOWorkflow, RevisionProvider, useRevision } from "@/context/RevisionContext"
import { WorkflowStatusPanel } from "@/shared/ui/workflow-status-panel"
import { RevisionStatusPanel } from "@/shared/ui/revisions/revision-status-panel"
import { RevisionHistory } from "@/shared/ui/revisions/revision-history"
import { Card } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Separator } from "@/shared/ui/separator"
import { Checkbox } from "@/shared/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/shared/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Calendar } from "@/shared/ui/calendar"
import { Switch } from "@/shared/ui/switch"
import { cn } from "@/lib/utils"

import { LineStatusPill } from "@/shared/ui/purchase-orders/line-status-pill"
import { LineStatusSelect } from "@/shared/ui/purchase-orders/line-status-select"
import { LineDetailModal } from "@/shared/ui/modals/line-detail-modal"
import { EditLineModal, type LineEditData } from "@/shared/ui/modals/edit-line-modal"
import { AddLineModal, type NewLineData } from "@/shared/ui/modals/add-line-modal"
import { ExpandableToolbar } from "@/shared/ui/expandable-toolbar"
import { POPDFDownload } from "@/shared/ui/purchase-orders/po-pdf-download"
import { useEmailContext } from "@/context/EmailContext"
import { getPOData, computePOTotals, getChargesByLine, type LineItem, type POCharge } from "@/lib/mock-data"
import { LineItemStatus } from "@/types/enums"
import type { MVPAttachment, MVPApprovalStatus, MVPLineItemExtensions } from "@/types/mvp-types"

// ============================================================================
// TYPES
// ============================================================================

interface POMVPDetailProps {
  poNumber: string
}

interface HeaderFee {
  id: string
  description: string
  amount: number
}

// ============================================================================
// COMPONENT
// ============================================================================

// Wrapper component that provides RevisionContext
export function POMVPDetail({ poNumber }: POMVPDetailProps) {
  return (
    <RevisionProvider poNumber={poNumber}>
      <POMVPDetailContent poNumber={poNumber} />
    </RevisionProvider>
  )
}

// Main content component that uses revision context
function POMVPDetailContent({ poNumber }: POMVPDetailProps) {
  const router = useRouter()

  // Get PO data
  const poData = getPOData(poNumber) || getPOData("PO-2026-00142")
  const poHeader = poData?.header
  const vendorContact = poData?.vendorContact

  // Revision context
  const {
    pendingDraftRevision,
    hasPendingDraft,
    createDraft,
    addChangeToDraft,
    revisionHistory,
    selectedRevision,
    activeRevision,
    selectRevision,
  } = useRevision()

  // Unified workflow hook
  const workflow = usePOWorkflow(poNumber)

  // Revision sidebar state
  const [revisionSidebarOpen, setRevisionSidebarOpen] = useState(false)

  // General info expandable state
  const [isGeneralInfoExpanded, setIsGeneralInfoExpanded] = useState(false)

  // Get email context
  const { openEmailModal } = useEmailContext()

  // State - must be declared before any early returns
  const [lines, setLines] = useState<LineItem[]>(poData?.lineItems || [])
  const [charges] = useState<POCharge[]>(poData.charges || [])
  const [lineDisplayMode, setLineDisplayMode] = useState<'basic' | 'quantity' | 'financial'>('basic')
  const [attachments, setAttachments] = useState<MVPAttachment[]>([])
  const [complianceClauses, setComplianceClauses] = useState<string[]>([])
  const [isAddClauseOpen, setIsAddClauseOpen] = useState(false)
  const [newClause, setNewClause] = useState('')
  const [headerFees, setHeaderFees] = useState<HeaderFee[]>([])
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false)
  const [newFeeDescription, setNewFeeDescription] = useState('')
  const [newFeeAmount, setNewFeeAmount] = useState('')
  const [draggedClauseIndex, setDraggedClauseIndex] = useState<number | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | undefined>(undefined)
  const [mvpApprovalStatus, setMvpApprovalStatus] = useState<MVPApprovalStatus>('draft')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Line extensions for additional tracking - with varied mock data
  const [lineExtensions, setLineExtensions] = useState<Record<number, MVPLineItemExtensions>>(() => {
    const extensions: Record<number, MVPLineItemExtensions> = {}
    let physicalLineIndex = 0

    poData?.lineItems?.forEach((line) => {
      const qty = line.quantityOrdered || line.quantity
      const isServiceLine = line.sku?.startsWith('SVC-') || line.sku?.startsWith('SVC_') || line.name?.toLowerCase().includes('service')

      let mockData: Partial<MVPLineItemExtensions> = {}

      if (isServiceLine) {
        // Service lines: only Ordered and Accepted matter - no shipping/receiving/inspection
        const acceptedPct = Math.random() > 0.3 ? (Math.random() > 0.5 ? 1 : 0.5) : 0
        mockData = {
          quantityShipped: 0,
          quantityReceived: 0,
          quantityInspected: 0,
          quantityAccepted: Math.floor(qty * acceptedPct),
          quantityOnHold: 0,
          lineStatus: acceptedPct === 1 ? 'complete' : acceptedPct > 0 ? 'in_progress' : 'pending',
        }
      } else {
        // Physical items: show different stages of fulfillment
        switch (physicalLineIndex % 5) {
          case 0: // Fully received and accepted
            mockData = {
              quantityShipped: qty,
              quantityReceived: qty,
              quantityInspected: qty,
              quantityAccepted: qty,
              quantityOnHold: 0,
              lineStatus: 'received',
            }
            break
          case 1: // Shipped, partially received with some on quality hold
            const onHold = Math.max(1, Math.floor(qty * 0.15))
            mockData = {
              quantityShipped: qty,
              quantityReceived: qty,
              quantityInspected: Math.floor(qty * 0.5),
              quantityAccepted: Math.floor(qty * 0.3),
              quantityOnHold: onHold,
              lineStatus: 'quality_hold',
            }
            break
          case 2: // Received, partially inspected
            mockData = {
              quantityShipped: qty,
              quantityReceived: qty,
              quantityInspected: Math.floor(qty * 0.5),
              quantityAccepted: Math.floor(qty * 0.25),
              quantityOnHold: 0,
              lineStatus: 'inspecting',
            }
            break
          case 3: // Just shipped, received but not inspected
            mockData = {
              quantityShipped: qty,
              quantityReceived: qty,
              quantityInspected: 0,
              quantityAccepted: 0,
              quantityOnHold: 0,
              lineStatus: 'received',
            }
            break
          case 4: // Pending - not yet shipped
            mockData = {
              quantityShipped: 0,
              quantityReceived: 0,
              quantityInspected: 0,
              quantityAccepted: 0,
              quantityOnHold: 0,
              lineStatus: 'pending',
            }
            break
        }
        physicalLineIndex++
      }

      extensions[line.id] = {
        needByDate: undefined,
        promisedDate: line.promisedDate,
        leadTime: undefined,
        isTaxable: true,
        taxRate: 8.25,
        inspectionRequired: !isServiceLine && physicalLineIndex % 3 === 0,
        quantityShipped: mockData.quantityShipped || 0,
        quantityReceived: mockData.quantityReceived || 0,
        quantityInspected: mockData.quantityInspected || 0,
        quantityAccepted: mockData.quantityAccepted || 0,
        quantityOnHold: mockData.quantityOnHold || 0,
        lineStatus: mockData.lineStatus || 'pending',
      }
    })
    return extensions
  })

  // Line modal state
  const [selectedLine, setSelectedLine] = useState<LineItem | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [closingLine, setClosingLine] = useState<LineItem | null>(null)
  const [isCloseLineModalOpen, setIsCloseLineModalOpen] = useState(false)
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false)

  // Edit form state
  const [editQty, setEditQty] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editPromisedDate, setEditPromisedDate] = useState<Date | undefined>(undefined)
  const [editNeedByDate, setEditNeedByDate] = useState<Date | undefined>(undefined)
  const [editLeadTime, setEditLeadTime] = useState('')
  const [editInspectionRequired, setEditInspectionRequired] = useState(false)
  const [editSourceRequestId, setEditSourceRequestId] = useState('')
  const [editProjectId, setEditProjectId] = useState('')
  const [editLineStatus, setEditLineStatus] = useState<LineItemStatus>(LineItemStatus.Pending)
  const [editIsTaxable, setEditIsTaxable] = useState(true)
  const [editTaxRate, setEditTaxRate] = useState('')

  // Header edit state
  const [isHeaderEditOpen, setIsHeaderEditOpen] = useState(false)
  const [headerBuyer, setHeaderBuyer] = useState(poHeader?.buyer || '')
  const [headerPromisedDate, setHeaderPromisedDate] = useState<Date | undefined>(
    poHeader?.dates?.promised ? new Date(poHeader.dates.promised) : undefined
  )
  const [headerRequestedDate, setHeaderRequestedDate] = useState<Date | undefined>(
    poHeader?.dates?.requested ? new Date(poHeader.dates.requested) : undefined
  )
  const [headerShippingMethod, setHeaderShippingMethod] = useState(poHeader?.shipping?.method || '')
  const [headerShippingInstructions, setHeaderShippingInstructions] = useState(poHeader?.shipping?.instructions || '')
  const [headerPaymentTerms, setHeaderPaymentTerms] = useState(poHeader?.payment?.terms || '')

  // Early return if PO not found (after all hooks)
  if (!poHeader) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Purchase Order Not Found</h1>
        <p className="text-muted-foreground">Could not find PO: {poNumber}</p>
        <Link href="/supply/purchase-orders" className="text-primary underline mt-4 inline-block">
          Back to Purchase Orders
        </Link>
      </div>
    )
  }

  // Calculate totals
  const poTotals = computePOTotals(lines, charges)

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateForStorage = (date: Date | undefined) => {
    if (!date) return undefined
    return date.toISOString().split('T')[0]
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Version tracking - uses revision system
  const handleVersionBump = (changeType: string, detail: string, previousValue?: any, newValue?: any) => {
    if (!hasPendingDraft) {
      createDraft()
      setAcknowledged(false)
      setAcknowledgedAt(undefined)
      setMvpApprovalStatus('draft')
    }

    addChangeToDraft({
      field: changeType,
      previousValue: previousValue ?? null,
      newValue: newValue ?? null,
      editType: 'non_critical',
      description: detail,
    })

    setRevisionSidebarOpen(true)
  }

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newAttachments: MVPAttachment[] = Array.from(files).map((file, idx) => ({
      id: `att-new-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User',
      url: URL.createObjectURL(file),
    }))
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }

  // Remove attachment
  const removeFile = (id: string) => {
    setAttachments(prev => prev.filter(f => f.id !== id))
  }

  // Clause handlers
  const handleAddClause = () => {
    if (newClause.trim()) {
      setComplianceClauses(prev => [...prev, newClause.trim()])
      handleVersionBump('clause_added', `Clause ${complianceClauses.length + 1}`)
      setNewClause('')
      setIsAddClauseOpen(false)
    }
  }

  const handleClauseDragStart = (index: number) => {
    setDraggedClauseIndex(index)
  }

  const handleClauseDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedClauseIndex === null || draggedClauseIndex === index) return
    const newClauses = [...complianceClauses]
    const draggedClause = newClauses[draggedClauseIndex]
    newClauses.splice(draggedClauseIndex, 1)
    newClauses.splice(index, 0, draggedClause)
    setComplianceClauses(newClauses)
    setDraggedClauseIndex(index)
  }

  const handleClauseDragEnd = () => {
    setDraggedClauseIndex(null)
  }

  // Acknowledgment handler
  const handleAcknowledgmentChange = (checked: boolean) => {
    setAcknowledged(checked)
    if (checked) {
      setAcknowledgedAt(new Date().toISOString())
    } else {
      setAcknowledgedAt(undefined)
    }
  }

  // Line modal handlers
  const handleViewLine = (line: LineItem) => {
    setSelectedLine(line)
    setIsViewModalOpen(true)
  }

  const handleEditLine = (line: LineItem) => {
    setSelectedLine(line)
    setEditQty(line.quantity.toString())
    setEditPrice(line.unitPrice.toString())

    const ext = lineExtensions[line.id]
    setEditPromisedDate(ext?.promisedDate ? new Date(ext.promisedDate) : undefined)
    setEditNeedByDate(ext?.needByDate ? new Date(ext.needByDate) : undefined)
    setEditLeadTime(ext?.leadTime?.toString() || '')
    setEditInspectionRequired(ext?.inspectionRequired || false)
    setEditSourceRequestId(ext?.sourceRequestId || '')
    setEditProjectId(ext?.projectId || '')
    setEditLineStatus(ext?.lineStatus || LineItemStatus.Pending)
    setEditIsTaxable(ext?.isTaxable ?? true)
    setEditTaxRate(ext?.taxRate?.toString() || '8.25')

    setIsEditModalOpen(true)
  }

  const handleCloseLine = (line: LineItem) => {
    setClosingLine(line)
    setIsCloseLineModalOpen(true)
  }

  const handleConfirmCloseLine = (action: 'close' | 'cancel') => {
    if (!closingLine) return

    const ext = lineExtensions[closingLine.id]
    const received = ext?.quantityReceived || 0
    const ordered = closingLine.quantity

    if (action === 'close') {
      setLineExtensions(prev => ({
        ...prev,
        [closingLine.id]: {
          ...prev[closingLine.id],
          lineStatus: LineItemStatus.Closed
        }
      }))
      handleVersionBump('line_closed', `Line ${closingLine.lineNumber} closed (${received}/${ordered} received)`)
    } else {
      setLineExtensions(prev => ({
        ...prev,
        [closingLine.id]: {
          ...prev[closingLine.id],
          lineStatus: LineItemStatus.Canceled
        }
      }))
      handleVersionBump('line_cancelled', `Line ${closingLine.lineNumber} remaining cancelled (${ordered - received} units)`)
    }

    setIsCloseLineModalOpen(false)
    setClosingLine(null)
  }

  const handleSaveLineChanges = () => {
    if (!selectedLine) return

    const ext = lineExtensions[selectedLine.id]
    const newQty = parseFloat(editQty) || selectedLine.quantity
    const newPrice = parseFloat(editPrice) || selectedLine.unitPrice
    const newPromisedDate = formatDateForStorage(editPromisedDate)
    const newNeedByDate = formatDateForStorage(editNeedByDate)
    const newLeadTime = parseInt(editLeadTime) || 0
    const newInspectionRequired = editInspectionRequired
    const newSourceRequestId = editSourceRequestId
    const newProjectId = editProjectId
    const newLineStatus = editLineStatus
    const newIsTaxable = editIsTaxable
    const newTaxRate = parseFloat(editTaxRate) || ext?.taxRate || 8.25

    // Track changes
    const changes: { field: string; oldValue: any; newValue: any; desc: string }[] = []

    if (newQty !== selectedLine.quantity) {
      changes.push({ field: 'quantity', oldValue: selectedLine.quantity, newValue: newQty, desc: `Line ${selectedLine.lineNumber}: Quantity ${selectedLine.quantity} → ${newQty}` })
    }
    if (newPrice !== selectedLine.unitPrice) {
      changes.push({ field: 'unitPrice', oldValue: selectedLine.unitPrice, newValue: newPrice, desc: `Line ${selectedLine.lineNumber}: Unit Price ${formatCurrency(selectedLine.unitPrice)} → ${formatCurrency(newPrice)}` })
    }

    if (changes.length > 0) {
      if (!hasPendingDraft) {
        createDraft()
        setAcknowledged(false)
        setAcknowledgedAt(undefined)
        setMvpApprovalStatus('draft')
      }

      changes.forEach(change => {
        addChangeToDraft({
          field: change.field,
          previousValue: change.oldValue,
          newValue: change.newValue,
          editType: 'non_critical',
          description: change.desc,
        })
      })

      setRevisionSidebarOpen(true)

      // Update line with tax calculations
      setLines(prev => prev.map(line => {
        if (line.id !== selectedLine.id) return line
        const newLineTotal = newQty * newPrice
        const taxAmount = newIsTaxable ? newLineTotal * (newTaxRate / 100) : 0
        const lineTotalWithTax = newLineTotal + taxAmount
        return {
          ...line,
          quantity: newQty,
          quantityOrdered: newQty,
          unitPrice: newPrice,
          lineTotal: newLineTotal,
          taxAmount,
          lineTotalWithTax,
        }
      }))

      // Update line extensions
      setLineExtensions(prev => ({
        ...prev,
        [selectedLine.id]: {
          ...prev[selectedLine.id],
          promisedDate: newPromisedDate,
          needByDate: newNeedByDate,
          leadTime: newLeadTime,
          inspectionRequired: newInspectionRequired,
          sourceRequestId: newSourceRequestId,
          projectId: newProjectId,
          lineStatus: newLineStatus,
          isTaxable: newIsTaxable,
          taxRate: newTaxRate,
          updatedAt: new Date().toISOString(),
        }
      }))
    }

    setIsEditModalOpen(false)
    setSelectedLine(null)
  }

  // Handle edit modal save (from shared EditLineModal component)
  const handleEditModalSave = (editData: LineEditData) => {
    if (!selectedLine) return

    const ext = lineExtensions[selectedLine.id]
    const newQty = editData.quantity || selectedLine.quantity
    const newPrice = editData.unitPrice || selectedLine.unitPrice
    const newPromisedDate = editData.promisedDate || ext?.promisedDate

    // Track changes
    const changes: { field: string; oldValue: any; newValue: any; desc: string }[] = []

    if (newQty !== selectedLine.quantity) {
      changes.push({ field: 'quantity', oldValue: selectedLine.quantity, newValue: newQty, desc: `Line ${selectedLine.lineNumber}: Quantity ${selectedLine.quantity} → ${newQty}` })
    }
    if (newPrice !== selectedLine.unitPrice) {
      changes.push({ field: 'unitPrice', oldValue: selectedLine.unitPrice, newValue: newPrice, desc: `Line ${selectedLine.lineNumber}: Unit Price ${formatCurrency(selectedLine.unitPrice)} → ${formatCurrency(newPrice)}` })
    }

    if (changes.length > 0) {
      if (!hasPendingDraft) {
        createDraft()
        setAcknowledged(false)
        setAcknowledgedAt(undefined)
        setMvpApprovalStatus('draft')
      }

      changes.forEach(change => {
        addChangeToDraft({
          field: change.field,
          previousValue: change.oldValue,
          newValue: change.newValue,
          editType: 'non_critical',
          description: change.desc,
        })
      })

      setRevisionSidebarOpen(true)

      // Update line with calculations
      setLines(prev => prev.map(line => {
        if (line.id !== selectedLine.id) return line
        const newLineTotal = newQty * newPrice
        const isTaxable = ext?.isTaxable ?? true
        const taxRate = ext?.taxRate ?? 8.25
        const taxAmount = isTaxable ? newLineTotal * (taxRate / 100) : 0
        const lineTotalWithTax = newLineTotal + taxAmount
        return {
          ...line,
          quantity: newQty,
          quantityOrdered: newQty,
          unitPrice: newPrice,
          promisedDate: newPromisedDate,
          lineTotal: newLineTotal,
          taxAmount,
          lineTotalWithTax,
        }
      }))

      // Update line extensions
      setLineExtensions(prev => ({
        ...prev,
        [selectedLine.id]: {
          ...prev[selectedLine.id],
          promisedDate: newPromisedDate,
          updatedAt: new Date().toISOString(),
        }
      }))
    }

    setIsEditModalOpen(false)
    setSelectedLine(null)
  }

  // Handle add line (from shared AddLineModal component)
  const handleAddLine = (newLine: NewLineData) => {
    const nextLineNumber = lines.length > 0 ? Math.max(...lines.map(l => l.lineNumber)) + 1 : 1
    const lineTotal = newLine.quantity * newLine.unitPrice
    const taxAmount = lineTotal * 0.0825 // Default tax rate

    const newLineItem: LineItem = {
      id: Date.now(),
      lineNumber: nextLineNumber,
      sku: newLine.sku,
      name: newLine.name,
      description: newLine.description || '',
      quantity: newLine.quantity,
      quantityOrdered: newLine.quantity,
      unitPrice: newLine.unitPrice,
      unitOfMeasure: newLine.unitOfMeasure || 'EA',
      lineTotal: lineTotal,
      taxAmount: taxAmount,
      lineTotalWithTax: lineTotal + taxAmount,
      status: LineItemStatus.Pending,
    }

    setLines(prev => [...prev, newLineItem])

    // Initialize line extensions for the new line
    setLineExtensions(prev => ({
      ...prev,
      [newLineItem.id]: {
        needByDate: undefined,
        promisedDate: undefined,
        leadTime: undefined,
        isTaxable: true,
        taxRate: 8.25,
        inspectionRequired: false,
        quantityShipped: 0,
        quantityReceived: 0,
        quantityInspected: 0,
        quantityAccepted: 0,
        quantityOnHold: 0,
        lineStatus: 'pending',
      }
    }))

    // Track the change for revision
    handleVersionBump('line_added', `Line ${nextLineNumber}: ${newLine.name}`, null, {
      lineNumber: nextLineNumber,
      sku: newLine.sku,
      name: newLine.name,
      quantity: newLine.quantity,
      unitPrice: newLine.unitPrice,
    })

    setIsAddLineModalOpen(false)
  }

  // Save header edits
  const handleSaveHeaderEdit = () => {
    const changes: { field: string; oldValue: string; newValue: string; label: string }[] = []

    if (headerBuyer !== (poHeader.buyer || '')) {
      changes.push({ field: 'buyer', oldValue: poHeader.buyer || '(none)', newValue: headerBuyer || '(none)', label: 'Buyer' })
    }

    const originalPromised = poHeader.dates?.promised ? formatDate(poHeader.dates.promised) : ''
    const newPromised = headerPromisedDate ? formatDate(headerPromisedDate.toISOString()) : ''
    if (newPromised !== originalPromised) {
      changes.push({ field: 'promisedDate', oldValue: originalPromised || '(none)', newValue: newPromised || '(none)', label: 'Promised Date' })
    }

    if (headerShippingMethod !== (poHeader.shipping?.method || '')) {
      changes.push({ field: 'shippingMethod', oldValue: poHeader.shipping?.method || '(none)', newValue: headerShippingMethod || '(none)', label: 'Shipping Method' })
    }

    if (headerPaymentTerms !== (poHeader.payment?.terms || '')) {
      changes.push({ field: 'paymentTerms', oldValue: poHeader.payment?.terms || '(none)', newValue: headerPaymentTerms || '(none)', label: 'Payment Terms' })
    }

    if (changes.length > 0) {
      if (!hasPendingDraft) {
        createDraft()
        setAcknowledged(false)
        setAcknowledgedAt(undefined)
        setMvpApprovalStatus('draft')
      }

      changes.forEach(change => {
        addChangeToDraft({
          field: change.field,
          previousValue: change.oldValue,
          newValue: change.newValue,
          editType: 'non_critical',
          description: `${change.label}: ${change.oldValue} → ${change.newValue}`,
        })
      })

      setRevisionSidebarOpen(true)
    }

    setIsHeaderEditOpen(false)
  }

  return (
    <>
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-muted/30 border-b shrink-0 z-10">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/supply/purchase-orders" className="hover:text-foreground">Purchase Orders</Link>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">{poNumber}</span>
              <Badge variant="outline" className="ml-3">MVP</Badge>
            </div>
            <div className="flex items-center gap-4">
              {/* Revision History Button */}
              {hasPendingDraft && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevisionSidebarOpen(!revisionSidebarOpen)}
                  className={cn("gap-2", revisionSidebarOpen && "bg-muted")}
                >
                  <History className="w-4 h-4" />
                  Revision
                </Button>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <ToggleGroup
                  type="single"
                  value="mvp"
                  onValueChange={(v) => {
                    if (v === 'full') {
                      router.push(`/po/${poNumber}`)
                    }
                  }}
                  className="bg-muted/50 rounded-md p-0.5"
                >
                  <ToggleGroupItem value="full" size="sm" className="text-xs px-3 data-[state=on]:bg-background">
                    Full
                  </ToggleGroupItem>
                  <ToggleGroupItem value="mvp" size="sm" className="text-xs px-3 data-[state=on]:bg-background">
                    MVP
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>

          {/* Title and Actions Row */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Purchase Order {poNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                {poHeader.supplier?.name || poHeader.vendorName} • Created {poHeader.dates?.created || poHeader.createdDate}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openEmailModal({ contextType: "general", poNumber: poHeader.poNumber })} title="Email supplier">
                <Mail className="w-4 h-4" />
              </Button>

              <ExpandableToolbar>
                <Button size="sm" variant="ghost" title="Documents">
                  <FileText className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Activity">
                  <History className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" title="AI Summary">
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsHeaderEditOpen(true)} title="Edit">
                  <Edit className="w-4 h-4" />
                </Button>
                <POPDFDownload
                  poHeader={poHeader}
                  lineItems={lines}
                  charges={charges}
                  vendorContact={vendorContact}
                  version={activeRevision?.version || "1.0"}
                  showLabel={false}
                />
              </ExpandableToolbar>

              <Button size="sm" className="bg-primary text-primary-foreground">Receive</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Row - Main Content + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-5xl">
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
                        setIsHeaderEditOpen(true)
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
                    <div className="text-sm font-medium">{poHeader.supplier?.name || poHeader.vendorName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Owner</div>
                    <div className="text-sm font-medium">{headerBuyer || poHeader.buyer || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Ordered</div>
                    <div className="text-sm font-medium">{poHeader.dates?.created || poHeader.createdDate || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Urgency</div>
                    <Badge className={`text-xs w-fit ${poHeader.urgency === "critical" ? "bg-destructive/10 text-destructive" : poHeader.urgency === "high" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}>
                      {poHeader.urgency === "low" ? "Not urgent" : poHeader.urgency?.charAt(0).toUpperCase() + poHeader.urgency?.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Supplier Acknowledgment */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="mvp-acknowledged"
                      checked={acknowledged}
                      onCheckedChange={handleAcknowledgmentChange}
                      disabled={mvpApprovalStatus !== 'sent'}
                    />
                    <label
                      htmlFor="mvp-acknowledged"
                      className={cn(
                        "text-sm font-medium",
                        mvpApprovalStatus === 'sent' ? "cursor-pointer" : "cursor-not-allowed text-muted-foreground"
                      )}
                    >
                      Supplier Acknowledged
                    </label>
                    {acknowledged && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {acknowledgedAt ? formatDate(acknowledgedAt) : 'Set date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={acknowledgedAt ? new Date(acknowledgedAt) : undefined}
                            onSelect={(date) => setAcknowledgedAt(date?.toISOString())}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
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
                      <div className="text-sm font-medium">{headerPaymentTerms || poHeader.payment?.terms || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Currency</div>
                      <div className="text-sm font-medium">{poHeader.currency || 'USD'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">FOB Terms</div>
                      <div className="text-sm font-medium">{headerShippingInstructions || poHeader.shipping?.instructions || "—"}</div>
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
                            <div className="font-medium text-sm">{vendorContact?.name || 'Daniel Thomas'}</div>
                            <div className="text-xs text-muted-foreground mb-2">{vendorContact?.title || 'Sales Manager'}</div>
                            <div className="flex items-center text-xs mb-1">
                              <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                              <span>{vendorContact?.phone || '+1-278-437-1129'}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEmailModal({ contextType: "general", poNumber: poHeader.poNumber })
                              }}
                              className="flex items-center text-xs text-primary hover:underline cursor-pointer"
                            >
                              <Mail className="w-3 h-3 mr-2" />
                              <span>{vendorContact?.email || 'daniel.thomas@flightechcontrollers.com'}</span>
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
                </div>
              )}
            </Card>

            {/* Line Items */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Line Items ({lines.length})</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">View:</span>
                      <ToggleGroup
                        type="single"
                        value={lineDisplayMode}
                        onValueChange={(v) => v && setLineDisplayMode(v as 'basic' | 'quantity' | 'financial')}
                        className="bg-muted/50 rounded-md p-0.5"
                      >
                        <ToggleGroupItem value="basic" size="sm" className="text-xs px-2 data-[state=on]:bg-background">
                          Basic
                        </ToggleGroupItem>
                        <ToggleGroupItem value="quantity" size="sm" className="text-xs px-2 data-[state=on]:bg-background">
                          Quantity
                        </ToggleGroupItem>
                        <ToggleGroupItem value="financial" size="sm" className="text-xs px-2 data-[state=on]:bg-background">
                          Financial
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddLineModalOpen(true)}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Line
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead className="w-24">SKU</TableHead>
                        <TableHead className="min-w-[180px]">Description</TableHead>
                        {lineDisplayMode === 'basic' && (
                          <>
                            <TableHead className="w-20 text-right">Qty</TableHead>
                            <TableHead className="w-24 text-right">Unit Price</TableHead>
                            <TableHead className="w-28 text-right">Total</TableHead>
                          </>
                        )}
                        {lineDisplayMode === 'quantity' && (
                          <>
                            <TableHead className="w-20 text-right">Ordered</TableHead>
                            <TableHead className="w-20 text-right">Shipped</TableHead>
                            <TableHead className="w-20 text-right">Received</TableHead>
                            <TableHead className="w-20 text-right">Inspected</TableHead>
                            <TableHead className="w-20 text-right">Accepted</TableHead>
                            <TableHead className="w-24 text-right">Quality Hold</TableHead>
                          </>
                        )}
                        {lineDisplayMode === 'financial' && (
                          <>
                            <TableHead className="w-24 text-right">Unit Price</TableHead>
                            <TableHead className="w-28 text-right">Line Total</TableHead>
                            <TableHead className="w-20 text-right">Tax Rate</TableHead>
                            <TableHead className="w-24 text-right">Tax</TableHead>
                            <TableHead className="w-28 text-right">With Tax</TableHead>
                          </>
                        )}
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => {
                        const ext = lineExtensions[line.id]
                        return (
                          <TableRow key={line.id} className="group">
                            <TableCell className="font-medium">{line.lineNumber}</TableCell>
                            <TableCell>
                              <LineStatusPill status={ext?.lineStatus || 'pending'} />
                            </TableCell>
                            <TableCell className="font-mono text-xs">{line.sku}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={line.name}>{line.name}</TableCell>
                            {lineDisplayMode === 'basic' && (
                              <>
                                <TableCell className="text-right">{line.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(line.lineTotal)}</TableCell>
                              </>
                            )}
                            {lineDisplayMode === 'quantity' && (() => {
                              const isServiceLine = line.sku?.startsWith('SVC-') || line.sku?.startsWith('SVC_') || line.name?.toLowerCase().includes('service')
                              return (
                                <>
                                  <TableCell className="text-right font-medium">{line.quantityOrdered || line.quantity}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {isServiceLine ? (
                                      <span className="text-muted-foreground/40">—</span>
                                    ) : ext?.quantityShipped ? (
                                      ext.quantityShipped
                                    ) : (
                                      <span className="text-muted-foreground/50">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {isServiceLine ? (
                                      <span className="text-muted-foreground/40">—</span>
                                    ) : ext?.quantityReceived ? (
                                      ext.quantityReceived
                                    ) : (
                                      <span className="text-muted-foreground/50">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {isServiceLine ? (
                                      <span className="text-muted-foreground/40">—</span>
                                    ) : ext?.quantityInspected ? (
                                      ext.quantityInspected
                                    ) : (
                                      <span className="text-muted-foreground/50">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-emerald-600">
                                    {ext?.quantityAccepted ? ext.quantityAccepted : <span className="text-muted-foreground/50 font-normal">—</span>}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {isServiceLine ? (
                                      <span className="text-muted-foreground/40">—</span>
                                    ) : ext?.quantityOnHold ? (
                                      <span className="text-amber-600 font-medium">{ext.quantityOnHold}</span>
                                    ) : (
                                      <span className="text-muted-foreground/50">—</span>
                                    )}
                                  </TableCell>
                                </>
                              )
                            })()}
                            {lineDisplayMode === 'financial' && (
                              <>
                                <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(line.lineTotal)}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {ext?.isTaxable ? `${ext?.taxRate || 8.25}%` : '—'}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{formatCurrency(line.taxAmount || 0)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(line.lineTotalWithTax || line.lineTotal)}</TableCell>
                              </>
                            )}
                            <TableCell>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="View details"
                                  onClick={() => handleViewLine(line)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {(ext?.quantityReceived || 0) > 0 ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground"
                                    onClick={() => handleCloseLine(line)}
                                    title={`${ext?.quantityReceived || 0} received - Click to close or cancel remaining`}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    title="Edit line"
                                    onClick={() => handleEditLine(line)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>

            {/* Additional Terms - Fees & Compliance Clauses */}
            {(headerFees.length === 0 && complianceClauses.length === 0) ? (
              <div className="flex items-center justify-center gap-3 py-3 px-4 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddFeeOpen(true)}
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Fee
                </Button>
                <Separator orientation="vertical" className="h-4" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddClauseOpen(true)}
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Clause
                </Button>
              </div>
            ) : (
              <Card>
                <div className="p-4 space-y-4">
                  {headerFees.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fees & Charges</h4>
                        <Button variant="ghost" size="sm" onClick={() => setIsAddFeeOpen(true)} className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {headerFees.map((fee) => (
                          <div key={fee.id} className="flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded group">
                            <span className="text-sm">{fee.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{formatCurrency(fee.amount)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setHeaderFees(prev => prev.filter(f => f.id !== fee.id))
                                  handleVersionBump('fee_removed', fee.description)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {complianceClauses.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compliance Clauses</h4>
                        <Button variant="ghost" size="sm" onClick={() => setIsAddClauseOpen(true)} className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {complianceClauses.map((clause, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleClauseDragStart(index)}
                            onDragOver={(e) => handleClauseDragOver(e, index)}
                            onDragEnd={handleClauseDragEnd}
                            className={cn(
                              "flex items-start gap-2 group py-1.5 px-2 rounded transition-colors cursor-move",
                              draggedClauseIndex === index ? "bg-muted/50 opacity-50" : "hover:bg-muted/30"
                            )}
                          >
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground font-medium w-5 shrink-0">{index + 1}.</span>
                            <span className="text-sm flex-1 whitespace-pre-wrap">{clause}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => {
                                setComplianceClauses(prev => prev.filter((_, i) => i !== index))
                                handleVersionBump('clause_removed', `Clause ${index + 1}`)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(headerFees.length > 0 && complianceClauses.length === 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddClauseOpen(true)}
                      className="w-full text-muted-foreground hover:text-foreground gap-1.5 border-dashed border"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Compliance Clause
                    </Button>
                  )}
                  {(complianceClauses.length > 0 && headerFees.length === 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddFeeOpen(true)}
                      className="w-full text-muted-foreground hover:text-foreground gap-1.5 border-dashed border"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Fee or Charge
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Financials */}
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold mb-4">Financials</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(poTotals.subtotal)}</span>
                  </div>
                  {headerFees.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fees & Charges</span>
                      <span>{formatCurrency(headerFees.reduce((sum, f) => sum + f.amount, 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({(poTotals.taxRate * 100).toFixed(2)}%)</span>
                    <span>{formatCurrency(poTotals.totalTax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(poTotals.grandTotal + headerFees.reduce((sum, f) => sum + f.amount, 0))}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Attachments */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Attachments</h3>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                      multiple
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No attachments</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFile(file.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Side Panel - Revision Workflow */}
        <div
          className={cn(
            "flex-shrink-0 bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-200 ease-out",
            revisionSidebarOpen ? "w-[400px]" : "w-0 border-l-0"
          )}
        >
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
                {workflow?.hasPendingDraft ? (
                  <WorkflowStatusPanel workflow={workflow} />
                ) : (
                  <RevisionStatusPanel />
                )}

                <RevisionHistory />
              </div>
            </>
          )}
        </div>
      </div>
    </div>

      {/* Modals */}
      {/* Add Clause Modal */}
      {isAddClauseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsAddClauseOpen(false)} />
          <Card className="relative z-50 w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-2">Add Compliance Clause</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the compliance requirement that will apply to this purchase order.
              </p>
              <Textarea
                value={newClause}
                onChange={(e) => setNewClause(e.target.value)}
                placeholder="Enter clause text..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddClauseOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddClause} disabled={!newClause.trim()}>
                  Add Clause
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Fee Modal */}
      {isAddFeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsAddFeeOpen(false)} />
          <Card className="relative z-50 w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Add Fee</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fee-description">Description</Label>
                  <Input
                    id="fee-description"
                    type="text"
                    value={newFeeDescription}
                    onChange={(e) => setNewFeeDescription(e.target.value)}
                    placeholder="e.g., Freight, Handling, Expedite Fee"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fee-amount">Amount</Label>
                  <Input
                    id="fee-amount"
                    type="number"
                    step="0.01"
                    value={newFeeAmount}
                    onChange={(e) => setNewFeeAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setIsAddFeeOpen(false)
                  setNewFeeDescription('')
                  setNewFeeAmount('')
                }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!newFeeDescription.trim() || !newFeeAmount}
                  onClick={() => {
                    const amount = parseFloat(newFeeAmount)
                    if (newFeeDescription.trim() && !isNaN(amount)) {
                      setHeaderFees(prev => [...prev, {
                        id: `fee-${Date.now()}`,
                        description: newFeeDescription.trim(),
                        amount
                      }])
                      handleVersionBump('fee_added', newFeeDescription.trim())
                      setIsAddFeeOpen(false)
                      setNewFeeDescription('')
                      setNewFeeAmount('')
                    }
                  }}
                >
                  Add Fee
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Line Modal */}
      {selectedLine && (
        <EditLineModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedLine(null)
          }}
          onSave={handleEditModalSave}
          line={selectedLine}
          lineCharges={getChargesByLine(selectedLine.lineNumber)}
          mode="mvp"
        />
      )}

      {/* Add Line Modal */}
      <AddLineModal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        onAdd={handleAddLine}
        mode="mvp"
      />

      {/* Header Edit Modal */}
      {isHeaderEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsHeaderEditOpen(false)} />
          <Card className="relative z-50 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Edit Order Details</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="header-buyer">Buyer</Label>
                  <Input
                    id="header-buyer"
                    type="text"
                    value={headerBuyer}
                    onChange={(e) => setHeaderBuyer(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="mt-1"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Dates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Promised Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !headerPromisedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {headerPromisedDate ? formatDateForDisplay(headerPromisedDate) : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={headerPromisedDate}
                            onSelect={setHeaderPromisedDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Requested Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !headerRequestedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {headerRequestedDate ? formatDateForDisplay(headerRequestedDate) : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={headerRequestedDate}
                            onSelect={setHeaderRequestedDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Payment & Shipping</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="header-payment">Payment Terms</Label>
                      <Input
                        id="header-payment"
                        type="text"
                        value={headerPaymentTerms}
                        onChange={(e) => setHeaderPaymentTerms(e.target.value)}
                        placeholder="e.g., Net 30"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="header-shipping">Shipping Method</Label>
                      <Input
                        id="header-shipping"
                        type="text"
                        value={headerShippingMethod}
                        onChange={(e) => setHeaderShippingMethod(e.target.value)}
                        placeholder="e.g., Ground"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="header-instructions">Shipping Instructions</Label>
                  <Input
                    id="header-instructions"
                    type="text"
                    value={headerShippingInstructions}
                    onChange={(e) => setHeaderShippingInstructions(e.target.value)}
                    placeholder="e.g., Deliver to loading dock B"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setIsHeaderEditOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveHeaderEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Line View Modal */}
      {selectedLine && isViewModalOpen && (
        <LineDetailModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setSelectedLine(null)
          }}
          item={selectedLine}
          orderNumber={poNumber}
          mode="mvp"
        />
      )}

      {/* Close/Cancel Line Modal */}
      {isCloseLineModalOpen && closingLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCloseLineModalOpen(false)} />
          <Card className="relative z-50 w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Line Has Receipts</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This line cannot be edited because goods have been received.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Line</span>
                    <p className="font-medium">{closingLine.lineNumber}. {closingLine.sku}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description</span>
                    <p className="font-medium truncate">{closingLine.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ordered</span>
                    <p className="font-medium">{closingLine.quantity}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Received</span>
                    <p className="font-medium text-primary">{lineExtensions[closingLine.id]?.quantityReceived || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Open Quantity</span>
                    <p className="font-medium">{closingLine.quantity - (lineExtensions[closingLine.id]?.quantityReceived || 0)}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Choose how to handle the remaining open quantity:
              </p>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => handleConfirmCloseLine('close')}
                >
                  <div className="text-left">
                    <p className="font-medium">Close Line</p>
                    <p className="text-xs text-muted-foreground">Accept {lineExtensions[closingLine.id]?.quantityReceived || 0} received as complete fulfillment</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => handleConfirmCloseLine('cancel')}
                >
                  <div className="text-left">
                    <p className="font-medium">Cancel Remaining</p>
                    <p className="text-xs text-muted-foreground">Cancel the open quantity of {closingLine.quantity - (lineExtensions[closingLine.id]?.quantityReceived || 0)} units</p>
                  </div>
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setIsCloseLineModalOpen(false)}
              >
                Keep Line Open
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
