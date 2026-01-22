/**
 * Approval Engine - Public API
 *
 * This module re-exports all public types and functions from the approval engine.
 * Import from this file for a clean, stable API surface.
 *
 * Usage:
 *   import { createApproval, ApprovalInstance, ApprovalCapabilities } from '@/domain/approval-engine';
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Identity
  EntityId,
  PrincipalId,
  ISOTimestamp,

  // Lifecycle
  ApprovalStatus,
  PendingReason,

  // Stages
  ApprovalStage,
  StageStatus,
  VotingRule,
  VotingRuleType,
  StageTemplate,

  // Votes
  Vote,
  VoteDecision,

  // Policies
  ApprovalPolicy,
  PolicyPredicate,
  PredicateType,
  ComparisonOperator,
  ApproverSelector,
  ApproverSelectorType,

  // Capabilities
  ApprovalCapabilities,

  // Context
  ApprovalContext,

  // Audit
  AuditEntry,
  AuditAction,

  // Results
  EngineResult,
  EngineError,
} from "./types";

export {
  // Factory functions
  entityId,
  principalId,
  isoTimestamp,

  // Result helpers
  success,
  failure,

  // Constants
  NO_CAPABILITIES,
} from "./types";

// ============================================================================
// ENGINE
// ============================================================================

export type { ApprovalInstance } from "./engine";

export {
  // Core operations
  createApproval,
  submitApproval,
  recordVote,
  cancelApproval,
  skipApprovalProcess,
  expireApproval,

  // Capability computation
  getCapabilities,

  // Query operations
  getProgress,
  getActiveStageVoteSummary,
  getAllVotes,
  hasPrincipalVotedOnCurrentStage,

  // Policy evaluation
  requiresApproval,
  getMatchingPolicies,
  getRequiredStages,
} from "./engine";

// ============================================================================
// POLICY
// ============================================================================

export {
  evaluatePredicate,
  evaluatePolicy,
  findMatchingPolicies,
  findBestMatchingPolicy,
  determineRequiredStages,
  isApprovalRequired,
  canSkipApproval,
} from "./policy";

// ============================================================================
// THRESHOLD
// ============================================================================

export type { Threshold, ThresholdType, ThresholdTier } from "./threshold";

export {
  meetsThreshold,
  exceedsThreshold,
  calculatePercentage,
  percentageExceedsThreshold,
  findTier,
  getTierRequirement,
  calculateAbsoluteDelta,
  calculatePercentageDelta,
  deltaExceedsThreshold,

  // Builders
  fixedThreshold,
  minimumThreshold,
  maximumThreshold,
  rangeThreshold,
  createApprovalTiers,
} from "./threshold";

// ============================================================================
// VOTING
// ============================================================================

export type { VoteSummary, VotingOutcome } from "./voting";

export {
  countVotes,
  getPrincipalVote,
  hasVoted,
  evaluateVotingOutcome,
  canPrincipalVote,
  remainingApprovalsNeeded,

  // Builders
  unanimousRule,
  anyRule,
  majorityRule,
  thresholdRule,
  percentageRule,
} from "./voting";

// ============================================================================
// STAGES
// ============================================================================

export type { StageProgress } from "./stages";

export {
  createStagesFromTemplates,
  createStage,
  getActiveStage,
  getStageById,
  getNextPendingStage,
  getCompletedStages,
  areAllStagesComplete,
  hasRejectedStage,
  allStagesApproved,
  addVoteToStage,
  updateStageStatus,
  evaluateStageOutcome,
  processVote,
  advanceToNextStage,
  skipStage,
  rejectStage,
  calculateStageProgress,
} from "./stages";

// ============================================================================
// CAPABILITIES
// ============================================================================

export type { CapabilityContext } from "./capabilities";

export {
  computeCapabilities,
  hasAnyAction,
  canVote,
  getAvailableActions,
  getDenialReason,
  mergeCapabilities,
  restrictCapabilities,
} from "./capabilities";
