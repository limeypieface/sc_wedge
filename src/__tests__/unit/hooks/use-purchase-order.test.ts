/**
 * usePurchaseOrder Hook Tests
 *
 * Tests for the purchase order data fetching hook.
 * Verifies loading states, error handling, and data fetching.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePurchaseOrder } from '../../../app/supply/purchase-orders/_hooks/use-purchase-order';

describe('usePurchaseOrder', () => {
  describe('Initial State', () => {
    it('should start with loading true', () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      expect(result.current.loading).toBe(true);
    });

    it('should start with undefined data', () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      expect(result.current.purchaseOrder).toBeUndefined();
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch and return purchase order data', async () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.purchaseOrder).toBeDefined();
      expect(result.current.purchaseOrder?.header).toBeDefined();
    });

    it('should set loading to false after fetch completes', async () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should return error for invalid PO number', async () => {
      const { result } = renderHook(() => usePurchaseOrder('INVALID-PO'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.purchaseOrder).toBeUndefined();
    });
  });

  describe('Skip Option', () => {
    it('should not fetch when skip is true', async () => {
      const { result } = renderHook(() =>
        usePurchaseOrder('PO-0861', { skip: true })
      );

      // Should immediately be not loading and no data
      expect(result.current.loading).toBe(false);
      expect(result.current.purchaseOrder).toBeUndefined();
    });
  });

  describe('Refetch', () => {
    it('should provide refetch function', async () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch data when refetch is called', async () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstData = result.current.purchaseOrder;

      act(() => {
        result.current.refetch();
      });

      // Should be loading again
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data should still be present
      expect(result.current.purchaseOrder).toBeDefined();
    });
  });

  describe('PO Number Change', () => {
    it('should refetch when PO number changes', async () => {
      const { result, rerender } = renderHook(
        ({ poNumber }) => usePurchaseOrder(poNumber),
        { initialProps: { poNumber: 'PO-0861' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change PO number
      rerender({ poNumber: 'PO-0862' });

      // Should trigger new fetch (loading will be true briefly)
      // Then error because PO-0862 doesn't exist in mock data
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Data Structure', () => {
    it('should return complete PO data structure', async () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const po = result.current.purchaseOrder;
      expect(po).toHaveProperty('header');
      expect(po).toHaveProperty('lineItems');
      expect(po).toHaveProperty('charges');
      expect(po).toHaveProperty('discounts');
      expect(po).toHaveProperty('totals');
      expect(po).toHaveProperty('vendorContact');
    });
  });
});
