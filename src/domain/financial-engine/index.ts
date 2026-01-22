/**
 * Financial Calculation Engine
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * WHAT THIS ENGINE OWNS:
 * - Line-level price calculations (extended price, discounts, charges, taxes)
 * - Order-level aggregation (subtotals, discounts, charges, taxes)
 * - Tax computation (single rate, hierarchical/compound rates)
 * - Variance detection and tolerance matching
 * - Cost delta calculation for approval triggers
 * - Currency rounding policies
 *
 * WHAT THIS ENGINE REFUSES TO OWN:
 * - Currency conversion (external service responsibility)
 * - Tax jurisdiction resolution (external lookup)
 * - Discount eligibility rules (caller provides applicable discounts)
 * - Persistence of calculations
 * - UI formatting beyond basic currency/percentage strings
 *
 * GUARANTEES:
 * - Determinism: Same inputs always produce same outputs
 * - Auditability: Calculations produce detailed breakdowns
 * - Immutability: All outputs are fresh objects, inputs unchanged
 * - Precision: Currency values rounded to 2 decimal places
 *
 * CALLER MUST PROVIDE:
 * - Line items with unit price and quantity
 * - Applicable charges and discounts
 * - Tax rules or default rate
 * - Tolerance configuration for matching
 * - Threshold configuration for cost delta
 *
 * ============================================================================
 */

export * from "./types"
export * from "./engine"
export * from "./policies"
