/**
 * Issue Detection Engine - Types
 *
 * Generic types for detecting, categorizing, and prioritizing issues
 * across any domain (PO, SO, shipments, quality, etc.)
 */

// ============================================================================
// CORE ISSUE TYPES
// ============================================================================

/**
 * Issue priority levels
 */
export type IssuePriority = "critical" | "high" | "medium" | "low"

/**
 * Issue status
 */
export type IssueStatus = "open" | "acknowledged" | "in_progress" | "resolved" | "dismissed"

/**
 * A detected issue
 */
export interface Issue<TCategory extends string = string> {
  id: string
  /** Machine-readable issue number */
  issueNumber: string
  /** Category of the issue */
  category: TCategory
  /** Priority level */
  priority: IssuePriority
  /** Human-readable title */
  title: string
  /** Detailed description */
  description: string
  /** Current status */
  status: IssueStatus

  /** Suggested action to resolve */
  suggestedAction?: SuggestedAction
  /** Related object IDs */
  relatedObjects?: RelatedObject[]
  /** Affected quantities or values */
  affectedQuantity?: number
  affectedValue?: number

  /** Timestamps */
  detectedAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date

  /** Actor information */
  detectedBy?: string
  assignedTo?: string
  resolvedBy?: string

  /** Resolution details */
  resolution?: string
  resolutionNotes?: string

  /** Source of the issue */
  source: IssueSource
  /** Raw data that triggered detection */
  sourceData?: Record<string, unknown>

  /** Metadata */
  meta?: Record<string, unknown>
}

/**
 * Source of issue detection
 */
export interface IssueSource {
  type: "automatic" | "manual" | "external"
  system?: string
  detector?: string
}

/**
 * Related object reference
 */
export interface RelatedObject {
  type: string  // e.g., "purchase_order", "line_item", "shipment", "invoice"
  id: string
  label?: string
}

// ============================================================================
// SUGGESTED ACTION TYPES
// ============================================================================

/**
 * Action types that can be suggested
 */
export type ActionType =
  | "email"
  | "call"
  | "review"
  | "approve"
  | "create_rma"
  | "create_ncr"
  | "escalate"
  | "acknowledge"
  | "resolve"
  | "dismiss"
  | "link"
  | "custom"

/**
 * A suggested action to resolve an issue
 */
export interface SuggestedAction {
  type: ActionType
  label: string
  description?: string
  /** Target for the action (e.g., who to email, what to review) */
  target?: string
  /** Priority of taking this action */
  urgency?: "immediate" | "soon" | "when_possible"
  /** Auto-generated context for the action */
  context?: Record<string, unknown>
}

// ============================================================================
// DETECTION RULE TYPES
// ============================================================================

/**
 * A rule for detecting issues
 */
export interface DetectionRule<TInput, TCategory extends string = string> {
  id: string
  name: string
  description?: string
  /** Category of issues this rule detects */
  category: TCategory
  /** Base priority for detected issues (can be adjusted by rule) */
  basePriority: IssuePriority
  /** Whether this rule is enabled */
  enabled: boolean
  /** The detection function - returns issues if detected */
  detect: (input: TInput, context?: DetectionContext) => DetectionResult<TCategory>[]
}

/**
 * Context passed to detection rules
 */
export interface DetectionContext {
  /** Current date for time-based rules */
  currentDate: Date
  /** Configuration/thresholds */
  config?: Record<string, unknown>
  /** Any additional context */
  meta?: Record<string, unknown>
}

/**
 * Result of running a detection rule
 */
export interface DetectionResult<TCategory extends string = string> {
  category: TCategory
  priority: IssuePriority
  title: string
  description: string
  suggestedAction?: SuggestedAction
  relatedObjects?: RelatedObject[]
  affectedQuantity?: number
  affectedValue?: number
  sourceData?: Record<string, unknown>
  meta?: Record<string, unknown>
}

// ============================================================================
// DETECTION ENGINE TYPES
// ============================================================================

/**
 * Configuration for the detection engine
 */
export interface DetectionEngineConfig {
  /** Generate unique issue IDs */
  generateId?: () => string
  /** Generate issue numbers */
  generateIssueNumber?: (category: string, index: number) => string
  /** Default context for detection */
  defaultContext?: Partial<DetectionContext>
}

/**
 * Input for batch detection
 */
export interface BatchDetectionInput<TInput> {
  /** Items to check */
  items: TInput[]
  /** Which rules to run (undefined = all enabled) */
  ruleIds?: string[]
  /** Override context */
  context?: DetectionContext
}

/**
 * Output of batch detection
 */
export interface BatchDetectionOutput<TCategory extends string = string> {
  /** All detected issues */
  issues: Issue<TCategory>[]
  /** Summary by category */
  byCategorySummary: Record<TCategory, number>
  /** Summary by priority */
  byPrioritySummary: Record<IssuePriority, number>
  /** Issues requiring immediate action */
  actionRequired: Issue<TCategory>[]
  /** Detection timestamp */
  detectedAt: Date
  /** Rules that were run */
  rulesExecuted: string[]
}

// ============================================================================
// QUERY & FILTER TYPES
// ============================================================================

/**
 * Filter criteria for querying issues
 */
export interface IssueFilter<TCategory extends string = string> {
  categories?: TCategory[]
  priorities?: IssuePriority[]
  statuses?: IssueStatus[]
  assignedTo?: string
  relatedObjectType?: string
  relatedObjectId?: string
  detectedAfter?: Date
  detectedBefore?: Date
}

/**
 * Sort options for issues
 */
export interface IssueSort {
  field: "priority" | "detectedAt" | "category" | "status"
  direction: "asc" | "desc"
}

// ============================================================================
// PREDEFINED CATEGORY TYPES
// ============================================================================

/**
 * Purchase Order issue categories
 */
export type POIssueCategory =
  | "ncr"           // Non-conformance report
  | "invoice"       // Invoice variance
  | "quality_hold"  // Quality hold
  | "shipment"      // Shipment issue
  | "payable"       // Payment issue
  | "revision"      // Revision/change issue
  | "compliance"    // Compliance issue
  | "delivery"      // Delivery delay

/**
 * Sales Order issue categories
 */
export type SOIssueCategory =
  | "customer_complaint"
  | "backorder"
  | "shipment_delay"
  | "billing_dispute"
  | "return_request"
  | "delivery"
  | "quality"
  | "inventory"

/**
 * Generic issue categories
 */
export type GenericIssueCategory =
  | "error"
  | "warning"
  | "info"
  | "task"
  | "approval"
  | "review"
