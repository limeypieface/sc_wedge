/**
 * UI Components - Public API
 *
 * React components for approval workflows.
 *
 * Note: ApprovalStatusBadge and StageStatusBadge have been replaced by
 * the generic StatusPill component from @/components/ui/status-pill.
 * Use APPROVAL_STATUS_CONFIG and STAGE_STATUS_CONFIG from @/components/po
 * for the same functionality.
 */

export type { ApprovalActionsPanelProps } from "./approval-actions-panel";
export { ApprovalActionsPanel } from "./approval-actions-panel";

export type { ApprovalProgressBarProps } from "./approval-progress-bar";
export { ApprovalProgressBar } from "./approval-progress-bar";
