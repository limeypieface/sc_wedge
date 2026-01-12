/**
 * Revision & Versioning Engine
 *
 * Semantic versioning, change tracking, and delta management.
 * Pure functions with no side effects.
 *
 * Features:
 * - Semantic versioning (major.minor.patch)
 * - Deep change detection
 * - Change significance classification
 * - Revision history management
 * - Version comparison and merging
 */

import type {
  SemanticVersion,
  ChangeSignificance,
  RevisionStatus,
  Revision,
  VersionedDocument,
  ChangeSet,
  FieldChange,
  CollectionChange,
  ChangeStats,
  RevisionComparison,
  ComparisonOptions,
  MergeResult,
  MergeConflict,
  ConflictResolution,
  RevisionEngineConfig,
  CreateRevisionInput,
  RevisionFilter,
  RevisionSort,
} from "./types"

export * from "./types"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Parse version string to SemanticVersion
 */
export function parseVersion(versionString: string): SemanticVersion {
  const [versionPart, preRelease] = versionString.split("-")
  const [major, minor, patch] = versionPart.split(".").map(Number)
  return {
    major: major || 0,
    minor: minor || 0,
    patch: patch || 0,
    preRelease,
  }
}

/**
 * Format SemanticVersion to string
 */
export function formatVersion(version: SemanticVersion): string {
  const base = `${version.major}.${version.minor}.${version.patch}`
  return version.preRelease ? `${base}-${version.preRelease}` : base
}

/**
 * Compare two versions
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareVersions(a: SemanticVersion, b: SemanticVersion): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  // Pre-release versions are lower than release versions
  if (a.preRelease && !b.preRelease) return -1
  if (!a.preRelease && b.preRelease) return 1
  return 0
}

/**
 * Increment version based on change significance
 */
export function incrementVersion(
  version: SemanticVersion,
  bump: ChangeSignificance
): SemanticVersion {
  switch (bump) {
    case "major":
      return { major: version.major + 1, minor: 0, patch: 0 }
    case "minor":
      return { major: version.major, minor: version.minor + 1, patch: 0 }
    case "patch":
      return { major: version.major, minor: version.minor, patch: version.patch + 1 }
    default:
      return version
  }
}

/**
 * Create initial version
 */
export function createInitialVersion(preRelease?: string): SemanticVersion {
  return { major: 1, minor: 0, patch: 0, preRelease }
}

// ============================================================================
// REVISION ENGINE
// ============================================================================

/**
 * Create a revision engine
 */
