/**
 * Approval Workflow Engine
 *
 * Policy-driven, multi-stage decision gating system.
 * Pure functions with no side effects.
 *
 * Features:
 * - Policy-based approval triggers
 * - Multi-step workflows (sequential, parallel, conditional)
 * - Configurable approvers (users, roles, dynamic)
 * - Escalation support
 * - Timeout handling
 */

import type {
  ApprovalDecision,
  ApprovalStatus,
  StepStatus,
  ApprovalPolicy,
  PolicyTrigger,
  TriggerCondition,
  ApprovalWorkflow,
  ApprovalStep,
  ApproverConfig,
  ApprovalRequest,
  ApprovalRequestStep,
  AssignedApprover,
  StepDecision,
  ApprovalEngineConfig,
  ApprovalContext,
  CreateApprovalInput,
  MakeDecisionInput,
  ApprovalCheckResult,
  ApprovalRequestFilter,
  ApprovalRequestSort,
} from "./types"

export * from "./types"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return `apr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Status ordering for sorting
 */
const STATUS_ORDER: Record<ApprovalStatus, number> = {
  pending: 0,
  in_progress: 1,
  approved: 2,
  rejected: 3,
  cancelled: 4,
  expired: 5,
}

// ============================================================================
// APPROVAL ENGINE
// ============================================================================

/**
 * Create an approval engine with policies
 */
export function createApprovalEngine(
  policies: ApprovalPolicy[],
  config: ApprovalEngineConfig = {}
) {
  const { generateId: customGenerateId = generateId, resolveApprovers, getManager } = config

  // Index policies
  const policiesByType = new Map<string, ApprovalPolicy[]>()
  for (const policy of policies) {
    if (!policy.active) continue
    const existing = policiesByType.get(policy.objectType) || []
    existing.push(policy)
    // Sort by priority
    existing.sort((a, b) => a.priority - b.priority)
    policiesByType.set(policy.objectType, existing)
  }

  return {
    /**
     * Check if approval is required for an action
     */
    checkApprovalRequired(context: ApprovalContext): ApprovalCheckResult {
      const applicablePolicies = policiesByType.get(context.objectType) || []
      const matchedPolicies: ApprovalPolicy[] = []
      const reasons: string[] = []

      for (const policy of applicablePolicies) {
        const matchResult = evaluatePolicyTriggers(policy.triggers, context)
        if (matchResult.matches) {
          matchedPolicies.push(policy)
          reasons.push(...matchResult.reasons)
        }
      }

      return {
        required: matchedPolicies.length > 0,
        policies: matchedPolicies,
        reasons,
      }
    },

    /**
     * Create a new approval request
     */
    createRequest(
      input: CreateApprovalInput,
      workflow: ApprovalWorkflow
    ): ApprovalRequest {
      const now = new Date()
      const requestId = customGenerateId()

      // Create step instances
      const steps: ApprovalRequestStep[] = workflow.steps.map((stepDef) => {
        const assignedApprovers = this.resolveStepApprovers(stepDef.approvers, {
          objectType: input.objectType,
          objectId: input.objectId,
          objectData: input.objectData,
          requesterId: input.requesterId,
        })

        const requiredCount =
          stepDef.requiredApprovals === "all"
            ? assignedApprovers.length
            : stepDef.requiredApprovals === "any"
            ? 1
            : stepDef.requiredApprovals

        return {
          id: customGenerateId(),
          stepDefinitionId: stepDef.id,
          name: stepDef.name,
          order: stepDef.order,
          status: "pending" as StepStatus,
          assignedApprovers: assignedApprovers.map((userId) => ({
            userId,
            assignedAt: now,
            hasResponded: false,
          })),
          requiredApprovals: requiredCount,
          decisions: [],
        }
      })

      // Calculate expiration
      let expiresAt: Date | undefined
      if (workflow.timeout) {
        expiresAt = new Date(now)
        const ms = getTimeoutMs(workflow.timeout.duration, workflow.timeout.unit)
        expiresAt.setTime(expiresAt.getTime() + ms)
      }

      // Activate first step(s) based on execution mode
      const activatedSteps = activateInitialSteps(steps, workflow.execution)

      return {
        id: requestId,
        policyId: input.policyId,
        workflowId: workflow.id,
        objectType: input.objectType,
        objectId: input.objectId,
        objectLabel: input.objectLabel,
        status: "pending",
        requesterId: input.requesterId,
        requesterName: input.requesterName,
        triggerReason: input.triggerReason,
        triggerData: input.triggerData,
        steps: activatedSteps,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        escalationCount: 0,
      }
    },

    /**
     * Resolve approvers for a step
     */
    resolveStepApprovers(
      approverConfig: ApproverConfig,
      context: Partial<ApprovalContext>
    ): string[] {
      // Use custom resolver if provided
      if (resolveApprovers) {
        return resolveApprovers(approverConfig, context as ApprovalContext)
      }

      // Default resolution
      switch (approverConfig.type) {
        case "user":
          return Array.isArray(approverConfig.value)
            ? approverConfig.value
            : [approverConfig.value]

        case "manager":
          if (getManager && context.requesterId) {
            const manager = getManager(context.requesterId)
            return manager ? [manager] : []
          }
          return []

        case "role":
        case "department":
        case "dynamic":
          // These require external resolution
          return []

        default:
          return []
      }
    },

    /**
     * Make a decision on a step
     */
    makeDecision(
      request: ApprovalRequest,
      input: MakeDecisionInput
    ): { request: ApprovalRequest; completed: boolean } {
      const now = new Date()
      const stepIndex = request.steps.findIndex((s) => s.id === input.stepId)

      if (stepIndex === -1) {
        return { request, completed: false }
      }

      const step = request.steps[stepIndex]

      // Check if approver is assigned
      const approverIndex = step.assignedApprovers.findIndex(
        (a) => a.userId === input.approverId
      )
      if (approverIndex === -1) {
        return { request, completed: false }
      }

      // Record the decision
      const decision: StepDecision = {
        id: customGenerateId(),
        approverId: input.approverId,
        approverName: input.approverName,
        decision: input.decision,
        notes: input.notes,
        decidedAt: now,
        attachments: input.attachments,
      }

      // Update the step
      const updatedApprovers = [...step.assignedApprovers]
      updatedApprovers[approverIndex] = {
        ...updatedApprovers[approverIndex],
        hasResponded: true,
      }

      const updatedStep: ApprovalRequestStep = {
        ...step,
        assignedApprovers: updatedApprovers,
        decisions: [...step.decisions, decision],
      }

      // Determine step status
      const stepResult = evaluateStepCompletion(updatedStep)
      updatedStep.status = stepResult.status
      if (stepResult.status !== "active") {
        updatedStep.completedAt = now
      }

      // Update request
      const updatedSteps = [...request.steps]
      updatedSteps[stepIndex] = updatedStep

      let updatedRequest: ApprovalRequest = {
        ...request,
        steps: updatedSteps,
        updatedAt: now,
      }

      // Check if workflow is complete
      const workflowResult = evaluateWorkflowCompletion(updatedRequest)
      if (workflowResult.complete) {
        updatedRequest = {
          ...updatedRequest,
          status: workflowResult.decision === "approved" ? "approved" : "rejected",
          finalDecision: workflowResult.decision,
          finalDecisionAt: now,
          finalDecisionBy: input.approverId,
          finalNotes: input.notes,
        }
      } else if (stepResult.status !== "active") {
        // Activate next step(s)
        updatedRequest = activateNextSteps(updatedRequest, stepIndex)
      }

      return {
        request: updatedRequest,
        completed: workflowResult.complete,
      }
    },

    /**
     * Cancel an approval request
     */
    cancelRequest(
      request: ApprovalRequest,
      cancelledBy: string,
      reason?: string
    ): ApprovalRequest {
      return {
        ...request,
        status: "cancelled",
        finalNotes: reason,
        finalDecisionBy: cancelledBy,
        finalDecisionAt: new Date(),
        updatedAt: new Date(),
      }
    },

    /**
     * Expire an approval request
     */
    expireRequest(request: ApprovalRequest): ApprovalRequest {
      return {
        ...request,
        status: "expired",
        finalDecision: undefined,
        finalDecisionAt: new Date(),
        updatedAt: new Date(),
      }
    },

    /**
     * Escalate a request
     */
    escalateRequest(
      request: ApprovalRequest,
      newApprovers: string[],
      reason?: string
    ): ApprovalRequest {
      const now = new Date()

      // Find active step and add new approvers
      const updatedSteps = request.steps.map((step) => {
        if (step.status !== "active") return step

        const newAssigned: AssignedApprover[] = newApprovers.map((userId) => ({
          userId,
          assignedAt: now,
          hasResponded: false,
        }))

        return {
          ...step,
          assignedApprovers: [...step.assignedApprovers, ...newAssigned],
          notes: reason ? `Escalated: ${reason}` : step.notes,
        }
      })

      return {
        ...request,
        steps: updatedSteps,
        escalationCount: request.escalationCount + 1,
        lastEscalatedAt: now,
        updatedAt: now,
      }
    },

    /**
     * Get pending approvals for a user
     */
    getPendingForUser(
      requests: ApprovalRequest[],
      userId: string
    ): ApprovalRequest[] {
      return requests.filter((request) => {
        if (request.status !== "pending" && request.status !== "in_progress") {
          return false
        }
        return request.steps.some(
          (step) =>
            step.status === "active" &&
            step.assignedApprovers.some(
              (a) => a.userId === userId && !a.hasResponded
            )
        )
      })
    },

    /**
     * Get all policies
     */
    getPolicies(): ApprovalPolicy[] {
      return policies.filter((p) => p.active)
    },

    /**
     * Get policy by ID
     */
    getPolicy(policyId: string): ApprovalPolicy | undefined {
      return policies.find((p) => p.id === policyId)
    },
  }
}

// ============================================================================
// TRIGGER EVALUATION
// ============================================================================

/**
 * Evaluate if policy triggers match the context
 */
function evaluatePolicyTriggers(
  triggers: PolicyTrigger[],
  context: ApprovalContext
): { matches: boolean; reasons: string[] } {
  const reasons: string[] = []

  for (const trigger of triggers) {
    const result = evaluateTrigger(trigger.condition, context)
    if (result.matches) {
      reasons.push(result.reason)
    }
  }

  return {
    matches: reasons.length > 0,
    reasons,
  }
}

/**
 * Evaluate a single trigger condition
 */
function evaluateTrigger(
  condition: TriggerCondition,
  context: ApprovalContext
): { matches: boolean; reason: string } {
  switch (condition.type) {
    case "threshold": {
      const value = getNestedValue(context.objectData || {}, condition.field)
      if (typeof value !== "number") {
        return { matches: false, reason: "" }
      }
      const matches = evaluateThreshold(value, condition.operator, condition.value)
      return {
        matches,
        reason: matches
          ? `${condition.field} (${value}) ${condition.operator} ${condition.value}`
          : "",
      }
    }

    case "change": {
      const oldValue = context.previousValues?.[condition.field]
      const newValue = context.newValues?.[condition.field]
      const matches =
        (condition.fromValue === undefined || oldValue === condition.fromValue) &&
        (condition.toValue === undefined || newValue === condition.toValue) &&
        oldValue !== newValue
      return {
        matches,
        reason: matches ? `${condition.field} changed from ${oldValue} to ${newValue}` : "",
      }
    }

    case "status": {
      const currentStatus = context.newValues?.status as string
      const previousStatus = context.previousValues?.status as string
      const toStatuses = Array.isArray(condition.to) ? condition.to : [condition.to]
      const fromStatuses = condition.from
        ? Array.isArray(condition.from)
          ? condition.from
          : [condition.from]
        : undefined

      const matches =
        toStatuses.includes(currentStatus) &&
        (!fromStatuses || fromStatuses.includes(previousStatus))
      return {
        matches,
        reason: matches ? `Status changed to ${currentStatus}` : "",
      }
    }

    case "category": {
      const category = context.objectData?.category as string
      const matches = condition.categories.includes(category)
      return {
        matches,
        reason: matches ? `Category is ${category}` : "",
      }
    }

    case "custom":
      // Custom conditions require external evaluation
      return { matches: false, reason: "" }

    default:
      return { matches: false, reason: "" }
  }
}

/**
 * Evaluate a threshold condition
 */
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
// STEP & WORKFLOW EVALUATION
// ============================================================================

/**
 * Evaluate if a step is complete
 */
function evaluateStepCompletion(
  step: ApprovalRequestStep
): { status: StepStatus; decision?: ApprovalDecision } {
  const approvalCount = step.decisions.filter((d) => d.decision === "approved").length
  const rejectionCount = step.decisions.filter((d) => d.decision === "rejected").length

  // Any rejection = step rejected
  if (rejectionCount > 0) {
    return { status: "rejected", decision: "rejected" }
  }

  // Enough approvals = step approved
  if (approvalCount >= step.requiredApprovals) {
    return { status: "approved", decision: "approved" }
  }

  // Still waiting
  return { status: "active" }
}

/**
 * Evaluate if workflow is complete
 */
function evaluateWorkflowCompletion(
  request: ApprovalRequest
): { complete: boolean; decision?: ApprovalDecision } {
  const steps = request.steps

  // Check for any rejections
  const hasRejection = steps.some((s) => s.status === "rejected")
  if (hasRejection) {
    return { complete: true, decision: "rejected" }
  }

  // Check if all steps approved
  const allApproved = steps.every((s) => s.status === "approved" || s.status === "skipped")
  if (allApproved) {
    return { complete: true, decision: "approved" }
  }

  return { complete: false }
}

/**
 * Activate initial steps based on execution mode
 */
function activateInitialSteps(
  steps: ApprovalRequestStep[],
  executionMode: "sequential" | "parallel" | "conditional"
): ApprovalRequestStep[] {
  const now = new Date()

  switch (executionMode) {
    case "parallel":
      // Activate all steps
      return steps.map((step) => ({
        ...step,
        status: "active" as StepStatus,
        activatedAt: now,
      }))

    case "sequential":
    case "conditional":
    default:
      // Activate first step only
      if (steps.length === 0) return steps
      const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
      return steps.map((step) =>
        step.id === sortedSteps[0].id
          ? { ...step, status: "active" as StepStatus, activatedAt: now }
          : step
      )
  }
}

/**
 * Activate next steps after a step completes
 */
function activateNextSteps(
  request: ApprovalRequest,
  completedStepIndex: number
): ApprovalRequest {
  const now = new Date()
  const steps = request.steps
  const completedStep = steps[completedStepIndex]

  // Find next step by order
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
  const currentOrderIndex = sortedSteps.findIndex((s) => s.id === completedStep.id)
  const nextStep = sortedSteps[currentOrderIndex + 1]

  if (!nextStep) {
    return request
  }

  const updatedSteps = steps.map((step) =>
    step.id === nextStep.id
      ? { ...step, status: "active" as StepStatus, activatedAt: now }
      : step
  )

  return {
    ...request,
    steps: updatedSteps,
    status: "in_progress",
    updatedAt: now,
  }
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter approval requests
 */
export function filterApprovalRequests(
  requests: ApprovalRequest[],
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
    if (filter.requesterId && request.requesterId !== filter.requesterId) {
      return false
    }
    if (filter.approverId) {
      const isApprover = request.steps.some((step) =>
        step.assignedApprovers.some((a) => a.userId === filter.approverId)
      )
      if (!isApprover) return false
    }
    if (filter.pendingForUser) {
      const hasPending = request.steps.some(
        (step) =>
          step.status === "active" &&
          step.assignedApprovers.some(
            (a) => a.userId === filter.pendingForUser && !a.hasResponded
          )
      )
      if (!hasPending) return false
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
  requests: ApprovalRequest[],
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
      case "expiresAt":
        const aExp = a.expiresAt?.getTime() || Infinity
        const bExp = b.expiresAt?.getTime() || Infinity
        return (aExp - bExp) * multiplier
      case "status":
        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * multiplier
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
 * Get nested value from object
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Convert timeout to milliseconds
 */
function getTimeoutMs(duration: number, unit: "hours" | "days" | "weeks"): number {
  const hourMs = 60 * 60 * 1000
  switch (unit) {
    case "hours":
      return duration * hourMs
    case "days":
      return duration * 24 * hourMs
    case "weeks":
      return duration * 7 * 24 * hourMs
    default:
      return duration * hourMs
  }
}

/**
 * Check if a request is expired
 */
export function isRequestExpired(request: ApprovalRequest): boolean {
  if (!request.expiresAt) return false
  return new Date() > request.expiresAt
}

/**
 * Get active step for a request
 */
export function getActiveStep(request: ApprovalRequest): ApprovalRequestStep | undefined {
  return request.steps.find((s) => s.status === "active")
}

/**
 * Check if user can approve a request
 */
export function canUserApprove(request: ApprovalRequest, userId: string): boolean {
  const activeStep = getActiveStep(request)
  if (!activeStep) return false

  return activeStep.assignedApprovers.some(
    (a) => a.userId === userId && !a.hasResponded
  )
}

/**
 * Calculate approval statistics
 */
export function calculateApprovalStats(requests: ApprovalRequest[]): {
  total: number
  pending: number
  approved: number
  rejected: number
  expired: number
  avgProcessingTime: number | null
  byObjectType: Record<string, number>
} {
  const stats = {
    total: requests.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    avgProcessingTime: null as number | null,
    byObjectType: {} as Record<string, number>,
  }

  let totalProcessingTime = 0
  let completedCount = 0

  for (const request of requests) {
    // Status counts
    switch (request.status) {
      case "pending":
      case "in_progress":
        stats.pending++
        break
      case "approved":
        stats.approved++
        break
      case "rejected":
        stats.rejected++
        break
      case "expired":
        stats.expired++
        break
    }

    // By object type
    stats.byObjectType[request.objectType] =
      (stats.byObjectType[request.objectType] || 0) + 1

    // Processing time
    if (request.finalDecisionAt) {
      totalProcessingTime +=
        request.finalDecisionAt.getTime() - request.createdAt.getTime()
      completedCount++
    }
  }

  if (completedCount > 0) {
    stats.avgProcessingTime = totalProcessingTime / completedCount
  }

  return stats
}
