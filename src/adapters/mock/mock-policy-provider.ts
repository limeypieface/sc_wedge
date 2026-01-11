/**
 * Mock Policy Provider
 *
 * In-memory implementation of PolicyProvider for development and testing.
 * Provides sample policies for PO revision approvals.
 *
 * Design principles:
 * - Policies mirror expected Sindri configuration
 * - Supports common approval patterns
 * - Easy to extend with new policies
 */

import {
  ApprovalPolicy,
  EntityId,
  PrincipalId,
  StageTemplate,
  ApproverSelector,
  entityId,
  principalId,
} from "../../domain/approval-engine";
import { anyRule, thresholdRule, unanimousRule } from "../../domain/approval-engine";
import {
  PolicyProvider,
  ApproverResolver,
  ApproverResolutionContext,
} from "../../application/ports/policy-provider.port";

// ============================================================================
// SAMPLE APPROVERS
// ============================================================================

export const SAMPLE_APPROVERS = {
  manager: principalId("manager-001"),
  director: principalId("director-001"),
  vp: principalId("vp-001"),
  cfo: principalId("cfo-001"),
  procurement: principalId("procurement-001"),
  finance: principalId("finance-001"),
} as const;

// ============================================================================
// SAMPLE POLICIES
// ============================================================================

/**
 * Create sample policies for PO revision approvals
 */
export function createSamplePolicies(): readonly ApprovalPolicy[] {
  return [
    // High-value PO changes require multiple approvals
    {
      id: entityId("policy-high-value"),
      name: "High Value Changes",
      priority: 100,
      predicates: [
        {
          type: "threshold",
          metric: "totalCostChange",
          operator: "gte",
          value: 50000,
        },
      ],
      predicateLogic: "all",
      requiredStages: [
        createStageTemplate("Manager Review", ["manager"], anyRule()),
        createStageTemplate("Director Approval", ["director"], anyRule()),
        createStageTemplate("Executive Approval", ["vp", "cfo"], thresholdRule(1)),
      ],
      skippable: false,
    },

    // Medium-value changes require manager + director
    {
      id: entityId("policy-medium-value"),
      name: "Medium Value Changes",
      priority: 80,
      predicates: [
        {
          type: "threshold",
          metric: "totalCostChange",
          operator: "gte",
          value: 10000,
        },
        {
          type: "threshold",
          metric: "totalCostChange",
          operator: "lt",
          value: 50000,
        },
      ],
      predicateLogic: "all",
      requiredStages: [
        createStageTemplate("Manager Review", ["manager"], anyRule()),
        createStageTemplate("Director Approval", ["director"], anyRule()),
      ],
      skippable: false,
    },

    // Large percentage changes require extra scrutiny
    {
      id: entityId("policy-large-percentage"),
      name: "Large Percentage Changes",
      priority: 90,
      predicates: [
        {
          type: "threshold",
          metric: "percentageChange",
          operator: "gte",
          value: 20,
        },
      ],
      predicateLogic: "all",
      requiredStages: [
        createStageTemplate("Manager Review", ["manager"], anyRule()),
        createStageTemplate("Finance Review", ["finance"], anyRule()),
      ],
      skippable: false,
    },

    // Line item changes over a threshold
    {
      id: entityId("policy-line-changes"),
      name: "Significant Line Item Changes",
      priority: 70,
      predicates: [
        {
          type: "threshold",
          metric: "changedLineItems",
          operator: "gte",
          value: 5,
        },
      ],
      predicateLogic: "all",
      requiredStages: [
        createStageTemplate("Procurement Review", ["procurement"], anyRule()),
        createStageTemplate("Manager Approval", ["manager"], anyRule()),
      ],
      skippable: true,
    },

    // Standard changes - just manager approval
    {
      id: entityId("policy-standard"),
      name: "Standard Changes",
      priority: 10,
      predicates: [
        {
          type: "threshold",
          metric: "totalCostChange",
          operator: "gt",
          value: 0,
        },
      ],
      predicateLogic: "all",
      requiredStages: [
        createStageTemplate("Manager Approval", ["manager"], anyRule()),
      ],
      skippable: true,
    },

    // No approval needed for zero-cost changes
    {
      id: entityId("policy-no-cost"),
      name: "No Cost Impact",
      priority: 50,
      predicates: [
        {
          type: "equality",
          metric: "totalCostChange",
          operator: "eq",
          value: 0,
        },
      ],
      predicateLogic: "all",
      requiredStages: [],
      skippable: true,
    },
  ];
}

/**
 * Helper to create a stage template
 */
function createStageTemplate(
  name: string,
  approverRoles: string[],
  votingRule: ReturnType<typeof anyRule>
): StageTemplate {
  return {
    name,
    approverSelector: {
      type: "role",
      config: { roles: approverRoles },
    },
    votingRule,
  };
}

// ============================================================================
// MOCK POLICY PROVIDER
// ============================================================================

/**
 * Create a mock policy provider with sample policies
 */
export function createMockPolicyProvider(
  policies?: readonly ApprovalPolicy[]
): PolicyProvider {
  const allPolicies = policies ?? createSamplePolicies();

  return {
    async getAllPolicies(): Promise<readonly ApprovalPolicy[]> {
      return allPolicies;
    },

    async getPolicyById(id: EntityId): Promise<ApprovalPolicy | undefined> {
      return allPolicies.find((p) => p.id === id);
    },

    async getPoliciesForEntityType(
      _entityType: string
    ): Promise<readonly ApprovalPolicy[]> {
      // In a real implementation, policies would be filtered by entity type
      return allPolicies;
    },
  };
}

// ============================================================================
// MOCK APPROVER RESOLVER
// ============================================================================

/**
 * Create a mock approver resolver
 */
export function createMockApproverResolver(): ApproverResolver {
  // Role to approver mapping
  const roleMapping: Record<string, PrincipalId[]> = {
    manager: [SAMPLE_APPROVERS.manager],
    director: [SAMPLE_APPROVERS.director],
    vp: [SAMPLE_APPROVERS.vp],
    cfo: [SAMPLE_APPROVERS.cfo],
    procurement: [SAMPLE_APPROVERS.procurement],
    finance: [SAMPLE_APPROVERS.finance],
  };

  return {
    async resolve(
      selector: ApproverSelector,
      _context: ApproverResolutionContext
    ): Promise<readonly PrincipalId[]> {
      switch (selector.type) {
        case "explicit": {
          const approvers = selector.config["approvers"];
          if (!Array.isArray(approvers)) return [];
          return approvers as PrincipalId[];
        }

        case "role": {
          const roles = selector.config["roles"];
          if (!Array.isArray(roles)) return [];

          const approvers: PrincipalId[] = [];
          for (const role of roles) {
            const mapped = roleMapping[role as string];
            if (mapped) {
              approvers.push(...mapped);
            }
          }
          return approvers;
        }

        case "hierarchy": {
          // For mock, just return manager
          return [SAMPLE_APPROVERS.manager];
        }

        case "dynamic": {
          // For mock, return based on config
          const dynamicApprovers = selector.config["approvers"];
          if (!Array.isArray(dynamicApprovers)) return [];
          return dynamicApprovers as PrincipalId[];
        }

        default:
          return [];
      }
    },

    async matches(
      principalId: PrincipalId,
      selector: ApproverSelector,
      context: ApproverResolutionContext
    ): Promise<boolean> {
      const approvers = await this.resolve(selector, context);
      return approvers.includes(principalId);
    },
  };
}
