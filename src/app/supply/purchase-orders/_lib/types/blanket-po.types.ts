/**
 * Blanket Purchase Order Types
 *
 * Blanket POs (also called contract POs) authorize spending up to
 * a limit over a period of time, with individual releases drawn
 * against the blanket.
 */

import { POHeader, LineItem, POCharge, PODiscount, POTotals, VendorContact } from "./purchase-order.types";

// ============================================================================
// BLANKET PO TERMS
// ============================================================================

/**
 * Terms and limits for a blanket PO
 */
export interface BlanketPOTerms {
  /** When the blanket becomes active */
  effectiveDate: string;

  /** When the blanket expires */
  expirationDate: string;

  /** Total authorized spend amount */
  authorizedTotal: number;

  /** Maximum amount per individual release */
  perReleaseLimit?: number;

  /** Minimum amount per release (if applicable) */
  perReleaseMinimum?: number;

  /** Maximum number of releases allowed */
  maxReleases?: number;

  /** Auto-renewal settings */
  autoRenew?: boolean;

  /** Terms and conditions reference */
  termsReference?: string;
}

// ============================================================================
// UTILIZATION TRACKING
// ============================================================================

/**
 * Utilization metrics for a blanket PO
 *
 * Tracks how much of the blanket has been used across all stages:
 * - Committed: Lines on unreleased requisitions/orders
 * - Released: Sum of all release order amounts
 * - Consumed: Amount actually invoiced/paid
 * - Available: Remaining authorization
 */
export interface BlanketUtilization {
  /** Amount committed but not yet released */
  committed: number;

  /** Total amount across all releases */
  released: number;

  /** Amount already invoiced/paid */
  consumed: number;

  /** Remaining available (authorizedTotal - released) */
  available: number;

  /** Number of releases created */
  releaseCount: number;

  /** Last calculation timestamp */
  lastCalculated?: string;
}

// ============================================================================
// BLANKET PO HEADER
// ============================================================================

/**
 * Extended header for blanket POs
 *
 * Includes blanket-specific terms and utilization tracking.
 */
export interface BlanketPOHeader extends POHeader {
  /** Must be BLANKET for blanket POs */
  poType: "BLANKET";

  /** Blanket terms and limits */
  blanketTerms: BlanketPOTerms;

  /** Current utilization */
  utilization: BlanketUtilization;
}

// ============================================================================
// RELEASE TYPES
// ============================================================================

/**
 * Header for a release order
 *
 * Releases are standalone POs that draw against a parent blanket.
 */
export interface ReleasePOHeader extends POHeader {
  /** Must be RELEASE for release orders */
  poType: "RELEASE";

  /** Parent blanket PO number */
  parentBlanketPO: string;

  /** Sequential release number within the blanket */
  releaseNumber: number;

  /** When the release was created */
  releaseDate: string;

  /** Reference/authorization number */
  authorizationRef?: string;
}

/**
 * Summary of a release for display in release lists
 */
export interface ReleaseSummary {
  /** Release PO number */
  releaseNumber: string;

  /** Sequential number within blanket */
  sequenceNumber: number;

  /** Release creation date */
  releaseDate: string;

  /** Total amount of the release */
  amount: number;

  /** Current status */
  status: "draft" | "open" | "partially_received" | "received" | "closed" | "cancelled";

  /** Number of line items */
  lineCount: number;

  /** Requested delivery date */
  requestedDelivery?: string;

  /** Who created the release */
  createdBy?: string;
}

// ============================================================================
// BLANKET LINE ITEMS
// ============================================================================

/**
 * Extended line item for blanket POs
 *
 * Blanket lines define what CAN be ordered and track
 * quantities released against the blanket.
 */
export interface BlanketLineItem extends LineItem {
  /** Maximum quantity that can be released */
  maxQuantity?: number;

  /** Quantity already released across all releases */
  releasedQuantity: number;

  /** Remaining quantity available for release */
  availableQuantity: number;

  /** Price is fixed for duration of blanket */
  priceLocked: boolean;

  /** Unit price cannot exceed this (for non-locked pricing) */
  maxUnitPrice?: number;
}

// ============================================================================
// COMPLETE BLANKET PO TYPE
// ============================================================================

/**
 * Complete Blanket Purchase Order
 *
 * Combines blanket header, authorized line items, and release history.
 */
export interface BlanketPurchaseOrder {
  header: BlanketPOHeader;
  lineItems: BlanketLineItem[];
  charges: POCharge[];
  discounts: PODiscount[];
  totals: POTotals;
  vendorContact: VendorContact;

  /** History of all releases against this blanket */
  releases: ReleaseSummary[];
}

/**
 * Complete Release Order
 *
 * A release is essentially a standard PO with a reference to its parent blanket.
 */
export interface ReleasePurchaseOrder {
  header: ReleasePOHeader;
  lineItems: LineItem[];
  charges: POCharge[];
  discounts: PODiscount[];
  totals: POTotals;
  vendorContact: VendorContact;
}

// ============================================================================
// RELEASE CREATION
// ============================================================================

/**
 * Line selection for creating a new release
 */
export interface ReleaseLineSelection {
  /** Blanket line ID to release from */
  blanketLineId: number;

  /** Quantity to release */
  releaseQuantity: number;

  /** Optional unit price override (if not locked) */
  unitPriceOverride?: number;

  /** Requested delivery date for this line */
  requestedDelivery?: string;
}

/**
 * Request to create a new release from a blanket
 */
export interface CreateReleaseRequest {
  /** Parent blanket PO number */
  blanketPONumber: string;

  /** Lines to include in the release */
  lines: ReleaseLineSelection[];

  /** Overall requested delivery date */
  requestedDeliveryDate?: string;

  /** Ship-to destination override */
  shipToOverride?: string;

  /** Notes for the release */
  notes?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a blanket PO is expired
 */
export function isBlanketExpired(terms: BlanketPOTerms): boolean {
  return new Date(terms.expirationDate) < new Date();
}

/**
 * Check if a blanket PO is expiring soon (within days)
 */
export function isBlanketExpiringSoon(terms: BlanketPOTerms, withinDays: number = 30): boolean {
  const expirationDate = new Date(terms.expirationDate);
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + withinDays);
  return expirationDate <= warningDate && expirationDate > new Date();
}

/**
 * Calculate utilization percentage
 */
export function getUtilizationPercentage(utilization: BlanketUtilization, authorized: number): number {
  if (authorized <= 0) return 0;
  return Math.round((utilization.released / authorized) * 100);
}

/**
 * Check if a release amount is within limits
 */
export function isReleaseWithinLimits(
  amount: number,
  terms: BlanketPOTerms,
  utilization: BlanketUtilization
): { valid: boolean; reason?: string } {
  // Check per-release limit
  if (terms.perReleaseLimit && amount > terms.perReleaseLimit) {
    return {
      valid: false,
      reason: `Amount exceeds per-release limit of ${terms.perReleaseLimit}`,
    };
  }

  // Check per-release minimum
  if (terms.perReleaseMinimum && amount < terms.perReleaseMinimum) {
    return {
      valid: false,
      reason: `Amount is below minimum release amount of ${terms.perReleaseMinimum}`,
    };
  }

  // Check available balance
  if (amount > utilization.available) {
    return {
      valid: false,
      reason: `Amount exceeds available balance of ${utilization.available}`,
    };
  }

  // Check max releases
  if (terms.maxReleases && utilization.releaseCount >= terms.maxReleases) {
    return {
      valid: false,
      reason: `Maximum number of releases (${terms.maxReleases}) has been reached`,
    };
  }

  return { valid: true };
}
