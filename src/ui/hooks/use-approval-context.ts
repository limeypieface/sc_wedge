/**
 * useApprovalContext Hook
 *
 * React hook for computing approval context from entity data.
 * Transforms entity-specific data into the approval engine's context format.
 *
 * Design principles:
 * - Memoized context computation
 * - Entity-agnostic through configuration
 * - Supports different entity types
 */

import { useMemo } from "react";
import {
  ApprovalContext,
  principalId,
  isoTimestamp,
} from "../../domain/approval-engine";

// ============================================================================
// TYPES
// ============================================================================

export interface UseApprovalContextOptions<T> {
  /** The entity data */
  readonly entity: T | undefined;
  /** Current principal ID */
  readonly principalId: string;
  /** Function to extract metrics from the entity */
  readonly extractMetrics: (entity: T) => Record<string, number | string | boolean>;
  /** Optional additional metadata */
  readonly metadata?: Record<string, unknown>;
}

export interface UseApprovalContextResult {
  /** The computed approval context */
  readonly context: ApprovalContext | undefined;
  /** Whether context is ready */
  readonly isReady: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useApprovalContext<T>(
  options: UseApprovalContextOptions<T>
): UseApprovalContextResult {
  const { entity, principalId: principalIdStr, extractMetrics, metadata } = options;

  const context = useMemo((): ApprovalContext | undefined => {
    if (!entity) return undefined;

    return {
      metrics: extractMetrics(entity),
      requestingPrincipal: principalId(principalIdStr),
      currentTime: isoTimestamp(),
      metadata,
    };
  }, [entity, principalIdStr, extractMetrics, metadata]);

  return {
    context,
    isReady: context !== undefined,
  };
}

// ============================================================================
// PO REVISION CONTEXT
// ============================================================================

/**
 * Metrics for PO revision approvals
 */
export interface PORevisionMetrics {
  /** Total cost change in dollars */
  readonly totalCostChange: number;
  /** Absolute value of cost change */
  readonly absoluteCostChange: number;
  /** Percentage change */
  readonly percentageChange: number;
  /** Number of changed line items */
  readonly changedLineItems: number;
  /** Number of added line items */
  readonly addedLineItems: number;
  /** Number of removed line items */
  readonly removedLineItems: number;
  /** Whether there are any changes */
  readonly hasChanges: boolean;
  /** Current revision number */
  readonly revisionNumber: number;
}

/**
 * Extract metrics from a PO revision
 */
export function extractPORevisionMetrics(revision: {
  originalTotal: number;
  revisedTotal: number;
  changedLines: number;
  addedLines: number;
  removedLines: number;
  revisionNumber: number;
}): PORevisionMetrics {
  const costChange = revision.revisedTotal - revision.originalTotal;
  const percentageChange =
    revision.originalTotal === 0
      ? 0
      : (costChange / revision.originalTotal) * 100;

  return {
    totalCostChange: costChange,
    absoluteCostChange: Math.abs(costChange),
    percentageChange: Math.abs(percentageChange),
    changedLineItems: revision.changedLines,
    addedLineItems: revision.addedLines,
    removedLineItems: revision.removedLines,
    hasChanges:
      revision.changedLines > 0 ||
      revision.addedLines > 0 ||
      revision.removedLines > 0,
    revisionNumber: revision.revisionNumber,
  };
}

/**
 * Hook for PO revision approval context
 */
export function usePORevisionContext(options: {
  readonly revision:
    | {
        originalTotal: number;
        revisedTotal: number;
        changedLines: number;
        addedLines: number;
        removedLines: number;
        revisionNumber: number;
      }
    | undefined;
  readonly principalId: string;
  readonly metadata?: Record<string, unknown>;
}): UseApprovalContextResult {
  return useApprovalContext({
    entity: options.revision,
    principalId: options.principalId,
    extractMetrics: extractPORevisionMetrics,
    metadata: options.metadata,
  });
}
