/**
 * Revision & Versioning Engine
 *
 * Semantic versioning, change tracking, and delta management.
 * Pure functions with no side effects.
 */

import { defaultIdGenerator, deepEqual, isPlainObject } from "../core/utils"
import type { Actor } from "../core/types"
import type {
  SemanticVersion,
  ChangeSignificance,
  Revision,
  VersionedDocument,
  ChangeSet,
  FieldChange,
  CollectionChange,
  ChangeStats,
  RevisionComparison,
  ComparisonOptions,
  RevisionEngineConfig,
  CreateRevisionInput,
  RevisionFilter,
  RevisionSort,
} from "./types"

// ============================================================================
// VERSION FUNCTIONS
// ============================================================================

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

export function formatVersion(version: SemanticVersion): string {
  const base = `${version.major}.${version.minor}.${version.patch}`
  return version.preRelease ? `${base}-${version.preRelease}` : base
}

export function compareVersions(a: SemanticVersion, b: SemanticVersion): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  if (a.preRelease && !b.preRelease) return -1
  if (!a.preRelease && b.preRelease) return 1
  return 0
}

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
  }
}

export function createInitialVersion(preRelease?: string): SemanticVersion {
  return { major: 1, minor: 0, patch: 0, preRelease }
}

// ============================================================================
// REVISION ENGINE
// ============================================================================

export function createRevisionEngine<TData = Record<string, unknown>>(
  config: RevisionEngineConfig = {}
) {
  const {
    generateId = defaultIdGenerator.generate,
    defaultComparisonOptions = {},
    fieldLabels = {},
    majorChangeFields = [],
    minorChangeFields = [],
    ignoreFields = [],
  } = config

  return {
    createDocument(
      documentType: string,
      initialData: TData,
      createdBy: Actor,
      options?: {
        documentNumber?: string
        changeSummary?: string
        tags?: readonly string[]
        meta?: Record<string, unknown>
      }
    ): { document: VersionedDocument<TData>; revision: Revision<TData> } {
      const now = new Date()
      const documentId = generateId("doc")
      const revisionId = generateId("rev")
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

    createRevision(
      document: VersionedDocument<TData>,
      previousRevision: Revision<TData>,
      input: CreateRevisionInput<TData>
    ): { document: VersionedDocument<TData>; revision: Revision<TData> } {
      const now = new Date()
      const revisionId = generateId("rev")

      const changeSet = this.calculateChanges(previousRevision.data, input.data)
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

    publishRevision(
      document: VersionedDocument<TData>,
      revision: Revision<TData>
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

    approveRevision(revision: Revision<TData>, approvedBy: Actor): Revision<TData> {
      return {
        ...revision,
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
      }
    },

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
        fieldLabels as Record<string, string>,
        majorChangeFields as string[],
        minorChangeFields as string[],
        ignoreFields as string[]
      )
    },

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

    suggestVersionBump(changeSet: ChangeSet): ChangeSignificance {
      if (changeSet.stats.majorChanges > 0) return "major"
      if (changeSet.stats.minorChanges > 0) return "minor"
      return "patch"
    },

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

      return parts.length > 0 ? parts.join(", ") : "No changes"
    },
  }
}

// ============================================================================
// DEEP COMPARISON (internal)
// ============================================================================

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

  for (const key of Array.from(allKeys)) {
    const path = basePath ? `${basePath}.${key}` : key

    if (ignoreFields.includes(path) || options.ignorePaths?.includes(path)) {
      continue
    }

    if (options.maxDepth && path.split(".").length > options.maxDepth) {
      continue
    }

    const oldValue = oldObj?.[key]
    const newValue = newObj?.[key]

    const significance = getFieldSignificance(
      path,
      majorChangeFields,
      minorChangeFields,
      options
    )

    if (Array.isArray(oldValue) || Array.isArray(newValue)) {
      const arrayChanges = compareArrays(oldValue as unknown[], newValue as unknown[], path)
      collectionChanges.push(...arrayChanges.collectionChanges)
      fieldChanges.push(...arrayChanges.fieldChanges)
      continue
    }

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

    if (oldValue === undefined && newValue !== undefined) {
      fieldChanges.push({ path, type: "added", newValue, significance, label: fieldLabels[path] })
    } else if (oldValue !== undefined && newValue === undefined) {
      fieldChanges.push({ path, type: "removed", oldValue, significance, label: fieldLabels[path] })
    } else if (!deepEqual(oldValue, newValue)) {
      fieldChanges.push({ path, type: "modified", oldValue, newValue, significance, label: fieldLabels[path] })
    }
  }

  return { fieldChanges, collectionChanges, stats: calculateStats(fieldChanges, collectionChanges) }
}

