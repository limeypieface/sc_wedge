"use client"

/**
 * RMASlidePanel
 *
 * Side panel overlay for managing RMA workflow.
 * Slides in from the right, keeping the main content visible.
 *
 * ## Features
 * - Shows RMA status and workflow progress
 * - Displays item details and return instructions
 * - Provides contextual action buttons
 * - Shows timeline of status changes
 * - Integrates with email modal for communications
 */

import { SlidePanel, SlidePanelSection } from "@/components/ui/slide-panel"
import { StatusPill, type StatusPillConfig } from "@/components/ui/status-pill"
import { Separator } from "@/components/ui/separator"
import type { RMA, RMAVariant, RMAStatus } from "@/types/rma-types"
import { RMA_TERMINOLOGY } from "@/types/rma-types"

import { RMAWorkflowProgress } from "./rma-workflow-progress"
import { RMADetailsSummary } from "./rma-details-summary"
import { RMASupplierInfo } from "./rma-supplier-info"
import { RMAActions } from "./rma-actions"
import { RMATimeline } from "./rma-timeline"

// ============================================================================
// STATUS PILL CONFIG
// ============================================================================

const RMA_STATUS_PILL_CONFIG: StatusPillConfig<RMAStatus> = {
  requested: { label: "Requested", color: "blue" },
  pending_auth: { label: "Pending Auth", color: "amber" },
  authorized: { label: "Authorized", color: "green" },
  return_shipped: { label: "Shipped", color: "blue" },
  in_transit: { label: "In Transit", color: "blue" },
  received_by_party: { label: "Received", color: "blue" },
  replacement_pending: { label: "Replacement Pending", color: "amber" },
  credit_pending: { label: "Credit Pending", color: "amber" },
  resolved: { label: "Resolved", color: "green" },
}

// ============================================================================
// PROPS
// ============================================================================

interface RMASlidePanelProps {
  /** Whether the panel is open */
  isOpen: boolean

  /** Callback when panel is closed */
  onClose: () => void

  /** The RMA to display */
  rma: RMA | null

  /** Variant for terminology (po = supplier, so = customer) */
  variant?: RMAVariant

  /** Callback when "Record Authorization" is clicked */
  onRecordAuthorization?: (rma: RMA) => void

  /** Callback when "Ship Return" is clicked */
  onShipReturn?: (rma: RMA) => void

  /** Callback when "Record Resolution" is clicked */
  onRecordResolution?: (rma: RMA) => void

  /** Callback when email action is clicked */
  onEmailClick?: (rma: RMA) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RMASlidePanel({
  isOpen,
  onClose,
  rma,
  variant = "po",
  onRecordAuthorization,
  onShipReturn,
  onRecordResolution,
  onEmailClick,
}: RMASlidePanelProps) {
  const terms = RMA_TERMINOLOGY[variant]

  if (!rma) {
    return null
  }

  const statusConfig = RMA_STATUS_PILL_CONFIG[rma.status]

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="font-semibold">{rma.rmaNumber || rma.id}</span>
          <StatusPill
            status={rma.status}
            config={RMA_STATUS_PILL_CONFIG}
            size="sm"
          />
        </div>
      }
      subtitle={`${terms.orderType} ${rma.orderNumber}`}
      width="md"
      footer={
        <RMAActions
          rma={rma}
          variant={variant}
          onRecordAuthorization={onRecordAuthorization}
          onShipReturn={onShipReturn}
          onRecordResolution={onRecordResolution}
          onEmailClick={onEmailClick}
        />
      }
    >
      <div className="space-y-6">
        {/* Workflow Progress */}
        <RMAWorkflowProgress status={rma.status} />

        <Separator />

        {/* Item Details */}
        <RMADetailsSummary rma={rma} />

        {/* Return Instructions (only show if authorized with instructions) */}
        {(rma.returnAddress || rma.returnInstructions) && (
          <>
            <Separator />
            <RMASupplierInfo rma={rma} variant={variant} />
          </>
        )}

        {/* Tracking Info (only show if shipped) */}
        {rma.returnCarrier && rma.returnTrackingNumber && (
          <>
            <Separator />
            <SlidePanelSection title="RETURN SHIPMENT">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carrier</span>
                  <span className="font-medium">{rma.returnCarrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking</span>
                  <span className="font-mono text-xs">{rma.returnTrackingNumber}</span>
                </div>
                {rma.returnShippedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipped</span>
                    <span>{new Date(rma.returnShippedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </SlidePanelSection>
          </>
        )}

        {/* Resolution Info (only show if resolved) */}
        {rma.status === "resolved" && (
          <>
            <Separator />
            <SlidePanelSection title="RESOLUTION">
              <div className="space-y-2 text-sm">
                {rma.replacementShipmentId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Replacement</span>
                    <span className="font-mono text-xs">{rma.replacementShipmentId}</span>
                  </div>
                )}
                {rma.creditMemoNumber && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Memo</span>
                      <span className="font-mono text-xs">{rma.creditMemoNumber}</span>
                    </div>
                    {rma.creditAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium text-emerald-600">
                          ${rma.creditAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {rma.dispositionNotes && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Disposition</span>
                    <p className="text-sm">{rma.dispositionNotes}</p>
                  </div>
                )}
                {rma.resolvedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolved</span>
                    <span>{new Date(rma.resolvedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </SlidePanelSection>
          </>
        )}

        {/* Timeline */}
        {rma.timeline && rma.timeline.length > 0 && (
          <>
            <Separator />
            <RMATimeline timeline={rma.timeline} />
          </>
        )}
      </div>
    </SlidePanel>
  )
}
