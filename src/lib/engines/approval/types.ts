/**
 * Approval Workflow Engine - Types
 *
 * Policy-driven, multi-stage decision gating system.
 * Supports sequential, parallel, and conditional approval flows.
 */

// ============================================================================
// CORE APPROVAL TYPES
// ============================================================================

/**
 * Approval decision
 */
export type ApprovalDecision = "approved" | "rejected" | "deferred" | "escalated"

/**
 * Approval request status
 */
export type ApprovalStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"

/**
 * Approval step status
 */
export type StepStatus = "pending" | "active" | "approved" | "rejected" | "skipped"

// ============================================================================
// POLICY TYPES
// ============================================================================

/**
 * An approval policy defines when and how approvals are required
 */
export interface ApprovalPolicy {
  id: string
  name: string
  description?: string

  /** What types of objects this policy applies to */
  objectType: string

  /** Conditions that trigger this policy */
  triggers: PolicyTrigger[]

  /** Priority when multiple policies match (lower = higher priority) */
  priority: number

  /** The approval workflow to use */
  workflow: ApprovalWorkflow

  /** Whether this policy is active */
  active: boolean

  /** Metadata */
  meta?: Record<string, unknown>
}

/**
 * Trigger conditions for a policy
 */
export interface PolicyTrigger {
  type: TriggerType
  /** Condition function or configuration */
  condition: TriggerCondition
}

/**
 * Types of triggers
 */
export type TriggerType =
  | "threshold"      // Amount exceeds threshold
  | "change"         // Specific field changed
  | "status"         // Status transition
  | "category"       // Object category
  | "custom"         // Custom condition

/**
 * Trigger condition configuration
 */
export type TriggerCondition =
  | ThresholdCondition
  | ChangeCondition
  | StatusCondition
  | CategoryCondition
  | CustomCondition

export interface ThresholdCondition {
  type: "threshold"
  field: string
  operator: ">" | ">=" | "<" | "<=" | "=="
  value: number
}

export interface ChangeCondition {
  type: "change"
  field: string
  fromValue?: unknown
  toValue?: unknown
}

export interface StatusCondition {
  type: "status"
  from?: string | string[]
  to: string | string[]
}

export interface CategoryCondition {
  type: "category"
  categories: string[]
}

export interface CustomCondition {
  type: "custom"
  /** Serializable rule identifier */
  ruleId: string
  params?: Record<string, unknown>
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

/**
 * An approval workflow defines the steps and rules
 */
export interface ApprovalWorkflow {
  id: string
  name: string
  description?: string

  /** Steps in the workflow */
  steps: ApprovalStep[]

  /** How steps are executed */
  execution: ExecutionMode

  /** Timeout configuration */
  timeout?: WorkflowTimeout

  /** What happens if workflow times out */
  timeoutAction?: "expire" | "auto_approve" | "auto_reject" | "escalate"

  /** Escalation configuration */
  escalation?: EscalationConfig
}

/**
 * Execution mode for workflow steps
 */
export type ExecutionMode =
  | "sequential"    // Steps execute in order
  | "parallel"      // All steps execute simultaneously
  | "conditional"   // Steps depend on conditions

/**
 * A single step in an approval workflow
 */
export interface ApprovalStep {
  id: string
  name: string
  description?: string

  /** Who can approve this step */
  approvers: ApproverConfig

  /** How many approvals needed */
  requiredApprovals: number | "all" | "any"

  /** Time limit for this step */
  timeout?: StepTimeout

  /** Conditions for this step to be active */
  conditions?: StepCondition[]

  /** Order in sequential workflows */
  order: number

  /** Actions to take after step completion */
  onApprove?: StepAction[]
  onReject?: StepAction[]
}

/**
 * Configuration for who can approve
 */
export interface ApproverConfig {
  type: ApproverType
  /** User IDs, role names, or dynamic rule */
  value: string | string[]
  /** Exclude these users (e.g., the requester) */
  exclude?: string[]
}

/**
 * Types of approvers
 */
export type ApproverType =
  | "user"          // Specific user IDs
  | "role"          // Users with specific role
  | "manager"       // Requester's manager
  | "department"    // Department head
  | "dynamic"       // Dynamically determined

/**
 * Timeout configuration for workflow
 */
export interface WorkflowTimeout {
  duration: number
  unit: "hours" | "days" | "weeks"
}

/**
 * Timeout configuration for step
 */
export interface StepTimeout {
  duration: number
  unit: "hours" | "days"
  action: "remind" | "escalate" | "skip" | "reject"
}

/**
 * Condition for step activation
 */
export interface StepCondition {
  type: "threshold" | "previous_step" | "custom"
  config: Record<string, unknown>
}

/**
 * Action after step completion
 */
export interface StepAction {
  type: "notify" | "update_status" | "trigger_workflow" | "webhook" | "custom"
  config: Record<string, unknown>
}

/**
 * Escalation configuration
 */
export interface EscalationConfig {
  /** Levels of escalation */
  levels: EscalationLevel[]
  /** Maximum escalation attempts */
  maxEscalations: number
}

/**
 * A single escalation level
 */
export interface EscalationLevel {
  afterDuration: number
  unit: "hours" | "days"
  escalateTo: ApproverConfig
  notify?: string[] // Additional users to notify
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * An approval request instance
 */
export interface ApprovalRequest {
  id: string
  /** Reference to the policy that triggered this */
  policyId: string
  /** Reference to the workflow definition */
  workflowId: string

