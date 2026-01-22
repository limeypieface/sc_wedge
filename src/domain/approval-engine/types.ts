/**
 * Approval Engine - Core Domain Types
 *
 * These types define the vocabulary of the approval domain.
 * They are completely target-agnostic - the engine doesn't know
 * if it's approving a PO revision, expense report, or any other entity.
 *
 * Design principles:
 * - All types are immutable value objects
 * - No framework, UI, or infrastructure dependencies
 * - Can be serialized/deserialized without loss
 */

// ============================================================================
// IDENTITY TYPES
// ============================================================================

/**
 * Unique identifier for any entity in the system.
 * Opaque string to prevent implicit coupling to ID format.
 */
export type EntityId = string & { readonly __brand: "EntityId" };

/**
 * Create a branded EntityId from a string
 */
export function entityId(id: string): EntityId {
  return id as EntityId;
}

/**
 * Identifier for a principal (user, system, or service)
 */
export type PrincipalId = string & { readonly __brand: "PrincipalId" };

export function principalId(id: string): PrincipalId {
  return id as PrincipalId;
}

// ============================================================================
// APPROVAL LIFECYCLE
// ============================================================================

/**
 * The lifecycle stages an approval can be in.
 *
 * State machine:
 *   PENDING → APPROVED
 *           → REJECTED
 *           → EXPIRED (time-based)
 *           → CANCELLED (by initiator)
 */
export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

/**
 * Reasons an approval can be pending
 */
export type PendingReason =
  | "awaiting_submission"
  | "awaiting_approval"
  | "awaiting_next_stage";

// ============================================================================
// STAGE TYPES
// ============================================================================

/**
 * A stage in a multi-stage approval process.
 *
 * Stages are processed sequentially. Each stage must complete
 * before the next begins.
 */
export interface ApprovalStage {
  /** Unique identifier for this stage */
  readonly id: EntityId;

  /** Sequence number (1-based) */
  readonly sequence: number;

  /** Human-readable name */
  readonly name: string;

  /** Principals who can approve at this stage */
  readonly approvers: readonly PrincipalId[];

  /** Voting semantics for this stage */
  readonly votingRule: VotingRule;

  /** Current status of this stage */
  readonly status: StageStatus;

  /** Votes recorded at this stage */
  readonly votes: readonly Vote[];
}

/**
 * Status of an individual stage
 */
export type StageStatus =
  | "pending"      // Not yet reached
  | "active"       // Currently awaiting votes
  | "approved"     // Stage passed
  | "rejected"     // Stage failed
  | "skipped";     // Bypassed (e.g., auto-approval)

/**
 * Rules for how votes are counted within a stage
 */
export interface VotingRule {
  /** Type of voting semantics */
  readonly type: VotingRuleType;

  /** Minimum approvals required (for threshold type) */
  readonly minApprovals?: number;

  /** Minimum percentage required (for percentage type) */
  readonly minPercentage?: number;
}

export type VotingRuleType =
  | "unanimous"      // All must approve
  | "any"            // Any single approval
  | "majority"       // >50% must approve
  | "threshold"      // Specific count required
  | "percentage";    // Specific percentage required

// ============================================================================
// VOTE TYPES
// ============================================================================

/**
 * A single vote in the approval process.
 * Immutable record of a principal's decision.
 */
export interface Vote {
  /** Unique identifier for this vote */
  readonly id: EntityId;

  /** Who cast this vote */
  readonly principalId: PrincipalId;

  /** The decision */
  readonly decision: VoteDecision;

  /** Optional explanation */
  readonly reason?: string;

  /** When the vote was cast */
  readonly timestamp: ISOTimestamp;

  /** Stage this vote belongs to */
  readonly stageId: EntityId;
}

export type VoteDecision =
  | "approve"
  | "reject"
  | "abstain"
  | "request_changes";

// ============================================================================
// POLICY TYPES
// ============================================================================

/**
 * A policy that determines if approval is required.
 *
 * Policies are evaluated against a context to determine:
 * 1. Whether approval is required
 * 2. What stages are needed
 * 3. Which approvers are required
 */
export interface ApprovalPolicy {
  /** Unique identifier */
  readonly id: EntityId;

  /** Human-readable name */
  readonly name: string;

  /** Priority (higher = evaluated first) */
  readonly priority: number;

  /** Conditions that trigger this policy */
  readonly predicates: readonly PolicyPredicate[];

  /** How predicates are combined */
  readonly predicateLogic: "all" | "any";

  /** Stages required when policy matches */
  readonly requiredStages: readonly StageTemplate[];

