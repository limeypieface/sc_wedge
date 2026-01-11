/**
 * Financial Calculation Engine
 *
 * Pure, deterministic financial calculations.
 * No side effects, no UI dependencies, fully testable.
 */

import { roundCurrency, calculatePercentage } from "../core/utils"
import type {
  FinancialLineItem,
  LineCalculation,
  Charge,
  Discount,
  TaxRule,
  TaxCalculation,
  OrderTotalsInput,
  OrderTotals,
  FinancialVariance,
  MatchResult,
  MatchTolerance,
  CostDelta,
  CostThreshold,
  DiscountBreakdownItem,
  ChargeBreakdownItem,
} from "./types"

// ============================================================================
// LINE CALCULATIONS
// ============================================================================

/**
 * Calculate extended price for a line
 */
export function calculateExtendedPrice(unitPrice: number, quantity: number): number {
  return roundCurrency(unitPrice * quantity)
}

/**
 * Calculate line-level discount
 */
export function calculateLineDiscount(
  extendedPrice: number,
  discount?: Discount
): number {
  if (!discount) return 0

  switch (discount.type) {
    case "percentage":
      return roundCurrency(extendedPrice * discount.value)
    case "fixed":
      return Math.min(discount.value, extendedPrice)
    case "volume":
      return roundCurrency(extendedPrice * discount.value)
    case "promotional":
      return discount.value > 1
        ? Math.min(discount.value, extendedPrice)
        : roundCurrency(extendedPrice * discount.value)
    default:
      return 0
  }
}

/**
 * Calculate a single charge amount
 */
export function calculateChargeAmount(
  charge: Charge,
  baseAmount: number,
  quantity = 1
): number {
  switch (charge.calculation) {
    case "fixed":
      return roundCurrency(charge.value)
    case "percentage":
      return calculatePercentage(baseAmount, charge.value)
    case "per_unit":
      return roundCurrency(charge.value * quantity)
    case "tiered":
      return calculateTieredCharge(charge, baseAmount, quantity)
    default:
      return 0
  }
}

/**
 * Calculate tiered charge
 */
function calculateTieredCharge(
  charge: Charge,
  baseAmount: number,
  quantity: number
): number {
  if (!charge.tiers || charge.tiers.length === 0) return 0

  for (const tier of charge.tiers) {
    const qtyMatch =
      (tier.minQuantity === undefined || quantity >= tier.minQuantity) &&
      (tier.maxQuantity === undefined || quantity <= tier.maxQuantity)
    const valMatch =
      (tier.minValue === undefined || baseAmount >= tier.minValue) &&
      (tier.maxValue === undefined || baseAmount <= tier.maxValue)

    if (qtyMatch && valMatch) {
      return roundCurrency(tier.rate)
    }
  }

  return 0
}

/**
 * Calculate line-level charges
 */
export function calculateLineCharges(
  line: FinancialLineItem,
  charges: readonly Charge[] = []
): number {
  return charges.reduce((total, charge) => {
    const amount = calculateChargeAmount(charge, line.extendedPrice || 0, line.quantity)
    return total + amount
  }, 0)
}

/**
 * Calculate complete line financial details
 */
export function calculateLine(
  line: FinancialLineItem,
  charges: readonly Charge[] = [],
  defaultTaxRate = 0
): LineCalculation {
  const extendedPrice = calculateExtendedPrice(line.unitPrice, line.quantity)
  const discountAmount = calculateLineDiscount(extendedPrice, line.discount)

  const lineCharges = charges.filter(
    (c) => c.scope === "line" && c.appliesTo?.includes(line.id)
  )
  const chargesAmount = calculateLineCharges({ ...line, extendedPrice }, lineCharges)

  const subtotal = roundCurrency(extendedPrice - discountAmount + chargesAmount)

  const taxRate = line.taxRate ?? defaultTaxRate
  const taxable = line.taxable !== false
  const taxAmount = taxable ? calculatePercentage(subtotal, taxRate) : 0

  return {
    lineId: line.id,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    extendedPrice,
    discountAmount,
    chargesAmount,
    subtotal,
    taxAmount,
    lineTotal: roundCurrency(subtotal + taxAmount),
  }
}

// ============================================================================
// ORDER-LEVEL CALCULATIONS
// ============================================================================

