/**
 * Workflow Compositions
 *
 * Pre-built compositions that combine multiple engines for common workflows.
 * These are opinionated defaults that can be customized or replaced.
 */

import type { Actor, Priority, ObjectReference } from "../domain/core/types"
import type { StateMachineInstance, StateDefinition, TransitionDefinition } from "../domain/state-machine"
import type { ApprovalRequest, ApprovalPolicy } from "../domain/approval-engine"
import type { Issue, DetectionRule } from "../domain/detection-engine"
import type { CommunicationThread, Message, MessageTemplate } from "../domain/communication-broker"
import type { Revision, VersionedDocument } from "../domain/revision-engine"
import type { AuthorizationResult, Permission } from "../domain/authorization-engine"

// ============================================================================
// WORKFLOW CONTEXT
// ============================================================================

/**
 * Context passed through workflow operations
 */
export interface WorkflowContext<TData = unknown> {
  /** Current actor performing the operation */
  actor: Actor

  /** Resource being operated on */
  resource: ObjectReference

  /** Current data state */
  data: TData

  /** Previous data state (for change detection) */
  previousData?: TData

  /** Timestamp of the operation */
  timestamp: Date

  /** Additional metadata */
  meta?: Record<string, unknown>
}

/**
 * Result of a workflow operation
 */
export interface WorkflowResult<TData = unknown> {
  success: boolean
  data?: TData
  errors?: string[]
  warnings?: string[]

  /** Side effects that occurred */
  effects: WorkflowEffect[]
}

/**
 * Side effect from a workflow operation
 */
export interface WorkflowEffect {
  type: "state_change" | "approval_created" | "issue_detected" | "notification_sent" | "revision_created" | "communication_sent"
  description: string
  data?: unknown
}

// ============================================================================
// DOCUMENT WORKFLOW
// ============================================================================

/**
 * Document workflow combining state machine, revision, and approval
 */
export interface DocumentWorkflowConfig<TDoc, TState extends string> {
  /** State machine states */
  states: StateDefinition<TState>[]

  /** State machine transitions */
  transitions: TransitionDefinition<TState>[]

  /** Approval policies */
  approvalPolicies: ApprovalPolicy[]

  /** Detection rules for issues */
  detectionRules?: DetectionRule<TDoc, string>[]

  /** Notification templates */
  notificationTemplates?: MessageTemplate[]

  /** Version field extraction */
  getVersion?: (doc: TDoc) => string

  /** Change significance evaluation */
  evaluateChangeSignificance?: (oldDoc: TDoc, newDoc: TDoc) => "major" | "minor" | "patch"
}

/**
 * Document workflow operations
 */
export interface DocumentWorkflow<TDoc, TState extends string> {
  /**
   * Transition document to new state
   */
  transition(
    context: WorkflowContext<TDoc>,
    targetState: TState
  ): WorkflowResult<{
    newState: TState
    approvalRequired?: ApprovalRequest
    revision?: Revision<TDoc>
    detectedIssues?: Issue<string>[]
  }>

  /**
   * Submit for approval
   */
  submitForApproval(
    context: WorkflowContext<TDoc>,
    reason: string
  ): WorkflowResult<{
    approvalRequest: ApprovalRequest
    notificationsSent?: number
  }>

  /**
   * Process approval decision
   */
  processApprovalDecision(
    context: WorkflowContext<TDoc>,
    request: ApprovalRequest,
    decision: "approve" | "deny",
    notes?: string
  ): WorkflowResult<{
    newState?: TState
    request: ApprovalRequest
  }>

  /**
   * Update document
   */
  update(
    context: WorkflowContext<TDoc>,
    newData: Partial<TDoc>
  ): WorkflowResult<{
    updated: TDoc
    revision?: Revision<TDoc>
    approvalRequired?: boolean
    detectedIssues?: Issue<string>[]
  }>

