/**
 * usePendingApprovals Hook
 *
 * React hook for fetching approvals pending action from the current user.
 * Useful for dashboard widgets and notification badges.
 *
 * Design principles:
 * - Efficient polling support
 * - Caches results between renders
 * - Type-safe with proper loading states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ApprovalInstance,
  PrincipalId,
  principalId,
} from "../../domain/approval-engine";
import { ApprovalRepository } from "../../application/ports/approval-repository.port";

// ============================================================================
// TYPES
// ============================================================================

export interface UsePendingApprovalsOptions {
  /** Current principal ID */
  readonly principalId: string;
  /** Repository to use */
  readonly repository: ApprovalRepository;
  /** Polling interval in ms (0 to disable) */
  readonly pollInterval?: number;
  /** Skip fetching */
  readonly skip?: boolean;
}

export interface UsePendingApprovalsResult {
  /** Loading state */
  readonly loading: boolean;
  /** Error state */
  readonly error: Error | undefined;
  /** Pending approvals */
  readonly approvals: readonly ApprovalInstance[];
  /** Number of pending approvals */
  readonly count: number;
  /** Refetch function */
  readonly refetch: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePendingApprovals(
  options: UsePendingApprovalsOptions
): UsePendingApprovalsResult {
  const {
    principalId: principalIdStr,
    repository,
    pollInterval = 0,
    skip = false,
  } = options;

  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | undefined>();
  const [approvals, setApprovals] = useState<readonly ApprovalInstance[]>([]);

  const requestIdRef = useRef(0);

  const fetchApprovals = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const results = await repository.findPendingForPrincipal(
        principalId(principalIdStr)
      );

      if (currentRequestId === requestIdRef.current) {
        setApprovals(results);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [principalIdStr, repository]);

  // Initial fetch
  useEffect(() => {
    if (!skip) {
      fetchApprovals();
    }
  }, [skip, fetchApprovals]);

  // Polling
  useEffect(() => {
    if (skip || pollInterval <= 0) return;

    const intervalId = setInterval(fetchApprovals, pollInterval);
    return () => clearInterval(intervalId);
  }, [skip, pollInterval, fetchApprovals]);

  return {
    loading,
    error,
    approvals,
    count: approvals.length,
    refetch: fetchApprovals,
  };
}

// ============================================================================
// BADGE COMPONENT DATA
// ============================================================================

export interface PendingApprovalsBadgeData {
  /** Count to display */
  readonly count: number;
  /** Whether still loading */
  readonly loading: boolean;
  /** Whether there was an error */
  readonly hasError: boolean;
  /** Display text */
  readonly displayText: string;
}

/**
 * Get formatted data for a pending approvals badge
 */
export function getPendingApprovalsBadgeData(
  result: UsePendingApprovalsResult
): PendingApprovalsBadgeData {
  return {
    count: result.count,
    loading: result.loading,
    hasError: result.error !== undefined,
    displayText:
      result.count > 99
        ? "99+"
        : result.count > 0
        ? String(result.count)
        : "",
  };
}