  /** Whether this policy can be skipped */
  readonly skippable: boolean;
}

/**
 * A condition that can be evaluated against approval context
 */
export interface PolicyPredicate {
  /** Type of predicate */
  readonly type: PredicateType;

  /** The metric to evaluate */
  readonly metric: string;

  /** Comparison operator */
  readonly operator: ComparisonOperator;

  /** Value to compare against */
  readonly value: number | string | boolean;
}

export type PredicateType =
  | "threshold"      // Numeric comparison
  | "presence"       // Field exists
  | "equality"       // Exact match
  | "membership";    // In a set

export type ComparisonOperator =
  | "eq" | "neq"                    // Equality
  | "gt" | "gte" | "lt" | "lte"     // Numeric
  | "contains" | "not_contains";    // Set membership

/**
 * Template for creating a stage
 */
export interface StageTemplate {
  /** Stage name */
  readonly name: string;

  /** How to determine approvers */
  readonly approverSelector: ApproverSelector;

  /** Voting rule for this stage */
  readonly votingRule: VotingRule;
}

/**
 * Strategy for selecting approvers
 */
export interface ApproverSelector {
  readonly type: ApproverSelectorType;
  readonly config: Record<string, unknown>;
}

export type ApproverSelectorType =
  | "explicit"         // Specific principals
  | "role"             // By role
  | "hierarchy"        // Organizational hierarchy
  | "dynamic";         // Runtime computation

// ============================================================================
// CAPABILITY TYPES
// ============================================================================

/**
 * Capabilities that a principal has for an approval.
 *
 * These are computed outputs from the domain engine,
 * consumed by UI and application layers.
 */
export interface ApprovalCapabilities {
  /** Can this principal submit for approval? */
  readonly canSubmit: boolean;

  /** Can this principal approve at the current stage? */
  readonly canApprove: boolean;

  /** Can this principal reject at the current stage? */
  readonly canReject: boolean;

  /** Can this principal request changes? */
  readonly canRequestChanges: boolean;

  /** Can this principal cancel the approval? */
  readonly canCancel: boolean;

  /** Can this principal view the approval? */
  readonly canView: boolean;

  /** Can this principal skip approval (if policy allows)? */
  readonly canSkip: boolean;

  /** Reasons for any denied capabilities */
  readonly denialReasons: Readonly<Record<string, string>>;
}

/**
 * Default capabilities (all denied)
 */
export const NO_CAPABILITIES: ApprovalCapabilities = {
  canSubmit: false,
  canApprove: false,
  canReject: false,
  canRequestChanges: false,
  canCancel: false,
  canView: false,
  canSkip: false,
  denialReasons: {},
};

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Context provided to the approval engine for evaluation.
 *
 * This is the input data used to:
 * - Match policies
 * - Evaluate thresholds
 * - Determine required approvers
 */
export interface ApprovalContext {
  /** Metrics that can be evaluated by predicates */
  readonly metrics: Readonly<Record<string, number | string | boolean>>;

  /** The principal requesting the action */
  readonly requestingPrincipal: PrincipalId;

  /** Current timestamp (for expiration checks) */
  readonly currentTime: ISOTimestamp;

  /** Any additional context-specific data */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

/**
 * A record of an action taken on an approval.
 * Immutable and append-only.
 */
export interface AuditEntry {
  /** Unique identifier */
  readonly id: EntityId;

  /** What happened */
  readonly action: AuditAction;

  /** Who did it */
  readonly principalId: PrincipalId;

  /** When it happened */
  readonly timestamp: ISOTimestamp;

  /** State before the action */
  readonly previousState?: ApprovalStatus;

  /** State after the action */
  readonly newState?: ApprovalStatus;

  /** Additional details */
  readonly details?: Readonly<Record<string, unknown>>;
}

export type AuditAction =
  | "created"
  | "submitted"
  | "voted"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"
  | "stage_advanced"
  | "stage_completed"
  | "skipped";

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * ISO 8601 timestamp string
 */
export type ISOTimestamp = string & { readonly __brand: "ISOTimestamp" };

export function isoTimestamp(date: Date = new Date()): ISOTimestamp {
  return date.toISOString() as ISOTimestamp;
}

/**
 * Result of an engine operation
 */
export type EngineResult<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: EngineError };

export interface EngineError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export function success<T>(value: T): EngineResult<T> {
  return { success: true, value };
}

export function failure<T>(code: string, message: string): EngineResult<T> {
  return { success: false, error: { code, message } };
}
