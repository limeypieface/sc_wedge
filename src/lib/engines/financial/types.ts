/**
 * Financial Calculation Engine - Types
 *
 * Pure domain types for financial calculations:
 * - Line item pricing
 * - Charges (freight, handling, etc.)
 * - Discounts (percentage, fixed, tiered)
 * - Taxes
 * - Order totals
 */

// ============================================================================
// CORE VALUE TYPES
// ============================================================================

/**
 * Monetary amount with precision
 */
export interface Money {
  amount: number
  currency: string
}

/**
 * Quantity with unit of measure
 */
export interface Quantity {
  value: number
  unit: string
}

// ============================================================================
// LINE ITEM TYPES
// ============================================================================

/**
 * A line item for financial calculation
 */
export interface FinancialLineItem {
  id: string | number
  /** Unit price */
  unitPrice: number
  /** Quantity ordered */
  quantity: number
  /** Unit of measure (optional) */
  unit?: string
  /** Extended price (quantity * unitPrice) - calculated */
  extendedPrice?: number
  /** Line-level discount (optional) */
  discount?: Discount
  /** Line-level charges (optional) */
  charges?: Charge[]
  /** Line-level tax override (optional) */
  taxRate?: number
  /** Whether line is taxable */
  taxable?: boolean
  /** Metadata for grouping/filtering */
  meta?: Record<string, unknown>
}

/**
 * Result of line-level calculation
 */
export interface LineCalculation {
  lineId: string | number
  quantity: number
  unitPrice: number
  extendedPrice: number
  discountAmount: number
  chargesAmount: number
  subtotal: number
  taxAmount: number
  lineTotal: number
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
  id: string
  type: ChargeType
  name: string
  description?: string
  calculation: ChargeCalculation
  /** For fixed/per_unit: the amount. For percentage: the rate (decimal) */
  value: number
  /** For tiered calculations */
  tiers?: ChargeTier[]
  scope: ChargeScope
  /** Line IDs this charge applies to (for line scope) */
  appliesTo?: (string | number)[]
  /** Category this applies to (for category scope) */
  category?: string
  /** Whether this charge is taxable */
  taxable?: boolean
  /** Vendor/source of this charge */
  vendor?: string
  /** Calculated amount (output) */
  calculatedAmount?: number
}

/**
 * Tier for tiered charge calculation
 */
export interface ChargeTier {
  minQuantity?: number
  maxQuantity?: number
  minValue?: number
  maxValue?: number
  rate: number // Amount or percentage for this tier
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
  id: string
  type: DiscountType
  name: string
  description?: string
  /** For fixed: the amount. For percentage: the rate (decimal, e.g., 0.10 for 10%) */
  value: number
  /** For volume discounts */
  tiers?: DiscountTier[]
  scope: DiscountScope
  /** Line IDs this discount applies to (for line scope) */
  appliesTo?: (string | number)[]
  /** Category this applies to (for category scope) */
  category?: string
  /** Promo code if applicable */
  promoCode?: string
  /** Expiration date */
  expiresAt?: Date
  /** Maximum discount amount (cap) */
  maxAmount?: number
  /** Minimum order value to qualify */
  minOrderValue?: number
  /** Calculated amount (output) */
  calculatedAmount?: number
}

/**
 * Tier for volume discount calculation
 */
export interface DiscountTier {
  minQuantity?: number
  maxQuantity?: number
  minValue?: number
  maxValue?: number
  rate: number // Percentage for this tier (decimal)
}

// ============================================================================
// TAX TYPES
// ============================================================================

/**
 * Tax rule for a jurisdiction or category
 */
export interface TaxRule {
  id: string
  name: string
  /** Tax rate as decimal (e.g., 0.0825 for 8.25%) */
  rate: number
  /** Jurisdiction (state, country, etc.) */
  jurisdiction?: string
  /** Product categories this applies to */
  categories?: string[]
  /** Whether this is compound tax */
  compound?: boolean
  /** Order in which to apply (for compound) */
  order?: number
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  ruleId: string
  ruleName: string
  rate: number
  taxableAmount: number
  taxAmount: number
}

// ============================================================================
// ORDER TOTALS TYPES
// ============================================================================

/**
 * Input for order total calculation
 */
export interface OrderTotalsInput {
  lines: FinancialLineItem[]
  charges?: Charge[]
  discounts?: Discount[]
  taxRules?: TaxRule[]
  /** Default tax rate if no rules provided */
  defaultTaxRate?: number
  /** Currency for the order */
  currency?: string
}

/**
 * Complete order totals calculation result
 */
export interface OrderTotals {
  /** Sum of all line extended prices */
  linesSubtotal: number
  /** Per-line calculation details */
  lineCalculations: LineCalculation[]

  /** Sum of all discounts */
  totalDiscounts: number
  /** Discount breakdown by type */
  discountBreakdown: {
    id: string
    name: string
    amount: number
    scope: DiscountScope
  }[]

  /** Subtotal after discounts (linesSubtotal - totalDiscounts) */
  subtotalAfterDiscounts: number

  /** Sum of all charges */
  totalCharges: number
  /** Charge breakdown by type */
  chargeBreakdown: {
    id: string
    name: string
    type: ChargeType
    amount: number
    taxable: boolean
  }[]

  /** Subtotal before tax */
  subtotalBeforeTax: number

  /** Total tax amount */
  totalTax: number
  /** Tax breakdown by rule */
  taxBreakdown: TaxCalculation[]

  /** Grand total (subtotal + charges + tax) */
  grandTotal: number

  /** Currency */
  currency: string

  /** Calculation timestamp */
  calculatedAt: Date
}

// ============================================================================
// VARIANCE TYPES (for matching invoices, etc.)
// ============================================================================

/**
 * Variance between expected and actual amounts
 */
export interface FinancialVariance {
  field: string
  expected: number
  actual: number
  variance: number
  variancePercent: number
  withinTolerance: boolean
}

/**
 * Result of financial matching
 */
export interface MatchResult {
  matched: boolean
  variances: FinancialVariance[]
  totalVariance: number
  totalVariancePercent: number
}

/**
 * Tolerance configuration for matching
 */
export interface MatchTolerance {
  /** Absolute tolerance amount */
  absoluteTolerance: number
  /** Percentage tolerance (decimal) */
  percentTolerance: number
  /** Use OR (either) or AND (both) */
  mode: "OR" | "AND"
}
