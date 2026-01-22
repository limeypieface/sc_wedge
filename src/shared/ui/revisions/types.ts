/**
 * Shared Revision Types
 *
 * Common types for revision components used by both PO and SO.
 */

/**
 * Terminology configuration for parameterizing revision components
 * between Purchase Orders and Sales Orders
 */
export interface RevisionTerminology {
  /** "PurchaseOrder" | "SalesOrder" */
  orderType: "PurchaseOrder" | "SalesOrder"

  /** External party label: "Supplier" | "Customer" */
  externalParty: string

  /** Internal owner label: "buyer" | "sales rep" */
  internalOwner: string

  /** Cost label: "Cost" | "Order Value" */
  costLabel: string
}

export const PO_TERMINOLOGY: RevisionTerminology = {
  orderType: "PurchaseOrder",
  externalParty: "Supplier",
  internalOwner: "buyer",
  costLabel: "Cost",
}

export const SO_TERMINOLOGY: RevisionTerminology = {
  orderType: "SalesOrder",
  externalParty: "Customer",
  internalOwner: "sales rep",
  costLabel: "Order Value",
}

/**
 * Approval step status
 */
export type ApprovalStepStatus = "pending" | "approved" | "rejected"

/**
 * Approver information
 */
export interface Approver {
  id: string
  name: string
  role: string
  email?: string
}

/**
 * Single step in an approval chain
 */
export interface ApprovalStep {
  id: string
  level: number
  approver: Approver
  status: ApprovalStepStatus
  notes?: string
  actionDate?: string
}

/**
 * Full approval chain
 */
export interface ApprovalChain {
  steps: ApprovalStep[]
  currentLevel: number
}

/**
 * Cost delta information
 */
export interface CostDeltaInfo {
  delta: number
  percentChange: number
  exceedsThreshold: boolean
  previousTotal?: number
  newTotal?: number
}

/**
 * Generic revision status (common workflow states)
 */
export type RevisionWorkflowStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "sent"
  | "active"

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  id: string
  label: string
  status: RevisionWorkflowStatus
}

/**
 * Default workflow steps
 */
export const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "draft", label: "Draft", status: "draft" },
  { id: "approval", label: "Approval", status: "pending_approval" },
  { id: "approved", label: "Approved", status: "approved" },
  { id: "sent", label: "Sent", status: "sent" },
  { id: "active", label: "Active", status: "active" },
]

/**
 * Map status to step index
 */
export function getStepIndex(
  status: RevisionWorkflowStatus,
  steps: WorkflowStep[] = DEFAULT_WORKFLOW_STEPS
): number {
  // Handle rejected - show at draft position
  if (status === "rejected") {
    return 0
  }
  const index = steps.findIndex((s) => s.status === status)
  return index >= 0 ? index : 0
}
