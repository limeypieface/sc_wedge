/**
 * useRevisions Hook
 *
 * React hook for managing PO revision data and history.
 * Provides access to active revision, draft, and revision history.
 *
 * In Sindri production:
 * - Replace adapter calls with Apollo useQuery hooks
 * - Revision state would be server-side
 *
 * Race Condition Handling:
 * - Uses request IDs to ignore stale responses
 * - Prevents state updates on unmounted components
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { PORevision, Approver, CurrentUser } from "../_lib/types";
import {
  fetchRevisions,
  fetchActiveRevision,
  fetchDraftRevision,
  fetchApprovers,
  fetchUsers,
} from "../_adapters";

// ============================================================================
// TYPES
// ============================================================================

interface UseRevisionsResult {
  /** All revisions for this PO (sorted by version, newest first) */
  revisions: PORevision[];
  /** The currently active (acknowledged) revision */
  activeRevision: PORevision | undefined;
  /** The current draft revision (if any) */
  draftRevision: PORevision | undefined;
  /** Whether data is loading */
  loading: boolean;
  /** Any error that occurred */
  error: Error | undefined;
  /** Refetch all revision data */
  refetch: () => void;
}

interface UseApproversResult {
  /** Available approvers */
  approvers: Approver[];
  /** Whether data is loading */
  loading: boolean;
  /** Any error */
  error: Error | undefined;
}

interface UseUsersResult {
  /** Available users (for simulation) */
  users: CurrentUser[];
  /** Whether data is loading */
  loading: boolean;
  /** Any error */
  error: Error | undefined;
}

// ============================================================================
// REVISION DATA HOOK
// ============================================================================

/**
 * Fetch all revision-related data for a PO
 *
 * @param poNumber - The PO number
 * @returns Revision data including history, active, and draft
 *
 * @example
 * const { revisions, activeRevision, draftRevision, loading } = useRevisions("PO-0861");
 */
export function useRevisions(poNumber: string): UseRevisionsResult {
  const [revisions, setRevisions] = useState<PORevision[]>([]);
  const [activeRevision, setActiveRevision] = useState<PORevision | undefined>(
    undefined
  );
  const [draftRevision, setDraftRevision] = useState<PORevision | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Race condition prevention
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!poNumber) {
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(undefined);

    try {
      // Fetch all revision data in parallel
      const [allRevisions, active, draft] = await Promise.all([
        fetchRevisions(poNumber),
        fetchActiveRevision(poNumber),
        fetchDraftRevision(poNumber),
      ]);

      // Race condition check
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setRevisions(allRevisions);
        setActiveRevision(active ?? undefined);
        setDraftRevision(draft ?? undefined);
        setLoading(false);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  }, [poNumber]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    revisions,
    activeRevision,
    draftRevision,
    loading,
    error,
    refetch,
  };
}

// ============================================================================
// APPROVERS HOOK
// ============================================================================

/**
 * Fetch available approvers
 *
 * @returns List of approvers configured for the approval chain
 */
export function useApprovers(): UseApproversResult {
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function loadApprovers() {
      try {
        const data = await fetchApprovers();
        if (mountedRef.current) {
          setApprovers(data);
          setLoading(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    loadApprovers();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { approvers, loading, error };
}

// ============================================================================
// USERS HOOK (for simulation)
// ============================================================================

/**
 * Fetch available users for simulation
 *
 * In production Sindri, this would come from AuthContext.
 * In the prototype, we allow switching between simulated users.
 */
export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function loadUsers() {
      try {
        const data = await fetchUsers();
        if (mountedRef.current) {
          setUsers(data);
          setLoading(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { users, loading, error };
}

// ============================================================================
// DERIVED STATE HELPERS
// ============================================================================

/**
 * Get the latest version number from revisions
 *
 * @param revisions - List of revisions
 */
export function getLatestVersion(revisions: PORevision[]): string {
  if (revisions.length === 0) return "1.0";
  return revisions[0].version; // Already sorted newest first
}

/**
 * Check if there's an active draft
 *
 * @param draftRevision - The current draft revision
 */
export function hasDraft(draftRevision: PORevision | undefined): boolean {
  return draftRevision !== undefined;
}
