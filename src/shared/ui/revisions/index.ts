/**
 * Shared Revision Components
 *
 * Unified revision workflow components for both PO and SO.
 * Uses terminology configuration to adapt labels and text.
 */

// Types
export type {
  RevisionTerminology,
  ApprovalStepStatus,
  Approver,
  ApprovalStep,
  ApprovalChain,
  CostDeltaInfo,
  RevisionWorkflowStatus,
  WorkflowStep,
} from "./types"

export {
  PO_TERMINOLOGY,
  SO_TERMINOLOGY,
  DEFAULT_WORKFLOW_STEPS,
  getStepIndex,
} from "./types"

// Components
export { ApprovalChainDisplay } from "./approval-chain-display"
export { CostDeltaIndicator } from "./cost-delta-indicator"
export { NotificationReminder } from "./notification-reminder"
export { RevisionActions } from "./revision-actions"
export { RevisionStatusPanel } from "./revision-status-panel"
export { WorkflowProgress } from "./workflow-progress"
