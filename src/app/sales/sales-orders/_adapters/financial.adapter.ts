/**
 * Financial Adapter for Sales Orders
 *
 * Maps Sales Order data to the Financial Engine inputs and outputs.
 * Handles discount calculations, margin tracking, and order totals.
 */

import type { SalesOrder, SalesOrderLine, PricingSummary } from "../_lib/types";
import { calculateOrderTotals, calculateCostDelta, type CostDelta } from "@/domain/order-core";

// =============================================================================
// LINE ITEM CALCULATIONS
// =============================================================================

/**
 * Calculate a Sales Order line item with all derived values.
 */
export function calculateSalesOrderLine(
  line: Omit<SalesOrderLine, "lineTotal" | "netPrice" | "discountAmount">,
  taxRate: number = 0
): SalesOrderLine {
  const discountAmount = Math.round(line.listPrice * line.quantity * (line.discountPercent / 100) * 100) / 100;
  const netPrice = Math.round((line.listPrice * (1 - line.discountPercent / 100)) * 100) / 100;
  const lineTotal = Math.round(netPrice * line.quantity * 100) / 100;
  const taxAmount = Math.round(lineTotal * taxRate * 100) / 100;

  return {
    ...line,
    netPrice,
    discountAmount,
    lineTotal,
    taxAmount,
    unitPrice: netPrice, // unitPrice is the net price in SO context
  } as SalesOrderLine;
}

// =============================================================================
// PRICING SUMMARY
// =============================================================================

/**
 * Calculate pricing summary for a Sales Order.
 */
export function calculatePricingSummary(lines: readonly SalesOrderLine[]): PricingSummary {
  const listTotal = lines.reduce((sum, line) => sum + (line.listPrice * line.quantity), 0);
  const discountTotal = lines.reduce((sum, line) => sum + line.discountAmount, 0);
  const netTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const discountPercent = listTotal > 0
    ? Math.round((discountTotal / listTotal) * 10000) / 100
    : 0;

  return {
    listTotal: Math.round(listTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    discountPercent,
    netTotal: Math.round(netTotal * 100) / 100,
    marginTotal: undefined, // Would require cost data
    marginPercent: undefined,
  };
}

// =============================================================================
// ORDER TOTALS
// =============================================================================

/**
 * Full order totals including shipping and taxes.
 */
export interface SalesOrderTotals {
  readonly lineCount: number;
  readonly totalQuantity: number;
  readonly listTotal: number;
  readonly discountTotal: number;
  readonly subtotal: number;
  readonly shippingTotal: number;
  readonly taxTotal: number;
  readonly grandTotal: number;
}

/**
 * Calculate complete Sales Order totals.
 */
export function calculateSalesOrderTotals(
  lines: readonly SalesOrderLine[],
  shippingCost: number = 0
): SalesOrderTotals {
  const baseTotals = calculateOrderTotals(lines);
  const pricing = calculatePricingSummary(lines);

  return {
    lineCount: baseTotals.lineCount,
    totalQuantity: baseTotals.totalQuantity,
    listTotal: pricing.listTotal,
    discountTotal: pricing.discountTotal,
    subtotal: baseTotals.subtotal,
    shippingTotal: shippingCost,
    taxTotal: baseTotals.taxTotal,
    grandTotal: baseTotals.subtotal + baseTotals.taxTotal + shippingCost,
  };
}

// =============================================================================
// DISCOUNT APPROVAL
// =============================================================================

/**
 * Information about discount levels requiring approval.
 */
export interface DiscountApprovalInfo {
  readonly totalDiscountPercent: number;
  readonly totalDiscountAmount: number;
  readonly requiresApproval: boolean;
  readonly requiredApprovalLevel: number;
  readonly reason?: string;
}

/**
 * Check if discount levels require approval.
 */
export function checkDiscountApproval(
  pricing: PricingSummary,
  config: {
    percentThreshold: number;
    absoluteThreshold: number;
    mode: "OR" | "AND";
    approvalLevels: readonly { level: number; maxAmount?: number }[];
  }
): DiscountApprovalInfo {
  const exceedsPercent = pricing.discountPercent >= config.percentThreshold * 100;
  const exceedsAbsolute = pricing.discountTotal >= config.absoluteThreshold;

  const requiresApproval = config.mode === "OR"
    ? exceedsPercent || exceedsAbsolute
    : exceedsPercent && exceedsAbsolute;

  // Find required approval level based on discount amount
  let requiredLevel = 0;
  if (requiresApproval) {
    for (const level of config.approvalLevels) {
      if (!level.maxAmount || pricing.discountTotal <= level.maxAmount) {
        requiredLevel = level.level;
        break;
      }
      requiredLevel = level.level;
    }
  }

  const reasons: string[] = [];
  if (exceedsPercent) {
    reasons.push(`Discount ${pricing.discountPercent.toFixed(1)}% exceeds ${(config.percentThreshold * 100).toFixed(0)}% threshold`);
  }
  if (exceedsAbsolute) {
    reasons.push(`Discount $${pricing.discountTotal.toFixed(2)} exceeds $${config.absoluteThreshold.toFixed(2)} threshold`);
  }

  return {
    totalDiscountPercent: pricing.discountPercent,
    totalDiscountAmount: pricing.discountTotal,
    requiresApproval,
    requiredApprovalLevel: requiredLevel,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined,
  };
}

// =============================================================================
// COST DELTA (FOR REVISIONS)
// =============================================================================

/**
 * Calculate cost delta between two order states.
 */
export function calculateOrderDelta(
  previousTotal: number,
  currentTotal: number
): CostDelta {
  return calculateCostDelta(previousTotal, currentTotal);
}

// =============================================================================
// CREDIT CHECK
// =============================================================================

/**
 * Credit check result.
 */
export interface CreditCheckInfo {
  readonly passed: boolean;
  readonly orderTotal: number;
  readonly creditLimit: number;
  readonly currentBalance: number;
  readonly availableCredit: number;
  readonly shortfall: number;
  readonly message: string;
}

/**
 * Check if an order can be approved against customer credit.
 */
export function checkCustomerCredit(
  orderTotal: number,
  credit: {
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
  }
): CreditCheckInfo {
  const wouldExceed = orderTotal > credit.availableCredit;
  const shortfall = wouldExceed ? orderTotal - credit.availableCredit : 0;

  return {
    passed: !wouldExceed,
    orderTotal,
    creditLimit: credit.creditLimit,
    currentBalance: credit.currentBalance,
    availableCredit: credit.availableCredit,
    shortfall,
    message: wouldExceed
      ? `Order exceeds available credit by $${shortfall.toFixed(2)}`
      : `Credit available: $${credit.availableCredit.toFixed(2)}`,
  };
}