export function createRevisionEngine<TData = Record<string, unknown>>(
  config: RevisionEngineConfig = {}
) {
  const {
    generateId: customGenerateId = generateId,
    defaultComparisonOptions = {},
    fieldLabels = {},
    majorChangeFields = [],
    minorChangeFields = [],
    ignoreFields = [],
  } = config

  return {
    /**
     * Create a new versioned document
     */
    createDocument(
      documentType: string,
      initialData: TData,
      createdBy: string,
      options?: {
        documentNumber?: string
        changeSummary?: string
        tags?: string[]
        meta?: Record<string, unknown>
      }
    ): { document: VersionedDocument<TData>; revision: Revision<TData> } {
      const now = new Date()
      const documentId = customGenerateId()
      const revisionId = customGenerateId()
      const initialVersion = createInitialVersion()

      const revision: Revision<TData> = {
        id: revisionId,
        documentId,
        version: initialVersion,
        versionString: formatVersion(initialVersion),
        revisionNumber: 1,
        status: "draft",
        data: initialData,
        createdBy,
        createdAt: now,
        changeSummary: options?.changeSummary || "Initial version",
        tags: options?.tags,
        meta: options?.meta,
      }

      const document: VersionedDocument<TData> = {
        id: documentId,
        documentType,
        documentNumber: options?.documentNumber,
        latestRevisionId: revisionId,
        latestVersion: initialVersion,
        revisionIds: [revisionId],
        revisionCount: 1,
        createdAt: now,
        updatedAt: now,
        meta: options?.meta,
      }

      return { document, revision }
    },

    /**
     * Create a new revision of a document
     */
    createRevision(
      document: VersionedDocument<TData>,
      previousRevision: Revision<TData>,
      input: CreateRevisionInput<TData>
    ): { document: VersionedDocument<TData>; revision: Revision<TData> } {
      const now = new Date()
      const revisionId = customGenerateId()

      // Calculate changes
      const changeSet = this.calculateChanges(previousRevision.data, input.data)

      // Determine version bump
      const bump = input.forceBump || this.suggestVersionBump(changeSet)
      const newVersion = incrementVersion(previousRevision.version, bump)

      const revision: Revision<TData> = {
        id: revisionId,
        documentId: document.id,
        version: newVersion,
        versionString: formatVersion(newVersion),
        revisionNumber: document.revisionCount + 1,
        status: input.status || "draft",
        data: input.data,
        changes: changeSet,
        changeSummary: input.changeSummary || this.generateChangeSummary(changeSet),
        createdBy: input.createdBy,
        createdByName: input.createdByName,
        createdAt: now,
        previousRevisionId: previousRevision.id,
        tags: input.tags,
        meta: input.meta,
      }

      const updatedDocument: VersionedDocument<TData> = {
        ...document,
        latestRevisionId: revisionId,
        latestVersion: newVersion,
        revisionIds: [...document.revisionIds, revisionId],
        revisionCount: document.revisionCount + 1,
        updatedAt: now,
      }

      return { document: updatedDocument, revision }
    },

    /**
     * Publish a revision (make it the current version)
     */
    publishRevision(
      document: VersionedDocument<TData>,
      revision: Revision<TData>,
      publishedBy?: string
    ): { document: VersionedDocument<TData>; revision: Revision<TData> } {
      const now = new Date()

      const updatedRevision: Revision<TData> = {
        ...revision,
        status: "published",
        publishedAt: now,
      }

      const updatedDocument: VersionedDocument<TData> = {
        ...document,
        currentVersion: revision.version,
        currentVersionString: revision.versionString,
        currentRevisionId: revision.id,
        updatedAt: now,
      }

      return { document: updatedDocument, revision: updatedRevision }
    },

    /**
     * Approve a revision
     */
    approveRevision(
      revision: Revision<TData>,
      approvedBy: string
    ): Revision<TData> {
      return {
        ...revision,
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
      }
    },

    /**
     * Archive a revision
     */
    archiveRevision(revision: Revision<TData>): Revision<TData> {
      return {
        ...revision,
        status: "archived",
      }
    },

    /**
     * Mark a revision as superseded
     */
    supersededRevision(revision: Revision<TData>): Revision<TData> {
      return {
        ...revision,
        status: "superseded",
      }
    },

    /**
     * Calculate changes between two data snapshots
     */
    calculateChanges(
      oldData: TData,
      newData: TData,
      options?: ComparisonOptions
    ): ChangeSet {
      const opts = { ...defaultComparisonOptions, ...options }
      return deepCompare(
        oldData as Record<string, unknown>,
        newData as Record<string, unknown>,
        opts,
        "",
        fieldLabels,
        majorChangeFields,
        minorChangeFields,
        ignoreFields
      )
    },

    /**
     * Compare two revisions
     */
    compareRevisions(
      fromRevision: Revision<TData>,
      toRevision: Revision<TData>,
      options?: ComparisonOptions
    ): RevisionComparison<TData> {
      const changeSet = this.calculateChanges(
        fromRevision.data,
        toRevision.data,
        options
      )

      return {
        fromRevision: {
          id: fromRevision.id,
          version: fromRevision.version,
          versionString: fromRevision.versionString,
        },
        toRevision: {
          id: toRevision.id,
          version: toRevision.version,
          versionString: toRevision.versionString,
        },
        changeSet,
        identical: changeSet.stats.totalChanges === 0,
        suggestedBump: this.suggestVersionBump(changeSet),
      }
    },

    /**
     * Suggest a version bump based on changes
     */
    suggestVersionBump(changeSet: ChangeSet): ChangeSignificance {
      if (changeSet.stats.majorChanges > 0) return "major"
      if (changeSet.stats.minorChanges > 0) return "minor"
      return "patch"
    },

    /**
     * Generate a human-readable change summary
     */
    generateChangeSummary(changeSet: ChangeSet): string {
      const parts: string[] = []

      if (changeSet.stats.fieldsAdded > 0) {
        parts.push(`${changeSet.stats.fieldsAdded} field(s) added`)
      }
      if (changeSet.stats.fieldsRemoved > 0) {
        parts.push(`${changeSet.stats.fieldsRemoved} field(s) removed`)
      }
      if (changeSet.stats.fieldsModified > 0) {
        parts.push(`${changeSet.stats.fieldsModified} field(s) modified`)
      }
      if (changeSet.stats.itemsAdded > 0) {
        parts.push(`${changeSet.stats.itemsAdded} item(s) added`)
      }
      if (changeSet.stats.itemsRemoved > 0) {
        parts.push(`${changeSet.stats.itemsRemoved} item(s) removed`)
      }
      if (changeSet.stats.itemsModified > 0) {
        parts.push(`${changeSet.stats.itemsModified} item(s) modified`)
      }

      return parts.length > 0 ? parts.join(", ") : "No changes"
    },

    /**
     * Get a specific field's change from a changeset
     */
    getFieldChange(changeSet: ChangeSet, path: string): FieldChange | undefined {
      return changeSet.fieldChanges.find((c) => c.path === path)
    },

    /**
     * Get all changes for a path prefix
     */
    getChangesForPath(changeSet: ChangeSet, pathPrefix: string): FieldChange[] {
      return changeSet.fieldChanges.filter(
        (c) => c.path === pathPrefix || c.path.startsWith(`${pathPrefix}.`)
      )
    },
  }
}

