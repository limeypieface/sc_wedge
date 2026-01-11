/**
 * Shared Approval Workflow Types
 *
 * Type definitions for the multi-level approval system.
 * Used by both Purchase Orders and Sales Orders.
 *
 * Workflow Overview:
 * 1. User makes changes to order (creates draft revision)
 * 2. If changes exceed threshold, revision requires approval
 * 3. Approval chain is created based on configured approvers
 * 4. Each approver reviews and approves/rejects
 * 5. Once approved, revision can be sent to external party
 */

// ============================================================================
// USER & APPROVER TYPES
// ============================================================================

/**
 * Current user in the system
 *
 * Used for permission checks and audit trails.
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Whether this user can approve revisions */
  isApprover: boolean;
  /** Approval level (if approver) - higher = more authority */
  approverLevel?: number;
}

/**
 * Approver configuration
 *
 * Defines who can approve at each level of the approval chain.
 */
export interface Approver {
  id: string;
  name: string;
  role: string;
  email: string;
  /** Approval level (1 = first approver, 2 = second, etc.) */
  level: number;
}

// ============================================================================
// APPROVAL CHAIN TYPES
// ============================================================================

/**
 * Individual step in the approval chain
 */
export interface ApprovalStep {
  id: string;
  /** Level in the chain (1-based) */
  level: number;
  /** Assigned approver */
  approver: Approver;
  /** Current status of this step */
  status: "pending" | "approved" | "rejected" | "skipped";
  /** Action taken (if any) */
  action?: "approve" | "reject" | "request_changes";
  /** Notes provided by approver */
  notes?: string;
  /** When action was taken */
  actionDate?: string;
  /** Who took the action */
  actionBy?: string;
}

/**
 * Complete approval chain for a revision
 *
 * Tracks all approval steps and current progress.
 */
export interface ApprovalChain {
  id: string;
  /** ID of the revision being approved */
  revisionId: string;
  /** All steps in the chain */
  steps: ApprovalStep[];
  /** Current level awaiting approval */
  currentLevel: number;
  /** Whether all approvals are complete */
  isComplete: boolean;
  /** When approval process started */
  startedAt: string;
  /** When approval process completed */
  completedAt?: string;
  /** Final outcome */
  outcome?: "approved" | "rejected";
}

// ============================================================================
// APPROVAL CYCLE (HISTORY TRACKING)
// ============================================================================

/**
 * Outcome of an approval cycle
 */
export type ApprovalCycleOutcome =
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";

/**
 * A single submission → review cycle
 *
 * Tracks one iteration of the approval process, preserving history
 * when revisions are resubmitted after feedback.
 */
export interface ApprovalCycle {
  id: string;
  cycleNumber: number;
  submittedAt: string;
  submittedBy: string;
  submissionNotes?: string;
  reviewedBy?: string;
  reviewerRole?: string;
  reviewedAt?: string;
  outcome: ApprovalCycleOutcome;
  feedback?: string;
  resolution?: string;
}

// ============================================================================
// THRESHOLD CONFIGURATION
// ============================================================================

/**
 * Approval threshold configuration
 *
 * Defines when changes require approval based on cost impact.
 *
 * @example
 * // Either 5% OR $500 triggers approval
 * {
 *   percentageThreshold: 0.05,  // 5% (as decimal)
 *   absoluteThreshold: 500,     // $500
 *   mode: 'OR'
 * }
 */
export interface ApprovalConfig {
  /** Percentage change that triggers approval (0.05 = 5%) */
  percentageThreshold: number;

  /** Absolute dollar change that triggers approval */
  absoluteThreshold: number;

  /**
   * How thresholds are evaluated:
   * - 'OR': Either threshold triggers approval
   * - 'AND': Both thresholds must be exceeded
   */
  mode: "OR" | "AND";
}

/**
 * Default approval configuration
 */
export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  percentageThreshold: 0.05, // 5%
  absoluteThreshold: 500, // $500
  mode: "OR",
};

// ============================================================================
// COST DELTA TRACKING
// ============================================================================

/**
 * Information about cost changes in a revision
 *
 * Used to determine if approval is required and display variance info.
 */
export interface CostDeltaInfo {
  /** Original cost (from active revision) */
  originalCost: number;

  /** New cost (in draft revision) */
  newCost: number;

  /** Absolute difference */
  delta: number;

  /** Percentage change (as decimal, e.g., 0.05 = 5%) */
  percentChange: number;

  /** Whether this exceeds the approval threshold */
  exceedsThreshold: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate cost delta between original and new costs
 *
 * @param originalCost - Cost from active/acknowledged revision
 * @param newCost - Cost in draft revision
 * @param config - Approval threshold configuration
 * @returns Cost delta information
 */
export function calculateCostDelta(
  originalCost: number,
  newCost: number,
  config: ApprovalConfig = DEFAULT_APPROVAL_CONFIG
): CostDeltaInfo {
  const delta = newCost - originalCost;
  const percentChange = originalCost > 0 ? delta / originalCost : 0;

  const exceedsPercentage =
    Math.abs(percentChange) >= config.percentageThreshold;
  const exceedsAbsolute = Math.abs(delta) >= config.absoluteThreshold;

  const exceedsThreshold =
    config.mode === "OR"
      ? exceedsPercentage || exceedsAbsolute
      : exceedsPercentage && exceedsAbsolute;

  return {
    originalCost,
    newCost,
    delta,
    percentChange,
    exceedsThreshold,
  };
}

/**
 * Create a new approval chain for a revision
 *
 * @param revisionId - ID of the revision needing approval
 * @param approvers - List of configured approvers
 * @returns New approval chain
 */
export function createApprovalChain(
  revisionId: string,
  approvers: Approver[]
): ApprovalChain {
  // Sort approvers by level
  const sortedApprovers = [...approvers].sort((a, b) => a.level - b.level);

  const steps: ApprovalStep[] = sortedApprovers.map((approver) => ({
    id: `step-${approver.id}-${Date.now()}`,
    level: approver.level,
    approver,
    status: "pending",
  }));

  return {
    id: `chain-${revisionId}-${Date.now()}`,
    revisionId,
    steps,
    currentLevel: steps[0]?.level || 1,
    isComplete: false,
    startedAt: new Date().toISOString(),
  };
}
