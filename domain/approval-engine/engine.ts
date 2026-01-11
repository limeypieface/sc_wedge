/**
 * Approval Workflow Engine
 *
 * Policy-driven, multi-stage decision gating system.
 * Pure functions with no side effects.
 */

import { defaultIdGenerator, addDuration, getNestedValue } from "../core/utils"
import type { EntityId, Actor, AuditEntry } from "../core/types"
import type {
  ApprovalPolicy,
  ApprovalWorkflow,
  ApprovalRequest,
  ApprovalRequestStep,
  ApprovalDecision,
  StepDecision,
  ApprovalContext,
  ApprovalCheckResult,
  ApprovalEngineConfig,
  CreateApprovalInput,
  MakeDecisionInput,
  ApprovalRequestFilter,
  ApprovalRequestSort,
  ApprovalCapabilities,
  TriggerCondition,
  CustomRuleEvaluator,
  ApproverResolver,
  ApproverConfig,
} from "./types"

// ============================================================================
// APPROVAL ENGINE
// ============================================================================

/**
 * Create an approval engine
 */
export function createApprovalEngine(
  policies: readonly ApprovalPolicy[],
  config: ApprovalEngineConfig = {}
) {
  const { generateId = defaultIdGenerator.generate, customRuleEvaluators = new Map() } = config

  const policiesById = new Map<string, ApprovalPolicy>()
  const policiesByObjectType = new Map<string, ApprovalPolicy[]>()

  for (const policy of policies) {
    policiesById.set(policy.id, policy)
    const existing = policiesByObjectType.get(policy.objectType) || []
    existing.push(policy)
    policiesByObjectType.set(policy.objectType, existing)
  }

  return {
    /**
     * Check if approval is required for an object/action
     */
    checkApprovalRequired(context: ApprovalContext): ApprovalCheckResult {
      const objectPolicies = policiesByObjectType.get(context.objectType) || []
      const activePolicies = objectPolicies.filter((p) => p.active)

      const matchingPolicies: ApprovalPolicy[] = []
      const reasons: string[] = []

      for (const policy of activePolicies) {
        const triggerResult = evaluatePolicyTriggers(policy, context, customRuleEvaluators)
        if (triggerResult.triggered) {
          matchingPolicies.push(policy)
          reasons.push(...triggerResult.reasons)
        }
      }

      matchingPolicies.sort((a, b) => a.priority - b.priority)

      return {
        required: matchingPolicies.length > 0,
        matchingPolicies,
        reasons,
      }
    },

    /**
     * Create a new approval request
     */
    createRequest(
      input: CreateApprovalInput,
      resolveApprovers: ApproverResolver
    ): ApprovalRequest {
      const policy = policiesById.get(input.policyId)
      if (!policy) {
        throw new Error(`Policy not found: ${input.policyId}`)
      }

      const workflow = policy.workflow
      const now = new Date()

      const context: ApprovalContext = {
        objectType: input.objectType,
        objectId: input.objectId,
        objectData: input.objectData,
        requester: input.requester,
      }

      const steps: ApprovalRequestStep[] = workflow.steps.map((stepDef) => {
        const approvers = resolveApprovers(stepDef.approvers, context)
        const requiredCount =
          stepDef.requiredApprovals === "all"
            ? approvers.length
            : stepDef.requiredApprovals === "any"
            ? 1
            : stepDef.requiredApprovals

        return {
          id: generateId("step"),
          stepDefinitionId: stepDef.id,
          name: stepDef.name,
          order: stepDef.order,
          status: workflow.execution === "parallel" ? "active" : "pending",
          assignedApprovers: approvers.map((actor) => ({
            actor,
            assignedAt: now,
            hasResponded: false,
          })),
          requiredApprovals: requiredCount,
          decisions: [],
        }
      })

      if (workflow.execution === "sequential" && steps.length > 0) {
        steps[0] = { ...steps[0], status: "active", activatedAt: now }
      }

      let expiresAt: Date | undefined
      if (workflow.timeout) {
        expiresAt = addDuration(now, workflow.timeout.duration, workflow.timeout.unit)
      }

      return {
        id: generateId("apr"),
        policyId: policy.id,
        workflowId: workflow.id,
        objectType: input.objectType,
        objectId: input.objectId,
        objectLabel: input.objectLabel,
        status: "in_progress",
        requester: input.requester,
        triggerReason: input.triggerReason,
        triggerData: input.triggerData,
        steps,
        currentStepIndex: 0,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        escalationCount: 0,
        auditLog: [
          {
            id: generateId("audit"),
            action: "created",
            actor: input.requester,
            timestamp: now,
            details: { triggerReason: input.triggerReason },
          },
        ],
      }
    },

    /**
     * Make a decision on an approval request
     */
    makeDecision(
      request: ApprovalRequest,
      input: MakeDecisionInput
    ): { request: ApprovalRequest; complete: boolean; finalDecision?: ApprovalDecision } {
      const now = new Date()

      const stepIndex = request.steps.findIndex((s) => s.id === input.stepId)
      if (stepIndex === -1) {
        throw new Error(`Step not found: ${input.stepId}`)
      }

      const step = request.steps[stepIndex]

      if (step.status !== "active") {
        throw new Error(`Step is not active: ${step.status}`)
      }

      const approverAssignment = step.assignedApprovers.find(
        (a) => a.actor.id === input.approver.id
      )
      if (!approverAssignment) {
        throw new Error(`User is not an approver for this step`)
      }

      const decision: StepDecision = {
        id: generateId("dec"),
        approver: input.approver,
        decision: input.decision,
        notes: input.notes,
        decidedAt: now,
        attachments: input.attachments,
      }

      const updatedStep: ApprovalRequestStep = {
        ...step,
        decisions: [...step.decisions, decision],
        assignedApprovers: step.assignedApprovers.map((a) =>
          a.actor.id === input.approver.id
            ? { ...a, hasResponded: true }
            : a
        ),
      }

      const stepResult = evaluateStepCompletion(updatedStep)
      let finalStep = updatedStep
      if (stepResult.complete) {
        finalStep = {
          ...updatedStep,
          status: stepResult.outcome === "approved" ? "approved" : "rejected",
          completedAt: now,
        }
      }

      const updatedSteps = [...request.steps]
      updatedSteps[stepIndex] = finalStep

      const auditEntry: AuditEntry = {
        id: generateId("audit"),
        action: `decision_${input.decision}`,
        actor: input.approver,
        timestamp: now,
        details: { stepId: input.stepId, notes: input.notes },
      }

      let updatedRequest: ApprovalRequest = {
        ...request,
        steps: updatedSteps,
        updatedAt: now,
        auditLog: [...request.auditLog, auditEntry],
      }

      const policy = policiesById.get(request.policyId)
      if (!policy) {
        throw new Error(`Policy not found: ${request.policyId}`)
      }

      const workflowResult = evaluateWorkflowCompletion(updatedRequest, policy.workflow)

      if (workflowResult.complete) {
        updatedRequest = {
          ...updatedRequest,
          status: workflowResult.outcome === "approved" ? "approved" : "rejected",
          finalDecision: workflowResult.outcome,
          finalDecisionAt: now,
          finalDecisionBy: input.approver,
          finalNotes: input.notes,
        }
      } else if (workflowResult.nextStepIndex !== undefined) {
        const nextStep = updatedRequest.steps[workflowResult.nextStepIndex]
        const activatedSteps = [...updatedRequest.steps]
        activatedSteps[workflowResult.nextStepIndex] = {
          ...nextStep,
          status: "active",
          activatedAt: now,
        }
        updatedRequest = {
          ...updatedRequest,
          steps: activatedSteps,
          currentStepIndex: workflowResult.nextStepIndex,
        }
      }

      return {
        request: updatedRequest,
        complete: workflowResult.complete,
        finalDecision: workflowResult.outcome,
      }
    },

    /**
     * Cancel an approval request
     */
    cancelRequest(request: ApprovalRequest, actor: Actor, reason?: string): ApprovalRequest {
      const now = new Date()

      return {
        ...request,
        status: "cancelled",
        updatedAt: now,
        auditLog: [
          ...request.auditLog,
          {
            id: generateId("audit"),
            action: "cancelled",
            actor,
            timestamp: now,
            details: { reason },
          },
        ],
      }
    },

    /**
     * Get capabilities for a user on a request
     */
    getCapabilities(request: ApprovalRequest, user: Actor): ApprovalCapabilities {
      const isPending = request.status === "in_progress"
      const currentStep = request.steps.find((s) => s.status === "active")
      const isApprover = currentStep?.assignedApprovers.some(
        (a) => a.actor.id === user.id && !a.hasResponded
      ) ?? false

      const canCancel =
        request.status === "in_progress" &&
        request.requester.id === user.id

      return {
        canApprove: isPending && isApprover,
        canReject: isPending && isApprover,
        canDefer: isPending && isApprover,
        canEscalate: isPending && isApprover,
        canCancel,
        currentStep,
        isApprover,
        isPending,
      }
    },

    /**
     * Get pending approvals for a user
     */
    getPendingForUser(requests: readonly ApprovalRequest[], userId: string): ApprovalRequest[] {
      return requests.filter((r) => {
        if (r.status !== "in_progress") return false
        return r.steps.some(
          (s) =>
            s.status === "active" &&
            s.assignedApprovers.some((a) => a.actor.id === userId && !a.hasResponded)
        )
      })
    },

    /**
     * Get policy by ID
     */
    getPolicy(policyId: string): ApprovalPolicy | undefined {
      return policiesById.get(policyId)
    },

    /**
     * Get all active policies for an object type
     */
    getPoliciesForObjectType(objectType: string): ApprovalPolicy[] {
      return (policiesByObjectType.get(objectType) || []).filter((p) => p.active)
    },
  }
}

