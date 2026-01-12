"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  Clock,
  ChevronDown,
  CheckCircle2,
  Mail,
  RotateCcw,
  ExternalLink,
  CircleAlert,
  Eye,
} from "lucide-react"
import {
  detectPOIssuesWithRevision,
  detectSOIssuesForSO,
  poHeader,
  vendorContact,
  getPOData,
  lineItems,
  type POIssue,
  type SOIssue,
} from "@/lib/mock-data"
import { useEmailContext } from "@/context/EmailContext"
import { useIssuePanel } from "@/context/IssuePanelContext"
import { useRevisionSafe } from "@/context/RevisionContext"
import { useRMASafe } from "@/context/RMAContext"
import { useFeatureFlag } from "@/context/FeatureFlagsContext"
import { cn } from "@/lib/utils"
import { CreateRMAModal } from "@/components/create-rma-modal"
import { RMASlidePanel, AuthorizeRMAModal, RecordResolutionModal } from "@/components/rma"
import { ShipReturnModal } from "@/components/ship-return-modal"
import type { RMA, RMAVariant } from "@/types/rma-types"
import { RMA_STATUS_CONFIG } from "@/types/rma-types"

// Unified issue type for rendering
type UnifiedIssue = {
  id: string
  issueNumber?: string
  title: string
  description: string
  priority: "critical" | "high" | "medium" | "low"
  category: string
  dueDate?: string
  sku?: string
  shipmentId?: string
  qtyAffected?: number
  ncrId?: string
}

// Severity colors
const SEVERITY_COLORS = {
  critical: { border: "border-l-red-400", icon: "text-red-400", issueNumber: "text-red-500" },
  high: { border: "border-l-red-400", icon: "text-red-400", issueNumber: "text-red-500" },
  medium: { border: "border-l-amber-400", icon: "text-amber-400", issueNumber: "text-amber-600" },
  low: { border: "border-l-gray-300", icon: "text-gray-400", issueNumber: "text-muted-foreground" },
}

// Terminology config
const TERMINOLOGY = {
  po: {
    externalParty: "Vendor",
    emailAction: "Email Vendor",
    createReturn: "Create RMA",
    emptyMessage: "No open issues",
  },
  so: {
    externalParty: "Customer",
    emailAction: "Email Customer",
    createReturn: "Process Return",
    emptyMessage: "No issues detected",
  },
}

interface IssuesTabProps {
  /** Order variant - determines terminology and data source */
  variant?: "po" | "so"
  /** Order number (PO number or SO number) */
  orderNumber?: string
}

