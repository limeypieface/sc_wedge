/**
 * Issue Detection Engine - Types
 *
 * A rule-based system for detecting, categorizing, and prioritizing issues.
 */

import type { EntityId, Actor, Timestamp, Priority, ObjectReference } from "../core/types"

// ============================================================================
// CORE ISSUE TYPES
// ============================================================================

/**
 * Issue status
 */
export type IssueStatus =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "dismissed"

/**
 * Issue source type
 */
export type IssueSourceType =
  | "automatic"     // Detected by rules
  | "manual"        // Created by user
  | "external"      // From external system
  | "escalation"    // Escalated from another issue

/**
 * An issue detected in the system
 */
export interface Issue<TCategory extends string = string> {
  readonly id: EntityId
  readonly issueNumber: string
  readonly category: TCategory
  readonly priority: Priority
  readonly title: string
  readonly description: string
  readonly status: IssueStatus

  /** Source of the issue */
  readonly source: IssueSource

  /** Related business objects */
  readonly relatedObjects?: readonly ObjectReference[]

  /** Quantitative impact */
  readonly affectedQuantity?: number
  readonly affectedValue?: number

  /** Suggested resolution */
  readonly suggestedAction?: SuggestedAction

  /** Assignment */
  readonly assignedTo?: Actor
  readonly acknowledgedAt?: Timestamp

  /** Resolution */
  readonly resolution?: string
  readonly resolvedBy?: Actor
  readonly resolvedAt?: Timestamp
  readonly resolutionNotes?: string

  /** Timestamps */
  readonly detectedAt: Timestamp

  /** Source data for debugging */
  readonly sourceData?: Readonly<Record<string, unknown>>

  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Source of an issue
 */
export interface IssueSource {
  readonly type: IssueSourceType
  readonly detector?: string
  readonly externalId?: string
  readonly createdBy?: Actor
}

/**
 * Suggested action for resolving an issue
 */
export interface SuggestedAction {
  readonly type: "navigate" | "action" | "workflow" | "contact" | "custom"
  readonly label: string
  readonly description?: string
  readonly target?: string
  readonly payload?: Readonly<Record<string, unknown>>
  readonly estimatedResolutionTime?: string
}

// ============================================================================
// DETECTION RULE TYPES
// ============================================================================

/**
 * A detection rule
 */
export interface DetectionRule<TInput, TCategory extends string = string> {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly category: TCategory
  readonly priority: Priority
  enabled: boolean // Mutable for enable/disable

  /** Detection function */
  readonly detect: (input: TInput, context: DetectionContext) => DetectionResult<TCategory>[]

  /** Conditions when rule applies */
  readonly conditions?: readonly RuleCondition[]

  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Context passed to detection rules
 */
export interface DetectionContext {
  readonly currentDate: Timestamp
  readonly user?: Actor
  readonly objectType?: string
  readonly objectId?: EntityId
  readonly [key: string]: unknown
}

/**
 * Result of a detection
 */
export interface DetectionResult<TCategory extends string = string> {
  readonly category: TCategory
  readonly priority: Priority
  readonly title: string
  readonly description: string
  readonly relatedObjects?: readonly ObjectReference[]
  readonly affectedQuantity?: number
  readonly affectedValue?: number
  readonly suggestedAction?: SuggestedAction
  readonly sourceData?: Readonly<Record<string, unknown>>
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Condition for when a rule applies
 */
export interface RuleCondition {
  readonly type: "object_type" | "status" | "category" | "custom"
  readonly value: string | readonly string[]
}

// ============================================================================
// ENGINE TYPES
// ============================================================================

/**
 * Configuration for detection engine
 */
export interface DetectionEngineConfig {
  readonly generateId?: (prefix?: string) => EntityId
  readonly generateIssueNumber?: (category: string, index: number) => string
  readonly defaultContext?: Readonly<Record<string, unknown>>
}

/**
 * Input for batch detection
 */
export interface BatchDetectionInput<TInput> {
  readonly items: readonly TInput[]
  readonly ruleIds?: readonly string[]
  readonly context?: DetectionContext
}

/**
 * Output from batch detection
 */
export interface BatchDetectionOutput<TCategory extends string = string> {
  readonly issues: readonly Issue<TCategory>[]
  readonly byCategorySummary: Readonly<Record<TCategory, number>>
  readonly byPrioritySummary: Readonly<Record<Priority, number>>
  readonly actionRequired: readonly Issue<TCategory>[]
  readonly detectedAt: Timestamp
  readonly rulesExecuted: readonly string[]
}

/**
 * Filter for issues
 */
export interface IssueFilter<TCategory extends string = string> {
  readonly categories?: readonly TCategory[]
  readonly priorities?: readonly Priority[]
  readonly statuses?: readonly IssueStatus[]
  readonly assignedTo?: EntityId
  readonly relatedObjectType?: string
  readonly relatedObjectId?: EntityId
  readonly detectedAfter?: Timestamp
  readonly detectedBefore?: Timestamp
}

/**
 * Sort for issues
 */
export interface IssueSort {
  readonly field: "priority" | "status" | "detectedAt" | "category"
  readonly direction: "asc" | "desc"
}

/**
 * Issue statistics
 */
export interface IssueStats<TCategory extends string = string> {
  readonly total: number
  readonly open: number
  readonly resolved: number
  readonly critical: number
  readonly actionRequired: number
  readonly byCategory: Readonly<Record<TCategory, number>>
  readonly byPriority: Readonly<Record<Priority, number>>
  readonly byStatus: Readonly<Record<IssueStatus, number>>
}