// ============================================================================
// POLICY EVALUATION
// ============================================================================

function evaluatePolicyTriggers(
  policy: ApprovalPolicy,
  context: ApprovalContext,
  customEvaluators: Map<string, CustomRuleEvaluator>
): { triggered: boolean; reasons: string[] } {
  const reasons: string[] = []

  for (const trigger of policy.triggers) {
    const result = evaluateTriggerCondition(trigger.condition, context, customEvaluators)
    if (result.triggered) {
      reasons.push(result.reason)
    }
  }

  return {
    triggered: reasons.length > 0,
    reasons,
  }
}

function evaluateTriggerCondition(
  condition: TriggerCondition,
  context: ApprovalContext,
  customEvaluators: Map<string, CustomRuleEvaluator>
): { triggered: boolean; reason: string } {
  switch (condition.type) {
    case "threshold": {
      const value = getNestedValue(context.objectData || {}, condition.field)
      if (typeof value !== "number") {
        return { triggered: false, reason: "" }
      }
      const triggered = evaluateThreshold(value, condition.operator, condition.value)
      return {
        triggered,
        reason: triggered
          ? `${condition.field} (${value}) ${condition.operator} ${condition.value}`
          : "",
      }
    }

    case "change": {
      const oldValue = getNestedValue(context.previousValues || {}, condition.field)
      const newValue = getNestedValue(context.newValues || {}, condition.field)
      const changed = oldValue !== newValue
      const matchesFrom = condition.fromValue === undefined || oldValue === condition.fromValue
      const matchesTo = condition.toValue === undefined || newValue === condition.toValue
      const triggered = changed && matchesFrom && matchesTo
      return {
        triggered,
        reason: triggered ? `${condition.field} changed` : "",
      }
    }

    case "status": {
      const currentStatus = context.objectData?.status as string | undefined
      const toStatuses = Array.isArray(condition.to) ? condition.to : [condition.to]
      const triggered = currentStatus !== undefined && toStatuses.includes(currentStatus)
      return {
        triggered,
        reason: triggered ? `Status is ${currentStatus}` : "",
      }
    }

    case "category": {
      const category = context.objectData?.category as string | undefined
      const triggered = category !== undefined && condition.categories.includes(category)
      return {
        triggered,
        reason: triggered ? `Category is ${category}` : "",
      }
    }

    case "custom": {
      const evaluator = customEvaluators.get(condition.ruleId)
      if (!evaluator) {
        return { triggered: false, reason: "" }
      }
      const triggered = evaluator(condition.params || {}, context)
      return {
        triggered,
        reason: triggered ? `Custom rule: ${condition.ruleId}` : "",
      }
    }

    default:
      return { triggered: false, reason: "" }
  }
}

