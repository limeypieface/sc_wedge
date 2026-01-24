/**
 * WorkflowStatusPanel - Wrapper around RevisionStatusPanel for workflow API
 *
 * This component uses RevisionContext to get data and passes it to
 * RevisionStatusPanel as props.
 */

"use client"

import { useRevision } from "@/context/RevisionContext"
import { RevisionStatusPanel } from "./revisions/revision-status-panel"
import type { RevisionWorkflowStatus } from "./revisions/types"
import { RevisionStatus } from "@/types/revision-status"

interface WorkflowStatusPanelProps {
  workflow: {
    hasPendingDraft: boolean
    pendingDraft?: unknown
    activeRevision?: unknown
    createDraft?: () => void
    enterEditMode?: () => void
    exitEditMode?: () => void
    isEditMode?: boolean
  } | null
}

function mapRevisionStatus(status: RevisionStatus): RevisionWorkflowStatus {
  const mapping: Record<RevisionStatus, RevisionWorkflowStatus> = {
    [RevisionStatus.Draft]: "draft",
    [RevisionStatus.PendingApproval]: "pending_approval",
    [RevisionStatus.Approved]: "approved",
    [RevisionStatus.Sent]: "sent",
    [RevisionStatus.Acknowledged]: "active",
    [RevisionStatus.Rejected]: "rejected",
  }
  return mapping[status] || "draft"
}

export function WorkflowStatusPanel({ workflow }: WorkflowStatusPanelProps) {
  const {
    currentUser,
    pendingDraftRevision,
    costDeltaInfo,
    canSubmit,
    canSkipApproval,
    canSendToSupplier,
    requiresApproval,
    submitForApproval,
    sendToSupplier,
    skipApprovalAndSend,
    discardDraft,
  } = useRevision()

  if (!workflow || !workflow.hasPendingDraft || !pendingDraftRevision) {
    return null
  }

  return (
    <RevisionStatusPanel
      version={pendingDraftRevision.version}
      status={mapRevisionStatus(pendingDraftRevision.status)}
      currentUser={{ id: currentUser.id, isApprover: currentUser.isApprover }}
      costDeltaInfo={costDeltaInfo ? {
        delta: costDeltaInfo.delta,
        percentChange: costDeltaInfo.deltaPercent,
        exceedsThreshold: Math.abs(costDeltaInfo.deltaPercent) > 10,
        previousTotal: costDeltaInfo.originalTotal,
        newTotal: costDeltaInfo.currentTotal,
      } : null}
      canSubmit={canSubmit}
      canSkipApproval={canSkipApproval}
      canSendToExternalParty={canSendToSupplier}
      canDiscard={pendingDraftRevision.status === RevisionStatus.Draft}
      requiresApproval={requiresApproval}
      onSubmitForApproval={() => submitForApproval()}
      onSendToExternalParty={() => sendToSupplier()}
      onSkipApprovalAndSend={() => skipApprovalAndSend()}
      onDiscard={() => discardDraft()}
    />
  )
}
