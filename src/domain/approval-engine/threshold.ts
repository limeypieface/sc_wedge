/**
 * Approval Engine - Threshold Evaluation Module
 *
 * Pure functions for evaluating numeric thresholds.
 * Used by policies to determine approval requirements based on values.
 *
 * Design principles:
 * - All functions are pure and deterministic
 * - Thresholds are composable and chainable
 * - Support for various threshold types (fixed, percentage, tiered)
 */

import { EngineResult, success, failure } from "./types";

// ============================================================================
// THRESHOLD TYPES
// ============================================================================

/**
 * A threshold configuration
 */
export interface Threshold {
  /** Type of threshold */
  readonly type: ThresholdType;
  /** Primary value for comparison */
  readonly value: number;
  /** Secondary value (for range thresholds) */
  readonly upperValue?: number;
}

export type ThresholdType =
  | "fixed" // Exact amount
  | "minimum" // At least this amount
  | "maximum" // At most this amount
  | "range" // Between two values
  | "percentage"; // Percentage of a base

/**
 * Configuration for tiered thresholds
 */
export interface ThresholdTier {
  /** Lower bound (inclusive) */
  readonly from: number;
  /** Upper bound (exclusive, infinity if omitted) */
  readonly to?: number;
  /** What this tier requires */
  readonly requirement: string;
}

// ============================================================================
// THRESHOLD EVALUATION
// ============================================================================

/**
 * Check if a value meets a threshold
 */
export function meetsThreshold(value: number, threshold: Threshold): boolean {
  switch (threshold.type) {
    case "fixed":
      return value === threshold.value;

    case "minimum":
      return value >= threshold.value;

    case "maximum":
      return value <= threshold.value;

    case "range":
      return (
        value >= threshold.value &&
        (threshold.upperValue === undefined || value < threshold.upperValue)
      );

    case "percentage":
      // For percentage, we'd need a base value
      // This is handled separately
      return false;

    default:
      return false;
  }
}

/**
 * Check if a value exceeds a threshold
 */
export function exceedsThreshold(value: number, threshold: Threshold): boolean {
  switch (threshold.type) {
    case "fixed":
      return value > threshold.value;

    case "minimum":
      return false; // Can't exceed a minimum

    case "maximum":
      return value > threshold.value;

    case "range":
      return threshold.upperValue !== undefined && value >= threshold.upperValue;

    default:
      return false;
  }
}

/**
 * Calculate what percentage a value is of a base
 */
export function calculatePercentage(value: number, base: number): number {
  if (base === 0) return 0;
  return (value / base) * 100;
}

/**
 * Check if a value represents a percentage exceeding a threshold
 */
export function percentageExceedsThreshold(
  value: number,
  base: number,
  thresholdPercent: number
): boolean {
  const actualPercent = calculatePercentage(value, base);
  return actualPercent > thresholdPercent;
}

// ============================================================================
// TIERED THRESHOLDS
// ============================================================================

/**
 * Find which tier a value falls into
 */
export function findTier(
  value: number,
  tiers: readonly ThresholdTier[]
): ThresholdTier | undefined {
  // Sort tiers by 'from' value descending
  const sortedTiers = [...tiers].sort((a, b) => b.from - a.from);

  for (const tier of sortedTiers) {
    if (value >= tier.from) {
      if (tier.to === undefined || value < tier.to) {
        return tier;
      }
    }
  }

  return undefined;
}

/**
 * Get the requirement for a value based on tiered thresholds
 */
export function getTierRequirement(
  value: number,
  tiers: readonly ThresholdTier[]
): EngineResult<string> {
  const tier = findTier(value, tiers);

  if (!tier) {
    return failure("NO_TIER", `No tier found for value ${value}`);
  }

  return success(tier.requirement);
}

// ============================================================================
// DELTA CALCULATIONS
// ============================================================================

/**
 * Calculate the absolute delta between two values
 */
export function calculateAbsoluteDelta(
  original: number,
  current: number
): number {
  return current - original;
}

/**
 * Calculate the percentage delta between two values
 */
export function calculatePercentageDelta(
  original: number,
  current: number
): number {
  if (original === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - original) / Math.abs(original)) * 100;
}

/**
 * Check if a delta exceeds configured thresholds
 */
export function deltaExceedsThreshold(
  original: number,
  current: number,
  absoluteThreshold?: number,
  percentageThreshold?: number
): boolean {
  const absoluteDelta = Math.abs(calculateAbsoluteDelta(original, current));
  const percentageDelta = Math.abs(
    calculatePercentageDelta(original, current)
  );

  if (absoluteThreshold !== undefined && absoluteDelta > absoluteThreshold) {
    return true;
  }

  if (
    percentageThreshold !== undefined &&
    percentageDelta > percentageThreshold
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// THRESHOLD BUILDERS (for convenience)
// ============================================================================

/**
 * Create a fixed threshold
 */
export function fixedThreshold(value: number): Threshold {
  return { type: "fixed", value };
}

/**
 * Create a minimum threshold
 */
export function minimumThreshold(value: number): Threshold {
  return { type: "minimum", value };
}

/**
 * Create a maximum threshold
 */
export function maximumThreshold(value: number): Threshold {
  return { type: "maximum", value };
}

/**
 * Create a range threshold
 */
export function rangeThreshold(from: number, to: number): Threshold {
  return { type: "range", value: from, upperValue: to };
}

/**
 * Create common approval tiers
 */
export function createApprovalTiers(): readonly ThresholdTier[] {
  return [
    { from: 0, to: 1000, requirement: "auto_approve" },
    { from: 1000, to: 5000, requirement: "manager_approval" },
    { from: 5000, to: 25000, requirement: "director_approval" },
    { from: 25000, to: 100000, requirement: "vp_approval" },
    { from: 100000, requirement: "executive_approval" },
  ];
}
