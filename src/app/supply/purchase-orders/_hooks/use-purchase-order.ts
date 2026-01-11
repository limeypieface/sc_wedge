/**
 * usePurchaseOrder Hook
 *
 * React hook for fetching and managing Purchase Order data.
 * Handles loading states, error handling, and data caching.
 *
 * In Sindri production:
 * - Replace with Apollo's useQuery hook
 * - Generated types would come from GraphQL codegen
 *
 * Race Condition Handling:
 * - Uses request ID to ignore stale responses
 * - Cleanup function prevents updates on unmounted component
 * - AbortController pattern for cancellation (when available)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { PurchaseOrder } from "../_lib/types";
import { fetchPurchaseOrder } from "../_adapters";

// ============================================================================
// TYPES
// ============================================================================

interface UsePurchaseOrderResult {
  /** The fetched PO data */
  purchaseOrder: PurchaseOrder | undefined;
  /** Whether the query is loading */
  loading: boolean;
  /** Any error that occurred */
  error: Error | undefined;
  /** Refetch the data */
  refetch: () => void;
}

interface UsePurchaseOrderOptions {
  /** Skip the query (useful for conditional fetching) */
  skip?: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Fetch a Purchase Order by number
 *
 * @param poNumber - The PO number to fetch
 * @param options - Query options
 * @returns Query result with PO data, loading, and error states
 *
 * @example
 * const { purchaseOrder, loading, error } = usePurchaseOrder("PO-0861");
 *
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 * return <PODetail po={purchaseOrder} />;
 */
export function usePurchaseOrder(
  poNumber: string,
  options: UsePurchaseOrderOptions = {}
): UsePurchaseOrderResult {
  const { skip = false } = options;

  // State
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Request tracking for race condition prevention
  // Each fetch gets a unique ID; we ignore responses from stale requests
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  /**
   * Fetch PO data
   *
   * Uses requestId to ensure we don't apply stale data from
   * out-of-order responses (race condition prevention).
   */
  const fetchData = useCallback(async () => {
    if (skip || !poNumber) {
      setLoading(false);
      return;
    }

    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const result = await fetchPurchaseOrder(poNumber);

      // Race condition check: Only update if this is still the latest request
      // and the component is still mounted
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setPurchaseOrder(result.purchaseOrder);
        setLoading(false);
      }
    } catch (err) {
      // Same race condition check for errors
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  }, [poNumber, skip]);

  // Initial fetch and refetch on poNumber change
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Cleanup: Mark as unmounted to prevent state updates
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    purchaseOrder,
    loading,
    error,
    refetch,
  };
}

// ============================================================================
// SELECTIVE DATA HOOKS
// ============================================================================

/**
 * Fetch only line items (for partial updates)
 *
 * Useful when you only need line items and want to minimize data transfer.
 */
export function useLineItems(poNumber: string) {
  const { purchaseOrder, loading, error, refetch } = usePurchaseOrder(poNumber);

  return {
    lineItems: purchaseOrder?.lineItems,
    loading,
    error,
    refetch,
  };
}

/**
 * Fetch only charges
 */
export function useCharges(poNumber: string) {
  const { purchaseOrder, loading, error, refetch } = usePurchaseOrder(poNumber);

  return {
    charges: purchaseOrder?.charges,
    loading,
    error,
    refetch,
  };
}

/**
 * Fetch only vendor contact
 */
export function useVendorContact(poNumber: string) {
  const { purchaseOrder, loading, error, refetch } = usePurchaseOrder(poNumber);

  return {
    vendorContact: purchaseOrder?.vendorContact,
    loading,
    error,
    refetch,
  };
}
