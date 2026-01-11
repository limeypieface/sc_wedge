"use client";

/**
 * RevisionActions
 *
 * Action buttons for the revision workflow.
 * Renders different buttons based on user permissions and revision state.
 *
 * ## Button States
 * - Skip Approval: When changes are within threshold
 * - Submit for Approval: When changes exceed threshold
 * - Send to Supplier: After approval is complete
 * - Discard Draft: Always available for drafts
 * - Approver Message: When approver is viewing a draft
 */

import { Button } from "@/components/ui/button";
import { useRevision } from "../../_lib/contexts";
import { RevisionStatus } from "@/types/enums";

interface RevisionActionsProps {
  onSubmitForApproval?: () => void;
  onSendToSupplier?: () => void;
  onSkipApprovalAndSend?: () => void;
}

export function RevisionActions({
  onSubmitForApproval,
  onSendToSupplier,
  onSkipApprovalAndSend,
}: RevisionActionsProps) {
  const {
    currentUser,
    pendingDraftRevision,
    canSubmit,
    canSendToSupplier,
    canSkipApproval,
    canDiscard,
    requiresApproval,
    discardDraft,
  } = useRevision();

  if (!pendingDraftRevision) {
    return null;
  }

  const status = pendingDraftRevision.status;
  const isApprover = currentUser.isApprover;
  const isDraftOrRejected =
    status === RevisionStatus.Draft || status === RevisionStatus.Rejected;

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
            Send to Supplier
          </Button>
        </div>
      )}

      {/* Submit for Approval - For significant changes */}
      {canSubmit && requiresApproval && (
        <Button onClick={onSubmitForApproval} className="w-full">
          Submit for Approval
        </Button>
      )}

      {/* Send to Supplier - After approval */}
      {canSendToSupplier && (
        <Button onClick={onSendToSupplier} className="w-full">
          Send to Supplier
        </Button>
      )}

      {/* Discard Draft */}
      {canDiscard && (
        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={discardDraft}
        >
          Discard Revision
        </Button>
      )}

      {/* Approver Message */}
      {isDraftOrRejected && isApprover && (
        <div className="p-3 bg-muted/50 rounded-md text-center">
          <p className="text-xs text-muted-foreground">
            Only the buyer can edit and submit this revision.
          </p>
        </div>
      )}
    </div>
  );
}