// ============================================================================
// DEEP COMPARISON
// ============================================================================

/**
 * Deep compare two objects and generate a ChangeSet
 */
function deepCompare(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  options: ComparisonOptions,
  basePath: string,
  fieldLabels: Record<string, string>,
  majorChangeFields: string[],
  minorChangeFields: string[],
  ignoreFields: string[]
): ChangeSet {
  const fieldChanges: FieldChange[] = []
  const collectionChanges: CollectionChange[] = []

  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])

  for (const key of allKeys) {
    const path = basePath ? `${basePath}.${key}` : key

    // Skip ignored fields
    if (ignoreFields.includes(path) || options.ignorePaths?.includes(path)) {
      continue
    }

    // Check max depth
    if (options.maxDepth && path.split(".").length > options.maxDepth) {
      continue
    }

    const oldValue = oldObj?.[key]
    const newValue = newObj?.[key]

    // Determine significance
    const significance = getFieldSignificance(
      path,
      majorChangeFields,
      minorChangeFields,
      options
    )

    // Handle arrays
    if (Array.isArray(oldValue) || Array.isArray(newValue)) {
      const arrayChanges = compareArrays(
        oldValue as unknown[],
        newValue as unknown[],
        path,
        fieldLabels,
        majorChangeFields,
        minorChangeFields,
        ignoreFields,
        options
      )
      collectionChanges.push(...arrayChanges.collectionChanges)
      fieldChanges.push(...arrayChanges.fieldChanges)
      continue
    }

    // Handle nested objects
    if (isPlainObject(oldValue) && isPlainObject(newValue)) {
      const nested = deepCompare(
        oldValue as Record<string, unknown>,
        newValue as Record<string, unknown>,
        options,
        path,
        fieldLabels,
        majorChangeFields,
        minorChangeFields,
        ignoreFields
      )
      fieldChanges.push(...nested.fieldChanges)
      collectionChanges.push(...nested.collectionChanges)
      continue
    }

    // Handle added/removed/modified primitives
    if (oldValue === undefined && newValue !== undefined) {
      fieldChanges.push({
        path,
        type: "added",
        newValue,
        significance,
        label: fieldLabels[path],
      })
    } else if (oldValue !== undefined && newValue === undefined) {
      fieldChanges.push({
        path,
        type: "removed",
        oldValue,
        significance,
        label: fieldLabels[path],
      })
    } else if (!deepEqual(oldValue, newValue)) {
      fieldChanges.push({
        path,
        type: "modified",
        oldValue,
        newValue,
        significance,
        label: fieldLabels[path],
      })
    }
  }

  return {
    fieldChanges,
    collectionChanges,
    stats: calculateStats(fieldChanges, collectionChanges),
  }
}

