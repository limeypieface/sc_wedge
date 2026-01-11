"use client";

/**
 * SOStatusPanel
 *
 * Displays the current revision status and provides workflow actions.
 * This is the main control panel for the SO revision approval workflow.
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
 * │ Customer Notification Reminder     │
 * ├─────────────────────────────────────┤
 * │ Value Change: +$500 (+5%)          │
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

import { Card, CardContent, CardHeader, CardTitle, Badge, Separator } from "@/components/ui";

import { useSalesOrder } from "../../_lib/contexts";
import { SORevisionStatus, SORevisionStatusMeta } from "@/types/enums";
import { cn } from "@/lib/utils";

import { WorkflowProgress } from "./workflow-progress";
import { CostDeltaIndicator } from "./cost-delta-indicator";
import { CustomerNotificationReminder } from "./customer-notification-reminder";
import { ApprovalChainDisplay } from "./approval-chain-display";
import { RevisionActions } from "./revision-actions";

// ============================================================================
// PROPS
// ============================================================================

interface SOStatusPanelProps {
  /** Callback when submitting for approval */
  onSubmitForApproval?: () => void;

  /** Callback when sending to customer */
  onSendToCustomer?: () => void;

  /** Callback when skipping approval */
  onSkipApprovalAndSend?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SOStatusPanel({
  onSubmitForApproval,
  onSendToCustomer,
  onSkipApprovalAndSend,
}: SOStatusPanelProps) {
  const { currentUser, pendingDraftRevision, costDeltaInfo } = useSalesOrder();

  // Don't render if no draft revision
  if (!pendingDraftRevision) {
    return null;
  }

  // Map string status to enum
  const statusKey = pendingDraftRevision.status as SORevisionStatus;
  const statusMeta = SORevisionStatusMeta.meta[statusKey];
  const isApprover = currentUser.isApprover;

  return (
    <Card className={cn("border-l-4", statusMeta?.borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Revision v{pendingDraftRevision.version}
          </CardTitle>
          <Badge variant="outline" className={statusMeta?.className}>
            {statusMeta?.label || pendingDraftRevision.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Workflow Progress */}
        <WorkflowProgress status={statusKey} />

        <Separator />

        {/* Customer Notification (Draft status, non-approvers only) */}
        {statusKey === SORevisionStatus.Draft && !isApprover && (
          <CustomerNotificationReminder revision={pendingDraftRevision} />
        )}

        {/* Cost Delta Indicator */}
        {costDeltaInfo && costDeltaInfo.delta !== 0 && (
          <CostDeltaIndicator costDeltaInfo={costDeltaInfo} />
        )}

        {/* Approval Chain (when in approval workflow) */}
        {pendingDraftRevision.approvalChain &&
          statusKey !== SORevisionStatus.Draft && (
            <ApprovalChainDisplay
              chain={pendingDraftRevision.approvalChain}
              currentUserId={currentUser.id}
            />
          )}

        <Separator />

        {/* Action Buttons */}
        <RevisionActions
          onSubmitForApproval={onSubmitForApproval}
          onSendToCustomer={onSendToCustomer}
          onSkipApprovalAndSend={onSkipApprovalAndSend}
        />
      </CardContent>
    </Card>
  );
}