/**
 * Calculate all order-level discounts
 */
export function calculateOrderDiscounts(
  discounts: readonly Discount[],
  linesSubtotal: number,
  lineCalculations: readonly LineCalculation[]
): { total: number; breakdown: DiscountBreakdownItem[] } {
  const breakdown: DiscountBreakdownItem[] = []
  let total = 0

  for (const discount of discounts) {
    let amount = 0

    switch (discount.scope) {
      case "order":
      case "subtotal":
        amount = discount.type === "percentage"
          ? calculatePercentage(linesSubtotal, discount.value)
          : Math.min(discount.value, linesSubtotal)
        break

      case "line": {
        const applicableLines = lineCalculations.filter(
          (lc) => discount.appliesTo?.includes(lc.lineId)
        )
        amount = applicableLines.reduce((sum, lc) => sum + lc.discountAmount, 0)
        break
      }

      case "category":
        // Category discounts require line category info
        break
    }

    if (discount.maxAmount && amount > discount.maxAmount) {
      amount = discount.maxAmount
    }

    if (discount.minOrderValue && linesSubtotal < discount.minOrderValue) {
      amount = 0
    }

    breakdown.push({
      id: discount.id,
      name: discount.name,
      amount: roundCurrency(amount),
      scope: discount.scope,
    })
    total += amount
  }

  return { total: roundCurrency(total), breakdown }
}

/**
 * Calculate all order-level charges
 */
export function calculateOrderCharges(
  charges: readonly Charge[],
  subtotal: number,
  totalQuantity: number
): { total: number; breakdown: ChargeBreakdownItem[] } {
  const breakdown: ChargeBreakdownItem[] = []
  let total = 0

  for (const charge of charges) {
    if (charge.scope !== "header") continue

    const amount = calculateChargeAmount(charge, subtotal, totalQuantity)

    breakdown.push({
      id: charge.id,
      name: charge.name,
      type: charge.type,
      amount: roundCurrency(amount),
      taxable: charge.taxable ?? false,
    })
    total += amount
  }

  return { total: roundCurrency(total), breakdown }
}

/**
 * Calculate taxes
 */
