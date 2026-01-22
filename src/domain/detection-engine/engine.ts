/**
 * Issue Detection Engine
 *
 * A rule-based system for detecting, categorizing, and prioritizing issues.
 * Pure functions with no side effects.
 */

import { defaultIdGenerator, PRIORITY_ORDER, type Priority } from "../core/utils"
import type { ObjectReference, Actor } from "../core/types"
import type {
  Issue,
  IssueStatus,
  IssueFilter,
  IssueSort,
  DetectionRule,
  DetectionContext,
  DetectionResult,
  DetectionEngineConfig,
  BatchDetectionInput,
  BatchDetectionOutput,
  SuggestedAction,
  IssueStats,
} from "./types"

// ============================================================================
// STATUS ORDERING
// ============================================================================

const STATUS_ORDER: Record<IssueStatus, number> = {
  open: 0,
  acknowledged: 1,
  in_progress: 2,
  resolved: 3,
  dismissed: 4,
}

// ============================================================================
// DETECTION ENGINE
// ============================================================================

/**
 * Create a detection engine with configured rules
 */
export function createDetectionEngine<TInput, TCategory extends string = string>(
  rules: DetectionRule<TInput, TCategory>[],
  config: DetectionEngineConfig = {}
) {
  const {
    generateId = defaultIdGenerator.generate,
    generateIssueNumber = defaultGenerateIssueNumber,
    defaultContext = {},
  } = config

  const rulesById = new Map<string, DetectionRule<TInput, TCategory>>()
  for (const rule of rules) {
    rulesById.set(rule.id, rule)
  }

  let issueCounter = 0

  return {
    /**
     * Detect issues from a single input
     */
    detect(
      input: TInput,
      context?: DetectionContext,
      ruleIds?: string[]
    ): Issue<TCategory>[] {
      const mergedContext: DetectionContext = {
        currentDate: new Date(),
        ...defaultContext,
        ...context,
      }

      const rulesToRun = ruleIds
        ? rules.filter((r) => ruleIds.includes(r.id) && r.enabled)
        : rules.filter((r) => r.enabled)

      const issues: Issue<TCategory>[] = []

      for (const rule of rulesToRun) {
        const results = rule.detect(input, mergedContext)

        for (const result of results) {
          issueCounter++
          issues.push(createIssue(result, rule, generateId, generateIssueNumber, issueCounter))
        }
      }

      return issues
    },

    /**
     * Detect issues from multiple inputs (batch)
     */
    detectBatch(batchInput: BatchDetectionInput<TInput>): BatchDetectionOutput<TCategory> {
      const { items, ruleIds, context } = batchInput
      const mergedContext: DetectionContext = {
        currentDate: new Date(),
        ...defaultContext,
        ...context,
      }

      const allIssues: Issue<TCategory>[] = []
      const rulesExecuted: string[] = []

      const rulesToRun = ruleIds
        ? rules.filter((r) => ruleIds.includes(r.id) && r.enabled)
        : rules.filter((r) => r.enabled)

      for (const rule of rulesToRun) {
        rulesExecuted.push(rule.id)

        for (const item of items) {
          const results = rule.detect(item, mergedContext)

          for (const result of results) {
            issueCounter++
            allIssues.push(createIssue(result, rule, generateId, generateIssueNumber, issueCounter))
          }
        }
      }

      const byCategorySummary = {} as Record<TCategory, number>
      const byPrioritySummary: Record<Priority, number> = {
        critical: 0,
        high: 0,
        normal: 0,
        low: 0,
      }

      for (const issue of allIssues) {
        byCategorySummary[issue.category] = (byCategorySummary[issue.category] || 0) + 1
        byPrioritySummary[issue.priority]++
      }

      const actionRequired = allIssues.filter(
        (i) => i.status === "open" && (i.priority === "critical" || i.priority === "high")
      )

      return {
        issues: allIssues,
        byCategorySummary,
        byPrioritySummary,
        actionRequired,
        detectedAt: new Date(),
        rulesExecuted,
      }
    },

    /**
     * Get all registered rules
     */
    getRules(): DetectionRule<TInput, TCategory>[] {
      return [...rules]
    },

    /**
     * Get a rule by ID
     */
    getRule(ruleId: string): DetectionRule<TInput, TCategory> | undefined {
      return rulesById.get(ruleId)
    },

    /**
     * Enable or disable a rule
     */
    setRuleEnabled(ruleId: string, enabled: boolean): boolean {
      const rule = rulesById.get(ruleId)
      if (rule) {
        rule.enabled = enabled
        return true
      }
      return false
    },
  }
}

// ============================================================================
// ISSUE CREATION
// ============================================================================

function createIssue<TInput, TCategory extends string>(
  result: DetectionResult<TCategory>,
  rule: DetectionRule<TInput, TCategory>,
  genId: (prefix?: string) => string,
  genNumber: (category: string, index: number) => string,
  index: number
): Issue<TCategory> {
  return {
    id: genId("iss"),
    issueNumber: genNumber(result.category, index),
    category: result.category,
    priority: result.priority,
    title: result.title,
    description: result.description,
    status: "open",
    suggestedAction: result.suggestedAction,
    relatedObjects: result.relatedObjects,
    affectedQuantity: result.affectedQuantity,
    affectedValue: result.affectedValue,
    detectedAt: new Date(),
    source: {
      type: "automatic",
      detector: rule.id,
    },
    sourceData: result.sourceData,
    meta: result.meta,
  }
}

function defaultGenerateIssueNumber(category: string, index: number): string {
  const prefix = category.toUpperCase().substring(0, 3)
  const year = new Date().getFullYear()
  const num = String(index).padStart(4, "0")
  return `${prefix}-${year}-${num}`
}

// ============================================================================
// ISSUE LIFECYCLE
// ============================================================================