  /**
   * Get available actions
   */
  getAvailableActions(context: WorkflowContext<TDoc>): {
    transitions: Array<{ state: TState; enabled: boolean; reason?: string }>
    canEdit: boolean
    canSubmit: boolean
    canApprove: boolean
    pendingApprovals: number
  }
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Standalone approval workflow
 */
export interface ApprovalWorkflowConfig {
  /** Policies to evaluate */
  policies: ApprovalPolicy[]

  /** Auto-approve conditions */
  autoApproveConditions?: Array<{
    name: string
    evaluate: (context: WorkflowContext) => boolean
  }>

  /** Escalation rules */
  escalationRules?: Array<{
    afterHours: number
    escalateTo: string[]
    notifyOriginal: boolean
  }>
}

// ============================================================================
// COMMUNICATION WORKFLOW
// ============================================================================

/**
 * Communication workflow configuration
 */
export interface CommunicationWorkflowConfig {
  /** Available templates */
  templates: MessageTemplate[]

  /** Auto-respond rules */
  autoRespondRules?: Array<{
    trigger: { objectType: string; status?: string; event?: string }
    templateId: string
    variables?: Record<string, unknown>
  }>

  /** Thread grouping rules */
  threadGrouping: "per_object" | "per_object_type" | "custom"
}

// ============================================================================
// ISSUE WORKFLOW
// ============================================================================

/**
 * Issue workflow configuration
 */
export interface IssueWorkflowConfig<TInput> {
  /** Detection rules */
  rules: DetectionRule<TInput, string>[]

  /** Auto-assignment rules */
  autoAssignmentRules?: Array<{
    category: string
    priority?: Priority[]
    assignToRole: string
  }>

  /** Auto-escalation rules */
  autoEscalationRules?: Array<{
    afterHours: number
    escalateFromPriority: Priority
    escalateToPriority: Priority
    notifyRoles: string[]
  }>

  /** Resolution templates */
  resolutionTemplates?: Array<{
    category: string
    suggestedResolutions: string[]
  }>
}

// ============================================================================
// WORKFLOW EVENTS
// ============================================================================

/**
 * Workflow event types
 */
export type WorkflowEventType =
  | "state_changed"
  | "approval_requested"
  | "approval_completed"
  | "document_updated"
  | "revision_created"
  | "issue_detected"
  | "issue_resolved"
  | "message_sent"
  | "message_received"
  | "authorization_granted"
  | "authorization_revoked"

/**
 * Workflow event
 */
export interface WorkflowEvent<TPayload = unknown> {
  type: WorkflowEventType
  timestamp: Date
  actor: Actor
  resource: ObjectReference
  payload: TPayload
  correlationId?: string
}

/**
 * Workflow event handler
 */
export type WorkflowEventHandler<TPayload = unknown> = (
  event: WorkflowEvent<TPayload>
) => void | Promise<void>

/**
 * Workflow event bus
 */
export interface WorkflowEventBus {
  /** Subscribe to events */
  subscribe<TPayload>(
    eventType: WorkflowEventType,
    handler: WorkflowEventHandler<TPayload>
  ): () => void

  /** Publish an event */
  publish<TPayload>(event: WorkflowEvent<TPayload>): void

