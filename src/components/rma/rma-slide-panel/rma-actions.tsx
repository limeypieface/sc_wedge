"use client"

/**
 * RMAActions
 *
 * Context-aware action buttons for the RMA workflow.
 * Shows different actions based on current status.
 */

import { Button } from "@/components/ui/button"
import {
  Truck,
  Mail,
  ClipboardCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import type { RMA, RMAVariant } from "@/types/rma-types"
import { RMA_TERMINOLOGY, canShipReturn } from "@/types/rma-types"

interface RMAActionsProps {
  rma: RMA
  variant?: RMAVariant
  onRecordAuthorization?: (rma: RMA) => void
  onShipReturn?: (rma: RMA) => void
  onRecordResolution?: (rma: RMA) => void
  onEmailClick?: (rma: RMA) => void
}

export function RMAActions({
  rma,
  variant = "po",
  onRecordAuthorization,
  onShipReturn,
  onRecordResolution,
  onEmailClick,
}: RMAActionsProps) {
  const terms = RMA_TERMINOLOGY[variant]

  // Determine which actions to show based on status
  const showRecordAuth = rma.status === "requested" || rma.status === "pending_auth"
  const showShipReturn = canShipReturn(rma)
  const showRecordResolution =
    rma.status === "return_shipped" ||
    rma.status === "in_transit" ||
    rma.status === "received_by_party" ||
    rma.status === "replacement_pending" ||
    rma.status === "credit_pending"
  const showTrackShipment = rma.returnTrackingNumber && rma.status !== "resolved"
  const isResolved = rma.status === "resolved"

  if (isResolved) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-emerald-600">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">RMA Resolved</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary action based on status */}
      {showRecordAuth && (
        <Button
          onClick={() => onRecordAuthorization?.(rma)}
          className="flex-1 gap-2"
        >
          <ClipboardCheck className="w-4 h-4" />
          Record Authorization
        </Button>
      )}

      {showShipReturn && (
        <Button
          onClick={() => onShipReturn?.(rma)}
          className="flex-1 gap-2"
        >
          <Truck className="w-4 h-4" />
          Ship Return
        </Button>
      )}

      {showRecordResolution && (
        <Button
          onClick={() => onRecordResolution?.(rma)}
          className="flex-1 gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Record Resolution
        </Button>
      )}

      {/* Secondary actions */}
      {showTrackShipment && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            // Open tracking URL in new tab
            // In real app, would construct proper tracking URL
            window.open(`https://track.example.com/${rma.returnTrackingNumber}`, "_blank")
          }}
          title="Track Shipment"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}

      <Button
        variant="outline"
        onClick={() => onEmailClick?.(rma)}
        className="gap-2"
      >
        <Mail className="w-4 h-4" />
        {terms.emailAction}
      </Button>
    </div>
  )
}
