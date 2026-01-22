/**
 * Approval Engine - Main Orchestrator
 *
 * The central coordinator that ties together all approval engine modules.
 * Provides a clean API for the application layer to interact with.
 *
 * Design principles:
 * - Stateless orchestration of domain modules
 * - All operations return new immutable instances
 * - Clear separation from infrastructure concerns
 */

import {
  EntityId,
  PrincipalId,
  ApprovalStatus,
  ApprovalStage,
  ApprovalPolicy,
  ApprovalContext,
  ApprovalCapabilities,
  StageTemplate,
  Vote,
  VoteDecision,
  AuditEntry,
  AuditAction,
  ISOTimestamp,
  EngineResult,
  entityId,
  principalId,
  isoTimestamp,
  success,
  failure,
  NO_CAPABILITIES,
} from "./types";
import {
  evaluatePolicy,
  findMatchingPolicies,
  determineRequiredStages,
  isApprovalRequired,
  canSkipApproval,
} from "./policy";
import {
  createStagesFromTemplates,
  getActiveStage,
  processVote,
  skipStage,
  allStagesApproved,
  hasRejectedStage,
  calculateStageProgress,
  StageProgress,
} from "./stages";
import { countVotes, canPrincipalVote, VoteSummary } from "./voting";
import { computeCapabilities, CapabilityContext } from "./capabilities";

// ============================================================================
// APPROVAL INSTANCE
// ============================================================================

/**
 * An immutable approval instance.
 * Represents the complete state of an approval at a point in time.
 */
export interface ApprovalInstance {
  /** Unique identifier */
  readonly id: EntityId;
  /** Current status */
  readonly status: ApprovalStatus;
  /** Principal who initiated the request */
  readonly initiatorId: PrincipalId;
  /** ID of the policy that governs this approval */
  readonly policyId: EntityId;
  /** Whether the governing policy allows skipping */
  readonly policyAllowsSkip: boolean;
  /** Stages in this approval */
  readonly stages: readonly ApprovalStage[];
  /** Complete audit history */
  readonly auditLog: readonly AuditEntry[];
  /** When the approval was created */
  readonly createdAt: ISOTimestamp;
  /** When the approval was last updated */
  readonly updatedAt: ISOTimestamp;
  /** Optional expiration time */
  readonly expiresAt?: ISOTimestamp;
  /** Additional metadata */
  readonly metadata: Readonly<Record<string, unknown>>;
}

// ============================================================================
// ENGINE OPERATIONS
// ============================================================================

/**
 * Create a new approval instance
 */
export function createApproval(
  id: string,
  initiatorId: string,
  policy: ApprovalPolicy,
  stageTemplates: readonly StageTemplate[],
  resolveApprovers: (
    selector: StageTemplate["approverSelector"]
  ) => readonly PrincipalId[],
  metadata: Record<string, unknown> = {},
  now: Date = new Date()
): EngineResult<ApprovalInstance> {
  const timestamp = isoTimestamp(now);

  const stages = createStagesFromTemplates(stageTemplates, resolveApprovers);

  if (stages.length === 0) {
    return failure("NO_STAGES", "Cannot create approval with no stages");
  }

  const auditEntry: AuditEntry = {
    id: entityId(`audit-${Date.now()}`),
    action: "created",
    principalId: principalId(initiatorId),
    timestamp,
    newState: "pending",
    details: { policyId: policy.id },
  };

  const instance: ApprovalInstance = {
    id: entityId(id),
    status: "pending",
    initiatorId: principalId(initiatorId),
    policyId: policy.id,
    policyAllowsSkip: policy.skippable,
    stages,
    auditLog: [auditEntry],
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata,
  };

  return success(instance);
}

/**
 * Submit an approval for review (activates first stage)
 */
