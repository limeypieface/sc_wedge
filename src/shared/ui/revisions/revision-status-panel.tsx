"use client"

/**
 * RevisionStatusPanel
 *
 * Displays the current revision status and provides workflow actions.
 * This is the main control panel for the revision approval workflow.
 *
 * Works for both Purchase Orders and Sales Orders via terminology configuration.
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
 * +-----------------------------------------+
 * | Revision v2.0          [Status]         |
 * +-----------------------------------------+
 * | *----*----o----o----o                   |
 * | Draft  Approval  Approved  Sent  Active |
 * +-----------------------------------------+
 * | External Party Notification Reminder    |
 * +-----------------------------------------+
 * | Cost Change: +$500 (+5%)                |
 * +-----------------------------------------+
 * | Approval Chain                          |
 * | * Level 1: John (Approved)              |
 * | o Level 2: Jane (Pending)               |
 * +-----------------------------------------+
 * | [Submit for Approval]                   |
 * | [Discard Draft]                         |
 * +-----------------------------------------+
 * ```
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { WorkflowProgress } from "./workflow-progress"
import { CostDeltaIndicator } from "./cost-delta-indicator"
import { NotificationReminder } from "./notification-reminder"
import { ApprovalChainDisplay } from "./approval-chain-display"
import { RevisionActions } from "./revision-actions"
import type {
  RevisionTerminology,
  RevisionWorkflowStatus,
  CostDeltaInfo,
  ApprovalChain,
  WorkflowStep,
} from "./types"
import { PO_TERMINOLOGY } from "./types"

// ============================================================================
// STATUS STYLING
// ============================================================================

type StatusVariant = "default" | "warning" | "success" | "destructive" | "muted"

interface StatusConfig {
  label: string
  variant: StatusVariant
  borderClass: string
}

const DEFAULT_STATUS_CONFIG: Record<RevisionWorkflowStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    variant: "muted",
    borderClass: "border-l-muted-foreground/50",
  },
  pending_approval: {
    label: "Pending Approval",
    variant: "warning",
    borderClass: "border-l-amber-500",
  },
  approved: {
    label: "Approved",
    variant: "success",
    borderClass: "border-l-green-500",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    borderClass: "border-l-destructive",
  },
  sent: {
    label: "Sent",
    variant: "default",
    borderClass: "border-l-primary",
  },
  active: {
    label: "Active",
    variant: "success",
    borderClass: "border-l-green-500",
  },
}

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-green-50 text-green-700 border-green-200",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  muted: "bg-muted text-muted-foreground border-border",
}

// ============================================================================
// PROPS
// ============================================================================

interface RevisionStatusPanelProps {
  /** Revision version number (e.g., "2.0") */
  version: string

  /** Current workflow status */
  status: RevisionWorkflowStatus

  /** Current user info */
  currentUser: {
    id: string
    isApprover: boolean
  }

  /** Cost delta info (optional) */
  costDeltaInfo?: CostDeltaInfo | null

  /** Approval chain (optional) */
  approvalChain?: ApprovalChain | null

  /** Custom workflow steps (optional) */
  workflowSteps?: WorkflowStep[]

  /** Custom status config (optional) */
  statusConfig?: Record<RevisionWorkflowStatus, StatusConfig>

  /** Terminology configuration */
  terminology?: RevisionTerminology

  /** Permission flags */
  canSubmit?: boolean
  canSendToExternalParty?: boolean
  canSkipApproval?: boolean
  canDiscard?: boolean
  requiresApproval?: boolean

  /** Callbacks */
  onSubmitForApproval?: () => void
  onSendToExternalParty?: () => void
  onSkipApprovalAndSend?: () => void
  onDiscard?: () => void
  onNotifyExternalParty?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RevisionStatusPanel({
  version,
  status,
  currentUser,
  costDeltaInfo,
  approvalChain,
  workflowSteps,
  statusConfig = DEFAULT_STATUS_CONFIG,
  terminology = PO_TERMINOLOGY,
  canSubmit = false,
  canSendToExternalParty = false,
  canSkipApproval = false,
  canDiscard = false,
  requiresApproval = false,
  onSubmitForApproval,
  onSendToExternalParty,
  onSkipApprovalAndSend,
  onDiscard,
  onNotifyExternalParty,
}: RevisionStatusPanelProps) {
  const config = statusConfig[status] || DEFAULT_STATUS_CONFIG.draft
  const isApprover = currentUser.isApprover
  const showNotification = status === "draft" && !isApprover

  return (
    <Card className={cn("border-l-4", config.borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Revision v{version}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("text-xs", VARIANT_CLASSES[config.variant])}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Workflow Progress */}
        <WorkflowProgress status={status} steps={workflowSteps} />

        <Separator />

        {/* External Party Notification (Draft status, non-approvers only) */}
        {showNotification && (
          <NotificationReminder
            terminology={terminology}
            onSendNotification={onNotifyExternalParty}
          />
        )}

        {/* Cost Delta Indicator */}
        {costDeltaInfo && costDeltaInfo.delta !== 0 && (
          <CostDeltaIndicator
            costDeltaInfo={costDeltaInfo}
            terminology={terminology}
          />
        )}

        {/* Approval Chain (when in approval workflow) */}
        {approvalChain && status !== "draft" && (
          <ApprovalChainDisplay
            chain={approvalChain}
            currentUserId={currentUser.id}
          />
        )}

        <Separator />

        {/* Action Buttons */}
        <RevisionActions
          status={status}
          isApprover={isApprover}
          canSubmit={canSubmit}
          canSendToExternalParty={canSendToExternalParty}
          canSkipApproval={canSkipApproval}
          canDiscard={canDiscard}
          requiresApproval={requiresApproval}
          terminology={terminology}
          onSubmitForApproval={onSubmitForApproval}
          onSendToExternalParty={onSendToExternalParty}
          onSkipApprovalAndSend={onSkipApprovalAndSend}
          onDiscard={onDiscard}
        />
      </CardContent>
    </Card>
  )
}
