/**
 * Approval Engine - Policy Evaluation Module
 *
 * Pure functions for evaluating approval policies against contexts.
 * Determines which policies apply and what stages they require.
 *
 * Design principles:
 * - All functions are pure (no side effects)
 * - Policies are evaluated in priority order
 * - Predicates are composable building blocks
 */

import {
  ApprovalPolicy,
  PolicyPredicate,
  ApprovalContext,
  StageTemplate,
  ComparisonOperator,
  EngineResult,
  success,
  failure,
} from "./types";

// ============================================================================
// PREDICATE EVALUATION
// ============================================================================

/**
 * Evaluate a single predicate against a context
 */
export function evaluatePredicate(
  predicate: PolicyPredicate,
  context: ApprovalContext
): boolean {
  const metricValue = context.metrics[predicate.metric];

  // Handle missing metrics
  if (metricValue === undefined) {
    // "presence" predicates check if a value exists
    if (predicate.type === "presence") {
      return predicate.operator === "neq"; // neq undefined = not present
    }
    return false;
  }

  switch (predicate.type) {
    case "threshold":
      return evaluateThresholdPredicate(
        metricValue as number,
        predicate.operator,
        predicate.value as number
      );

    case "equality":
      return evaluateEqualityPredicate(
        metricValue,
        predicate.operator,
        predicate.value
      );

    case "presence":
      return evaluatePresencePredicate(metricValue, predicate.operator);

    case "membership":
      return evaluateMembershipPredicate(
        metricValue,
        predicate.operator,
        predicate.value
      );

    default:
      return false;
  }
}

/**
 * Evaluate numeric threshold comparison
 */
function evaluateThresholdPredicate(
  actual: number,
  operator: ComparisonOperator,
  expected: number
): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return actual > expected;
    case "gte":
      return actual >= expected;
    case "lt":
      return actual < expected;
    case "lte":
      return actual <= expected;
    default:
      return false;
  }
}

/**
 * Evaluate equality comparison
 */
function evaluateEqualityPredicate(
  actual: number | string | boolean,
  operator: ComparisonOperator,
  expected: number | string | boolean
): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    default:
      return false;
  }
}

/**
 * Evaluate presence check
 */
function evaluatePresencePredicate(
  value: number | string | boolean,
  operator: ComparisonOperator
): boolean {
  const exists = value !== null && value !== undefined && value !== "";
  switch (operator) {
    case "eq":
      return exists;
    case "neq":
      return !exists;
    default:
      return false;
  }
}

/**
 * Evaluate set membership
 */
function evaluateMembershipPredicate(
  actual: number | string | boolean,
  operator: ComparisonOperator,
  expected: number | string | boolean
): boolean {
  // Expected is typically a string that we parse as a set
  const expectedSet = String(expected).split(",").map((s) => s.trim());

  switch (operator) {
    case "contains":
      return expectedSet.includes(String(actual));
    case "not_contains":
      return !expectedSet.includes(String(actual));
    default:
      return false;
  }
}

// ============================================================================
// POLICY MATCHING
// ============================================================================

/**
 * Evaluate all predicates for a policy
 */
export function evaluatePolicy(
  policy: ApprovalPolicy,
  context: ApprovalContext
): boolean {
  if (policy.predicates.length === 0) {
    // No predicates = policy always matches
    return true;
  }

  const results = policy.predicates.map((predicate) =>
    evaluatePredicate(predicate, context)
  );

  return policy.predicateLogic === "all"
    ? results.every(Boolean)
    : results.some(Boolean);
}

/**
 * Find all policies that match a context, sorted by priority
 */
export function findMatchingPolicies(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): readonly ApprovalPolicy[] {
  return [...policies]
    .filter((policy) => evaluatePolicy(policy, context))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get the highest-priority matching policy
 */
export function findBestMatchingPolicy(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): ApprovalPolicy | undefined {
  const matches = findMatchingPolicies(policies, context);
  return matches[0];
}

// ============================================================================
// STAGE REQUIREMENTS
// ============================================================================

/**
 * Determine required stages based on matching policies
 */
export function determineRequiredStages(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): EngineResult<readonly StageTemplate[]> {
  const matchingPolicies = findMatchingPolicies(policies, context);

  if (matchingPolicies.length === 0) {
    // No matching policies = no approval required
    return success([]);
  }

  // Use the highest-priority policy's stages
  const bestPolicy = matchingPolicies[0];

  if (bestPolicy.requiredStages.length === 0) {
    return failure("NO_STAGES", "Policy has no required stages defined");
  }

  return success(bestPolicy.requiredStages);
}

/**
 * Check if approval is required for a given context
 */
export function isApprovalRequired(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): boolean {
  const result = determineRequiredStages(policies, context);
  return result.success && result.value.length > 0;
}

/**
 * Check if approval can be skipped for a given context
 */
export function canSkipApproval(
  policies: readonly ApprovalPolicy[],
  context: ApprovalContext
): boolean {
  const matchingPolicies = findMatchingPolicies(policies, context);

  if (matchingPolicies.length === 0) {
    // No matching policies = no approval needed anyway
    return true;
  }

  // Can only skip if all matching policies are skippable
  return matchingPolicies.every((policy) => policy.skippable);
}