export function IssuesTab({ variant = "po", orderNumber }: IssuesTabProps) {
  const { openEmailModal } = useEmailContext()
  const { highlightedIssueId, clearHighlight } = useIssuePanel()
  const revisionContext = useRevisionSafe()
  const rmaContext = useRMASafe()
  const pendingDraftRevision = revisionContext?.pendingDraftRevision ?? null
  const issueRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null)

  // Feature flags
  const isRMAEnabled = useFeatureFlag("rma_workflow")
  const isEmailEnabled = useFeatureFlag("email_integration")

  // RMA Modal states
  const [createRMAModalOpen, setCreateRMAModalOpen] = useState(false)
  const [createRMAIssue, setCreateRMAIssue] = useState<UnifiedIssue | null>(null)
  const [slidePanelOpen, setSlidePanelOpen] = useState(false)
  const [selectedRMA, setSelectedRMA] = useState<RMA | null>(null)
  const [authorizeModalOpen, setAuthorizeModalOpen] = useState(false)
  const [shipReturnModalOpen, setShipReturnModalOpen] = useState(false)
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false)

  const terminology = TERMINOLOGY[variant]
  const rmaVariant: RMAVariant = variant

  // Get contact info based on variant
  const contact = useMemo(() => {
    if (variant === "so" && orderNumber) {
      const soData = getPOData(orderNumber)
      return soData?.vendorContact || vendorContact
    }
    return vendorContact
  }, [variant, orderNumber])

  // Get issues based on variant
  const issues: UnifiedIssue[] = useMemo(() => {
    if (variant === "so") {
      const soIssues = detectSOIssuesForSO(orderNumber || "SO-2024-00142")
      return soIssues.map((issue: SOIssue): UnifiedIssue => ({
        id: issue.id,
        issueNumber: issue.issueNumber || issue.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        category: issue.category as string,
        dueDate: issue.estimatedResolution,
        sku: undefined,
        shipmentId: undefined,
        qtyAffected: issue.affectedQuantity,
      }))
    } else {
      const draftRevision = pendingDraftRevision ? {
        id: pendingDraftRevision.id,
        version: pendingDraftRevision.version,
        createdAt: pendingDraftRevision.createdAt,
        createdBy: pendingDraftRevision.createdBy,
      } : null
      const poIssues = detectPOIssuesWithRevision(orderNumber, draftRevision)
      return poIssues.map((issue: POIssue): UnifiedIssue => ({
        id: issue.id,
        issueNumber: issue.issueNumber || issue.id,
        title: issue.title || "Untitled Issue",
        description: issue.description,
        priority: issue.priority || "medium",
        category: issue.category as string,
        dueDate: issue.dueDate,
        sku: issue.sku,
        shipmentId: issue.shipmentId,
        qtyAffected: issue.qtyAffected,
        ncrId: issue.ncrId,
      }))
    }
  }, [variant, orderNumber, pendingDraftRevision])

  useEffect(() => {
    if (highlightedIssueId) {
      setExpandedIssueId(highlightedIssueId)
      setTimeout(() => {
        const ref = issueRefs.current[highlightedIssueId]
        if (ref) {
          ref.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }
  }, [highlightedIssueId])

  const actionRequired = issues.filter((i) => i.priority === "critical" || i.priority === "high")
  const tracking = issues.filter((i) => i.priority === "medium" || i.priority === "low")

  // Get RMA for an issue
  const getRMAForIssue = (issueId: string): RMA | undefined => {
    return rmaContext?.getRMAForIssue(issueId)
  }

  // Handle Create RMA click
  const handleCreateRMA = (issue: UnifiedIssue) => {
    setCreateRMAIssue(issue)
    setCreateRMAModalOpen(true)
  }

  // Handle View RMA click
  const handleViewRMA = (rma: RMA) => {
    setSelectedRMA(rma)
    setSlidePanelOpen(true)
  }

  // Handle RMA created callback
  const handleRMACreated = (rmaId: string) => {
    // Refresh the RMA data
    const newRMA = rmaContext?.getRMAById(rmaId)
    if (newRMA) {
      setSelectedRMA(newRMA)
      setSlidePanelOpen(true)
    }
  }

  // Handle Record Authorization
  const handleRecordAuthorization = (rma: RMA) => {
    setSelectedRMA(rma)
    setAuthorizeModalOpen(true)
  }

  // Handle Ship Return
  const handleShipReturn = (rma: RMA) => {
    setSelectedRMA(rma)
    setShipReturnModalOpen(true)
  }

  // Handle Record Resolution
  const handleRecordResolution = (rma: RMA) => {
    setSelectedRMA(rma)
    setResolutionModalOpen(true)
  }

  // Handle Email for RMA - uses appropriate context based on status
  const handleRMAEmail = (rma: RMA) => {
    // Determine the appropriate email context based on RMA status
    type RMAEmailContext = "rma_request" | "rma_follow_up" | "rma_authorized" | "rma_shipped" | "rma_received" | "rma_resolved"
    let contextType: RMAEmailContext = "rma_request"

    switch (rma.status) {
      case "requested":
        contextType = "rma_request"
        break
      case "pending_auth":
        contextType = "rma_follow_up"
        break
      case "authorized":
        contextType = "rma_authorized"
        break
      case "return_shipped":
      case "in_transit":
        contextType = "rma_shipped"
        break
      case "received_by_party":
      case "replacement_pending":
      case "credit_pending":
        contextType = "rma_received"
        break
      case "resolved":
        contextType = "rma_resolved"
        break
      default:
        contextType = "rma_request"
    }

    openEmailModal({
      contextType,
      poNumber: rma.orderNumber,
      rmaId: rma.id,
      rmaNumber: rma.rmaNumber,
      sku: rma.sku,
      itemName: rma.itemName,
      qtyAffected: rma.qtyAffected,
      rmaType: rma.type,
      carrier: rma.returnCarrier,
      returnTrackingNumber: rma.returnTrackingNumber,
      issueDescription: rma.reason,
    })
  }

  // Authorization callback
  const handleAuthorizationSubmit = (
    rmaId: string,
    rmaNumber: string,
    returnAddress?: any,
    returnInstructions?: string
  ) => {
    rmaContext?.recordAuthorization(rmaId, { rmaNumber, returnAddress, returnInstructions })
    setAuthorizeModalOpen(false)
    // Refresh selected RMA
    const updatedRMA = rmaContext?.getRMAById(rmaId)
    if (updatedRMA) setSelectedRMA(updatedRMA)
  }

  // Resolution callback
  const handleResolutionSubmit = (rmaId: string, resolution: any) => {
    rmaContext?.recordResolution(rmaId, resolution)
    setResolutionModalOpen(false)
    setSlidePanelOpen(false)
  }

  const handleEmailContact = (issue: UnifiedIssue) => {
    const orderNum = orderNumber || (variant === "po" ? poHeader.poNumber : "SO-2024-00142")
    const firstName = contact.name.split(" ")[0]

    if (issue.category === "revision") {
      // Heads up email for pending revision (PO only)
      openEmailModal({
        contextType: "general",
        subject: `${orderNum} – Heads up`,
        body: `Hi ${firstName},

Quick heads up – we're preparing some changes to ${orderNum}. Will send the formal revision shortly.

Let me know if you have questions.

Thanks`,
        poNumber: orderNum,
      })
    } else if (issue.category === "ncr" && issue.ncrId) {
      openEmailModal({
        contextType: "ncr",
        ncrId: issue.ncrId,
        ncrType: issue.title?.split(": ")[1] || "Quality Issue",
        sku: issue.sku,
        itemName: issue.sku,
        qtyAffected: issue.qtyAffected,
        issueDescription: issue.description,
        poNumber: orderNum,
      })
    } else if (issue.category === "invoice" || issue.category === "billing_dispute") {
      openEmailModal({
        contextType: "general",
        subject: `Re: ${orderNum} - ${issue.title}`,
        body: `Dear ${contact.name},\n\nI am writing regarding ${issue.title}.\n\n${issue.description}\n\nPlease advise on the resolution.\n\nBest regards`,
        poNumber: orderNum,
      })
    } else if (issue.category === "customer_complaint") {
      openEmailModal({
        contextType: "general",
        subject: `Re: ${orderNum} - ${issue.title}`,
        body: `Dear ${contact.name},\n\nThank you for bringing this to our attention regarding ${orderNum}.\n\n${issue.description}\n\nWe are investigating and will follow up with resolution options.\n\nBest regards`,
        poNumber: orderNum,
      })
    } else {
      openEmailModal({
        contextType: "shipment",
        shipmentId: issue.shipmentId,
        poNumber: orderNum,
      })
    }
  }

  const renderIssue = (issue: UnifiedIssue) => {
    const isExpanded = expandedIssueId === issue.id
    const isHighlighted = highlightedIssueId === issue.id
    const colors = SEVERITY_COLORS[issue.priority] || SEVERITY_COLORS.medium

    // Check if there's an active RMA for this issue
    const existingRMA = getRMAForIssue(issue.id)
    const hasRMA = !!existingRMA
    const rmaStatusConfig = existingRMA ? RMA_STATUS_CONFIG[existingRMA.status] : null

    return (
      <div
        key={issue.id}
        ref={(el) => { issueRefs.current[issue.id] = el }}
        className={cn(
          "rounded-lg border-l-[3px] overflow-hidden transition-colors",
          colors.border,
          isHighlighted ? "bg-orange-100/50" : "bg-stone-50"
        )}
      >
        <button
          onClick={() => {
            setExpandedIssueId(isExpanded ? null : issue.id)
            if (isHighlighted) clearHighlight()
          }}
          className="w-full flex items-start gap-2.5 p-3 text-left hover:bg-stone-100 transition-colors"
        >
          {/* Circle icon */}
          <CircleAlert className={cn("w-4 h-4 mt-0.5 flex-shrink-0", colors.icon)} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Issue ID */}
            <div className={cn("text-[11px]", colors.issueNumber)}>
              {issue.issueNumber || issue.id}
            </div>

            {/* Title */}
            <p className="text-sm text-foreground mt-0.5 leading-snug">
              {issue.title}
            </p>

            {/* Date */}
            {issue.dueDate && (
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{issue.dueDate}</span>
              </div>
            )}

            {/* RMA Status Inline (when expanded or always visible) - controlled by rma_workflow flag */}
            {isRMAEnabled && hasRMA && existingRMA && (
              <div className="flex items-center gap-2 mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  RMA In Progress
                </span>
                <span className="text-xs text-muted-foreground">
                  {existingRMA.rmaNumber || existingRMA.id}
                </span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  rmaStatusConfig?.color === "success" && "bg-emerald-100 text-emerald-700",
                  rmaStatusConfig?.color === "warning" && "bg-amber-100 text-amber-700",
                  rmaStatusConfig?.color === "info" && "bg-blue-100 text-blue-700",
                  rmaStatusConfig?.color === "default" && "bg-gray-100 text-gray-700"
                )}>
                  {rmaStatusConfig?.label}
                </span>
              </div>
            )}
          </div>

          {/* Expand chevron */}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground/50 transition-transform flex-shrink-0",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 ml-6">
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>

            {/* Details */}
            <div className="flex flex-wrap gap-x-4 text-xs mb-2">
              {issue.sku && (
                <span>
                  <span className="text-muted-foreground">Item: </span>
                  <span className="text-primary">{issue.sku}</span>
                </span>
              )}
              {issue.shipmentId && (
                <span>
                  <span className="text-muted-foreground">Shipment: </span>
                  <span>{issue.shipmentId}</span>
                </span>
              )}
              {issue.qtyAffected && (
                <span>
                  <span className="text-muted-foreground">Qty: </span>
                  <span>{issue.qtyAffected}</span>
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {/* Email Action - controlled by email_integration flag */}
              {isEmailEnabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleEmailContact(issue) }}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {terminology.emailAction}
                </button>
              )}

              {/* RMA Actions - controlled by rma_workflow flag */}
              {isRMAEnabled && (issue.category === "ncr" || issue.category === "return_request") && (
                hasRMA && existingRMA ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewRMA(existingRMA) }}
                    className="flex items-center gap-1 hover:text-foreground text-primary"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View RMA
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCreateRMA(issue) }}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {terminology.createReturn}
                  </button>
                )
              )}

              {issue.shipmentId && (
                <button className="flex items-center gap-1 hover:text-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Track
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-2xl font-bold tabular-nums">{issues.length}</span>
        <span className="text-muted-foreground">open</span>
        {actionRequired.length > 0 && (
          <>
            <span className="text-destructive font-medium tabular-nums ml-2">{actionRequired.length}</span>
            <span className="text-destructive">action required</span>
          </>
        )}
      </div>

      {/* Action Required */}
      {actionRequired.length > 0 && (
        <div>
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Action Required
          </h3>
          <div className="space-y-2">
            {actionRequired.map(renderIssue)}
          </div>
        </div>
      )}

      {/* Tracking */}
      {tracking.length > 0 && (
        <div>
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Tracking
          </h3>
          <div className="space-y-2">
            {tracking.map(renderIssue)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {issues.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="w-8 h-8 text-primary/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{terminology.emptyMessage}</p>
        </div>
      )}

      {/* Create RMA Modal */}
      {createRMAIssue && (
        <CreateRMAModal
          isOpen={createRMAModalOpen}
          onClose={() => {
            setCreateRMAModalOpen(false)
            setCreateRMAIssue(null)
          }}
          issue={{
            id: createRMAIssue.id,
            lineNumber: lineItems.find(l => l.sku === createRMAIssue.sku)?.lineNumber,
            sku: createRMAIssue.sku,
            qtyAffected: createRMAIssue.qtyAffected,
            description: createRMAIssue.description,
            ncrId: createRMAIssue.ncrId,
            shipmentId: createRMAIssue.shipmentId,
          } as any}
          shipmentId={createRMAIssue.shipmentId}
          onRMACreated={handleRMACreated}
        />
      )}

      {/* RMA Slide Panel */}
      <RMASlidePanel
        isOpen={slidePanelOpen}
        onClose={() => setSlidePanelOpen(false)}
        rma={selectedRMA}
        variant={rmaVariant}
        onRecordAuthorization={handleRecordAuthorization}
        onShipReturn={handleShipReturn}
        onRecordResolution={handleRecordResolution}
        onEmailClick={handleRMAEmail}
      />

      {/* Authorize RMA Modal */}
      <AuthorizeRMAModal
        isOpen={authorizeModalOpen}
        onClose={() => setAuthorizeModalOpen(false)}
        rma={selectedRMA}
        variant={rmaVariant}
        onAuthorized={handleAuthorizationSubmit}
      />

      {/* Ship Return Modal */}
      {selectedRMA && (
        <ShipReturnModal
          isOpen={shipReturnModalOpen}
          onClose={() => setShipReturnModalOpen(false)}
          rma={selectedRMA}
          onShipped={() => {
            setShipReturnModalOpen(false)
            // Refresh the RMA
            const updated = rmaContext?.getRMAById(selectedRMA.id)
            if (updated) setSelectedRMA(updated)
          }}
        />
      )}

      {/* Record Resolution Modal */}
      <RecordResolutionModal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        rma={selectedRMA}
        variant={rmaVariant}
        onResolved={handleResolutionSubmit}
      />
    </div>
  )
}
