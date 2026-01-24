"use client"

/**
 * RevisionActions
 *
 * Action buttons for the revision workflow.
 * Renders different buttons based on permissions and revision state.
 *
 * ## Button States
 * - Skip Approval: When changes are within threshold
 * - Submit for Approval: When changes exceed threshold
 * - Send to External Party: After approval is complete
 * - Discard Draft: Always available for drafts
 * - Approver Message: When approver is viewing a draft
 */

import { Button } from "@/shared/ui/button"
import type { RevisionTerminology, RevisionWorkflowStatus } from "./types"
import { PO_TERMINOLOGY } from "./types"

interface RevisionActionsProps {
  /** Current revision status */
  status: RevisionWorkflowStatus

  /** Whether the current user is an approver */
  isApprover: boolean

  /** Whether the user can submit for approval */
  canSubmit?: boolean

  /** Whether the user can send to external party */
  canSendToExternalParty?: boolean

  /** Whether the user can skip approval and send */
  canSkipApproval?: boolean

  /** Whether the user can discard the draft */
  canDiscard?: boolean

  /** Whether approval is required */
  requiresApproval?: boolean

  /** Optional terminology config - defaults to PO terminology */
  terminology?: RevisionTerminology

  /** Callbacks */
  onSubmitForApproval?: () => void
  onSendToExternalParty?: () => void
  onSkipApprovalAndSend?: () => void
  onDiscard?: () => void
}

export function RevisionActions({
  status,
  isApprover,
  canSubmit = false,
  canSendToExternalParty = false,
  canSkipApproval = false,
  canDiscard = false,
  requiresApproval = false,
  terminology = PO_TERMINOLOGY,
  onSubmitForApproval,
  onSendToExternalParty,
  onSkipApprovalAndSend,
  onDiscard,
}: RevisionActionsProps) {
  const isDraftOrRejected = status === "draft" || status === "rejected"

  return (
    <div className="flex flex-col gap-2">
      {/* Skip Approval & Send - For minor changes */}
      {canSkipApproval && (
        <div className="space-y-2">
          <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
            <p className="text-xs text-primary">
              Changes within threshold — approval not required
            </p>
          </div>
          <Button onClick={onSkipApprovalAndSend} className="w-full">
            Send to {terminology.externalParty}
          </Button>
        </div>
      )}

      {/* Submit for Approval - For significant changes */}
      {canSubmit && requiresApproval && (
        <Button onClick={onSubmitForApproval} className="w-full">
          Submit for Approval
        </Button>
      )}

      {/* Send to External Party - After approval */}
      {canSendToExternalParty && (
        <Button onClick={onSendToExternalParty} className="w-full">
          Send to {terminology.externalParty}
        </Button>
      )}

      {/* Discard Draft */}
      {canDiscard && (
        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={onDiscard}
        >
          Discard Revision
        </Button>
      )}

      {/* Approver Message */}
      {isDraftOrRejected && isApprover && (
        <div className="p-3 bg-muted/50 rounded-md text-center">
          <p className="text-xs text-muted-foreground">
            Only the {terminology.internalOwner} can edit and submit this revision.
          </p>
        </div>
      )}
    </div>
  )
}