/**
 * Acknowledge an issue
 */
export function acknowledgeIssue<TCategory extends string>(
  issue: Issue<TCategory>
): Issue<TCategory> {
  return {
    ...issue,
    status: "acknowledged",
    acknowledgedAt: new Date(),
  }
}

/**
 * Start working on an issue
 */
export function startIssue<TCategory extends string>(
  issue: Issue<TCategory>,
  assignedTo: Actor
): Issue<TCategory> {
  return {
    ...issue,
    status: "in_progress",
    assignedTo,
  }
}

/**
 * Resolve an issue
 */
export function resolveIssue<TCategory extends string>(
  issue: Issue<TCategory>,
  resolution: string,
  resolvedBy: Actor,
  notes?: string
): Issue<TCategory> {
  return {
    ...issue,
    status: "resolved",
    resolution,
    resolvedBy,
    resolutionNotes: notes,
    resolvedAt: new Date(),
  }
}

/**
 * Dismiss an issue
 */
export function dismissIssue<TCategory extends string>(
  issue: Issue<TCategory>,
  reason: string,
  dismissedBy: Actor
): Issue<TCategory> {
  return {
    ...issue,
    status: "dismissed",
    resolution: reason,
    resolvedBy: dismissedBy,
    resolvedAt: new Date(),
  }
}

/**
 * Reopen an issue
 */
export function reopenIssue<TCategory extends string>(
  issue: Issue<TCategory>
): Issue<TCategory> {
  return {
    ...issue,
    status: "open",
    resolvedAt: undefined,
    resolution: undefined,
    resolvedBy: undefined,
  }
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter issues
 */
export function filterIssues<TCategory extends string>(
  issues: readonly Issue<TCategory>[],
  filter: IssueFilter<TCategory>
): Issue<TCategory>[] {
  return issues.filter((issue) => {
    if (filter.categories?.length && !filter.categories.includes(issue.category)) return false
    if (filter.priorities?.length && !filter.priorities.includes(issue.priority)) return false
    if (filter.statuses?.length && !filter.statuses.includes(issue.status)) return false
    if (filter.assignedTo && issue.assignedTo?.id !== filter.assignedTo) return false
    if (filter.relatedObjectType || filter.relatedObjectId) {
      const hasMatch = issue.relatedObjects?.some(
        (ro) =>
          (!filter.relatedObjectType || ro.type === filter.relatedObjectType) &&
          (!filter.relatedObjectId || ro.id === filter.relatedObjectId)
      )
      if (!hasMatch) return false
    }
    if (filter.detectedAfter && issue.detectedAt < filter.detectedAfter) return false
    if (filter.detectedBefore && issue.detectedAt > filter.detectedBefore) return false
    return true
  })
}

/**
 * Sort issues
 */
export function sortIssues<TCategory extends string>(
  issues: readonly Issue<TCategory>[],
  sort: IssueSort
): Issue<TCategory>[] {
  const sorted = [...issues]
  const multiplier = sort.direction === "asc" ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case "priority":
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * multiplier
      case "status":
        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * multiplier
      case "detectedAt":
        return (a.detectedAt.getTime() - b.detectedAt.getTime()) * multiplier
      case "category":
        return a.category.localeCompare(b.category) * multiplier
      default:
        return 0
    }
  })

  return sorted
}

/**
 * Get action-required issues
 */
export function getActionRequiredIssues<TCategory extends string>(
  issues: readonly Issue<TCategory>[]
): Issue<TCategory>[] {
  return filterIssues(issues, {
    statuses: ["open"],
    priorities: ["critical", "high"],
  })
}

/**
 * Calculate issue statistics
 */
export function calculateIssueStats<TCategory extends string>(
  issues: readonly Issue<TCategory>[]
): IssueStats<TCategory> {
  const byCategory = {} as Record<TCategory, number>
  const byPriority: Record<Priority, number> = { critical: 0, high: 0, normal: 0, low: 0 }
  const byStatus: Record<IssueStatus, number> = { open: 0, acknowledged: 0, in_progress: 0, resolved: 0, dismissed: 0 }

  let open = 0
  let resolved = 0
  let critical = 0
  let actionRequired = 0

  for (const issue of issues) {
    byCategory[issue.category] = (byCategory[issue.category] || 0) + 1
    byPriority[issue.priority]++
    byStatus[issue.status]++

    if (["open", "acknowledged", "in_progress"].includes(issue.status)) {
      open++
    } else if (issue.status === "resolved") {
      resolved++
    }

    if (issue.priority === "critical") critical++

    if (
      (issue.status === "open" || issue.status === "acknowledged") &&
      (issue.priority === "critical" || issue.priority === "high")
    ) {
      actionRequired++
    }
  }

  return {
    total: issues.length,
    open,
    resolved,
    critical,
    actionRequired,
    byCategory,
    byPriority,
    byStatus,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a suggested action
 */
export function createSuggestedAction(
  type: SuggestedAction["type"],
  label: string,
  options?: Partial<Omit<SuggestedAction, "type" | "label">>
): SuggestedAction {
  return { type, label, ...options }
}

/**
 * Create a related object reference
 */
export function createRelatedObject(
  type: string,
  id: string,
  label?: string
): ObjectReference {
  return { type, id, label }
}

/**
 * Check if an issue is actionable
 */
export function isActionable<TCategory extends string>(issue: Issue<TCategory>): boolean {
  return issue.status === "open" || issue.status === "acknowledged"
}

/**
 * Get priority variant for UI
 */
export function getPriorityVariant(priority: Priority): "error" | "warning" | "info" | "muted" {
  switch (priority) {
    case "critical": return "error"
    case "high": return "warning"
    case "normal": return "info"
    case "low": return "muted"
  }
}
