/**
 * Financial Engine - Policies
 *
 * Configurable policies for financial calculations.
 * Policies centralize thresholds, rules, and business logic.
 */

import type { TaxRule, MatchTolerance, CostThreshold, RoundingPolicy, TaxPolicy } from "./types"

// ============================================================================
// DEFAULT POLICIES
// ============================================================================

/**
 * Default rounding policy (standard currency)
 */
export const DEFAULT_ROUNDING_POLICY: RoundingPolicy = {
  currencyDecimals: 2,
  roundingMode: "half_up",
}

/**
 * Default match tolerance (2% or $5)
 */
export const DEFAULT_MATCH_TOLERANCE: MatchTolerance = {
  absoluteTolerance: 5.00,
  percentTolerance: 0.02,
  mode: "OR",
}

/**
 * Strict match tolerance (exact match)
 */
export const STRICT_MATCH_TOLERANCE: MatchTolerance = {
  absoluteTolerance: 0.01,
  percentTolerance: 0.0001,
  mode: "AND",
}

/**
 * Default cost threshold for approval triggers
 */
export const DEFAULT_COST_THRESHOLD: CostThreshold = {
  percentThreshold: 0.05,      // 5%
  absoluteThreshold: 1000.00,  // $1,000
  mode: "OR",
}

/**
 * High value cost threshold
 */
export const HIGH_VALUE_COST_THRESHOLD: CostThreshold = {
  percentThreshold: 0.10,      // 10%
  absoluteThreshold: 10000.00, // $10,000
  mode: "AND",
}

// ============================================================================
// TAX POLICIES
// ============================================================================

/**
 * Default US tax policy (standard state tax)
 */
export const DEFAULT_US_TAX_POLICY: TaxPolicy = {
  defaultRate: 0.0825,  // 8.25%
  rules: [],
  applyToCharges: false,
  compoundTaxes: false,
}

/**
 * Create a simple tax policy with single rate
 */
export function createSimpleTaxPolicy(rate: number): TaxPolicy {
  return {
    defaultRate: rate,
    rules: [],
    applyToCharges: false,
    compoundTaxes: false,
  }
}

/**
 * Create a compound tax policy (e.g., GST + PST)
 */
export function createCompoundTaxPolicy(rules: TaxRule[]): TaxPolicy {
  return {
    defaultRate: 0,
    rules: rules.map((rule, index) => ({
      ...rule,
      compound: index > 0,
      order: index,
    })),
    applyToCharges: true,
    compoundTaxes: true,
  }
}

// ============================================================================
// POLICY BUILDERS
// ============================================================================

/**
 * Create match tolerance with custom values
 */
export function createMatchTolerance(
  absoluteTolerance: number,
  percentTolerance: number,
  mode: "OR" | "AND" = "OR"
): MatchTolerance {
  return {
    absoluteTolerance,
    percentTolerance,
    mode,
  }
}

/**
 * Create cost threshold with custom values
 */
export function createCostThreshold(
  percentThreshold: number,
  absoluteThreshold: number,
  mode: "OR" | "AND" = "OR"
): CostThreshold {
  return {
    percentThreshold,
    absoluteThreshold,
    mode,
  }
}

// ============================================================================
// POLICY PRESETS BY DOMAIN
// ============================================================================

/**
 * Purchase Order financial policies
 */
export const PO_POLICIES = {
  matchTolerance: DEFAULT_MATCH_TOLERANCE,
  costThreshold: DEFAULT_COST_THRESHOLD,
  taxPolicy: DEFAULT_US_TAX_POLICY,
  rounding: DEFAULT_ROUNDING_POLICY,
} as const

/**
 * Sales Order financial policies
 */
export const SO_POLICIES = {
  matchTolerance: createMatchTolerance(1.00, 0.01, "OR"),
  costThreshold: createCostThreshold(0.03, 500.00, "OR"),
  taxPolicy: DEFAULT_US_TAX_POLICY,
  rounding: DEFAULT_ROUNDING_POLICY,
} as const

/**
 * Invoice matching policies
 */
export const INVOICE_POLICIES = {
  twoWayMatch: createMatchTolerance(5.00, 0.02, "OR"),
  threeWayMatch: createMatchTolerance(1.00, 0.005, "AND"),
  taxPolicy: DEFAULT_US_TAX_POLICY,
  rounding: DEFAULT_ROUNDING_POLICY,
} as const
