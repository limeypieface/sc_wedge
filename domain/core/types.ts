/**
 * Core Domain Types
 *
 * Shared value types used across all domain engines.
 * These are pure value types with no behavior or side effects.
 *
 * Design Principles:
 * - Branded types for type safety (prevents implicit coupling to format)
 * - No external dependencies
 * - Pure, serializable values
 * - Immutable by convention
 */

// ============================================================================
// IDENTITY TYPES
// ============================================================================

/**
 * Unique identifier for any entity in the system.
 * Branded to prevent accidental ID confusion.
 */
export type EntityId = string & { readonly __brand?: "EntityId" }

/**
 * Create a branded EntityId from a string
 */
export function entityId(id: string): EntityId {
  return id as EntityId
}

/**
 * Identifier for a principal (user, system, or service)
 */
export type PrincipalId = string & { readonly __brand?: "PrincipalId" }

/**
 * Create a branded PrincipalId from a string
 */
export function principalId(id: string): PrincipalId {
  return id as PrincipalId
}

/**
 * Actor type classification
 */
export type ActorType = "user" | "system" | "service" | "external"

/**
 * Actor who performs actions in the system
 */
export interface Actor {
  readonly id: PrincipalId
  readonly type: ActorType
  readonly name?: string
  readonly email?: string
  readonly roles?: readonly string[]
  readonly department?: string
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * System actor for automated actions
 */
export const SYSTEM_ACTOR: Actor = Object.freeze({
  id: "system" as PrincipalId,
  type: "system" as const,
  name: "System",
  roles: ["system"],
})

// ============================================================================
// TEMPORAL TYPES
// ============================================================================

/**
 * ISO 8601 timestamp string
 */
export type ISOTimestamp = string & { readonly __brand?: "ISOTimestamp" }

/**
 * Create a branded ISOTimestamp
 */
export function isoTimestamp(date?: Date | string): ISOTimestamp {
  if (typeof date === "string") {
    return date as ISOTimestamp
  }
  return (date ?? new Date()).toISOString() as ISOTimestamp
}

/**
 * Parse an ISOTimestamp to Date
 */
export function parseTimestamp(timestamp: ISOTimestamp): Date {
  return new Date(timestamp)
}

/**
 * Timestamp as Date object (runtime type)
 */
export type Timestamp = Date

/**
 * Duration specification
 */
export interface Duration {
  readonly value: number
  readonly unit: "seconds" | "minutes" | "hours" | "days" | "weeks" | "months"
}

/**
 * Duration in milliseconds
 */
export type DurationMs = number & { readonly __brand?: "DurationMs" }

/**
 * Create a branded DurationMs
 */
export function durationMs(ms: number): DurationMs {
  return ms as DurationMs
}

/**
 * Date range
 */
export interface DateRange {
  readonly start: Timestamp
  readonly end: Timestamp
}

/**
 * Common duration constants
 */
export const DURATIONS = {
  SECOND: 1000 as DurationMs,
  MINUTE: (60 * 1000) as DurationMs,
  HOUR: (60 * 60 * 1000) as DurationMs,
  DAY: (24 * 60 * 60 * 1000) as DurationMs,
  WEEK: (7 * 24 * 60 * 60 * 1000) as DurationMs,
} as const

// ============================================================================
// STATUS & PRIORITY TYPES
// ============================================================================

/**
 * Generic status type
 */
export type Status = string

/**
 * Priority levels
 */
export type Priority = "critical" | "high" | "normal" | "low"

/**
 * Priority numeric values for sorting (lower = higher priority)
 */
export const PRIORITY_ORDER: Readonly<Record<Priority, number>> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

/**
 * Audit entry for tracking changes
 */
export interface AuditEntry {
  readonly id: EntityId
  readonly action: string
  readonly actor: Actor
  readonly timestamp: Timestamp
  readonly details?: Readonly<Record<string, unknown>>
  readonly previousValue?: unknown
  readonly newValue?: unknown
  readonly notes?: string
}

/**
 * Auditable entity mixin
 */
export interface Auditable {
  readonly createdAt: Timestamp
  readonly createdBy: Actor
  readonly updatedAt: Timestamp
  readonly updatedBy?: Actor
  readonly auditLog?: readonly AuditEntry[]
}

/**
 * Soft delete fields
 */
export interface SoftDeletable {
  readonly deletedAt?: Timestamp
  readonly deletedBy?: Actor
  readonly isDeleted: boolean
}

// ============================================================================
// REFERENCE TYPES
// ============================================================================

/**
 * Object reference for linking entities
 */
export interface ObjectReference {
  readonly type: string
  readonly id: EntityId
  readonly label?: string
  readonly meta?: Readonly<Record<string, unknown>>
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Execution context for engine operations
 */
export interface ExecutionContext {
  readonly actor: Actor
  readonly timestamp: Timestamp
  readonly correlationId?: string
  readonly source?: string
  readonly meta?: Readonly<Record<string, unknown>>
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination request
 */
export interface PaginationRequest {
  readonly offset?: number
  readonly limit?: number
  readonly cursor?: string
}

/**
 * Pagination response
 */
export interface PaginationResponse {
  readonly offset: number
  readonly limit: number
  readonly total: number
  readonly hasMore: boolean
  readonly nextCursor?: string
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  readonly items: readonly T[]
  readonly pagination: PaginationResponse
}

// ============================================================================
// SORT TYPES
// ============================================================================

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc"

/**
 * Generic sort specification
 */
export interface SortSpec<TField extends string = string> {
  readonly field: TField
  readonly direction: SortDirection
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Deep readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Make specific keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Extract keys of type T that are strings
 */
export type StringKeys<T> = Extract<keyof T, string>

/**
 * Extract non-function properties (data only)
 */
export type DataOnly<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K]
}
