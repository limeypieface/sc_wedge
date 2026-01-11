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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useRevision } from "../../_lib/contexts";
import { RevisionStatus, RevisionStatusMeta } from "@/types/enums";
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
  const statusMeta = RevisionStatusMeta.meta[status];
  const isApprover = currentUser.isApprover;

  return (
    <Card className={cn("border-l-4", statusMeta.borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Revision v{pendingDraftRevision.version}
          </CardTitle>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
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
