/**
 * Policy Provider Port
 *
 * Defines the interface for retrieving and managing approval policies.
 * Policies determine what approvals are required and how they're structured.
 *
 * Design principles:
 * - Policies are configuration, not business logic
 * - Provider interface is simple and focused
 * - Supports both static and dynamic policy sources
 */

import {
  ApprovalPolicy,
  ApprovalContext,
  EntityId,
  PrincipalId,
  StageTemplate,
  ApproverSelector,
  EngineResult,
} from "../../domain/approval-engine";

// ============================================================================
// POLICY PROVIDER INTERFACE
// ============================================================================

/**
 * Provider for approval policies
 */
export interface PolicyProvider {
  /**
   * Get all active policies
   */
  getAllPolicies(): Promise<readonly ApprovalPolicy[]>;

  /**
   * Get a specific policy by ID
   */
  getPolicyById(id: EntityId): Promise<ApprovalPolicy | undefined>;

  /**
   * Get policies applicable to a specific entity type
   */
  getPoliciesForEntityType(entityType: string): Promise<readonly ApprovalPolicy[]>;

  /**
   * Refresh policies from source (for dynamic policies)
   */
  refresh?(): Promise<void>;
}

// ============================================================================
// APPROVER RESOLVER INTERFACE
// ============================================================================

/**
 * Context for resolving approvers
 */
export interface ApproverResolutionContext {
  /** The principal requesting approval */
  readonly requestingPrincipal: PrincipalId;
  /** Entity type being approved */
  readonly entityType: string;
  /** Additional context for resolution */
  readonly metadata: Record<string, unknown>;
}

/**
 * Resolves approver selectors to actual principal IDs
 */
export interface ApproverResolver {
  /**
   * Resolve a selector to a list of approvers
   */
  resolve(
    selector: ApproverSelector,
    context: ApproverResolutionContext
  ): Promise<readonly PrincipalId[]>;

  /**
   * Check if a principal matches a selector
   */
  matches(
    principalId: PrincipalId,
    selector: ApproverSelector,
    context: ApproverResolutionContext
  ): Promise<boolean>;
}

// ============================================================================
// POLICY EVALUATION SERVICE
// ============================================================================

/**
 * Result of policy evaluation
 */
export interface PolicyEvaluationResult {
  /** Whether approval is required */
  readonly requiresApproval: boolean;
  /** The matched policy (if any) */
  readonly matchedPolicy?: ApprovalPolicy;
  /** Required stages with resolved approvers */
  readonly resolvedStages?: readonly ResolvedStage[];
  /** Whether the approval can be skipped */
  readonly canSkip: boolean;
}

/**
 * A stage with resolved approver IDs
 */
export interface ResolvedStage extends StageTemplate {
  /** Resolved approver principal IDs */
  readonly resolvedApprovers: readonly PrincipalId[];
}

/**
 * Service for evaluating policies
 * Combines PolicyProvider and ApproverResolver
 */
export interface PolicyEvaluationService {
  /**
   * Evaluate whether approval is required for a context
   */
  evaluate(
    context: ApprovalContext,
    entityType: string,
    approverContext: ApproverResolutionContext
  ): Promise<PolicyEvaluationResult>;
}

// ============================================================================
// STATIC POLICY PROVIDER
// ============================================================================

/**
 * Create a simple static policy provider from a list of policies
 */
export function createStaticPolicyProvider(
  policies: readonly ApprovalPolicy[]
): PolicyProvider {
  return {
    async getAllPolicies() {
      return policies;
    },

    async getPolicyById(id: EntityId) {
      return policies.find((p) => p.id === id);
    },

    async getPoliciesForEntityType(_entityType: string) {
      // Static provider returns all policies
      // Filter by entity type would require metadata on policies
      return policies;
    },
  };
}

// ============================================================================
// EXPLICIT APPROVER RESOLVER
// ============================================================================

/**
 * Create a resolver for explicit approver selectors
 */
export function createExplicitApproverResolver(): ApproverResolver {
  return {
    async resolve(selector: ApproverSelector, _context: ApproverResolutionContext) {
      if (selector.type !== "explicit") {
        return [];
      }

      const approvers = selector.config["approvers"];
      if (!Array.isArray(approvers)) {
        return [];
      }

      return approvers as readonly PrincipalId[];
    },

    async matches(
      principalId: PrincipalId,
      selector: ApproverSelector,
      context: ApproverResolutionContext
    ) {
      const approvers = await this.resolve(selector, context);
      return approvers.includes(principalId);
    },
  };
}