  /** The object being approved */
  objectType: string
  objectId: string
  objectLabel?: string

  /** Current status */
  status: ApprovalStatus

  /** Who requested the approval */
  requesterId: string
  requesterName?: string

  /** Why approval was triggered */
  triggerReason: string
  triggerData?: Record<string, unknown>

  /** The steps in this request */
  steps: ApprovalRequestStep[]

  /** Final decision (if complete) */
  finalDecision?: ApprovalDecision
  finalDecisionAt?: Date
  finalDecisionBy?: string
  finalNotes?: string

  /** Timestamps */
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date

  /** Escalation tracking */
  escalationCount: number
  lastEscalatedAt?: Date

  /** Metadata */
  meta?: Record<string, unknown>
}

/**
 * A step instance within a request
 */
export interface ApprovalRequestStep {
  id: string
  stepDefinitionId: string
  name: string
  order: number
  status: StepStatus

  /** Approvers for this step */
  assignedApprovers: AssignedApprover[]

  /** Required approvals */
  requiredApprovals: number

  /** Collected decisions */
  decisions: StepDecision[]

  /** Timestamps */
  activatedAt?: Date
  completedAt?: Date
  dueAt?: Date

  /** Notes */
  notes?: string
}

/**
 * An assigned approver for a step
 */
export interface AssignedApprover {
  userId: string
  userName?: string
  role?: string
  assignedAt: Date
  notifiedAt?: Date
  hasResponded: boolean
}

/**
 * A decision made on a step
 */
export interface StepDecision {
  id: string
  approverId: string
  approverName?: string
  decision: ApprovalDecision
  notes?: string
  decidedAt: Date
  /** Attachments or supporting docs */
  attachments?: string[]
}

// ============================================================================
// ENGINE TYPES
// ============================================================================

/**
 * Configuration for the approval engine
 */
export interface ApprovalEngineConfig {
  /** Generate unique IDs */
  generateId?: () => string

  /** Resolve approvers for dynamic/role-based configs */
  resolveApprovers?: (config: ApproverConfig, context: ApprovalContext) => string[]

  /** Get user's manager */
  getManager?: (userId: string) => string | undefined

  /** Current user context */
  currentUser?: { id: string; name?: string; roles?: string[] }
}

/**
 * Context for approval processing
 */
export interface ApprovalContext {
  objectType: string
  objectId: string
  objectData?: Record<string, unknown>
  requesterId: string
  currentUser?: { id: string; name?: string; roles?: string[] }
  previousValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

/**
 * Input for creating an approval request
 */
export interface CreateApprovalInput {
  policyId: string
  objectType: string
  objectId: string
  objectLabel?: string
  requesterId: string
  requesterName?: string
  triggerReason: string
  triggerData?: Record<string, unknown>
  objectData?: Record<string, unknown>
}

/**
 * Input for making a decision
 */
export interface MakeDecisionInput {
  requestId: string
  stepId: string
  approverId: string
  approverName?: string
  decision: ApprovalDecision
  notes?: string
  attachments?: string[]
}

/**
 * Result of checking if approval is required
 */
export interface ApprovalCheckResult {
  required: boolean
  policies: ApprovalPolicy[]
  reasons: string[]
}

/**
 * Filter for querying approval requests
 */
export interface ApprovalRequestFilter {
  statuses?: ApprovalStatus[]
  objectType?: string
  objectId?: string
  requesterId?: string
  approverId?: string
  pendingForUser?: string
  createdAfter?: Date
  createdBefore?: Date
  expiringBefore?: Date
}

/**
 * Sort options for approval requests
 */
export interface ApprovalRequestSort {
  field: "createdAt" | "updatedAt" | "expiresAt" | "status"
  direction: "asc" | "desc"
}
