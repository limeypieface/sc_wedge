/**
 * Financial Calculation Engine
 *
 * Pure, deterministic financial calculations.
 * No side effects, no UI dependencies, fully testable.
 *
 * Features:
 * - Line item extended price calculation
 * - Hierarchical charge calculation (header, line, category)
 * - Multi-tier discount calculation
 * - Tax calculation with multiple rules
 * - Variance detection for invoice matching
 */

import type {
  FinancialLineItem,
  LineCalculation,
  Charge,
  ChargeCalculation,
  Discount,
  DiscountType,
  TaxRule,
  TaxCalculation,
  OrderTotalsInput,
  OrderTotals,
  FinancialVariance,
  MatchResult,
  MatchTolerance,
} from "./types"

export * from "./types"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round to 2 decimal places (currency precision)
 */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Calculate percentage of a value
 */
function calculatePercentage(base: number, rate: number): number {
  return roundCurrency(base * rate)
}

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
      // Volume discounts typically apply at order level
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
 * Calculate line-level charges
 */
export function calculateLineCharges(
  line: FinancialLineItem,
  charges: Charge[] = []
): number {
  return charges.reduce((total, charge) => {
    const amount = calculateChargeAmount(charge, line.extendedPrice || 0, line.quantity)
    return total + amount
  }, 0)
}

/**
 * Calculate a single charge amount
 */
export function calculateChargeAmount(
  charge: Charge,
  baseAmount: number,
  quantity: number = 1
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

  // Find applicable tier based on quantity or value
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
 * Calculate complete line financial details
 */
export function calculateLine(
  line: FinancialLineItem,
  charges: Charge[] = [],
  defaultTaxRate: number = 0
): LineCalculation {
  const extendedPrice = calculateExtendedPrice(line.unitPrice, line.quantity)
  const discountAmount = calculateLineDiscount(extendedPrice, line.discount)

  // Filter charges that apply to this line
  const lineCharges = charges.filter(
    (c) => c.scope === "line" && c.appliesTo?.includes(line.id)
  )
  const chargesAmount = calculateLineCharges(
    { ...line, extendedPrice },
    lineCharges
  )

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
  discounts: Discount[],
  linesSubtotal: number,
  lineCalculations: LineCalculation[]
): { total: number; breakdown: OrderTotals["discountBreakdown"] } {
  const breakdown: OrderTotals["discountBreakdown"] = []
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

      case "line":
        // Line-level discounts already calculated
        const applicableLines = lineCalculations.filter(
          (lc) => discount.appliesTo?.includes(lc.lineId)
        )
        amount = applicableLines.reduce((sum, lc) => sum + lc.discountAmount, 0)
        break

      case "category":
        // Would need category info on lines to calculate
        break
    }

    // Apply maximum cap if specified
    if (discount.maxAmount && amount > discount.maxAmount) {
      amount = discount.maxAmount
    }

    // Check minimum order value
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
  charges: Charge[],
  subtotal: number,
  totalQuantity: number
): { total: number; breakdown: OrderTotals["chargeBreakdown"] } {
  const breakdown: OrderTotals["chargeBreakdown"] = []
  let total = 0

  for (const charge of charges) {
    // Only calculate header-level charges here (line charges done per-line)
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
  taxRules: TaxRule[],
  defaultRate?: number
): { total: number; breakdown: TaxCalculation[] } {
  const breakdown: TaxCalculation[] = []
  let total = 0
  let runningBase = taxableAmount

  // Sort by order for compound taxes
  const sortedRules = [...taxRules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  if (sortedRules.length === 0 && defaultRate !== undefined) {
    // Use default rate
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
 * It's a pure function with no side effects.
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

  // Calculate each line
  const lineCalculations = lines.map((line) =>
    calculateLine(line, charges, defaultTaxRate)
  )

  // Sum line totals (before tax - tax calculated at order level for simplicity)
  const linesSubtotal = roundCurrency(
    lineCalculations.reduce((sum, lc) => sum + lc.extendedPrice, 0)
  )

  // Calculate order-level discounts
  const discountResult = calculateOrderDiscounts(discounts, linesSubtotal, lineCalculations)
  const subtotalAfterDiscounts = roundCurrency(linesSubtotal - discountResult.total)

  // Calculate order-level charges
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0)
  const chargeResult = calculateOrderCharges(charges, subtotalAfterDiscounts, totalQuantity)

  // Add line-level charges
  const lineLevelCharges = roundCurrency(
    lineCalculations.reduce((sum, lc) => sum + lc.chargesAmount, 0)
  )
  const totalCharges = roundCurrency(chargeResult.total + lineLevelCharges)

  // Subtotal before tax
  const subtotalBeforeTax = roundCurrency(subtotalAfterDiscounts + totalCharges)

  // Calculate taxable amount (consider taxable charges)
  const taxableCharges = chargeResult.breakdown
    .filter((c) => c.taxable)
    .reduce((sum, c) => sum + c.amount, 0)
  const taxableAmount = roundCurrency(subtotalAfterDiscounts + taxableCharges)

  // Calculate taxes
  const taxResult = calculateTaxes(taxableAmount, taxRules, defaultTaxRate)

  // Grand total
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

  // Compare key fields
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
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
  decimals: number = 2,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate)
}

/**
 * Calculate cost delta and determine if approval is required
 */
export function calculateCostDelta(
  originalTotal: number,
  currentTotal: number,
  thresholdPercent: number,
  thresholdAbsolute: number,
  mode: "OR" | "AND" = "OR"
): {
  delta: number
  percentChange: number
  exceedsThreshold: boolean
  exceedsPercentThreshold: boolean
  exceedsAbsoluteThreshold: boolean
} {
  const delta = roundCurrency(currentTotal - originalTotal)
  const percentChange = originalTotal !== 0 ? Math.abs(delta / originalTotal) : 0

  const exceedsPercentThreshold = percentChange > thresholdPercent
  const exceedsAbsoluteThreshold = Math.abs(delta) > thresholdAbsolute

  const exceedsThreshold = mode === "OR"
    ? exceedsPercentThreshold || exceedsAbsoluteThreshold
    : exceedsPercentThreshold && exceedsAbsoluteThreshold

  return {
    delta,
    percentChange,
    exceedsThreshold,
    exceedsPercentThreshold,
    exceedsAbsoluteThreshold,
  }
}
