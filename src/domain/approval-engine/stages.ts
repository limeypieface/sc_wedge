/**
 * Approval Engine - Stage Progression Module
 *
 * Pure functions for managing multi-stage approval workflows.
 * Handles stage transitions, ordering, and completion logic.
 *
 * Design principles:
 * - Stages are processed sequentially
 * - Each stage must complete before the next begins
 * - All state transitions are explicit and immutable
 */

import {
  ApprovalStage,
  StageStatus,
  StageTemplate,
  Vote,
  VotingRule,
  EntityId,
  PrincipalId,
  ISOTimestamp,
  entityId,
  isoTimestamp,
  EngineResult,
  success,
  failure,
} from "./types";
import { evaluateVotingOutcome, VotingOutcome } from "./voting";

// ============================================================================
// STAGE CREATION
// ============================================================================

/**
 * Create stages from templates
 */
export function createStagesFromTemplates(
  templates: readonly StageTemplate[],
  resolveApprovers: (selector: StageTemplate["approverSelector"]) => readonly PrincipalId[]
): readonly ApprovalStage[] {
  return templates.map((template, index) => ({
    id: entityId(`stage-${index + 1}`),
    sequence: index + 1,
    name: template.name,
    approvers: resolveApprovers(template.approverSelector),
    votingRule: template.votingRule,
    status: index === 0 ? "active" : "pending",
    votes: [],
  }));
}

/**
 * Create a single stage
 */
export function createStage(
  id: string,
  sequence: number,
  name: string,
  approvers: readonly PrincipalId[],
  votingRule: VotingRule,
  status: StageStatus = "pending"
): ApprovalStage {
  return {
    id: entityId(id),
    sequence,
    name,
    approvers,
    votingRule,
    status,
    votes: [],
  };
}

// ============================================================================
// STAGE QUERIES
// ============================================================================

/**
 * Get the currently active stage
 */
export function getActiveStage(
  stages: readonly ApprovalStage[]
): ApprovalStage | undefined {
  return stages.find((s) => s.status === "active");
}

/**
 * Get stage by ID
 */
export function getStageById(
  stages: readonly ApprovalStage[],
  stageId: EntityId
): ApprovalStage | undefined {
  return stages.find((s) => s.id === stageId);
}

/**
 * Get the next pending stage
 */
export function getNextPendingStage(
  stages: readonly ApprovalStage[]
): ApprovalStage | undefined {
  return stages.find((s) => s.status === "pending");
}

/**
 * Get all completed stages
 */
export function getCompletedStages(
  stages: readonly ApprovalStage[]
): readonly ApprovalStage[] {
  return stages.filter(
    (s) => s.status === "approved" || s.status === "rejected"
  );
}

/**
 * Check if all stages are complete
 */
export function areAllStagesComplete(
  stages: readonly ApprovalStage[]
): boolean {
  return stages.every(
    (s) =>
      s.status === "approved" || s.status === "rejected" || s.status === "skipped"
  );
}

/**
 * Check if any stage is rejected
 */
export function hasRejectedStage(stages: readonly ApprovalStage[]): boolean {
  return stages.some((s) => s.status === "rejected");
}

/**
 * Check if all stages are approved (or skipped)
 */
export function allStagesApproved(stages: readonly ApprovalStage[]): boolean {
  return stages.every(
    (s) => s.status === "approved" || s.status === "skipped"
  );
}

// ============================================================================
// STAGE TRANSITIONS
// ============================================================================

/**
 * Add a vote to a stage (immutable)
 */
export function addVoteToStage(
  stage: ApprovalStage,
  vote: Vote
): ApprovalStage {
  return {
    ...stage,
    votes: [...stage.votes, vote],
  };
}

/**
 * Update stage status (immutable)
 */
export function updateStageStatus(
  stage: ApprovalStage,
  status: StageStatus
): ApprovalStage {
  return {
    ...stage,
    status,
  };
}

/**
 * Evaluate a stage's current outcome based on votes
 */
export function evaluateStageOutcome(stage: ApprovalStage): VotingOutcome {
  return evaluateVotingOutcome(stage.votes, stage.approvers, stage.votingRule);
}

/**
 * Process vote and update stages
 */
