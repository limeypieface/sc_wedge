/**
 * Approval Repository Port
 *
 * Defines the interface for persisting and retrieving approvals.
 * This is a port in the hexagonal architecture - implementations
 * live in the adapters layer.
 *
 * Design principles:
 * - Interface is defined by the application, not infrastructure
 * - No framework or database-specific types
 * - Async operations to support various backends
 */

import {
  ApprovalInstance,
  EntityId,
  PrincipalId,
  ApprovalStatus,
  EngineResult,
} from "../../domain/approval-engine";

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Filters for querying approvals
 */
export interface ApprovalQueryFilters {
  /** Filter by status */
  readonly status?: ApprovalStatus | readonly ApprovalStatus[];
  /** Filter by initiator */
  readonly initiatorId?: PrincipalId;
  /** Filter by approver (at any stage) */
  readonly approverId?: PrincipalId;
  /** Filter by policy */
  readonly policyId?: EntityId;
  /** Filter by creation date range */
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  /** Filter by expiration */
  readonly expiringBefore?: Date;
}

/**
 * Options for querying approvals
 */
export interface ApprovalQueryOptions {
  /** Maximum number of results */
  readonly limit?: number;
  /** Offset for pagination */
  readonly offset?: number;
  /** Sort field */
  readonly sortBy?: "createdAt" | "updatedAt" | "status";
  /** Sort direction */
  readonly sortOrder?: "asc" | "desc";
}

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly hasMore: boolean;
}

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

/**
 * Repository for approval instances
 */
export interface ApprovalRepository {
  /**
   * Save an approval instance
   * Creates if new, updates if exists
   */
  save(approval: ApprovalInstance): Promise<EngineResult<ApprovalInstance>>;

  /**
   * Find an approval by ID
   */
  findById(id: EntityId): Promise<ApprovalInstance | undefined>;

  /**
   * Find approvals matching filters
   */
  findMany(
    filters?: ApprovalQueryFilters,
    options?: ApprovalQueryOptions
  ): Promise<PaginatedResult<ApprovalInstance>>;

  /**
   * Find approvals awaiting action from a principal
   */
  findPendingForPrincipal(
    principalId: PrincipalId
  ): Promise<readonly ApprovalInstance[]>;

  /**
   * Find approvals initiated by a principal
   */
  findByInitiator(
    initiatorId: PrincipalId,
    options?: ApprovalQueryOptions
  ): Promise<PaginatedResult<ApprovalInstance>>;

  /**
   * Find expired approvals that need to be processed
   */
  findExpired(before: Date): Promise<readonly ApprovalInstance[]>;

  /**
   * Delete an approval (for cleanup/testing)
   */
  delete(id: EntityId): Promise<EngineResult<void>>;

  /**
   * Check if an approval exists
   */
  exists(id: EntityId): Promise<boolean>;
}

// ============================================================================
// APPROVAL REFERENCE
// ============================================================================

/**
 * Lightweight reference to an external entity being approved
 */
export interface ApprovalReference {
  /** Type of entity (e.g., "purchase_order", "expense_report") */
  readonly entityType: string;
  /** External entity ID */
  readonly entityId: string;
  /** Human-readable label */
  readonly label: string;
}

/**
 * Extended repository that supports linking approvals to external entities
 */
export interface LinkedApprovalRepository extends ApprovalRepository {
  /**
   * Save approval with a reference to an external entity
   */
  saveWithReference(
    approval: ApprovalInstance,
    reference: ApprovalReference
  ): Promise<EngineResult<ApprovalInstance>>;

  /**
   * Find approval for a specific external entity
   */
  findByReference(reference: ApprovalReference): Promise<ApprovalInstance | undefined>;

  /**
   * Find all approvals for an entity type
   */
  findByEntityType(
    entityType: string,
    options?: ApprovalQueryOptions
  ): Promise<PaginatedResult<ApprovalInstance>>;
}
