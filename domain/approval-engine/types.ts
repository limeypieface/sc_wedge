/**
 * Approval Workflow Engine - Types
 *
 * Policy-driven, multi-stage decision gating system.
 * Supports sequential, parallel, and conditional approval flows.
 */

import type { EntityId, Actor, Timestamp, AuditEntry } from "../core/types"

// ============================================================================
// CORE APPROVAL TYPES
// ============================================================================

/**
 * Approval decision options
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
  readonly id: EntityId
  readonly name: string
  readonly description?: string
  readonly objectType: string
  readonly triggers: readonly PolicyTrigger[]
  readonly priority: number
  readonly workflow: ApprovalWorkflow
  readonly active: boolean
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Trigger conditions for a policy
 */
export interface PolicyTrigger {
  readonly type: TriggerType
  readonly condition: TriggerCondition
}

/**
 * Types of triggers
 */
export type TriggerType =
  | "threshold"
  | "change"
  | "status"
  | "category"
  | "custom"

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
  readonly type: "threshold"
  readonly field: string
  readonly operator: ">" | ">=" | "<" | "<=" | "=="
  readonly value: number
}

export interface ChangeCondition {
  readonly type: "change"
  readonly field: string
  readonly fromValue?: unknown
  readonly toValue?: unknown
}

export interface StatusCondition {
  readonly type: "status"
  readonly from?: string | readonly string[]
  readonly to: string | readonly string[]
}

export interface CategoryCondition {
  readonly type: "category"
  readonly categories: readonly string[]
}

