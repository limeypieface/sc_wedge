/**
 * Approval Engine - Voting Semantics Module
 *
 * Pure functions for evaluating votes and determining outcomes.
 * Supports various voting rules: unanimous, any, majority, threshold, percentage.
 *
 * Design principles:
 * - All functions are pure and deterministic
 * - Voting rules are composable
 * - Clear separation between vote counting and outcome determination
 */

import {
  Vote,
  VoteDecision,
  VotingRule,
  VotingRuleType,
  PrincipalId,
  EngineResult,
  success,
  failure,
} from "./types";

// ============================================================================
// VOTE COUNTING
// ============================================================================

/**
 * Summary of votes in a stage
 */
export interface VoteSummary {
  /** Total votes cast */
  readonly totalVotes: number;
  /** Total eligible voters */
  readonly totalVoters: number;
  /** Approval votes */
  readonly approvals: number;
  /** Rejection votes */
  readonly rejections: number;
  /** Abstentions */
  readonly abstentions: number;
  /** Change requests */
  readonly changeRequests: number;
  /** Voters who have voted */
  readonly votedPrincipals: readonly PrincipalId[];
  /** Voters who haven't voted yet */
  readonly pendingPrincipals: readonly PrincipalId[];
}

/**
 * Count votes and summarize
 */
export function countVotes(
  votes: readonly Vote[],
  eligibleVoters: readonly PrincipalId[]
): VoteSummary {
  const votedPrincipals = votes.map((v) => v.principalId);
  const pendingPrincipals = eligibleVoters.filter(
    (p) => !votedPrincipals.includes(p)
  );

  return {
    totalVotes: votes.length,
    totalVoters: eligibleVoters.length,
    approvals: votes.filter((v) => v.decision === "approve").length,
    rejections: votes.filter((v) => v.decision === "reject").length,
    abstentions: votes.filter((v) => v.decision === "abstain").length,
    changeRequests: votes.filter((v) => v.decision === "request_changes")
      .length,
    votedPrincipals,
    pendingPrincipals,
  };
}

/**
 * Get a principal's vote from a list
 */
export function getPrincipalVote(
  votes: readonly Vote[],
  principalId: PrincipalId
): Vote | undefined {
  return votes.find((v) => v.principalId === principalId);
}

/**
 * Check if a principal has voted
 */
export function hasVoted(
  votes: readonly Vote[],
  principalId: PrincipalId
): boolean {
  return getPrincipalVote(votes, principalId) !== undefined;
}

// ============================================================================
// VOTING OUTCOME
// ============================================================================

/**
 * Possible outcomes of vote evaluation
 */
export type VotingOutcome =
  | "approved" // Sufficient approvals
  | "rejected" // Sufficient rejections
  | "pending" // More votes needed
  | "blocked"; // Changes requested, cannot proceed

/**
 * Evaluate voting outcome based on rule
 */
export function evaluateVotingOutcome(
  votes: readonly Vote[],
  eligibleVoters: readonly PrincipalId[],
  rule: VotingRule
): VotingOutcome {
  const summary = countVotes(votes, eligibleVoters);

  // Any rejection immediately rejects (for most rule types)
  if (summary.rejections > 0 && rule.type !== "majority") {
    return "rejected";
  }

  // Any change request blocks progress
  if (summary.changeRequests > 0) {
    return "blocked";
  }

  switch (rule.type) {
    case "unanimous":
      return evaluateUnanimous(summary);

    case "any":
      return evaluateAny(summary);

    case "majority":
      return evaluateMajority(summary);

    case "threshold":
      return evaluateThreshold(summary, rule.minApprovals ?? 1);

    case "percentage":
      return evaluatePercentage(summary, rule.minPercentage ?? 50);

    default:
      return "pending";
  }
}

/**
 * Unanimous: All must approve
 */
function evaluateUnanimous(summary: VoteSummary): VotingOutcome {
  if (summary.rejections > 0) {
    return "rejected";
  }
  if (summary.approvals === summary.totalVoters) {
    return "approved";
  }
  return "pending";
}