export function submitApproval(
  instance: ApprovalInstance,
  submitterId: string,
  now: Date = new Date()
): EngineResult<ApprovalInstance> {
  if (instance.status !== "pending") {
    return failure("INVALID_STATUS", `Cannot submit approval in ${instance.status} status`);
  }

  const activeStage = getActiveStage(instance.stages);
  if (activeStage) {
    return failure("ALREADY_SUBMITTED", "Approval has already been submitted");
  }

  if (principalId(submitterId) !== instance.initiatorId) {
    return failure("NOT_AUTHORIZED", "Only the initiator can submit");
  }

  const timestamp = isoTimestamp(now);

  // Activate first stage
  const newStages = instance.stages.map((stage, index) =>
    index === 0 ? { ...stage, status: "active" as const } : stage
  );

  const auditEntry: AuditEntry = {
    id: entityId(`audit-${Date.now()}`),
    action: "submitted",
    principalId: principalId(submitterId),
    timestamp,
    previousState: "pending",
    newState: "pending",
    details: { activatedStage: newStages[0].id },
  };

  return success({
    ...instance,
    stages: newStages,
    auditLog: [...instance.auditLog, auditEntry],
    updatedAt: timestamp,
  });
}

/**
 * Record a vote on an approval
 */
export function recordVote(
  instance: ApprovalInstance,
  voterId: string,
  decision: VoteDecision,
  reason?: string,
  now: Date = new Date()
): EngineResult<ApprovalInstance> {
  if (instance.status !== "pending") {
    return failure("INVALID_STATUS", `Cannot vote on approval in ${instance.status} status`);
  }

  const activeStage = getActiveStage(instance.stages);
  if (!activeStage) {
    return failure("NO_ACTIVE_STAGE", "No active stage to vote on");
  }

  // Validate voter
  const canVoteResult = canPrincipalVote(
    principalId(voterId),
    activeStage.approvers,
    activeStage.votes
  );
  if (!canVoteResult.success) {
    return failure(canVoteResult.error.code, canVoteResult.error.message);
  }

  const timestamp = isoTimestamp(now);

  const vote: Vote = {
    id: entityId(`vote-${Date.now()}`),
    principalId: principalId(voterId),
    decision,
    reason,
    timestamp,
    stageId: activeStage.id,
  };

  // Process the vote
  const processResult = processVote(instance.stages, activeStage.id, vote);
  if (!processResult.success) {
    return failure(processResult.error.code, processResult.error.message);
  }

  const newStages = processResult.value;

  // Determine new status
  let newStatus = instance.status;
  let auditAction: AuditAction = "voted";

  if (allStagesApproved(newStages)) {
    newStatus = "approved";
    auditAction = "approved";
  } else if (hasRejectedStage(newStages)) {
    newStatus = "rejected";
    auditAction = "rejected";
  }

  const auditEntry: AuditEntry = {
    id: entityId(`audit-${Date.now()}`),
    action: auditAction,
    principalId: principalId(voterId),
    timestamp,
    previousState: instance.status,
    newState: newStatus,
    details: {
      stageId: activeStage.id,
      decision,
      reason,
    },
  };

  return success({
    ...instance,
    status: newStatus,
    stages: newStages,
    auditLog: [...instance.auditLog, auditEntry],
    updatedAt: timestamp,
  });
}

/**
 * Cancel an approval
 */
export function cancelApproval(
  instance: ApprovalInstance,
  cancellerId: string,
  reason?: string,
  now: Date = new Date()
): EngineResult<ApprovalInstance> {
  if (instance.status !== "pending") {
    return failure("INVALID_STATUS", `Cannot cancel approval in ${instance.status} status`);
  }

  if (principalId(cancellerId) !== instance.initiatorId) {
    return failure("NOT_AUTHORIZED", "Only the initiator can cancel");
  }

  const timestamp = isoTimestamp(now);

  const auditEntry: AuditEntry = {
    id: entityId(`audit-${Date.now()}`),
    action: "cancelled",
    principalId: principalId(cancellerId),
    timestamp,
    previousState: "pending",
    newState: "cancelled",
    details: { reason },
  };

  return success({
    ...instance,
    status: "cancelled",
    auditLog: [...instance.auditLog, auditEntry],
    updatedAt: timestamp,
  });
}

/**
 * Skip approval (if policy allows)
 */
