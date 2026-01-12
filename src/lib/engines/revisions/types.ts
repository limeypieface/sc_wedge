/**
 * Revision & Versioning Engine - Types
 *
 * Semantic versioning, change tracking, and delta management.
 * Supports document versioning with full history and comparisons.
 */

// ============================================================================
// CORE VERSION TYPES
// ============================================================================

/**
 * Semantic version components
 */
export interface SemanticVersion {
  major: number
  minor: number
  patch: number
  /** Optional pre-release label (e.g., "draft", "rc1") */
  preRelease?: string
}

/**
 * Change significance level
 */
export type ChangeSignificance = "major" | "minor" | "patch"

/**
 * Revision status
 */
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

/**
 * A single revision of a document/object
 */
export interface Revision<TData = Record<string, unknown>> {
  id: string
  /** The document this revision belongs to */
  documentId: string
  /** Semantic version */
  version: SemanticVersion
  /** Version string (e.g., "1.2.3") */
  versionString: string
  /** Revision number (sequential) */
  revisionNumber: number

  /** Current status */
  status: RevisionStatus

  /** The full data snapshot at this revision */
  data: TData

  /** Changes from previous revision */
  changes?: ChangeSet

  /** Summary of changes */
  changeSummary?: string

  /** Who made the revision */
  createdBy: string
  createdByName?: string

  /** Timestamps */
  createdAt: Date
  publishedAt?: Date

  /** Reference to previous revision */
  previousRevisionId?: string

  /** Approval information */
  approvedBy?: string
  approvedAt?: Date

  /** Metadata */
  tags?: string[]
  meta?: Record<string, unknown>
}

/**
 * A versioned document container
 */
export interface VersionedDocument<TData = Record<string, unknown>> {
  id: string
  /** Document type (e.g., "purchase_order", "contract") */
  documentType: string
  /** Human-readable identifier */
  documentNumber?: string

  /** Current published version */
  currentVersion?: SemanticVersion
  currentVersionString?: string
  currentRevisionId?: string

  /** Latest revision (may be draft) */
  latestRevisionId: string
  latestVersion: SemanticVersion

  /** All revision IDs (ordered oldest to newest) */
  revisionIds: string[]
  revisionCount: number

  /** Timestamps */
  createdAt: Date
  updatedAt: Date

  /** Metadata */
  meta?: Record<string, unknown>
}

// ============================================================================
// CHANGE TRACKING TYPES
// ============================================================================

/**
 * A set of changes between revisions
 */
export interface ChangeSet {
  /** Individual field changes */
  fieldChanges: FieldChange[]
  /** Array/collection changes */
  collectionChanges: CollectionChange[]
  /** Summary statistics */
  stats: ChangeStats
}

/**
 * A change to a single field
 */
export interface FieldChange {
  /** Path to the field (e.g., "header.supplier.name") */
  path: string
  /** Type of change */
  type: "added" | "removed" | "modified"
  /** Previous value */
  oldValue?: unknown
  /** New value */
  newValue?: unknown
  /** Significance of this change */
  significance: ChangeSignificance
  /** Human-readable label for the field */
  label?: string
}

/**
 * Changes to an array/collection
 */
export interface CollectionChange {
  /** Path to the collection */
  path: string
  /** Type of change */
  type: "item_added" | "item_removed" | "item_modified" | "reordered"
  /** Item identifier (if applicable) */
  itemId?: string | number
  /** Index in collection */
  index?: number
  /** The item change details */
  itemChanges?: FieldChange[]
  /** Old item (for removed/modified) */
  oldItem?: unknown
  /** New item (for added/modified) */
  newItem?: unknown
}

/**
 * Statistics about changes
 */
export interface ChangeStats {
  totalChanges: number
  fieldsAdded: number
  fieldsRemoved: number
  fieldsModified: number
  itemsAdded: number
  itemsRemoved: number
  itemsModified: number
  majorChanges: number
  minorChanges: number
  patchChanges: number
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

/**
 * Result of comparing two revisions
 */
export interface RevisionComparison<TData = Record<string, unknown>> {
  /** Source revision */
  fromRevision: {
    id: string
    version: SemanticVersion
    versionString: string
  }
  /** Target revision */
  toRevision: {
    id: string
    version: SemanticVersion
    versionString: string
  }
  /** The changes between them */
  changeSet: ChangeSet
  /** Whether they are identical */
  identical: boolean
  /** Suggested version bump */
  suggestedBump: ChangeSignificance
}

/**
 * Options for comparison
 */
export interface ComparisonOptions {
  /** Paths to ignore in comparison */
  ignorePaths?: string[]
  /** Paths that are always major changes */
  majorChangePaths?: string[]
  /** Paths that are always minor changes */
  minorChangePaths?: string[]
  /** Whether to include unchanged fields in output */
  includeUnchanged?: boolean
  /** Maximum depth to traverse */
  maxDepth?: number
}

// ============================================================================
// MERGE TYPES
// ============================================================================

/**
 * Result of attempting to merge revisions
 */
export interface MergeResult<TData = Record<string, unknown>> {
  /** Whether merge was successful */
  success: boolean
  /** Merged data (if successful) */
  mergedData?: TData
  /** Conflicts that need resolution */
  conflicts: MergeConflict[]
  /** Auto-resolved changes */
  autoResolved: FieldChange[]
}

/**
 * A conflict during merge
 */
export interface MergeConflict {
  /** Path to conflicting field */
  path: string
  /** Value in base revision */
  baseValue: unknown
  /** Value in "ours" revision */
  oursValue: unknown
  /** Value in "theirs" revision */
  theirsValue: unknown
  /** Suggested resolution (if any) */
  suggestion?: "ours" | "theirs" | "base"
}

/**
 * Strategy for resolving conflicts
 */
export type ConflictResolution = "ours" | "theirs" | "base" | "manual"

// ============================================================================
// ENGINE CONFIGURATION
// ============================================================================

/**
 * Configuration for the revision engine
 */
export interface RevisionEngineConfig {
  /** Generate unique IDs */
  generateId?: () => string

  /** Default comparison options */
  defaultComparisonOptions?: ComparisonOptions

  /** Field labels for change descriptions */
  fieldLabels?: Record<string, string>

  /** Fields that trigger major version bumps */
  majorChangeFields?: string[]

  /** Fields that trigger minor version bumps */
  minorChangeFields?: string[]

  /** Fields to always ignore in comparisons */
  ignoreFields?: string[]
}

/**
 * Input for creating a new revision
 */
export interface CreateRevisionInput<TData = Record<string, unknown>> {
  documentId: string
  data: TData
  createdBy: string
  createdByName?: string
  changeSummary?: string
  /** Force a specific version bump (otherwise auto-detected) */
  forceBump?: ChangeSignificance
  /** Initial status */
  status?: RevisionStatus
  tags?: string[]
  meta?: Record<string, unknown>
}

/**
 * Filter for querying revisions
 */
export interface RevisionFilter {
  documentId?: string
  statuses?: RevisionStatus[]
  createdBy?: string
  createdAfter?: Date
  createdBefore?: Date
  tags?: string[]
  minVersion?: SemanticVersion
  maxVersion?: SemanticVersion
}

/**
 * Sort options for revisions
 */
export interface RevisionSort {
  field: "version" | "createdAt" | "revisionNumber"
  direction: "asc" | "desc"
}
