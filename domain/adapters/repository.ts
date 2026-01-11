/**
 * Repository Port
 *
 * Generic repository interface for CRUD operations on any entity type.
 * Implementations can be in-memory, local storage, or remote API.
 */

import type { EntityId, PaginationRequest, PaginatedResult, SortSpec } from "../core/types"
import type { Result } from "../core/errors"

// ============================================================================
// REPOSITORY PORT
// ============================================================================

/**
 * Generic repository interface
 */
export interface Repository<T extends { id: EntityId }> {
  /**
   * Find entity by ID
   */
  findById(id: EntityId): Promise<Result<T | null>>

  /**
   * Find all entities matching criteria
   */
  findAll(options?: QueryOptions<T>): Promise<Result<T[]>>

  /**
   * Find entities with pagination
   */
  findPaginated(
    options?: QueryOptions<T>,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<T>>>

  /**
   * Save an entity (create or update)
   */
  save(entity: T): Promise<Result<T>>

  /**
   * Save multiple entities
   */
  saveAll(entities: readonly T[]): Promise<Result<T[]>>

  /**
   * Delete entity by ID
   */
  delete(id: EntityId): Promise<Result<boolean>>

  /**
   * Check if entity exists
   */
  exists(id: EntityId): Promise<Result<boolean>>

  /**
   * Count entities matching criteria
   */
  count(filter?: Partial<T>): Promise<Result<number>>
}

/**
 * Query options for repository operations
 */
export interface QueryOptions<T> {
  readonly filter?: Partial<T>
  readonly sort?: SortSpec | readonly SortSpec[]
  readonly include?: readonly string[]
}

// ============================================================================
// SPECIALIZED REPOSITORIES
// ============================================================================

/**
 * Versioned repository with revision support
 */
export interface VersionedRepository<T extends { id: EntityId }> extends Repository<T> {
  /**
   * Find all versions of an entity
   */
  findVersions(id: EntityId): Promise<Result<T[]>>

  /**
   * Find specific version
   */
  findVersion(id: EntityId, version: string): Promise<Result<T | null>>

  /**
   * Save as new version
   */
  saveVersion(entity: T): Promise<Result<T>>
}

/**
 * Auditable repository with history tracking
 */
export interface AuditableRepository<T extends { id: EntityId }> extends Repository<T> {
  /**
   * Get audit history for entity
   */
  getHistory(id: EntityId): Promise<Result<AuditEntry[]>>

  /**
   * Find entities by audit criteria
   */
  findByAudit(criteria: AuditCriteria): Promise<Result<T[]>>
}

/**
 * Audit entry for history tracking
 */
export interface AuditEntry {
  readonly id: EntityId
  readonly entityId: EntityId
  readonly action: "create" | "update" | "delete"
  readonly actorId: EntityId
  readonly timestamp: Date
  readonly changes?: Readonly<Record<string, { old: unknown; new: unknown }>>
  readonly notes?: string
}

/**
 * Audit criteria for queries
 */
export interface AuditCriteria {
  readonly entityId?: EntityId
  readonly actorId?: EntityId
  readonly action?: "create" | "update" | "delete"
  readonly after?: Date
  readonly before?: Date
}

// ============================================================================
// UNIT OF WORK
// ============================================================================

/**
 * Unit of work for transactional operations
 */
export interface UnitOfWork {
  /**
   * Start a transaction
   */
  begin(): Promise<void>

  /**
   * Commit the transaction
   */
  commit(): Promise<void>

  /**
   * Rollback the transaction
   */
  rollback(): Promise<void>

  /**
   * Check if transaction is active
   */
  isActive(): boolean
}

/**
 * Repository factory within a unit of work
 */
export interface RepositoryFactory {
  getRepository<T extends { id: EntityId }>(name: string): Repository<T>
  getUnitOfWork(): UnitOfWork
}