/**
 * Compare two arrays
 */
function compareArrays(
  oldArr: unknown[] | undefined,
  newArr: unknown[] | undefined,
  path: string,
  fieldLabels: Record<string, string>,
  majorChangeFields: string[],
  minorChangeFields: string[],
  ignoreFields: string[],
  options: ComparisonOptions
): { collectionChanges: CollectionChange[]; fieldChanges: FieldChange[] } {
  const collectionChanges: CollectionChange[] = []
  const fieldChanges: FieldChange[] = []

  const old = oldArr || []
  const current = newArr || []

  // Track items by ID if they have one
  const getItemId = (item: unknown): string | number | undefined => {
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>
      return (obj.id as string | number) || (obj.key as string | number)
    }
    return undefined
  }

  const oldById = new Map<string | number, { item: unknown; index: number }>()
  const newById = new Map<string | number, { item: unknown; index: number }>()

  old.forEach((item, index) => {
    const id = getItemId(item)
    if (id !== undefined) {
      oldById.set(id, { item, index })
    }
  })

  current.forEach((item, index) => {
    const id = getItemId(item)
    if (id !== undefined) {
      newById.set(id, { item, index })
    }
  })

  // Find added items
  for (const [id, { item, index }] of newById) {
    if (!oldById.has(id)) {
      collectionChanges.push({
        path,
        type: "item_added",
        itemId: id,
        index,
        newItem: item,
      })
    }
  }

  // Find removed items
  for (const [id, { item, index }] of oldById) {
    if (!newById.has(id)) {
      collectionChanges.push({
        path,
        type: "item_removed",
        itemId: id,
        index,
        oldItem: item,
      })
    }
  }

  // Find modified items
  for (const [id, { item: newItem, index }] of newById) {
    const oldEntry = oldById.get(id)
    if (oldEntry && !deepEqual(oldEntry.item, newItem)) {
      const itemPath = `${path}[${id}]`
      const itemChanges = deepCompare(
        oldEntry.item as Record<string, unknown>,
        newItem as Record<string, unknown>,
        options,
        itemPath,
        fieldLabels,
        majorChangeFields,
        minorChangeFields,
        ignoreFields
      )

      collectionChanges.push({
        path,
        type: "item_modified",
        itemId: id,
        index,
        oldItem: oldEntry.item,
        newItem,
        itemChanges: itemChanges.fieldChanges,
      })

      fieldChanges.push(...itemChanges.fieldChanges)
    }
  }

  return { collectionChanges, fieldChanges }
}

/**
 * Calculate change statistics
 */