export interface CustomCondition {
  readonly type: "custom"
  readonly ruleId: string
  readonly params?: Readonly<Record<string, unknown>>
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

/**
 * An approval workflow defines the steps and rules
 */
export interface ApprovalWorkflow {
  readonly id: EntityId
  readonly name: string
  readonly description?: string
  readonly steps: readonly ApprovalStep[]
  readonly execution: ExecutionMode
  readonly timeout?: WorkflowTimeout
  readonly timeoutAction?: "expire" | "auto_approve" | "auto_reject" | "escalate"
  readonly escalation?: EscalationConfig
}

/**
 * Execution mode for workflow steps
 */
export type ExecutionMode =
  | "sequential"
  | "parallel"
  | "conditional"

/**
 * A single step in an approval workflow
 */
export interface ApprovalStep {
  readonly id: EntityId
  readonly name: string
  readonly description?: string
  readonly approvers: ApproverConfig
  readonly requiredApprovals: number | "all" | "any"
  readonly timeout?: StepTimeout
  readonly conditions?: readonly StepCondition[]
  readonly order: number
  readonly onApprove?: readonly StepAction[]
  readonly onReject?: readonly StepAction[]
}

/**
 * Configuration for who can approve
 */
export interface ApproverConfig {
  readonly type: ApproverType
  readonly value: string | readonly string[]
  readonly exclude?: readonly string[]
}

/**
 * Types of approvers
 */
export type ApproverType =
  | "user"
  | "role"
  | "manager"
  | "department"
  | "dynamic"

/**
 * Timeout configuration for workflow
 */
export interface WorkflowTimeout {
  readonly duration: number
  readonly unit: "hours" | "days" | "weeks"
}

/**
 * Timeout configuration for step
 */
export interface StepTimeout {
  readonly duration: number
  readonly unit: "hours" | "days"
  readonly action: "remind" | "escalate" | "skip" | "reject"
}

/**
 * Condition for step activation
 */
export interface StepCondition {
  readonly type: "threshold" | "previous_step" | "custom"
  readonly config: Readonly<Record<string, unknown>>
}

/**
 * Action after step completion
 */
export interface StepAction {
  readonly type: "notify" | "update_status" | "trigger_workflow" | "webhook" | "custom"
  readonly config: Readonly<Record<string, unknown>>
}

/**
 * Escalation configuration
 */
export interface EscalationConfig {
  readonly levels: readonly EscalationLevel[]
  readonly maxEscalations: number
}

/**
 * A single escalation level
 */
export interface EscalationLevel {
  readonly afterDuration: number
  readonly unit: "hours" | "days"
  readonly escalateTo: ApproverConfig
  readonly notify?: readonly string[]
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * An approval request instance
 */
export interface ApprovalRequest {
  readonly id: EntityId
  readonly policyId: EntityId
  readonly workflowId: EntityId
  readonly objectType: string
  readonly objectId: EntityId
  readonly objectLabel?: string
  readonly status: ApprovalStatus
  readonly requester: Actor
  readonly triggerReason: string
  readonly triggerData?: Readonly<Record<string, unknown>>
  readonly steps: readonly ApprovalRequestStep[]
  readonly currentStepIndex: number
  readonly finalDecision?: ApprovalDecision
  readonly finalDecisionAt?: Timestamp
  readonly finalDecisionBy?: Actor
  readonly finalNotes?: string
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly expiresAt?: Timestamp
  readonly escalationCount: number
  readonly lastEscalatedAt?: Timestamp
  readonly auditLog: readonly AuditEntry[]
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * A step instance within a request
 */
export interface ApprovalRequestStep {
  readonly id: EntityId
  readonly stepDefinitionId: EntityId
  readonly name: string
  readonly order: number
  readonly status: StepStatus
  readonly assignedApprovers: readonly AssignedApprover[]
  readonly requiredApprovals: number
  readonly decisions: readonly StepDecision[]
  readonly activatedAt?: Timestamp
  readonly completedAt?: Timestamp
  readonly dueAt?: Timestamp
  readonly notes?: string
}

/**
 * An assigned approver for a step
 */
export interface AssignedApprover {
  readonly actor: Actor
  readonly assignedAt: Timestamp
  readonly notifiedAt?: Timestamp
  readonly hasResponded: boolean
}

/**
 * A decision made on a step
 */
export interface StepDecision {
  readonly id: EntityId
  readonly approver: Actor
  readonly decision: ApprovalDecision
  readonly notes?: string
  readonly decidedAt: Timestamp
  readonly attachments?: readonly string[]
}

// ============================================================================
// ENGINE TYPES
// ============================================================================

/**
 * Configuration for the approval engine
 */
export interface ApprovalEngineConfig {
  readonly generateId?: () => EntityId
  readonly customRuleEvaluators?: Map<string, CustomRuleEvaluator>
}

/**
 * Custom rule evaluator function
 */
export type CustomRuleEvaluator = (
  params: Readonly<Record<string, unknown>>,
  context: ApprovalContext
) => boolean

/**
 * Context for approval processing
 */
export interface ApprovalContext {
  readonly objectType: string
  readonly objectId: EntityId
  readonly objectData?: Readonly<Record<string, unknown>>
  readonly requester: Actor
  readonly currentUser?: Actor
  readonly previousValues?: Readonly<Record<string, unknown>>
  readonly newValues?: Readonly<Record<string, unknown>>
}

/**
 * Input for creating an approval request
 */
export interface CreateApprovalInput {
  readonly policyId: EntityId
  readonly objectType: string
  readonly objectId: EntityId
  readonly objectLabel?: string
  readonly requester: Actor
  readonly triggerReason: string
  readonly triggerData?: Readonly<Record<string, unknown>>
  readonly objectData?: Readonly<Record<string, unknown>>
}

/**
 * Input for making a decision
 */
export interface MakeDecisionInput {
  readonly requestId: EntityId
  readonly stepId: EntityId
  readonly approver: Actor
  readonly decision: ApprovalDecision
  readonly notes?: string
  readonly attachments?: readonly string[]
}

/**
 * Result of checking if approval is required
 */
export interface ApprovalCheckResult {
  readonly required: boolean
  readonly matchingPolicies: readonly ApprovalPolicy[]
  readonly reasons: readonly string[]
}

/**
 * Filter for querying approval requests
 */
export interface ApprovalRequestFilter {
  readonly statuses?: readonly ApprovalStatus[]
  readonly objectType?: string
  readonly objectId?: EntityId
  readonly requesterId?: EntityId
  readonly pendingForUserId?: EntityId
  readonly createdAfter?: Timestamp
  readonly createdBefore?: Timestamp
  readonly expiringBefore?: Timestamp
}

/**
 * Sort options for approval requests
 */
export interface ApprovalRequestSort {
  readonly field: "createdAt" | "updatedAt" | "expiresAt" | "status"
  readonly direction: "asc" | "desc"
}

/**
 * Capabilities for an approval request
 */
export interface ApprovalCapabilities {
  readonly canApprove: boolean
  readonly canReject: boolean
  readonly canDefer: boolean
  readonly canEscalate: boolean
  readonly canCancel: boolean
  readonly currentStep?: ApprovalRequestStep
  readonly isApprover: boolean
  readonly isPending: boolean
}

/**
 * Approver resolver function type
 */
export type ApproverResolver = (
  config: ApproverConfig,
  context: ApprovalContext
) => readonly Actor[]
