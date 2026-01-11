/**
 * Process Vote Use Case
 *
 * Handles recording votes on approvals and determining outcomes.
 * Manages stage transitions, notifications, and status updates.
 *
 * Design principles:
 * - Single responsibility: processing votes
 * - Atomic operations (vote + save are transactional)
 * - Clear outcome reporting
 */

import {
  ApprovalInstance,
  VoteDecision,
  PrincipalId,
  EntityId,
  recordVote,
  getCapabilities,
  getProgress,
  EngineResult,
  success,
  failure,
  principalId,
  entityId,
} from "../../domain/approval-engine";
import { ApprovalRepository } from "../ports/approval-repository.port";
import {
  NotificationService,
  buildVoteRecordedNotification,
  buildApprovalCompleteNotification,
} from "../ports/notification.port";

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Input for processing a vote
 */
export interface ProcessVoteInput {
  /** Approval ID */
  readonly approvalId: string;
  /** Who is voting */
  readonly voterId: string;
  /** The vote decision */
  readonly decision: VoteDecision;
  /** Optional reason for the vote */
  readonly reason?: string;
  /** URL for viewing the approval */
  readonly actionUrl?: string;
}

/**
 * Output from processing a vote
 */
export interface ProcessVoteOutput {
  /** Updated approval instance */
  readonly approval: ApprovalInstance;
  /** Whether the approval is now complete */
  readonly isComplete: boolean;
  /** Whether approval was approved */
  readonly wasApproved: boolean;
  /** Whether approval was rejected */
  readonly wasRejected: boolean;
  /** Current stage progress */
  readonly progress: {
    readonly completedStages: number;
    readonly totalStages: number;
    readonly percentComplete: number;
  };
}

// ============================================================================
// USE CASE DEPENDENCIES
// ============================================================================

export interface ProcessVoteDependencies {
  readonly repository: ApprovalRepository;
  readonly notificationService: NotificationService;
}

// ============================================================================
// USE CASE IMPLEMENTATION
// ============================================================================

/**
 * Create the process vote use case
 */
export function createProcessVoteUseCase(deps: ProcessVoteDependencies) {
  return async function processVote(
    input: ProcessVoteInput
  ): Promise<EngineResult<ProcessVoteOutput>> {
    const { repository, notificationService } = deps;

    // 1. Fetch the approval
    const approval = await repository.findById(entityId(input.approvalId));
    if (!approval) {
      return failure("NOT_FOUND", `Approval ${input.approvalId} not found`);
    }

    // 2. Check capabilities
    const capabilities = getCapabilities(approval, input.voterId);

    const canVote =
      capabilities.canApprove ||
      capabilities.canReject ||
      capabilities.canRequestChanges;

    if (!canVote) {
      const reason =
        capabilities.denialReasons["canApprove"] ??
        capabilities.denialReasons["canReject"] ??
        "Not authorized to vote";
      return failure("NOT_AUTHORIZED", reason);
    }

    // Validate decision matches capability
    if (input.decision === "approve" && !capabilities.canApprove) {
      return failure("NOT_AUTHORIZED", capabilities.denialReasons["canApprove"] ?? "Cannot approve");
    }
    if (input.decision === "reject" && !capabilities.canReject) {
      return failure("NOT_AUTHORIZED", capabilities.denialReasons["canReject"] ?? "Cannot reject");
    }
    if (input.decision === "request_changes" && !capabilities.canRequestChanges) {
      return failure(
        "NOT_AUTHORIZED",
        capabilities.denialReasons["canRequestChanges"] ?? "Cannot request changes"
      );
    }

    // 3. Record the vote
    const voteResult = recordVote(
      approval,
      input.voterId,
      input.decision,
      input.reason
    );

    if (!voteResult.success) {
      return failure(voteResult.error.code, voteResult.error.message);
    }

    const updatedApproval = voteResult.value;

    // 4. Save to repository
    const saveResult = await repository.save(updatedApproval);
    if (!saveResult.success) {
      return failure(saveResult.error.code, saveResult.error.message);
    }

    // 5. Calculate progress
    const progress = getProgress(updatedApproval);
    const isComplete = progress.isComplete;
    const wasApproved = updatedApproval.status === "approved";
    const wasRejected = updatedApproval.status === "rejected";

    // 6. Send notifications
    const watchers = getWatchers(updatedApproval);
    const vote = updatedApproval.stages
      .flatMap((s) => s.votes)
      .find((v) => v.principalId === principalId(input.voterId));

    if (vote) {
      const voteNotification = buildVoteRecordedNotification(
        updatedApproval,
        vote,
        progress.completedStages,
        progress.totalStages,
        watchers.filter((w) => w !== principalId(input.voterId)),
        input.actionUrl
      );
      await notificationService.send(voteNotification);
    }

    // If complete, send completion notification
    if (isComplete) {
      const completeNotification = buildApprovalCompleteNotification(
        updatedApproval,
        watchers,
        input.actionUrl
      );
      await notificationService.send(completeNotification);
    }

    return success({
      approval: saveResult.value,
      isComplete,
      wasApproved,
      wasRejected,
      progress: {
        completedStages: progress.completedStages,
        totalStages: progress.totalStages,
        percentComplete: progress.percentComplete,
      },
    });
  };
}

/**
 * Get all principals who should be notified about this approval
 */
function getWatchers(approval: ApprovalInstance): readonly PrincipalId[] {
  const watchers = new Set<PrincipalId>();

  // Initiator always watches
  watchers.add(approval.initiatorId);

  // All approvers watch
  for (const stage of approval.stages) {
    for (const approver of stage.approvers) {
      watchers.add(approver);
    }
  }

  return Array.from(watchers);
}

/**
 * Type for the use case function
 */
export type ProcessVoteUseCase = ReturnType<typeof createProcessVoteUseCase>;
