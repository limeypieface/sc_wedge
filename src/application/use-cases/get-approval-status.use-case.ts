/**
 * Get Approval Status Use Case
 *
 * Retrieves approval status along with computed capabilities.
 * This is the primary read operation for approval data.
 *
 * Design principles:
 * - Returns rich, pre-computed data for UI consumption
 * - Capabilities are always included
 * - Single source of truth for approval state
 */

import {
  ApprovalInstance,
  ApprovalCapabilities,
  ApprovalStatus,
  ApprovalStage,
  PrincipalId,
  EntityId,
  getCapabilities,
  getProgress,
  getActiveStage,
  StageProgress,
  EngineResult,
  success,
  failure,
  entityId,
} from "../../domain/approval-engine";
import { ApprovalRepository, ApprovalReference } from "../ports/approval-repository.port";

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Input for getting approval status by ID
 */
export interface GetApprovalByIdInput {
  readonly approvalId: string;
  readonly viewerId: string;
  readonly hasViewerRole?: boolean;
}

/**
 * Input for getting approval status by reference
 */
export interface GetApprovalByReferenceInput {
  readonly reference: ApprovalReference;
  readonly viewerId: string;
  readonly hasViewerRole?: boolean;
}

/**
 * Approval status view model for UI consumption
 */
export interface ApprovalStatusViewModel {
  /** Approval ID */
  readonly id: EntityId;
  /** Current status */
  readonly status: ApprovalStatus;
  /** Status display label */
  readonly statusLabel: string;
  /** Who initiated */
  readonly initiatorId: PrincipalId;
  /** Computed capabilities for the viewer */
  readonly capabilities: ApprovalCapabilities;
  /** Progress information */
  readonly progress: StageProgress;
  /** Active stage info (if any) */
  readonly activeStage?: StageViewModel;
  /** All stages with their status */
  readonly stages: readonly StageViewModel[];
  /** Timestamps */
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Whether viewer can take action */
  readonly requiresAction: boolean;
  /** Summary of what action is needed (if any) */
  readonly actionSummary?: string;
}

/**
 * Stage view model
 */
export interface StageViewModel {
  readonly id: EntityId;
  readonly name: string;
  readonly sequence: number;
  readonly status: string;
  readonly statusLabel: string;
  readonly approvers: readonly PrincipalId[];
  readonly voteCount: number;
  readonly requiredVotes: number;
  readonly hasViewerVoted: boolean;
}

// ============================================================================
// USE CASE DEPENDENCIES
// ============================================================================

export interface GetApprovalStatusDependencies {
  readonly repository: ApprovalRepository;
}

// ============================================================================
// USE CASE IMPLEMENTATION
// ============================================================================

/**
 * Create the get approval status use case
 */
export function createGetApprovalStatusUseCase(deps: GetApprovalStatusDependencies) {
  async function getApprovalById(
    input: GetApprovalByIdInput
  ): Promise<EngineResult<ApprovalStatusViewModel>> {
    const { repository } = deps;

    const approval = await repository.findById(entityId(input.approvalId));
    if (!approval) {
      return failure("NOT_FOUND", `Approval ${input.approvalId} not found`);
    }

    return success(
      buildViewModel(approval, input.viewerId, input.hasViewerRole ?? false)
    );
  }

  return {
    getApprovalById,
  };
}

/**
 * Build the view model from an approval instance
 */
function buildViewModel(
  approval: ApprovalInstance,
  viewerId: string,
  hasViewerRole: boolean
): ApprovalStatusViewModel {
  const capabilities = getCapabilities(approval, viewerId, hasViewerRole);
  const progress = getProgress(approval);
  const activeStageInstance = getActiveStage(approval.stages);

  const stages = approval.stages.map((stage) =>
    buildStageViewModel(stage, viewerId)
  );

  const activeStage = activeStageInstance
    ? stages.find((s) => s.id === activeStageInstance.id)
    : undefined;

  const requiresAction =
    capabilities.canApprove ||
    capabilities.canReject ||
    capabilities.canSubmit ||
    capabilities.canRequestChanges;

  let actionSummary: string | undefined;
  if (capabilities.canSubmit) {
    actionSummary = "Ready to submit for approval";
  } else if (capabilities.canApprove || capabilities.canReject) {
    actionSummary = `Your approval is needed for "${activeStage?.name ?? "current stage"}"`;
  } else if (capabilities.canRequestChanges) {
    actionSummary = "You can request changes";
  }

  return {
    id: approval.id,
    status: approval.status,
    statusLabel: getStatusLabel(approval.status),
    initiatorId: approval.initiatorId,
    capabilities,
    progress,
    activeStage,
    stages,
    createdAt: approval.createdAt,
    updatedAt: approval.updatedAt,
    requiresAction,
    actionSummary,
  };
}

/**
 * Build a stage view model
 */
function buildStageViewModel(
  stage: ApprovalStage,
  viewerId: string
): StageViewModel {
  return {
    id: stage.id,
    name: stage.name,
    sequence: stage.sequence,
    status: stage.status,
    statusLabel: getStageStatusLabel(stage.status),
    approvers: stage.approvers,
    voteCount: stage.votes.length,
    requiredVotes: calculateRequiredVotes(stage),
    hasViewerVoted: stage.votes.some((v) => v.principalId === viewerId),
  };
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: ApprovalStatus): string {
  switch (status) {
    case "pending":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

/**
 * Get human-readable stage status label
 */
function getStageStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "active":
      return "Awaiting Approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
}

/**
 * Calculate required votes based on voting rule
 */
function calculateRequiredVotes(stage: ApprovalStage): number {
  switch (stage.votingRule.type) {
    case "unanimous":
      return stage.approvers.length;
    case "any":
      return 1;
    case "majority":
      return Math.floor(stage.approvers.length / 2) + 1;
    case "threshold":
      return stage.votingRule.minApprovals ?? 1;
    case "percentage":
      return Math.ceil(
        stage.approvers.length * ((stage.votingRule.minPercentage ?? 50) / 100)
      );
    default:
      return 1;
  }
}

/**
 * Type for the use case
 */
export type GetApprovalStatusUseCase = ReturnType<
  typeof createGetApprovalStatusUseCase
>;
