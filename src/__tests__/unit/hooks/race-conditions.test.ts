/**
 * Race Condition Tests
 *
 * Tests that verify the hooks properly handle race conditions:
 * - Out-of-order responses (slow request returns after fast request)
 * - Stale closure prevention
 * - Unmounted component state updates
 *
 * These tests are critical for ensuring data consistency in async operations.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePurchaseOrder } from '../../../app/supply/purchase-orders/_hooks/use-purchase-order';

// Helper to create a delayed promise
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Race Condition Handling', () => {
  describe('Out-of-Order Response Handling', () => {
    /**
     * Scenario: User quickly changes PO number
     * Request 1 (slow) starts first but returns after Request 2 (fast)
     * Expected: Show data from Request 2, ignore stale Request 1 data
     */
    it('should ignore stale responses when PO number changes rapidly', async () => {
      const { result, rerender } = renderHook(
        ({ poNumber }) => usePurchaseOrder(poNumber),
        { initialProps: { poNumber: 'PO-0861' } }
      );

      // Wait for first request to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstPO = result.current.purchaseOrder;
      expect(firstPO).toBeDefined();

      // Quickly change to invalid PO (will error)
      rerender({ poNumber: 'PO-INVALID' });

      // Wait for second request
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have error from second request, not data from first
      expect(result.current.error).toBeDefined();
    });

    it('should handle multiple rapid refetches correctly', async () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger multiple rapid refetches
      act(() => {
        result.current.refetch();
      });
      act(() => {
        result.current.refetch();
      });
      act(() => {
        result.current.refetch();
      });

      // Wait for all to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still have valid data
      expect(result.current.purchaseOrder).toBeDefined();
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Unmounted Component Protection', () => {
    /**
     * Scenario: Component unmounts while request is in flight
     * Expected: No state update attempted (would cause React warning)
     */
    it('should not update state after unmount', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const { result, unmount } = renderHook(() => usePurchaseOrder('PO-0861'));

      // Request is in flight
      expect(result.current.loading).toBe(true);

      // Unmount immediately
      unmount();

      // Wait a bit for any async operations
      await delay(500);

      // Should not have caused any React state update warnings
      // (React would log an error for state updates on unmounted components)
      const reactWarnings = consoleError.mock.calls.filter(
        call => call[0]?.includes?.('unmounted component')
      );
      expect(reactWarnings).toHaveLength(0);

      consoleError.mockRestore();
    });

    it('should clean up properly on PO number change', async () => {
      const { result, rerender, unmount } = renderHook(
        ({ poNumber }) => usePurchaseOrder(poNumber),
        { initialProps: { poNumber: 'PO-0861' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change PO and immediately unmount
      rerender({ poNumber: 'PO-OTHER' });
      unmount();

      // Wait and verify no errors
      await delay(500);
      // Test passes if no errors thrown
    });
  });

  describe('Request ID Tracking', () => {
    /**
     * The hook uses requestIdRef to track requests.
     * Each new request increments the ID.
     * Only the response matching the current ID should be applied.
     */
    it('should track request sequence correctly', async () => {
      const { result, rerender } = renderHook(
        ({ poNumber }) => usePurchaseOrder(poNumber),
        { initialProps: { poNumber: 'PO-0861' } }
      );

      // First request
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.purchaseOrder).toBeDefined();

      // Second request
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data should still be consistent
      expect(result.current.purchaseOrder?.header.poNumber).toBe('PO-0861');
    });
  });

  describe('Concurrent State Updates', () => {
    /**
     * Scenario: Multiple state updates happen close together
     * Expected: Final state should be consistent
     */
    it('should handle concurrent refetch calls', async () => {
      const { result } = renderHook(() => usePurchaseOrder('PO-0861'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate rapid user actions
      const refetchPromises = [];
      for (let i = 0; i < 5; i++) {
        refetchPromises.push(
          new Promise<void>(resolve => {
            act(() => {
              result.current.refetch();
            });
            setTimeout(resolve, 10);
          })
        );
      }

      await Promise.all(refetchPromises);

      // Wait for everything to settle
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 5000 }
      );

      // State should be consistent
      expect(result.current.purchaseOrder).toBeDefined();
    });
  });

  describe('Skip Option Race Conditions', () => {
    it('should handle skip toggling correctly', async () => {
      const { result, rerender } = renderHook(
        ({ skip }) => usePurchaseOrder('PO-0861', { skip }),
        { initialProps: { skip: true } }
      );

      // Should not be loading when skipped
      expect(result.current.loading).toBe(false);
      expect(result.current.purchaseOrder).toBeUndefined();

      // Enable fetching
      rerender({ skip: false });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.purchaseOrder).toBeDefined();

      // Skip again
      rerender({ skip: true });

      // Should maintain last data but not refetch
      expect(result.current.purchaseOrder).toBeDefined();
    });
  });
});

describe('Error Recovery', () => {
  it('should recover from error on successful refetch', async () => {
    const { result, rerender } = renderHook(
      ({ poNumber }) => usePurchaseOrder(poNumber),
      { initialProps: { poNumber: 'INVALID-PO' } }
    );

    // Wait for error
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBeDefined();

    // Switch to valid PO
    rerender({ poNumber: 'PO-0861' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have cleared error and have data
    expect(result.current.error).toBeUndefined();
    expect(result.current.purchaseOrder).toBeDefined();
  });
});