export function skipApprovalProcess(
  instance: ApprovalInstance,
  skipperId: string,
  reason?: string,
  now: Date = new Date()
): EngineResult<ApprovalInstance> {
  if (instance.status !== "pending") {
    return failure("INVALID_STATUS", `Cannot skip approval in ${instance.status} status`);
  }

  if (!instance.policyAllowsSkip) {
    return failure("SKIP_NOT_ALLOWED", "Policy does not allow skipping");
  }

  if (principalId(skipperId) !== instance.initiatorId) {
    return failure("NOT_AUTHORIZED", "Only the initiator can skip");
  }

  const timestamp = isoTimestamp(now);

  // Skip all stages
  const newStages = instance.stages.map((stage) => ({
    ...stage,
    status: "skipped" as const,
  }));

  const auditEntry: AuditEntry = {
    id: entityId(`audit-${Date.now()}`),
    action: "skipped",
    principalId: principalId(skipperId),
    timestamp,
    previousState: "pending",
    newState: "approved",
    details: { reason },
  };

  return success({
    ...instance,
    status: "approved",
    stages: newStages,
    auditLog: [...instance.auditLog, auditEntry],
    updatedAt: timestamp,
  });
}

/**
 * Expire an approval
 */
export function expireApproval(
  instance: ApprovalInstance,
  now: Date = new Date()
): EngineResult<ApprovalInstance> {
  if (instance.status !== "pending") {
    return failure("INVALID_STATUS", `Cannot expire approval in ${instance.status} status`);
  }

  if (!instance.expiresAt) {
    return failure("NO_EXPIRATION", "Approval has no expiration date");
  }

  if (new Date(instance.expiresAt) > now) {
    return failure("NOT_EXPIRED", "Approval has not yet expired");
  }

  const timestamp = isoTimestamp(now);

  const auditEntry: AuditEntry = {
    id: entityId(`audit-${Date.now()}`),
    action: "expired",
    principalId: principalId("system"),
    timestamp,
    previousState: "pending",
    newState: "expired",
  };

  return success({
    ...instance,
    status: "expired",
    auditLog: [...instance.auditLog, auditEntry],
    updatedAt: timestamp,
  });
}

// ============================================================================
// CAPABILITY COMPUTATION
// ============================================================================

/**
 * Compute capabilities for a principal on an approval
 */
export function getCapabilities(
  instance: ApprovalInstance,
  principalId: string,
  hasViewerRole: boolean = false
): ApprovalCapabilities {
  const context: CapabilityContext = {
    status: instance.status,
    stages: instance.stages,
    principalId: principalId as PrincipalId,
    initiatorId: instance.initiatorId,
    policyAllowsSkip: instance.policyAllowsSkip,
    hasViewerRole,
  };

  return computeCapabilities(context);
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get current stage progress
 */
export function getProgress(instance: ApprovalInstance): StageProgress {
  return calculateStageProgress(instance.stages);
}

/**
 * Get vote summary for the active stage
 */
export function getActiveStageVoteSummary(
  instance: ApprovalInstance
): VoteSummary | undefined {
  const activeStage = getActiveStage(instance.stages);
  if (!activeStage) return undefined;

  return countVotes(activeStage.votes, activeStage.approvers);
}

/**
 * Get all votes across all stages
 */
export function getAllVotes(instance: ApprovalInstance): readonly Vote[] {
  return instance.stages.flatMap((stage) => stage.votes);
}

/**
 * Check if a principal has voted on the current stage
 */
export function hasPrincipalVotedOnCurrentStage(
  instance: ApprovalInstance,
  principalId: string
): boolean {
  const activeStage = getActiveStage(instance.stages);
  if (!activeStage) return false;

  return activeStage.votes.some(
    (v) => v.principalId === principalId
  );
}

// ============================================================================
// POLICY EVALUATION
// ============================================================================

/**
 * Determine if approval is required based on policies and context
 */
export function requiresApproval(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): boolean {
  return isApprovalRequired(policies, context);
}

/**
 * Get matching policies for a context
 */
export function getMatchingPolicies(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): readonly ApprovalPolicy[] {
  return findMatchingPolicies(policies, context);
}

/**
 * Get required stages for a context
 */
export function getRequiredStages(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): EngineResult<readonly StageTemplate[]> {
  return determineRequiredStages(policies, context);
}
