/**
 * Purchase Order Data Adapter
 *
 * Provides data access for Purchase Order entities.
 * In this prototype, data comes from mock sources.
 * In Sindri production, this would be replaced with GraphQL queries.
 *
 * Design Philosophy:
 * - Same interface whether data is mocked or from GraphQL
 * - Simulates async behavior to match real API patterns
 * - Includes loading/error states for UI handling
 *
 * Migration to Sindri:
 * - Replace mock data imports with generated GraphQL hooks
 * - Keep the same return shape for UI compatibility
 */

import type {
  POHeader,
  LineItem,
  POCharge,
  PODiscount,
  VendorContact,
  POTotals,
  PurchaseOrder,
} from "../_lib/types";

// Import mock data from the prototype's mock data module
// In Sindri, this would be: import { usePurchaseOrderQuery } from "../_queries/purchase-order.generated"
import {
  poHeader as mockPOHeader,
  lineItems as mockLineItems,
  poCharges as mockCharges,
  poDiscounts as mockDiscounts,
  vendorContact as mockVendorContact,
  computePOTotals,
} from "@/lib/mock-data";

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

/**
 * Standard query result shape
 * Matches Apollo Client's useQuery return type for easy migration
 */
export interface QueryResult<T> {
  /** The fetched data */
  data: T | undefined;
  /** Whether the query is in flight */
  loading: boolean;
  /** Any error that occurred */
  error: Error | undefined;
  /** Refetch the data */
  refetch: () => Promise<void>;
}

/**
 * Result shape for PO detail query
 */
export interface PurchaseOrderQueryResult {
  purchaseOrder: PurchaseOrder;
}

/**
 * Result shape for PO list query
 */
export interface PurchaseOrderListQueryResult {
  purchaseOrders: POHeader[];
}

// ============================================================================
// SIMULATED NETWORK DELAY
// ============================================================================

/**
 * Simulate network latency for realistic async behavior
 * Helps test loading states and race conditions
 *
 * @param ms - Delay in milliseconds (default: 100-300ms random)
 */
async function simulateDelay(ms?: number): Promise<void> {
  const delay = ms ?? Math.floor(Math.random() * 200) + 100;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// ============================================================================
// PURCHASE ORDER QUERIES
// ============================================================================

/**
 * Fetch a single Purchase Order by number
 *
 * In Sindri, this would be:
 * ```
 * const { data, loading, error } = usePurchaseOrderQuery({
 *   variables: { orderNumber: poNumber }
 * });
 * ```
 *
 * @param poNumber - The PO number to fetch (e.g., "PO-0861")
 * @returns Query result with PO data
 */
export async function fetchPurchaseOrder(
  poNumber: string
): Promise<PurchaseOrderQueryResult> {
  // Simulate network delay
  await simulateDelay();

  // In prototype, we only have one mock PO
  if (poNumber !== mockPOHeader.poNumber) {
    throw new Error(`Purchase Order ${poNumber} not found`);
  }

  // Compute totals
  const totals = computePOTotals(mockCharges);

  return {
    purchaseOrder: {
      header: mockPOHeader as POHeader,
      lineItems: mockLineItems as unknown as LineItem[],
      charges: mockCharges as POCharge[],
      discounts: mockDiscounts as PODiscount[],
      totals: {
        subtotal: totals.subtotal,
        totalCharges: totals.charges.total,
        totalDiscounts: totals.discounts.total,
        taxAmount: totals.totalTax,
        grandTotal: totals.grandTotal,
      },
      vendorContact: mockVendorContact,
    },
  };
}

/**
 * Fetch the PO header only (for list views)
 *
 * @param poNumber - The PO number to fetch
 */
export async function fetchPurchaseOrderHeader(
  poNumber: string
): Promise<POHeader> {
  await simulateDelay(50);

  if (poNumber !== mockPOHeader.poNumber) {
    throw new Error(`Purchase Order ${poNumber} not found`);
  }

  return mockPOHeader as POHeader;
}

/**
 * Fetch line items for a PO
 *
 * @param poNumber - The PO number
 */
export async function fetchLineItems(poNumber: string): Promise<LineItem[]> {
  await simulateDelay(100);

  if (poNumber !== mockPOHeader.poNumber) {
    throw new Error(`Purchase Order ${poNumber} not found`);
  }

  return mockLineItems as unknown as LineItem[];
}

/**
 * Fetch charges for a PO
 *
 * @param poNumber - The PO number
 */
export async function fetchCharges(poNumber: string): Promise<POCharge[]> {
  await simulateDelay(50);

  if (poNumber !== mockPOHeader.poNumber) {
    throw new Error(`Purchase Order ${poNumber} not found`);
  }

  return mockCharges as POCharge[];
}

/**
 * Fetch vendor contact for a PO
 *
 * @param poNumber - The PO number
 */
export async function fetchVendorContact(
  poNumber: string
): Promise<VendorContact> {
  await simulateDelay(50);

  if (poNumber !== mockPOHeader.poNumber) {
    throw new Error(`Purchase Order ${poNumber} not found`);
  }

  return mockVendorContact;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get charges that apply to a specific line
 *
 * @param lineNumber - The line number to filter by
 * @param charges - All charges on the PO
 */
export function getLineCharges(
  lineNumber: number,
  charges: POCharge[]
): POCharge[] {
  return charges.filter((c) => c.appliesToLines?.includes(lineNumber));
}

/**
 * Get charges that apply to the header (not line-specific)
 *
 * @param charges - All charges on the PO
 */
export function getHeaderCharges(charges: POCharge[]): POCharge[] {
  return charges.filter(
    (c) => !c.appliesToLines || c.appliesToLines.length === 0
  );
}

/**
 * Calculate line-level totals
 *
 * @param lineItems - Line items to calculate
 */
export function calculateLineTotals(lineItems: LineItem[]): {
  subtotal: number;
  itemCount: number;
} {
  const subtotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
  return {
    subtotal,
    itemCount: lineItems.length,
  };
}