export function processVote(
  stages: readonly ApprovalStage[],
  stageId: EntityId,
  vote: Vote
): EngineResult<readonly ApprovalStage[]> {
  const stageIndex = stages.findIndex((s) => s.id === stageId);

  if (stageIndex === -1) {
    return failure("STAGE_NOT_FOUND", `Stage ${stageId} not found`);
  }

  const stage = stages[stageIndex];

  if (stage.status !== "active") {
    return failure(
      "STAGE_NOT_ACTIVE",
      `Stage ${stageId} is not active (status: ${stage.status})`
    );
  }

  // Add vote
  const updatedStage = addVoteToStage(stage, vote);

  // Evaluate outcome
  const outcome = evaluateStageOutcome(updatedStage);

  // Update stage status based on outcome
  let finalStage = updatedStage;
  if (outcome === "approved") {
    finalStage = updateStageStatus(updatedStage, "approved");
  } else if (outcome === "rejected") {
    finalStage = updateStageStatus(updatedStage, "rejected");
  }

  // Create new stages array
  const newStages = [...stages];
  newStages[stageIndex] = finalStage;

  // If stage completed, activate next stage
  if (outcome === "approved") {
    const nextStageIndex = stageIndex + 1;
    if (nextStageIndex < newStages.length) {
      newStages[nextStageIndex] = updateStageStatus(
        newStages[nextStageIndex],
        "active"
      );
    }
  }

  return success(newStages);
}

// ============================================================================
// STAGE PROGRESSION
// ============================================================================

/**
 * Advance to the next stage
 */
export function advanceToNextStage(
  stages: readonly ApprovalStage[]
): EngineResult<readonly ApprovalStage[]> {
  const activeStage = getActiveStage(stages);

  if (!activeStage) {
    return failure("NO_ACTIVE_STAGE", "No active stage to advance from");
  }

  const activeIndex = stages.findIndex((s) => s.id === activeStage.id);
  const nextIndex = activeIndex + 1;

  if (nextIndex >= stages.length) {
    return failure("NO_NEXT_STAGE", "Already at the final stage");
  }

  const newStages = [...stages];

  // Mark current as approved
  newStages[activeIndex] = updateStageStatus(
    newStages[activeIndex],
    "approved"
  );

  // Activate next
  newStages[nextIndex] = updateStageStatus(newStages[nextIndex], "active");

  return success(newStages);
}

/**
 * Skip a stage
 */
export function skipStage(
  stages: readonly ApprovalStage[],
  stageId: EntityId
): EngineResult<readonly ApprovalStage[]> {
  const stageIndex = stages.findIndex((s) => s.id === stageId);

  if (stageIndex === -1) {
    return failure("STAGE_NOT_FOUND", `Stage ${stageId} not found`);
  }

  const stage = stages[stageIndex];

  if (stage.status !== "active" && stage.status !== "pending") {
    return failure(
      "CANNOT_SKIP",
      `Cannot skip stage with status ${stage.status}`
    );
  }

  const newStages = [...stages];
  newStages[stageIndex] = updateStageStatus(newStages[stageIndex], "skipped");

  // Activate next pending stage if we skipped the active one
  if (stage.status === "active") {
    const nextPending = newStages.findIndex(
      (s, i) => i > stageIndex && s.status === "pending"
    );
    if (nextPending !== -1) {
      newStages[nextPending] = updateStageStatus(
        newStages[nextPending],
        "active"
      );
    }
  }

  return success(newStages);
}

/**
 * Reject a stage (and all subsequent stages)
 */
export function rejectStage(
  stages: readonly ApprovalStage[],
  stageId: EntityId
): EngineResult<readonly ApprovalStage[]> {
  const stageIndex = stages.findIndex((s) => s.id === stageId);

  if (stageIndex === -1) {
    return failure("STAGE_NOT_FOUND", `Stage ${stageId} not found`);
  }

  const newStages = [...stages];

  // Mark the stage as rejected
  newStages[stageIndex] = updateStageStatus(newStages[stageIndex], "rejected");

  // All subsequent pending stages remain pending (no longer possible to reach)
  // They don't get rejected, just left in pending state

  return success(newStages);
}

// ============================================================================
// STAGE PROGRESS
// ============================================================================

/**
 * Stage progress information
 */
export interface StageProgress {
  /** Total stages */
  readonly totalStages: number;
  /** Completed stages (approved or skipped) */
  readonly completedStages: number;
  /** Current stage number (1-based) */
  readonly currentStage: number;
  /** Percentage complete */
  readonly percentComplete: number;
  /** Whether all stages are done */
  readonly isComplete: boolean;
  /** Whether any stage was rejected */
  readonly isRejected: boolean;
}

/**
 * Calculate stage progress
 */
export function calculateStageProgress(
  stages: readonly ApprovalStage[]
): StageProgress {
  const totalStages = stages.length;
  const completedStages = stages.filter(
    (s) => s.status === "approved" || s.status === "skipped"
  ).length;
  const activeStage = getActiveStage(stages);
  const currentStage = activeStage?.sequence ?? completedStages + 1;
  const isRejected = hasRejectedStage(stages);

  return {
    totalStages,
    completedStages,
    currentStage,
    percentComplete:
      totalStages > 0 ? (completedStages / totalStages) * 100 : 0,
    isComplete: areAllStagesComplete(stages),
    isRejected,
  };
}
