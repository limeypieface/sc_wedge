"use client";

/**
 * RevisionStatusPanel
 *
 * Displays the current revision status and provides workflow actions.
 * This is the main control panel for the revision approval workflow.
 *
 * ## Features
 * - Shows current revision version and status
 * - Displays workflow progress bar
 * - Shows cost change indicator when applicable
 * - Provides action buttons based on user permissions
 * - Displays approval chain progress
 *
 * ## Layout
 * ```
 * ┌─────────────────────────────────────┐
 * │ Revision v2.0          [Status]    │
 * ├─────────────────────────────────────┤
 * │ ●────●────○────○────○              │
 * │ Draft  Approval  Approved  Sent    │
 * ├─────────────────────────────────────┤
 * │ Vendor Notification Reminder       │
 * ├─────────────────────────────────────┤
 * │ Cost Change: +$500 (+5%)           │
 * ├─────────────────────────────────────┤
 * │ Approval Chain                     │
 * │ ✓ Level 1: John (Approved)         │
 * │ ● Level 2: Jane (Pending)          │
 * ├─────────────────────────────────────┤
 * │ [Submit for Approval]              │
 * │ [Discard Draft]                    │
 * └─────────────────────────────────────┘
 * ```
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusPill } from "@/components/ui/status-pill";

import { useRevision } from "../../_lib/contexts";
import { RevisionStatus } from "@/types/enums";
import { PO_REVISION_STATUS_CONFIG, getRevisionStatusBorderClass } from "@/components/po";
import { cn } from "@/lib/utils";

import { WorkflowProgress } from "./workflow-progress";
import { CostDeltaIndicator } from "./cost-delta-indicator";
import { VendorNotificationReminder } from "./vendor-notification-reminder";
import { ApprovalChainDisplay } from "./approval-chain-display";
import { RevisionActions } from "./revision-actions";

// ============================================================================
// PROPS
// ============================================================================

interface RevisionStatusPanelProps {
  /** Callback when submitting for approval */
  onSubmitForApproval?: () => void;

  /** Callback when sending to supplier */
  onSendToSupplier?: () => void;

  /** Callback when skipping approval */
  onSkipApprovalAndSend?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RevisionStatusPanel({
  onSubmitForApproval,
  onSendToSupplier,
  onSkipApprovalAndSend,
}: RevisionStatusPanelProps) {
  const { currentUser, pendingDraftRevision, costDeltaInfo } = useRevision();

  // Don't render if no draft revision
  if (!pendingDraftRevision) {
    return null;
  }

  const status = pendingDraftRevision.status;
  const isApprover = currentUser.isApprover;

  return (
    <Card className={cn("border-l-4", getRevisionStatusBorderClass(status))}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Revision v{pendingDraftRevision.version}
          </CardTitle>
          <StatusPill
            status={status}
            config={PO_REVISION_STATUS_CONFIG}
            size="md"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Workflow Progress */}
        <WorkflowProgress status={status} />

        <Separator />

        {/* Vendor Notification (Draft status, non-approvers only) */}
        {status === RevisionStatus.Draft && !isApprover && (
          <VendorNotificationReminder revision={pendingDraftRevision} />
        )}

        {/* Cost Delta Indicator */}
        {costDeltaInfo && costDeltaInfo.delta !== 0 && (
          <CostDeltaIndicator costDeltaInfo={costDeltaInfo} />
        )}

        {/* Approval Chain (when in approval workflow) */}
        {pendingDraftRevision.approvalChain &&
          status !== RevisionStatus.Draft && (
            <ApprovalChainDisplay
              chain={pendingDraftRevision.approvalChain}
              currentUserId={currentUser.id}
            />
          )}

        <Separator />

        {/* Action Buttons */}
        <RevisionActions
          onSubmitForApproval={onSubmitForApproval}
          onSendToSupplier={onSendToSupplier}
          onSkipApprovalAndSend={onSkipApprovalAndSend}
        />
      </CardContent>
    </Card>
  );
}
