/**
 * UI Hooks - Public API
 *
 * React hooks for working with the approval engine in the UI.
 */

// Core approval hook
export type {
  UseApprovalOptions,
  UseApprovalResult,
  ApprovalActions,
} from "./use-approval";

export { useApproval } from "./use-approval";

// Approval context hook
export type {
  UseApprovalContextOptions,
  UseApprovalContextResult,
  PORevisionMetrics,
} from "./use-approval-context";

export {
  useApprovalContext,
  usePORevisionContext,
  extractPORevisionMetrics,
} from "./use-approval-context";

// Pending approvals hook
export type {
  UsePendingApprovalsOptions,
  UsePendingApprovalsResult,
  PendingApprovalsBadgeData,
} from "./use-pending-approvals";

export {
  usePendingApprovals,
  getPendingApprovalsBadgeData,
} from "./use-pending-approvals";