/**
 * Any: Single approval is sufficient
 */
function evaluateAny(summary: VoteSummary): VotingOutcome {
  if (summary.rejections > 0) {
    return "rejected";
  }
  if (summary.approvals >= 1) {
    return "approved";
  }
  return "pending";
}

/**
 * Majority: >50% must approve
 */
function evaluateMajority(summary: VoteSummary): VotingOutcome {
  const nonAbstaining = summary.totalVoters - summary.abstentions;
  const majority = Math.floor(nonAbstaining / 2) + 1;

  if (summary.rejections >= majority) {
    return "rejected";
  }
  if (summary.approvals >= majority) {
    return "approved";
  }
  return "pending";
}

/**
 * Threshold: Specific count required
 */
function evaluateThreshold(
  summary: VoteSummary,
  minApprovals: number
): VotingOutcome {
  if (summary.rejections > 0) {
    return "rejected";
  }
  if (summary.approvals >= minApprovals) {
    return "approved";
  }
  return "pending";
}

/**
 * Percentage: Specific percentage required
 */
function evaluatePercentage(
  summary: VoteSummary,
  minPercentage: number
): VotingOutcome {
  const actualPercentage = (summary.approvals / summary.totalVoters) * 100;
  const rejectionPercentage = (summary.rejections / summary.totalVoters) * 100;

  // If rejections make approval impossible
  if (100 - rejectionPercentage < minPercentage) {
    return "rejected";
  }

  if (actualPercentage >= minPercentage) {
    return "approved";
  }
  return "pending";
}

// ============================================================================
// VOTING RULE BUILDERS
// ============================================================================

/**
 * Create a unanimous voting rule
 */
export function unanimousRule(): VotingRule {
  return { type: "unanimous" };
}

/**
 * Create an "any single approval" rule
 */
export function anyRule(): VotingRule {
  return { type: "any" };
}

/**
 * Create a majority voting rule
 */
export function majorityRule(): VotingRule {
  return { type: "majority" };
}

/**
 * Create a threshold voting rule
 */
export function thresholdRule(minApprovals: number): VotingRule {
  return { type: "threshold", minApprovals };
}

/**
 * Create a percentage voting rule
 */
export function percentageRule(minPercentage: number): VotingRule {
  return { type: "percentage", minPercentage };
}

// ============================================================================
// VOTE VALIDATION
// ============================================================================

/**
 * Validate that a principal can vote
 */
export function canPrincipalVote(
  principalId: PrincipalId,
  eligibleVoters: readonly PrincipalId[],
  existingVotes: readonly Vote[]
): EngineResult<true> {
  if (!eligibleVoters.includes(principalId)) {
    return failure(
      "NOT_ELIGIBLE",
      "Principal is not an eligible voter for this stage"
    );
  }

  if (hasVoted(existingVotes, principalId)) {
    return failure("ALREADY_VOTED", "Principal has already voted on this stage");
  }

  return success(true);
}

/**
 * Get remaining approvals needed
 */
export function remainingApprovalsNeeded(
  votes: readonly Vote[],
  eligibleVoters: readonly PrincipalId[],
  rule: VotingRule
): number {
  const summary = countVotes(votes, eligibleVoters);

  switch (rule.type) {
    case "unanimous":
      return summary.totalVoters - summary.approvals;

    case "any":
      return summary.approvals >= 1 ? 0 : 1;

    case "majority": {
      const nonAbstaining = summary.totalVoters - summary.abstentions;
      const majority = Math.floor(nonAbstaining / 2) + 1;
      return Math.max(0, majority - summary.approvals);
    }

    case "threshold":
      return Math.max(0, (rule.minApprovals ?? 1) - summary.approvals);

    case "percentage": {
      const needed = Math.ceil(
        summary.totalVoters * ((rule.minPercentage ?? 50) / 100)
      );
      return Math.max(0, needed - summary.approvals);
    }

    default:
      return 0;
  }
}
