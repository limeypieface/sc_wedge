/**
 * Mock Approval Repository
 *
 * In-memory implementation of ApprovalRepository for development and testing.
 * Will be replaced by GraphQL adapter when integrating with Sindri.
 *
 * Design principles:
 * - Simulates async behavior with configurable delays
 * - Stores data in memory (reset on refresh)
 * - Follows the same interface as production adapters
 */

import {
  ApprovalInstance,
  EntityId,
  PrincipalId,
  success,
  failure,
  entityId,
} from "@/domain/shared"
import type { EngineResult } from "../../../domain/approval-engine"
import {
  ApprovalRepository,
  LinkedApprovalRepository,
  ApprovalQueryFilters,
  ApprovalQueryOptions,
  PaginatedResult,
  ApprovalReference,
} from "../../application/ports/approval-repository.port";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface MockRepositoryConfig {
  /** Simulated network delay in ms */
  readonly delay?: number;
  /** Simulate random failures (0-1) */
  readonly failureRate?: number;
  /** Initial data to populate */
  readonly initialData?: readonly ApprovalInstance[];
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Create a mock approval repository
 */
export function createMockApprovalRepository(
  config: MockRepositoryConfig = {}
): LinkedApprovalRepository {
  const { delay = 50, failureRate = 0, initialData = [] } = config;

  // In-memory storage
  const approvals = new Map<string, ApprovalInstance>();
  const references = new Map<string, EntityId>();

  // Initialize with any provided data
  for (const approval of initialData) {
    approvals.set(approval.id, approval);
  }

  // Helper to simulate async delay
  const simulateDelay = async (): Promise<void> => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  // Helper to potentially fail
  const maybeThrow = (): void => {
    if (failureRate > 0 && Math.random() < failureRate) {
      throw new Error("Simulated repository failure");
    }
  };

  // Helper to build reference key
  const referenceKey = (ref: ApprovalReference): string => {
    return `${ref.entityType}:${ref.entityId}`;
  };

  return {
    async save(approval: ApprovalInstance): Promise<EngineResult<ApprovalInstance>> {
      await simulateDelay();
      try {
        maybeThrow();
        approvals.set(approval.id, approval);
        return success(approval);
      } catch (err) {
        return failure("SAVE_FAILED", (err as Error).message);
      }
    },

    async saveWithReference(
      approval: ApprovalInstance,
      reference: ApprovalReference
    ): Promise<EngineResult<ApprovalInstance>> {
      await simulateDelay();
      try {
        maybeThrow();
        approvals.set(approval.id, approval);
        references.set(referenceKey(reference), approval.id);
        return success(approval);
      } catch (err) {
        return failure("SAVE_FAILED", (err as Error).message);
      }
    },

    async findById(id: EntityId): Promise<ApprovalInstance | undefined> {
      await simulateDelay();
      maybeThrow();
      return approvals.get(id);
    },

    async findByReference(
      reference: ApprovalReference
    ): Promise<ApprovalInstance | undefined> {
      await simulateDelay();
      maybeThrow();
      const approvalId = references.get(referenceKey(reference));
      if (!approvalId) return undefined;
      return approvals.get(approvalId);
    },

    async findMany(
      filters?: ApprovalQueryFilters,
      options?: ApprovalQueryOptions
    ): Promise<PaginatedResult<ApprovalInstance>> {
      await simulateDelay();
      maybeThrow();

      let results = Array.from(approvals.values());

      // Apply filters
      if (filters) {
        results = applyFilters(results, filters);
      }

      // Apply sorting
      if (options?.sortBy) {
        results = applySorting(results, options.sortBy, options.sortOrder);
      }

      const total = results.length;

      // Apply pagination
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? 50;
      results = results.slice(offset, offset + limit);

      return {
        items: results,
        total,
        hasMore: offset + results.length < total,
      };
    },

    async findPendingForPrincipal(
      principalId: PrincipalId
    ): Promise<readonly ApprovalInstance[]> {
      await simulateDelay();
      maybeThrow();

      return Array.from(approvals.values()).filter((approval) => {
        if (approval.status !== "pending") return false;

        // Check if principal is an approver on the active stage
        const activeStage = approval.stages.find((s) => s.status === "active");
        if (!activeStage) return false;

        // Check if they're an approver and haven't voted
        if (!activeStage.approvers.includes(principalId)) return false;
        if (activeStage.votes.some((v) => v.principalId === principalId)) {
          return false;
        }

        return true;
      });
    },

    async findByInitiator(
      initiatorId: PrincipalId,
      options?: ApprovalQueryOptions
    ): Promise<PaginatedResult<ApprovalInstance>> {
      return this.findMany({ initiatorId }, options);
    },

    async findByEntityType(
      entityType: string,
      options?: ApprovalQueryOptions
    ): Promise<PaginatedResult<ApprovalInstance>> {
      await simulateDelay();
      maybeThrow();

      // Find all approvals with references matching the entity type
      const matchingIds: EntityId[] = [];
      for (const [key, approvalId] of references.entries()) {
        if (key.startsWith(`${entityType}:`)) {
          matchingIds.push(approvalId);
        }
      }

      let results = matchingIds
        .map((id) => approvals.get(id))
        .filter((a): a is ApprovalInstance => a !== undefined);

      const total = results.length;
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? 50;
      results = results.slice(offset, offset + limit);

      return {
        items: results,
        total,
        hasMore: offset + results.length < total,
      };
    },

    async findExpired(before: Date): Promise<readonly ApprovalInstance[]> {
      await simulateDelay();
      maybeThrow();

      return Array.from(approvals.values()).filter((approval) => {
        if (approval.status !== "pending") return false;
        if (!approval.expiresAt) return false;
        return new Date(approval.expiresAt) < before;
      });
    },

    async delete(id: EntityId): Promise<EngineResult<void>> {
      await simulateDelay();
      try {
        maybeThrow();
        approvals.delete(id);
        // Also clean up any references
        for (const [key, approvalId] of references.entries()) {
          if (approvalId === id) {
            references.delete(key);
          }
        }
        return success(undefined);
      } catch (err) {
        return failure("DELETE_FAILED", (err as Error).message);
      }
    },

    async exists(id: EntityId): Promise<boolean> {
      await simulateDelay();
      maybeThrow();
      return approvals.has(id);
    },
  };
}

// ============================================================================
// FILTER HELPERS
// ============================================================================

function applyFilters(
  approvals: ApprovalInstance[],
  filters: ApprovalQueryFilters
): ApprovalInstance[] {
  return approvals.filter((approval) => {
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      if (!statuses.includes(approval.status)) return false;
    }

    // Initiator filter
    if (filters.initiatorId && approval.initiatorId !== filters.initiatorId) {
      return false;
    }

    // Approver filter
    if (filters.approverId) {
      const isApprover = approval.stages.some((s) =>
        s.approvers.includes(filters.approverId!)
      );
      if (!isApprover) return false;
    }

    // Policy filter
    if (filters.policyId && approval.policyId !== filters.policyId) {
      return false;
    }

    // Date filters
    if (filters.createdAfter) {
      if (new Date(approval.createdAt) < filters.createdAfter) return false;
    }
    if (filters.createdBefore) {
      if (new Date(approval.createdAt) > filters.createdBefore) return false;
    }
    if (filters.expiringBefore && approval.expiresAt) {
      if (new Date(approval.expiresAt) > filters.expiringBefore) return false;
    }

    return true;
  });
}

function applySorting(
  approvals: ApprovalInstance[],
  sortBy: "createdAt" | "updatedAt" | "status",
  sortOrder: "asc" | "desc" = "desc"
): ApprovalInstance[] {
  return [...approvals].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "updatedAt":
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a repository with test data for development
 */
export function createMockRepositoryWithTestData(): LinkedApprovalRepository {
  return createMockApprovalRepository({
    delay: 100,
    initialData: [],
  });
}