function compareArrays(
  oldArr: unknown[] | undefined,
  newArr: unknown[] | undefined,
  path: string
): { collectionChanges: CollectionChange[]; fieldChanges: FieldChange[] } {
  const collectionChanges: CollectionChange[] = []
  const fieldChanges: FieldChange[] = []

  const old = oldArr || []
  const current = newArr || []

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
    if (id !== undefined) oldById.set(id, { item, index })
  })

  current.forEach((item, index) => {
    const id = getItemId(item)
    if (id !== undefined) newById.set(id, { item, index })
  })

  for (const [id, { item, index }] of Array.from(newById.entries())) {
    if (!oldById.has(id)) {
      collectionChanges.push({ path, type: "item_added", itemId: id, index, newItem: item })
    }
  }

  for (const [id, { item, index }] of Array.from(oldById.entries())) {
    if (!newById.has(id)) {
      collectionChanges.push({ path, type: "item_removed", itemId: id, index, oldItem: item })
    }
  }

  for (const [id, { item: newItem }] of Array.from(newById.entries())) {
    const oldEntry = oldById.get(id)
    if (oldEntry && !deepEqual(oldEntry.item, newItem)) {
      collectionChanges.push({ path, type: "item_modified", itemId: id, oldItem: oldEntry.item, newItem })
    }
  }

  return { collectionChanges, fieldChanges }
}

function calculateStats(fieldChanges: FieldChange[], collectionChanges: CollectionChange[]): ChangeStats {
  let totalChanges = 0
  let fieldsAdded = 0
  let fieldsRemoved = 0
  let fieldsModified = 0
  let itemsAdded = 0
  let itemsRemoved = 0
  let itemsModified = 0
  let majorChanges = 0
  let minorChanges = 0
  let patchChanges = 0

  for (const change of fieldChanges) {
    totalChanges++
    if (change.type === "added") fieldsAdded++
    else if (change.type === "removed") fieldsRemoved++
    else if (change.type === "modified") fieldsModified++
    if (change.significance === "major") majorChanges++
    else if (change.significance === "minor") minorChanges++
    else patchChanges++
  }

  for (const change of collectionChanges) {
    totalChanges++
    if (change.type === "item_added") itemsAdded++
    else if (change.type === "item_removed") itemsRemoved++
    else if (change.type === "item_modified") itemsModified++
  }

  return {
    totalChanges,
    fieldsAdded,
    fieldsRemoved,
    fieldsModified,
    itemsAdded,
    itemsRemoved,
    itemsModified,
    majorChanges,
    minorChanges,
    patchChanges,
  }
}

function getFieldSignificance(
  path: string,
  majorChangeFields: string[],
  minorChangeFields: string[],
  options: ComparisonOptions
): ChangeSignificance {
  if (majorChangeFields.includes(path) || options.majorChangePaths?.includes(path)) return "major"
  if (minorChangeFields.includes(path) || options.minorChangePaths?.includes(path)) return "minor"
  return "patch"
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

export function filterRevisions<TData>(
  revisions: readonly Revision<TData>[],
  filter: RevisionFilter
): Revision<TData>[] {
  return revisions.filter((revision) => {
    if (filter.documentId && revision.documentId !== filter.documentId) return false
    if (filter.statuses?.length && !filter.statuses.includes(revision.status)) return false
    if (filter.createdBy && revision.createdBy.id !== filter.createdBy) return false
    if (filter.createdAfter && revision.createdAt < filter.createdAfter) return false
    if (filter.createdBefore && revision.createdAt > filter.createdBefore) return false
    if (filter.tags?.length) {
      const hasAllTags = filter.tags.every((tag) => revision.tags?.includes(tag))
      if (!hasAllTags) return false
    }
    if (filter.minVersion && compareVersions(revision.version, filter.minVersion) < 0) return false
    if (filter.maxVersion && compareVersions(revision.version, filter.maxVersion) > 0) return false
    return true
  })
}

export function sortRevisions<TData>(
  revisions: readonly Revision<TData>[],
  sort: RevisionSort
): Revision<TData>[] {
  const sorted = [...revisions]
  const multiplier = sort.direction === "asc" ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case "version": return compareVersions(a.version, b.version) * multiplier
      case "createdAt": return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier
      case "revisionNumber": return (a.revisionNumber - b.revisionNumber) * multiplier
      default: return 0
    }
  })

  return sorted
}
