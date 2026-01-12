/**
 * Issue Detection Engine
 *
 * A rule-based system for detecting, categorizing, and prioritizing issues.
 * Pure functions with no side effects.
 *
 * Features:
 * - Configurable detection rules
 * - Priority-based sorting
 * - Action suggestions
 * - Batch detection across multiple items
 * - Filtering and querying
 */

import type {
  Issue,
  IssuePriority,
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
  RelatedObject,
} from "./types"

export * from "./types"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateIssueNumber(category: string, index: number): string {
  const prefix = category.toUpperCase().substring(0, 3)
  const year = new Date().getFullYear()
  const num = String(index).padStart(4, "0")
  return `${prefix}-${year}-${num}`
}

/**
 * Priority ordering for sorting (lower = more urgent)
 */
const PRIORITY_ORDER: Record<IssuePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/**
 * Status ordering for sorting
 */
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
    generateId: customGenerateId = generateId,
    generateIssueNumber: customGenerateIssueNumber = generateIssueNumber,
    defaultContext = {},
  } = config

  // Index rules by ID for fast lookup
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
          issues.push(createIssue(result, rule, customGenerateId, customGenerateIssueNumber, issueCounter))
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
            allIssues.push(createIssue(result, rule, customGenerateId, customGenerateIssueNumber, issueCounter))
          }
        }
      }

      // Build summaries
      const byCategorySummary = {} as Record<TCategory, number>
      const byPrioritySummary: Record<IssuePriority, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }

      for (const issue of allIssues) {
        byCategorySummary[issue.category] = (byCategorySummary[issue.category] || 0) + 1
        byPrioritySummary[issue.priority]++
      }

      // Action required = open + critical/high priority
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

/**
 * Create an Issue from a DetectionResult
 */
function createIssue<TCategory extends string>(
  result: DetectionResult<TCategory>,
  rule: DetectionRule<unknown, TCategory>,
  genId: () => string,
  genNumber: (category: string, index: number) => string,
  index: number
): Issue<TCategory> {
  return {
    id: genId(),
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

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter issues based on criteria
 */
export function filterIssues<TCategory extends string>(
  issues: Issue<TCategory>[],
  filter: IssueFilter<TCategory>
): Issue<TCategory>[] {
  return issues.filter((issue) => {
    if (filter.categories?.length && !filter.categories.includes(issue.category)) {
      return false
    }
    if (filter.priorities?.length && !filter.priorities.includes(issue.priority)) {
      return false
    }
    if (filter.statuses?.length && !filter.statuses.includes(issue.status)) {
      return false
    }
    if (filter.assignedTo && issue.assignedTo !== filter.assignedTo) {
      return false
    }
    if (filter.relatedObjectType || filter.relatedObjectId) {
      const hasMatch = issue.relatedObjects?.some(
        (ro) =>
          (!filter.relatedObjectType || ro.type === filter.relatedObjectType) &&
          (!filter.relatedObjectId || ro.id === filter.relatedObjectId)
      )
      if (!hasMatch) return false
    }
    if (filter.detectedAfter && issue.detectedAt < filter.detectedAfter) {
      return false
    }
    if (filter.detectedBefore && issue.detectedAt > filter.detectedBefore) {
      return false
    }
    return true
  })
}

/**
 * Sort issues
 */
export function sortIssues<TCategory extends string>(
  issues: Issue<TCategory>[],
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
 * Get issues requiring action (open + critical/high)
 */
export function getActionRequiredIssues<TCategory extends string>(
  issues: Issue<TCategory>[]
): Issue<TCategory>[] {
  return filterIssues(issues, {
    statuses: ["open"],
    priorities: ["critical", "high"],
  })
}

/**
 * Group issues by category
 */
export function groupIssuesByCategory<TCategory extends string>(
  issues: Issue<TCategory>[]
): Map<TCategory, Issue<TCategory>[]> {
  const groups = new Map<TCategory, Issue<TCategory>[]>()

  for (const issue of issues) {
    const existing = groups.get(issue.category) || []
    existing.push(issue)
    groups.set(issue.category, existing)
  }

  return groups
}

/**
 * Group issues by priority
 */
export function groupIssuesByPriority<TCategory extends string>(
  issues: Issue<TCategory>[]
): Map<IssuePriority, Issue<TCategory>[]> {
  const groups = new Map<IssuePriority, Issue<TCategory>[]>()

  for (const issue of issues) {
    const existing = groups.get(issue.priority) || []
    existing.push(issue)
    groups.set(issue.priority, existing)
  }

  return groups
}

// ============================================================================
// ISSUE LIFECYCLE
// ============================================================================

/**
 * Acknowledge an issue (immutable)
 */
export function acknowledgeIssue<TCategory extends string>(
  issue: Issue<TCategory>,
  acknowledgedBy: string
): Issue<TCategory> {
  return {
    ...issue,
    status: "acknowledged",
    acknowledgedAt: new Date(),
  }
}

/**
 * Start working on an issue (immutable)
 */
export function startIssue<TCategory extends string>(
  issue: Issue<TCategory>,
  assignedTo: string
): Issue<TCategory> {
  return {
    ...issue,
    status: "in_progress",
    assignedTo,
  }
}

/**
 * Resolve an issue (immutable)
 */
export function resolveIssue<TCategory extends string>(
  issue: Issue<TCategory>,
  resolution: string,
  resolvedBy: string,
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
 * Dismiss an issue (immutable)
 */
export function dismissIssue<TCategory extends string>(
  issue: Issue<TCategory>,
  reason: string,
  dismissedBy: string
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
 * Reopen an issue (immutable)
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
  return {
    type,
    label,
    ...options,
  }
}

/**
 * Create a related object reference
 */
export function createRelatedObject(
  type: string,
  id: string,
  label?: string
): RelatedObject {
  return { type, id, label }
}

/**
 * Check if an issue is actionable
 */
export function isActionable<TCategory extends string>(
  issue: Issue<TCategory>
): boolean {
  return issue.status === "open" || issue.status === "acknowledged"
}

/**
 * Get priority color/variant
 */
export function getPriorityVariant(
  priority: IssuePriority
): "error" | "warning" | "info" | "muted" {
  switch (priority) {
    case "critical":
      return "error"
    case "high":
      return "warning"
    case "medium":
      return "info"
    case "low":
      return "muted"
  }
}

/**
 * Calculate issue statistics
 */
export function calculateIssueStats<TCategory extends string>(
  issues: Issue<TCategory>[]
): {
  total: number
  open: number
  resolved: number
  critical: number
  actionRequired: number
  byCategory: Record<string, number>
  byPriority: Record<IssuePriority, number>
  byStatus: Record<IssueStatus, number>
} {
  const stats = {
    total: issues.length,
    open: 0,
    resolved: 0,
    critical: 0,
    actionRequired: 0,
    byCategory: {} as Record<string, number>,
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 } as Record<IssuePriority, number>,
    byStatus: { open: 0, acknowledged: 0, in_progress: 0, resolved: 0, dismissed: 0 } as Record<IssueStatus, number>,
  }

  for (const issue of issues) {
    stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1
    stats.byPriority[issue.priority]++
    stats.byStatus[issue.status]++

    if (issue.status === "open" || issue.status === "acknowledged" || issue.status === "in_progress") {
      stats.open++
    } else if (issue.status === "resolved") {
      stats.resolved++
    }

    if (issue.priority === "critical") {
      stats.critical++
    }

    if (isActionable(issue) && (issue.priority === "critical" || issue.priority === "high")) {
      stats.actionRequired++
    }
  }

  return stats
}