export function calculateTaxes(
  taxableAmount: number,
  taxRules: readonly TaxRule[],
  defaultRate?: number
): { total: number; breakdown: TaxCalculation[] } {
  const breakdown: TaxCalculation[] = []
  let total = 0
  let runningBase = taxableAmount

  const sortedRules = [...taxRules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  if (sortedRules.length === 0 && defaultRate !== undefined) {
    const taxAmount = calculatePercentage(taxableAmount, defaultRate)
    breakdown.push({
      ruleId: "default",
      ruleName: "Tax",
      rate: defaultRate,
      taxableAmount,
      taxAmount,
    })
    return { total: taxAmount, breakdown }
  }

  for (const rule of sortedRules) {
    const base = rule.compound ? runningBase : taxableAmount
    const taxAmount = calculatePercentage(base, rule.rate)

    breakdown.push({
      ruleId: rule.id,
      ruleName: rule.name,
      rate: rule.rate,
      taxableAmount: base,
      taxAmount,
    })

    total += taxAmount
    if (rule.compound) {
      runningBase += taxAmount
    }
  }

  return { total: roundCurrency(total), breakdown }
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate complete order totals
 *
 * This is the main entry point for financial calculations.
 * Pure function with no side effects.
 */
export function calculateOrderTotals(input: OrderTotalsInput): OrderTotals {
  const {
    lines,
    charges = [],
    discounts = [],
    taxRules = [],
    defaultTaxRate = 0,
    currency = "USD",
  } = input

  const lineCalculations = lines.map((line) =>
    calculateLine(line, charges, defaultTaxRate)
  )

  const linesSubtotal = roundCurrency(
    lineCalculations.reduce((sum, lc) => sum + lc.extendedPrice, 0)
  )

  const discountResult = calculateOrderDiscounts(discounts, linesSubtotal, lineCalculations)
  const subtotalAfterDiscounts = roundCurrency(linesSubtotal - discountResult.total)

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0)
  const chargeResult = calculateOrderCharges(charges, subtotalAfterDiscounts, totalQuantity)

  const lineLevelCharges = roundCurrency(
    lineCalculations.reduce((sum, lc) => sum + lc.chargesAmount, 0)
  )
  const totalCharges = roundCurrency(chargeResult.total + lineLevelCharges)

  const subtotalBeforeTax = roundCurrency(subtotalAfterDiscounts + totalCharges)

  const taxableCharges = chargeResult.breakdown
    .filter((c) => c.taxable)
    .reduce((sum, c) => sum + c.amount, 0)
  const taxableAmount = roundCurrency(subtotalAfterDiscounts + taxableCharges)

  const taxResult = calculateTaxes(taxableAmount, taxRules, defaultTaxRate)

  const grandTotal = roundCurrency(subtotalBeforeTax + taxResult.total)

  return {
    linesSubtotal,
    lineCalculations,
    totalDiscounts: discountResult.total,
    discountBreakdown: discountResult.breakdown,
    subtotalAfterDiscounts,
    totalCharges,
    chargeBreakdown: chargeResult.breakdown,
    subtotalBeforeTax,
    totalTax: taxResult.total,
    taxBreakdown: taxResult.breakdown,
    grandTotal,
    currency,
    calculatedAt: new Date(),
  }
}

// ============================================================================
// VARIANCE & MATCHING
// ============================================================================

/**
 * Calculate variance between expected and actual values
 */
export function calculateVariance(
  field: string,
  expected: number,
  actual: number,
  tolerance: MatchTolerance
): FinancialVariance {
  const variance = roundCurrency(actual - expected)
  const variancePercent = expected !== 0 ? Math.abs(variance / expected) : 0

  const withinAbsolute = Math.abs(variance) <= tolerance.absoluteTolerance
  const withinPercent = variancePercent <= tolerance.percentTolerance

  const withinTolerance = tolerance.mode === "OR"
    ? withinAbsolute || withinPercent
    : withinAbsolute && withinPercent

  return {
    field,
    expected,
    actual,
    variance,
    variancePercent,
    withinTolerance,
  }
}

/**
 * Match two order totals and identify variances
 */
export function matchOrderTotals(
  expected: OrderTotals,
  actual: Partial<OrderTotals>,
  tolerance: MatchTolerance
): MatchResult {
  const variances: FinancialVariance[] = []

  if (actual.linesSubtotal !== undefined) {
    variances.push(
      calculateVariance("linesSubtotal", expected.linesSubtotal, actual.linesSubtotal, tolerance)
    )
  }
  if (actual.totalCharges !== undefined) {
    variances.push(
      calculateVariance("totalCharges", expected.totalCharges, actual.totalCharges, tolerance)
    )
  }
  if (actual.totalTax !== undefined) {
    variances.push(
      calculateVariance("totalTax", expected.totalTax, actual.totalTax, tolerance)
    )
  }
  if (actual.grandTotal !== undefined) {
    variances.push(
      calculateVariance("grandTotal", expected.grandTotal, actual.grandTotal, tolerance)
    )
  }

  const matched = variances.every((v) => v.withinTolerance)
  const totalVariance = variances.reduce((sum, v) => sum + Math.abs(v.variance), 0)
  const totalVariancePercent = expected.grandTotal !== 0
    ? totalVariance / expected.grandTotal
    : 0

  return {
    matched,
    variances,
    totalVariance,
    totalVariancePercent,
  }
}

// ============================================================================
// COST DELTA
// ============================================================================

/**
 * Calculate cost delta and determine if threshold is exceeded
 */
export function calculateCostDelta(
  originalTotal: number,
  currentTotal: number,
  threshold: CostThreshold
): CostDelta {
  const delta = roundCurrency(currentTotal - originalTotal)
  const percentChange = originalTotal !== 0 ? Math.abs(delta / originalTotal) : 0

  const exceedsPercentThreshold = percentChange > threshold.percentThreshold
  const exceedsAbsoluteThreshold = Math.abs(delta) > threshold.absoluteThreshold

  const exceedsThreshold = threshold.mode === "OR"
    ? exceedsPercentThreshold || exceedsAbsoluteThreshold
    : exceedsPercentThreshold && exceedsAbsoluteThreshold

  return {
    originalTotal,
    currentTotal,
    delta,
    percentChange,
    exceedsThreshold,
    exceedsPercentThreshold,
    exceedsAbsoluteThreshold,
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(
  rate: number,
  decimals = 2,
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate)
}