function evaluateThreshold(
  value: number,
  operator: ">" | ">=" | "<" | "<=" | "==",
  threshold: number
): boolean {
  switch (operator) {
    case ">":
      return value > threshold
    case ">=":
      return value >= threshold
    case "<":
      return value < threshold
    case "<=":
      return value <= threshold
    case "==":
      return value === threshold
    default:
      return false
  }
}

// ============================================================================
// STEP EVALUATION
// ============================================================================

function evaluateStepCompletion(
  step: ApprovalRequestStep
): { complete: boolean; outcome?: "approved" | "rejected" } {
  const approvals = step.decisions.filter((d) => d.decision === "approved").length
  const rejections = step.decisions.filter((d) => d.decision === "rejected").length

  if (rejections > 0) {
    return { complete: true, outcome: "rejected" }
  }

  if (approvals >= step.requiredApprovals) {
    return { complete: true, outcome: "approved" }
  }

  const pendingApprovers = step.assignedApprovers.filter((a) => !a.hasResponded).length
  if (approvals + pendingApprovers < step.requiredApprovals) {
    return { complete: true, outcome: "rejected" }
  }

  return { complete: false }
}

function evaluateWorkflowCompletion(
  request: ApprovalRequest,
  workflow: ApprovalWorkflow
): { complete: boolean; outcome?: ApprovalDecision; nextStepIndex?: number } {
  const completedSteps = request.steps.filter(
    (s) => s.status === "approved" || s.status === "rejected"
  )
  const rejectedSteps = request.steps.filter((s) => s.status === "rejected")

  if (rejectedSteps.length > 0) {
    return { complete: true, outcome: "rejected" }
  }

  if (workflow.execution === "parallel") {
    if (completedSteps.length === request.steps.length) {
      return { complete: true, outcome: "approved" }
    }
    return { complete: false }
  }

  if (workflow.execution === "sequential") {
    if (completedSteps.length === request.steps.length) {
      return { complete: true, outcome: "approved" }
    }

    const nextStep = request.steps.find((s) => s.status === "pending")
    if (nextStep) {
      const nextIndex = request.steps.indexOf(nextStep)
      return { complete: false, nextStepIndex: nextIndex }
    }

    return { complete: false }
  }

  return { complete: false }
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter approval requests
 */
export function filterApprovalRequests(
  requests: readonly ApprovalRequest[],
  filter: ApprovalRequestFilter
): ApprovalRequest[] {
  return requests.filter((request) => {
    if (filter.statuses?.length && !filter.statuses.includes(request.status)) {
      return false
    }
    if (filter.objectType && request.objectType !== filter.objectType) {
      return false
    }
    if (filter.objectId && request.objectId !== filter.objectId) {
      return false
    }
    if (filter.requesterId && request.requester.id !== filter.requesterId) {
      return false
    }
    if (filter.pendingForUserId) {
      const isPending = request.steps.some(
        (s) =>
          s.status === "active" &&
          s.assignedApprovers.some(
            (a) => a.actor.id === filter.pendingForUserId && !a.hasResponded
          )
      )
      if (!isPending) return false
    }
    if (filter.createdAfter && request.createdAt < filter.createdAfter) {
      return false
    }
    if (filter.createdBefore && request.createdAt > filter.createdBefore) {
      return false
    }
    if (filter.expiringBefore && request.expiresAt && request.expiresAt > filter.expiringBefore) {
      return false
    }
    return true
  })
}

/**
 * Sort approval requests
 */
export function sortApprovalRequests(
  requests: readonly ApprovalRequest[],
  sort: ApprovalRequestSort
): ApprovalRequest[] {
  const sorted = [...requests]
  const multiplier = sort.direction === "asc" ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case "createdAt":
        return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier
      case "updatedAt":
        return (a.updatedAt.getTime() - b.updatedAt.getTime()) * multiplier
      case "expiresAt": {
        const aExp = a.expiresAt?.getTime() ?? Infinity
        const bExp = b.expiresAt?.getTime() ?? Infinity
        return (aExp - bExp) * multiplier
      }
      case "status":
        return a.status.localeCompare(b.status) * multiplier
      default:
        return 0
    }
  })

  return sorted
}
