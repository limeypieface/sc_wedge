/**
 * Financial Engine - Types
 *
 * Pure domain types for financial calculations:
 * - Line item pricing
 * - Charges (freight, handling, etc.)
 * - Discounts (percentage, fixed, tiered)
 * - Taxes (single, compound, jurisdiction-based)
 * - Order totals
 * - Variance detection
 * - Cost delta tracking
 */

import type { EntityId } from "../core/types"

// ============================================================================
// MONETARY VALUE TYPES
// ============================================================================

/**
 * Monetary amount with currency
 */
export interface Money {
  readonly amount: number
  readonly currency: string
}

/**
 * Quantity with unit of measure
 */
export interface Quantity {
  readonly value: number
  readonly unit: string
}

// ============================================================================
// LINE ITEM TYPES
// ============================================================================

/**
 * A line item for financial calculation
 */
export interface FinancialLineItem {
  readonly id: EntityId
  readonly unitPrice: number
  readonly quantity: number
  readonly unit?: string
  readonly extendedPrice?: number
  readonly discount?: Discount
  readonly charges?: readonly Charge[]
  readonly taxRate?: number
  readonly taxable?: boolean
  readonly category?: string
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Result of line-level calculation
 */
export interface LineCalculation {
  readonly lineId: EntityId
  readonly quantity: number
  readonly unitPrice: number
  readonly extendedPrice: number
  readonly discountAmount: number
  readonly chargesAmount: number
  readonly subtotal: number
  readonly taxAmount: number
  readonly lineTotal: number
}

// ============================================================================
// CHARGE TYPES
// ============================================================================

/**
 * Charge type classification
 */
export type ChargeType =
  | "freight"
  | "handling"
  | "insurance"
  | "packaging"
  | "expedite"
  | "customs"
  | "restocking"
  | "setup"
  | "service"
  | "other"

/**
 * How the charge is calculated
 */
export type ChargeCalculation =
  | "fixed"        // Fixed amount
  | "percentage"   // Percentage of base
  | "per_unit"     // Per unit amount
  | "tiered"       // Tiered based on quantity/value

/**
 * What the charge applies to
 */
export type ChargeScope =
  | "header"       // Applies to entire order
  | "line"         // Applies to specific line(s)
  | "category"     // Applies to lines in a category

/**
 * A charge applied to an order or line
 */
export interface Charge {
  readonly id: EntityId
  readonly type: ChargeType
  readonly name: string
  readonly description?: string
  readonly calculation: ChargeCalculation
  readonly value: number
  readonly tiers?: readonly ChargeTier[]
  readonly scope: ChargeScope
  readonly appliesTo?: readonly EntityId[]
  readonly category?: string
  readonly taxable?: boolean
  readonly vendor?: string
  readonly calculatedAmount?: number
}

/**
 * Tier for tiered charge calculation
 */
export interface ChargeTier {
  readonly minQuantity?: number
  readonly maxQuantity?: number
  readonly minValue?: number
  readonly maxValue?: number
  readonly rate: number
}

// ============================================================================
// DISCOUNT TYPES
// ============================================================================

/**
 * Discount type classification
 */
export type DiscountType =
  | "percentage"   // Percentage off
  | "fixed"        // Fixed amount off
  | "volume"       // Volume-based tiered discount
  | "promotional"  // Promotional/coupon discount

/**
 * What the discount applies to
 */
export type DiscountScope =
  | "order"        // Applies to entire order
  | "line"         // Applies to specific line(s)
  | "category"     // Applies to lines in a category
  | "subtotal"     // Applies to subtotal before charges

/**
 * A discount applied to an order or line
 */
export interface Discount {
  readonly id: EntityId
  readonly type: DiscountType
  readonly name: string
  readonly description?: string
  readonly value: number
  readonly tiers?: readonly DiscountTier[]
  readonly scope: DiscountScope
  readonly appliesTo?: readonly EntityId[]
  readonly category?: string
  readonly promoCode?: string
  readonly expiresAt?: Date
  readonly maxAmount?: number
  readonly minOrderValue?: number
  readonly calculatedAmount?: number
}

/**
 * Tier for volume discount calculation
 */
export interface DiscountTier {
  readonly minQuantity?: number
  readonly maxQuantity?: number
  readonly minValue?: number
  readonly maxValue?: number
  readonly rate: number
}

// ============================================================================
// TAX TYPES
// ============================================================================

/**
 * Tax rule for a jurisdiction or category
 */
export interface TaxRule {
  readonly id: EntityId
  readonly name: string
  readonly rate: number
  readonly jurisdiction?: string
  readonly categories?: readonly string[]
  readonly compound?: boolean
  readonly order?: number
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  readonly ruleId: EntityId
  readonly ruleName: string
  readonly rate: number
  readonly taxableAmount: number
  readonly taxAmount: number
}

// ============================================================================
// ORDER TOTALS TYPES
// ============================================================================

/**
 * Input for order total calculation
 */
export interface OrderTotalsInput {
  readonly lines: readonly FinancialLineItem[]
  readonly charges?: readonly Charge[]
  readonly discounts?: readonly Discount[]
  readonly taxRules?: readonly TaxRule[]
  readonly defaultTaxRate?: number
  readonly currency?: string
}

/**
 * Complete order totals calculation result
 */
export interface OrderTotals {
  readonly linesSubtotal: number
  readonly lineCalculations: readonly LineCalculation[]
  readonly totalDiscounts: number
  readonly discountBreakdown: readonly DiscountBreakdownItem[]
  readonly subtotalAfterDiscounts: number
  readonly totalCharges: number
  readonly chargeBreakdown: readonly ChargeBreakdownItem[]
  readonly subtotalBeforeTax: number
  readonly totalTax: number
  readonly taxBreakdown: readonly TaxCalculation[]
  readonly grandTotal: number
  readonly currency: string
  readonly calculatedAt: Date
}

/**
 * Discount breakdown item
 */
export interface DiscountBreakdownItem {
  readonly id: EntityId
  readonly name: string
  readonly amount: number
  readonly scope: DiscountScope
}

/**
 * Charge breakdown item
 */
export interface ChargeBreakdownItem {
  readonly id: EntityId
  readonly name: string
  readonly type: ChargeType
  readonly amount: number
  readonly taxable: boolean
}

// ============================================================================
// VARIANCE & MATCHING TYPES
// ============================================================================

/**
 * Variance between expected and actual amounts
 */
export interface FinancialVariance {
  readonly field: string
  readonly expected: number
  readonly actual: number
  readonly variance: number
  readonly variancePercent: number
  readonly withinTolerance: boolean
}

/**
 * Result of financial matching
 */
export interface MatchResult {
  readonly matched: boolean
  readonly variances: readonly FinancialVariance[]
  readonly totalVariance: number
  readonly totalVariancePercent: number
}

/**
 * Tolerance configuration for matching
 */
export interface MatchTolerance {
  readonly absoluteTolerance: number
  readonly percentTolerance: number
  readonly mode: "OR" | "AND"
}

// ============================================================================
// COST DELTA TYPES
// ============================================================================

/**
 * Result of cost delta calculation
 */
export interface CostDelta {
  readonly originalTotal: number
  readonly currentTotal: number
  readonly delta: number
  readonly percentChange: number
  readonly exceedsThreshold: boolean
  readonly exceedsPercentThreshold: boolean
  readonly exceedsAbsoluteThreshold: boolean
}

/**
 * Threshold configuration for approval triggers
 */
export interface CostThreshold {
  readonly percentThreshold: number
  readonly absoluteThreshold: number
  readonly mode: "OR" | "AND"
}

// ============================================================================
// POLICY TYPES
// ============================================================================

/**
 * Rounding policy for financial calculations
 */
export interface RoundingPolicy {
  readonly currencyDecimals: number
  readonly roundingMode: "half_up" | "half_down" | "half_even" | "floor" | "ceiling"
}

/**
 * Tax policy configuration
 */
export interface TaxPolicy {
  readonly defaultRate: number
  readonly rules: readonly TaxRule[]
  readonly applyToCharges: boolean
  readonly compoundTaxes: boolean
}
