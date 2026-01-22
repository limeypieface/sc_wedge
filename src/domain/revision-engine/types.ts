/**
 * Revision & Versioning Engine - Types
 *
 * Semantic versioning, change tracking, and delta management.
 */

import type { EntityId, Actor, Timestamp } from "../core/types"

// ============================================================================
// VERSION TYPES
// ============================================================================

export interface SemanticVersion {
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly preRelease?: string
}

export type ChangeSignificance = "major" | "minor" | "patch"

export type RevisionStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "superseded"
  | "archived"

// ============================================================================
// REVISION TYPES
// ============================================================================

export interface Revision<TData = Record<string, unknown>> {
  readonly id: EntityId
  readonly documentId: EntityId
  readonly version: SemanticVersion
  readonly versionString: string
  readonly revisionNumber: number
  readonly status: RevisionStatus
  readonly data: TData
  readonly changes?: ChangeSet
  readonly changeSummary?: string
  readonly previousRevisionId?: EntityId
  readonly createdBy: Actor
  readonly createdAt: Timestamp
  readonly approvedBy?: Actor
  readonly approvedAt?: Timestamp
  readonly publishedAt?: Timestamp
  readonly tags?: readonly string[]
  readonly meta?: Readonly<Record<string, unknown>>
}

export interface VersionedDocument<TData = Record<string, unknown>> {
  readonly id: EntityId
  readonly documentType: string
  readonly documentNumber?: string
  readonly currentVersion?: SemanticVersion
  readonly currentVersionString?: string
  readonly currentRevisionId?: EntityId
  readonly latestVersion: SemanticVersion
  readonly latestRevisionId: EntityId
  readonly revisionIds: readonly EntityId[]
  readonly revisionCount: number
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly meta?: Readonly<Record<string, unknown>>
}

// ============================================================================
// CHANGE TRACKING TYPES
// ============================================================================

export interface ChangeSet {
  readonly fieldChanges: readonly FieldChange[]
  readonly collectionChanges: readonly CollectionChange[]
  readonly stats: ChangeStats
}

export interface FieldChange {
  readonly path: string
  readonly type: "added" | "removed" | "modified"
  readonly oldValue?: unknown
  readonly newValue?: unknown
  readonly significance: ChangeSignificance
  readonly label?: string
}

export interface CollectionChange {
  readonly path: string
  readonly type: "item_added" | "item_removed" | "item_modified" | "reordered"
  readonly itemId?: string | number
  readonly index?: number
  readonly oldItem?: unknown
  readonly newItem?: unknown
  readonly itemChanges?: readonly FieldChange[]
}

export interface ChangeStats {
  readonly totalChanges: number
  readonly fieldsAdded: number
  readonly fieldsRemoved: number
  readonly fieldsModified: number
  readonly itemsAdded: number
  readonly itemsRemoved: number
  readonly itemsModified: number
  readonly majorChanges: number
  readonly minorChanges: number
  readonly patchChanges: number
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

export interface ComparisonOptions {
  readonly ignorePaths?: readonly string[]
  readonly maxDepth?: number
  readonly majorChangePaths?: readonly string[]
  readonly minorChangePaths?: readonly string[]
}

export interface RevisionComparison<TData = Record<string, unknown>> {
  readonly fromRevision: {
    readonly id: EntityId
    readonly version: SemanticVersion
    readonly versionString: string
  }
  readonly toRevision: {
    readonly id: EntityId
    readonly version: SemanticVersion
    readonly versionString: string
  }
  readonly changeSet: ChangeSet
  readonly identical: boolean
  readonly suggestedBump: ChangeSignificance
}

// ============================================================================
// ENGINE TYPES
// ============================================================================

export interface RevisionEngineConfig {
  readonly generateId?: () => EntityId
  readonly defaultComparisonOptions?: ComparisonOptions
  readonly fieldLabels?: Readonly<Record<string, string>>
  readonly majorChangeFields?: readonly string[]
  readonly minorChangeFields?: readonly string[]
  readonly ignoreFields?: readonly string[]
}

export interface CreateRevisionInput<TData = Record<string, unknown>> {
  readonly data: TData
  readonly createdBy: Actor
  readonly status?: RevisionStatus
  readonly changeSummary?: string
  readonly forceBump?: ChangeSignificance
  readonly tags?: readonly string[]
  readonly meta?: Readonly<Record<string, unknown>>
}

export interface RevisionFilter {
  readonly documentId?: EntityId
  readonly statuses?: readonly RevisionStatus[]
  readonly createdBy?: EntityId
  readonly createdAfter?: Timestamp
  readonly createdBefore?: Timestamp
  readonly tags?: readonly string[]
  readonly minVersion?: SemanticVersion
  readonly maxVersion?: SemanticVersion
}

export interface RevisionSort {
  readonly field: "version" | "createdAt" | "revisionNumber"
  readonly direction: "asc" | "desc"
}
