/**
 * Order Core - Calculation Utilities
 *
 * Pure functions for order calculations that work with any order type.
 * These are thin wrappers around the Financial Engine, providing
 * order-specific interfaces.
 */

import type { BaseLineItem, BaseOrder, OrderParty } from "./types";

// =============================================================================
// LINE ITEM CALCULATIONS
// =============================================================================

/**
 * Calculate the extended total for a line item (quantity × unit price).
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

/**
 * Calculate tax amount for a line item.
 */
export function calculateLineTax(lineTotal: number, taxRate: number): number {
  return Math.round(lineTotal * taxRate * 100) / 100;
}

/**
 * Calculate line item with derived values.
 */
export function computeLineItem<T extends BaseLineItem>(
  line: Omit<T, "lineTotal" | "taxAmount">,
  taxRate: number = 0
): T {
  const lineTotal = calculateLineTotal(line.quantity, line.unitPrice);
  const taxAmount = calculateLineTax(lineTotal, taxRate);

  return {
    ...line,
    lineTotal,
    taxAmount,
  } as T;
}

// =============================================================================
// ORDER TOTALS
// =============================================================================

/**
 * Summary of order totals.
 */
export interface OrderTotals {
  readonly lineCount: number;
  readonly totalQuantity: number;
  readonly subtotal: number;
  readonly taxTotal: number;
  readonly chargesTotal: number;
  readonly discountsTotal: number;
  readonly grandTotal: number;
}

/**
 * Calculate all totals for an order's line items.
 */
export function calculateOrderTotals<T extends BaseLineItem>(
  lines: readonly T[],
  charges: number = 0,
  discounts: number = 0
): OrderTotals {
  const lineCount = lines.length;
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const taxTotal = lines.reduce((sum, line) => sum + (line.taxAmount ?? 0), 0);
  const chargesTotal = charges;
  const discountsTotal = discounts;
  const grandTotal = subtotal + taxTotal + chargesTotal - discountsTotal;

  return {
    lineCount,
    totalQuantity,
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    chargesTotal: Math.round(chargesTotal * 100) / 100,
    discountsTotal: Math.round(discountsTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

// =============================================================================
// VARIANCE & COMPARISON
// =============================================================================

/**
 * Cost delta between two order states.
 */
export interface CostDelta {
  readonly previousTotal: number;
  readonly currentTotal: number;
  readonly absoluteDelta: number;
  readonly percentDelta: number;
  readonly direction: "increase" | "decrease" | "unchanged";
}

/**
 * Calculate the cost delta between two totals.
 */
export function calculateCostDelta(previousTotal: number, currentTotal: number): CostDelta {
  const absoluteDelta = Math.round((currentTotal - previousTotal) * 100) / 100;
  const percentDelta = previousTotal === 0
    ? (currentTotal === 0 ? 0 : 1)
    : Math.round(((currentTotal - previousTotal) / previousTotal) * 10000) / 10000;

  const direction: CostDelta["direction"] =
    absoluteDelta > 0.001 ? "increase" :
    absoluteDelta < -0.001 ? "decrease" :
    "unchanged";

  return {
    previousTotal,
    currentTotal,
    absoluteDelta,
    percentDelta,
    direction,
  };
}

/**
 * Check if a cost delta exceeds approval thresholds.
 */
export function exceedsThreshold(
  delta: CostDelta,
  percentThreshold: number,
  absoluteThreshold: number,
  mode: "OR" | "AND"
): boolean {
  const exceedsPercent = Math.abs(delta.percentDelta) >= percentThreshold;
  const exceedsAbsolute = Math.abs(delta.absoluteDelta) >= absoluteThreshold;

  return mode === "OR"
    ? exceedsPercent || exceedsAbsolute
    : exceedsPercent && exceedsAbsolute;
}

// =============================================================================
// ORDER NUMBER GENERATION
// =============================================================================

/**
 * Generate a new order number with a prefix.
 *
 * @param prefix - The order type prefix (e.g., "PO", "SO")
 * @param sequence - The sequence number
 * @param options - Formatting options
 */
export function generateOrderNumber(
  prefix: string,
  sequence: number,
  options: {
    padLength?: number;
    separator?: string;
    includeDate?: boolean;
  } = {}
): string {
  const { padLength = 6, separator = "-", includeDate = false } = options;

  const paddedSequence = String(sequence).padStart(padLength, "0");

  if (includeDate) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${prefix}${separator}${year}${month}${separator}${paddedSequence}`;
  }

  return `${prefix}${separator}${paddedSequence}`;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validation result for an order.
 */
export interface OrderValidation {
  readonly isValid: boolean;
  readonly errors: readonly OrderValidationError[];
  readonly warnings: readonly OrderValidationWarning[];
}

export interface OrderValidationError {
  readonly code: string;
  readonly field?: string;
  readonly lineNumber?: number;
  readonly message: string;
}

export interface OrderValidationWarning {
  readonly code: string;
  readonly field?: string;
  readonly lineNumber?: number;
  readonly message: string;
}

/**
 * Validate an order's basic structure.
 */
export function validateOrder<
  P extends OrderParty,
  L extends BaseLineItem,
  S extends string
>(order: BaseOrder<P, L, S>): OrderValidation {
  const errors: OrderValidationError[] = [];
  const warnings: OrderValidationWarning[] = [];

  // Required fields
  if (!order.orderNumber) {
    errors.push({ code: "MISSING_ORDER_NUMBER", message: "Order number is required" });
  }

  if (!order.externalParty?.id) {
    errors.push({
      code: "MISSING_EXTERNAL_PARTY",
      field: "externalParty",
      message: "External party is required",
    });
  }

  // Line items
  if (order.lineItems.length === 0) {
    errors.push({ code: "NO_LINE_ITEMS", message: "At least one line item is required" });
  }

  order.lineItems.forEach((line, index) => {
    if (line.quantity <= 0) {
      errors.push({
        code: "INVALID_QUANTITY",
        lineNumber: index + 1,
        message: `Line ${index + 1}: Quantity must be greater than zero`,
      });
    }

    if (line.unitPrice < 0) {
      errors.push({
        code: "INVALID_PRICE",
        lineNumber: index + 1,
        message: `Line ${index + 1}: Unit price cannot be negative`,
      });
    }

    if (line.unitPrice === 0) {
      warnings.push({
        code: "ZERO_PRICE",
        lineNumber: index + 1,
        message: `Line ${index + 1}: Unit price is zero`,
      });
    }
  });

  // Totals validation
  const expectedTotal = order.subtotal + order.taxTotal + order.chargesTotal - order.discountsTotal;
  if (Math.abs(expectedTotal - order.grandTotal) > 0.01) {
    warnings.push({
      code: "TOTAL_MISMATCH",
      message: "Grand total does not match calculated total",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
