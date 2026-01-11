/**
 * useApproval Hook
 *
 * React hook for working with approvals in the UI.
 * Provides capabilities-first access to approval state and actions.
 *
 * Design principles:
 * - Capabilities are computed and cached
 * - Actions are type-safe and capability-gated
 * - State updates are optimistic where possible
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ApprovalInstance,
  ApprovalCapabilities,
  ApprovalStatus,
  VoteDecision,
  PrincipalId,
  EntityId,
  getCapabilities,
  getProgress,
  StageProgress,
  NO_CAPABILITIES,
} from "../../domain/approval-engine";
import {
  ApprovalStatusViewModel,
  createGetApprovalStatusUseCase,
  createProcessVoteUseCase,
  createCancelApprovalUseCase,
} from "../../application";
import { ApprovalRepository } from "../../application/ports/approval-repository.port";
import { NotificationService } from "../../application/ports/notification.port";

// ============================================================================
// TYPES
// ============================================================================

export interface UseApprovalOptions {
  /** Approval ID to load */
  readonly approvalId: string;
  /** Current viewer's principal ID */
  readonly viewerId: string;
  /** Whether viewer has a general viewer role */
  readonly hasViewerRole?: boolean;
  /** Skip initial fetch */
  readonly skip?: boolean;
  /** Dependencies */
  readonly repository: ApprovalRepository;
  readonly notificationService: NotificationService;
}

export interface UseApprovalResult {
  /** Loading state */
  readonly loading: boolean;
  /** Error state */
  readonly error: Error | undefined;
  /** The approval view model */
  readonly approval: ApprovalStatusViewModel | undefined;
  /** Computed capabilities for the viewer */
  readonly capabilities: ApprovalCapabilities;
  /** Stage progress */
  readonly progress: StageProgress | undefined;
  /** Actions */
  readonly actions: ApprovalActions;
  /** Refetch the approval */
  readonly refetch: () => Promise<void>;
}

export interface ApprovalActions {
  /** Submit for approval (if capabilities allow) */
  readonly submit: () => Promise<void>;
  /** Approve at current stage (if capabilities allow) */
  readonly approve: (reason?: string) => Promise<void>;
  /** Reject at current stage (if capabilities allow) */
  readonly reject: (reason?: string) => Promise<void>;
  /** Request changes (if capabilities allow) */
  readonly requestChanges: (reason?: string) => Promise<void>;
  /** Cancel the approval (if capabilities allow) */
  readonly cancel: (reason?: string) => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useApproval(options: UseApprovalOptions): UseApprovalResult {
  const {
    approvalId,
    viewerId,
    hasViewerRole = false,
    skip = false,
    repository,
    notificationService,
  } = options;

  // State
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | undefined>();
  const [approval, setApproval] = useState<ApprovalStatusViewModel | undefined>();

  // Track request ID for race condition prevention
  const requestIdRef = useRef(0);

  // Create use cases
  const getStatusUseCase = useMemo(
    () => createGetApprovalStatusUseCase({ repository }),
    [repository]
  );

  const processVoteUseCase = useMemo(
    () => createProcessVoteUseCase({ repository, notificationService }),
    [repository, notificationService]
  );

  const cancelUseCase = useMemo(
    () => createCancelApprovalUseCase({ repository, notificationService }),
    [repository, notificationService]
  );

  // Fetch function
  const fetchApproval = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const result = await getStatusUseCase.getApprovalById({
        approvalId,
        viewerId,
        hasViewerRole,
      });

      // Check for stale response
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (result.success) {
        setApproval(result.value);
      } else {
        setError(new Error(result.error.message));
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
  }, [approvalId, viewerId, hasViewerRole, getStatusUseCase]);

  // Initial fetch
  useEffect(() => {
    if (!skip) {
      fetchApproval();
    }
  }, [skip, fetchApproval]);

  // Capabilities
  const capabilities = useMemo(() => {
    return approval?.capabilities ?? NO_CAPABILITIES;
  }, [approval]);

  // Progress
  const progress = useMemo(() => {
    return approval?.progress;
  }, [approval]);

  // Actions
  const actions = useMemo((): ApprovalActions => {
    const vote = async (decision: VoteDecision, reason?: string) => {
      if (!approval) throw new Error("No approval loaded");

      const result = await processVoteUseCase({
        approvalId,
        voterId: viewerId,
        decision,
        reason,
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // Refresh to get updated state
      await fetchApproval();
    };

    return {
      submit: async () => {
        if (!capabilities.canSubmit) {
          throw new Error(
            capabilities.denialReasons["canSubmit"] ?? "Cannot submit"
          );
        }
        // Submit would be handled by a different use case
        // For now, just refetch
        await fetchApproval();
      },

      approve: async (reason?: string) => {
        if (!capabilities.canApprove) {
          throw new Error(
            capabilities.denialReasons["canApprove"] ?? "Cannot approve"
          );
        }
        await vote("approve", reason);
      },

      reject: async (reason?: string) => {
        if (!capabilities.canReject) {
          throw new Error(
            capabilities.denialReasons["canReject"] ?? "Cannot reject"
          );
        }
        await vote("reject", reason);
      },

      requestChanges: async (reason?: string) => {
        if (!capabilities.canRequestChanges) {
          throw new Error(
            capabilities.denialReasons["canRequestChanges"] ??
              "Cannot request changes"
          );
        }
        await vote("request_changes", reason);
      },

      cancel: async (reason?: string) => {
        if (!capabilities.canCancel) {
          throw new Error(
            capabilities.denialReasons["canCancel"] ?? "Cannot cancel"
          );
        }

        const result = await cancelUseCase({
          approvalId,
          cancellerId: viewerId,
          reason,
        });

        if (!result.success) {
          throw new Error(result.error.message);
        }

        await fetchApproval();
      },
    };
  }, [
    approval,
    approvalId,
    viewerId,
    capabilities,
    processVoteUseCase,
    cancelUseCase,
    fetchApproval,
  ]);

  return {
    loading,
    error,
    approval,
    capabilities,
    progress,
    actions,
    refetch: fetchApproval,
  };
}