  /** Publish and wait for handlers */
  publishAsync<TPayload>(event: WorkflowEvent<TPayload>): Promise<void>
}

/**
 * Create a simple in-memory event bus
 */
export function createEventBus(): WorkflowEventBus {
  const handlers = new Map<WorkflowEventType, Set<WorkflowEventHandler>>()

  return {
    subscribe(eventType, handler) {
      if (!handlers.has(eventType)) {
        handlers.set(eventType, new Set())
      }
      handlers.get(eventType)!.add(handler as WorkflowEventHandler)

      return () => {
        handlers.get(eventType)?.delete(handler as WorkflowEventHandler)
      }
    },

    publish(event) {
      const eventHandlers = handlers.get(event.type)
      if (eventHandlers) {
        for (const handler of Array.from(eventHandlers)) {
          try {
            handler(event)
          } catch (error) {
            console.error(`Event handler error for ${event.type}:`, error)
          }
        }
      }
    },

    async publishAsync(event) {
      const eventHandlers = handlers.get(event.type)
      if (eventHandlers) {
        await Promise.all(
          Array.from(eventHandlers).map((handler) =>
            Promise.resolve(handler(event)).catch((error) => {
              console.error(`Event handler error for ${event.type}:`, error)
            })
          )
        )
      }
    },
  }
}

// ============================================================================
// WORKFLOW ORCHESTRATOR
// ============================================================================

/**
 * Orchestrator that coordinates multiple engines
 */
export interface WorkflowOrchestrator {
  /** Execute a workflow step */
  execute<TInput, TOutput>(
    step: WorkflowStep<TInput, TOutput>,
    input: TInput,
    context: WorkflowContext
  ): Promise<WorkflowResult<TOutput>>

  /** Execute multiple steps in sequence */
  executeSequence<TInput, TOutput>(
    steps: WorkflowStep<unknown, unknown>[],
    input: TInput,
    context: WorkflowContext
  ): Promise<WorkflowResult<TOutput>>

  /** Execute steps in parallel */
  executeParallel<TOutputs extends unknown[]>(
    steps: WorkflowStep<unknown, unknown>[],
    context: WorkflowContext
  ): Promise<WorkflowResult<TOutputs>>
}

/**
 * A single workflow step
 */
export interface WorkflowStep<TInput, TOutput> {
  name: string
  execute: (input: TInput, context: WorkflowContext) => Promise<TOutput>
  rollback?: (context: WorkflowContext) => Promise<void>
  validate?: (input: TInput, context: WorkflowContext) => string[]
}

/**
 * Create a simple orchestrator
 */
export function createOrchestrator(eventBus?: WorkflowEventBus): WorkflowOrchestrator {
  const orchestrator: WorkflowOrchestrator = {
    async execute<TInput, TOutput>(
      step: WorkflowStep<TInput, TOutput>,
      input: TInput,
      context: WorkflowContext
    ): Promise<WorkflowResult<TOutput>> {
      const errors = step.validate?.(input, context) ?? []
      if (errors.length > 0) {
        return { success: false, errors, effects: [] }
      }

      try {
        const output = await step.execute(input, context)
        return {
          success: true,
          data: output,
          effects: [{ type: "state_change", description: `Executed ${step.name}` }],
        }
      } catch (error) {
        return {
          success: false,
          errors: [error instanceof Error ? error.message : String(error)],
          effects: [],
        }
      }
    },

    async executeSequence<TInput, TOutput>(
      steps: WorkflowStep<unknown, unknown>[],
      input: TInput,
      context: WorkflowContext
    ): Promise<WorkflowResult<TOutput>> {
      let currentInput: unknown = input
      const allEffects: WorkflowEffect[] = []

      for (const step of steps) {
        const result = await orchestrator.execute(step, currentInput, context)
        if (!result.success) {
          return result as WorkflowResult<TOutput>
        }
        allEffects.push(...result.effects)
        currentInput = result.data
      }

      return {
        success: true,
        data: currentInput as TOutput,
        effects: allEffects,
      }
    },

    async executeParallel<TOutputs extends unknown[]>(
      steps: WorkflowStep<unknown, unknown>[],
      context: WorkflowContext
    ): Promise<WorkflowResult<TOutputs>> {
      const results = await Promise.all(
        steps.map((step) => orchestrator.execute(step, undefined, context))
      )

      const allErrors = results.flatMap((r) => r.errors ?? [])
      const allEffects = results.flatMap((r) => r.effects)
      const outputs = results.map((r) => r.data)

      return {
        success: allErrors.length === 0,
        data: outputs as TOutputs,
        errors: allErrors.length > 0 ? allErrors : undefined,
        effects: allEffects,
      }
    },
  }

  return orchestrator
}