function calculateStats(
  fieldChanges: FieldChange[],
  collectionChanges: CollectionChange[]
): ChangeStats {
  const stats: ChangeStats = {
    totalChanges: 0,
    fieldsAdded: 0,
    fieldsRemoved: 0,
    fieldsModified: 0,
    itemsAdded: 0,
    itemsRemoved: 0,
    itemsModified: 0,
    majorChanges: 0,
    minorChanges: 0,
    patchChanges: 0,
  }

  for (const change of fieldChanges) {
    stats.totalChanges++
    switch (change.type) {
      case "added":
        stats.fieldsAdded++
        break
      case "removed":
        stats.fieldsRemoved++
        break
      case "modified":
        stats.fieldsModified++
        break
    }
    switch (change.significance) {
      case "major":
        stats.majorChanges++
        break
      case "minor":
        stats.minorChanges++
        break
      case "patch":
        stats.patchChanges++
        break
    }
  }

  for (const change of collectionChanges) {
    stats.totalChanges++
    switch (change.type) {
      case "item_added":
        stats.itemsAdded++
        break
      case "item_removed":
        stats.itemsRemoved++
        break
      case "item_modified":
        stats.itemsModified++
        break
    }
  }

  return stats
}

/**
 * Determine field significance
 */
function getFieldSignificance(
  path: string,
  majorChangeFields: string[],
  minorChangeFields: string[],
  options: ComparisonOptions
): ChangeSignificance {
  if (majorChangeFields.includes(path) || options.majorChangePaths?.includes(path)) {
    return "major"
  }
  if (minorChangeFields.includes(path) || options.minorChangePaths?.includes(path)) {
    return "minor"
  }
  return "patch"
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter revisions
 */
export function filterRevisions<TData>(
  revisions: Revision<TData>[],
  filter: RevisionFilter
): Revision<TData>[] {
  return revisions.filter((revision) => {
    if (filter.documentId && revision.documentId !== filter.documentId) {
      return false
    }
    if (filter.statuses?.length && !filter.statuses.includes(revision.status)) {
      return false
    }
    if (filter.createdBy && revision.createdBy !== filter.createdBy) {
      return false
    }
    if (filter.createdAfter && revision.createdAt < filter.createdAfter) {
      return false
    }
    if (filter.createdBefore && revision.createdAt > filter.createdBefore) {
      return false
    }
    if (filter.tags?.length) {
      const hasAllTags = filter.tags.every((tag) => revision.tags?.includes(tag))
      if (!hasAllTags) return false
    }
    if (filter.minVersion && compareVersions(revision.version, filter.minVersion) < 0) {
      return false
    }
    if (filter.maxVersion && compareVersions(revision.version, filter.maxVersion) > 0) {
      return false
    }
    return true
  })
}

/**
 * Sort revisions
 */
export function sortRevisions<TData>(
  revisions: Revision<TData>[],
  sort: RevisionSort
): Revision<TData>[] {
  const sorted = [...revisions]
  const multiplier = sort.direction === "asc" ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case "version":
        return compareVersions(a.version, b.version) * multiplier
      case "createdAt":
        return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier
      case "revisionNumber":
        return (a.revisionNumber - b.revisionNumber) * multiplier
      default:
        return 0
    }
  })

  return sorted
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((item, index) => deepEqual(item, b[index]))
    }

    if (isPlainObject(a) && isPlainObject(b)) {
      const aObj = a as Record<string, unknown>
      const bObj = b as Record<string, unknown>
      const keysA = Object.keys(aObj)
      const keysB = Object.keys(bObj)
      if (keysA.length !== keysB.length) return false
      return keysA.every((key) => deepEqual(aObj[key], bObj[key]))
    }
  }

  return false
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Get the latest published revision from a list
 */
export function getLatestPublished<TData>(
  revisions: Revision<TData>[]
): Revision<TData> | undefined {
  const published = revisions.filter((r) => r.status === "published")
  if (published.length === 0) return undefined
  return sortRevisions(published, { field: "version", direction: "desc" })[0]
}

/**
 * Check if a version is newer than another
 */
export function isNewerVersion(a: SemanticVersion, b: SemanticVersion): boolean {
  return compareVersions(a, b) > 0
}

/**
 * Get revision history (ordered oldest to newest)
 */
export function getRevisionHistory<TData>(
  revisions: Revision<TData>[],
  documentId: string
): Revision<TData>[] {
  return sortRevisions(
    filterRevisions(revisions, { documentId }),
    { field: "revisionNumber", direction: "asc" }
  )
}
