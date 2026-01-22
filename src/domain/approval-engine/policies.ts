/**
 * Approval Engine - Policies
 *
 * Pre-built policies and policy builders for common approval patterns.
 */

import type { EntityId } from "../core/types"
import type {
  ApprovalPolicy,
  ApprovalWorkflow,
  ApprovalStep,
  PolicyTrigger,
  ApproverConfig,
  TriggerCondition,
  WorkflowTimeout,
  ExecutionMode,
} from "./types"

// ============================================================================
// POLICY BUILDERS
// ============================================================================

/**
 * Create a simple approval policy
 */
export function createPolicy(config: {
  id: EntityId
  name: string
  description?: string
  objectType: string
  triggers: readonly PolicyTrigger[]
  workflow: ApprovalWorkflow
  priority?: number
  active?: boolean
}): ApprovalPolicy {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    objectType: config.objectType,
    triggers: config.triggers,
    priority: config.priority ?? 100,
    workflow: config.workflow,
    active: config.active ?? true,
  }
}

/**
 * Create a workflow
 */
export function createWorkflow(config: {
  id: EntityId
  name: string
  description?: string
  steps: readonly ApprovalStep[]
  execution?: ExecutionMode
  timeout?: WorkflowTimeout
  timeoutAction?: "expire" | "auto_approve" | "auto_reject" | "escalate"
}): ApprovalWorkflow {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    steps: config.steps,
    execution: config.execution ?? "sequential",
    timeout: config.timeout,
    timeoutAction: config.timeoutAction,
  }
}

/**
 * Create an approval step
 */
export function createStep(config: {
  id: EntityId
  name: string
  description?: string
  approvers: ApproverConfig
  requiredApprovals?: number | "all" | "any"
  order: number
}): ApprovalStep {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    approvers: config.approvers,
    requiredApprovals: config.requiredApprovals ?? 1,
    order: config.order,
  }
}

// ============================================================================
// TRIGGER BUILDERS
// ============================================================================

/**
 * Create a threshold trigger
 */
export function thresholdTrigger(
  field: string,
  operator: ">" | ">=" | "<" | "<=" | "==",
  value: number
): PolicyTrigger {
  return {
    type: "threshold",
    condition: { type: "threshold", field, operator, value },
  }
}

/**
 * Create a change trigger
 */
export function changeTrigger(
  field: string,
  fromValue?: unknown,
  toValue?: unknown
): PolicyTrigger {
  return {
    type: "change",
    condition: { type: "change", field, fromValue, toValue },
  }
}

/**
 * Create a status trigger
 */
export function statusTrigger(
  to: string | readonly string[],
  from?: string | readonly string[]
): PolicyTrigger {
  return {
    type: "status",
    condition: { type: "status", to, from },
  }
}

/**
 * Create a category trigger
 */
export function categoryTrigger(categories: readonly string[]): PolicyTrigger {
  return {
    type: "category",
    condition: { type: "category", categories },
  }
}

/**
 * Create a custom trigger
 */
export function customTrigger(
  ruleId: string,
  params?: Readonly<Record<string, unknown>>
): PolicyTrigger {
  return {
    type: "custom",
    condition: { type: "custom", ruleId, params },
  }
}

// ============================================================================
// APPROVER CONFIG BUILDERS
// ============================================================================

/**
 * Specific users as approvers
 */
export function userApprovers(userIds: readonly string[], exclude?: readonly string[]): ApproverConfig {
  return { type: "user", value: [...userIds], exclude }
}

/**
 * Role-based approvers
 */
export function roleApprovers(roles: readonly string[], exclude?: readonly string[]): ApproverConfig {
  return { type: "role", value: [...roles], exclude }
}

/**
 * Manager as approver
 */
export function managerApprover(exclude?: readonly string[]): ApproverConfig {
  return { type: "manager", value: "manager", exclude }
}

/**
 * Department head as approver
 */
export function departmentApprover(exclude?: readonly string[]): ApproverConfig {
  return { type: "department", value: "department_head", exclude }
}

// ============================================================================
// PRESET POLICIES
// ============================================================================

/**
 * High-value purchase order approval policy
 */
export const HIGH_VALUE_PO_POLICY: ApprovalPolicy = createPolicy({
  id: "pol-high-value-po",
  name: "High Value Purchase Order",
  description: "Requires approval for POs over $10,000",
  objectType: "purchase_order",
  triggers: [thresholdTrigger("grandTotal", ">", 10000)],
  workflow: createWorkflow({
    id: "wf-high-value-po",
    name: "High Value PO Workflow",
    steps: [
      createStep({
        id: "step-manager",
        name: "Manager Approval",
        approvers: managerApprover(),
        order: 1,
      }),
      createStep({
        id: "step-finance",
        name: "Finance Approval",
        approvers: roleApprovers(["finance_manager"]),
        order: 2,
      }),
    ],
    timeout: { duration: 3, unit: "days" },
    timeoutAction: "escalate",
  }),
  priority: 10,
})

/**
 * Cost increase approval policy
 */
export const COST_INCREASE_POLICY: ApprovalPolicy = createPolicy({
  id: "pol-cost-increase",
  name: "Cost Increase",
  description: "Requires approval when costs increase significantly",
  objectType: "purchase_order",
  triggers: [
    customTrigger("cost_delta_exceeded", { percentThreshold: 0.05, absoluteThreshold: 1000 }),
  ],
  workflow: createWorkflow({
    id: "wf-cost-increase",
    name: "Cost Increase Workflow",
    steps: [
      createStep({
        id: "step-buyer",
        name: "Buyer Review",
        approvers: roleApprovers(["buyer"]),
        order: 1,
      }),
    ],
    timeout: { duration: 1, unit: "days" },
  }),
  priority: 20,
})

/**
 * New vendor approval policy
 */
export const NEW_VENDOR_POLICY: ApprovalPolicy = createPolicy({
  id: "pol-new-vendor",
  name: "New Vendor",
  description: "Requires approval for orders with new vendors",
  objectType: "purchase_order",
  triggers: [customTrigger("is_new_vendor")],
  workflow: createWorkflow({
    id: "wf-new-vendor",
    name: "New Vendor Workflow",
    steps: [
      createStep({
        id: "step-procurement",
        name: "Procurement Review",
        approvers: roleApprovers(["procurement_manager"]),
        order: 1,
      }),
      createStep({
        id: "step-compliance",
        name: "Compliance Review",
        approvers: roleApprovers(["compliance"]),
        order: 2,
      }),
    ],
    execution: "parallel",
    timeout: { duration: 5, unit: "days" },
  }),
  priority: 15,
})

/**
 * Get all preset policies
 */
export function getPresetPolicies(): readonly ApprovalPolicy[] {
  return [HIGH_VALUE_PO_POLICY, COST_INCREASE_POLICY, NEW_VENDOR_POLICY]
}
