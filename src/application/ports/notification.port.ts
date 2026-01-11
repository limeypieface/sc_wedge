/**
 * Notification Port
 *
 * Defines the interface for sending notifications about approval events.
 * Implementations can be email, Slack, in-app notifications, etc.
 *
 * Design principles:
 * - Fire-and-forget semantics (application doesn't wait for delivery)
 * - Notification content is computed by the application layer
 * - Multiple notification channels supported
 */

import {
  ApprovalInstance,
  EntityId,
  PrincipalId,
  Vote,
  ApprovalStatus,
} from "../../domain/approval-engine";

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Types of notifications
 */
export type NotificationType =
  | "approval_requested" // New approval needs attention
  | "approval_reminder" // Reminder for pending approval
  | "vote_recorded" // Someone voted
  | "approval_complete" // Approval finished (approved/rejected)
  | "approval_cancelled" // Approval was cancelled
  | "approval_expiring" // Approval is about to expire
  | "approval_expired"; // Approval expired

/**
 * Base notification payload
 */
export interface NotificationPayload {
  /** Type of notification */
  readonly type: NotificationType;
  /** Recipients */
  readonly recipients: readonly PrincipalId[];
  /** Approval this is about */
  readonly approvalId: EntityId;
  /** Human-readable subject */
  readonly subject: string;
  /** Human-readable body */
  readonly body: string;
  /** Link to view the approval (if applicable) */
  readonly actionUrl?: string;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Notification for approval requested
 */
export interface ApprovalRequestedNotification extends NotificationPayload {
  readonly type: "approval_requested";
  /** Who requested the approval */
  readonly requestedBy: PrincipalId;
  /** Stage name the recipient needs to approve */
  readonly stageName: string;
}

/**
 * Notification for vote recorded
 */
export interface VoteRecordedNotification extends NotificationPayload {
  readonly type: "vote_recorded";
  /** The vote that was recorded */
  readonly vote: Vote;
  /** Current progress */
  readonly progress: {
    readonly completedStages: number;
    readonly totalStages: number;
  };
}

/**
 * Notification for approval complete
 */
export interface ApprovalCompleteNotification extends NotificationPayload {
  readonly type: "approval_complete";
  /** Final status */
  readonly finalStatus: ApprovalStatus;
}

// ============================================================================
// NOTIFICATION SERVICE INTERFACE
// ============================================================================

/**
 * Service for sending notifications
 */
export interface NotificationService {
  /**
   * Send a notification
   */
  send(notification: NotificationPayload): Promise<void>;

  /**
   * Send multiple notifications
   */
  sendMany(notifications: readonly NotificationPayload[]): Promise<void>;

  /**
   * Check if a principal has opted out of a notification type
   */
  isOptedOut?(
    principalId: PrincipalId,
    notificationType: NotificationType
  ): Promise<boolean>;
}

// ============================================================================
// NOTIFICATION BUILDERS
// ============================================================================

/**
 * Build an approval requested notification
 */
export function buildApprovalRequestedNotification(
  approval: ApprovalInstance,
  stageName: string,
  approvers: readonly PrincipalId[],
  actionUrl?: string
): ApprovalRequestedNotification {
  return {
    type: "approval_requested",
    recipients: approvers,
    approvalId: approval.id,
    subject: `Approval requested: ${stageName}`,
    body: `Your approval is needed for stage "${stageName}".`,
    actionUrl,
    requestedBy: approval.initiatorId,
    stageName,
  };
}

/**
 * Build a vote recorded notification
 */
export function buildVoteRecordedNotification(
  approval: ApprovalInstance,
  vote: Vote,
  completedStages: number,
  totalStages: number,
  watchers: readonly PrincipalId[],
  actionUrl?: string
): VoteRecordedNotification {
  const decisionText =
    vote.decision === "approve"
      ? "approved"
      : vote.decision === "reject"
      ? "rejected"
      : vote.decision === "request_changes"
      ? "requested changes on"
      : "abstained from";

  return {
    type: "vote_recorded",
    recipients: watchers,
    approvalId: approval.id,
    subject: `Vote recorded on approval`,
    body: `${vote.principalId} ${decisionText} the approval.`,
    actionUrl,
    vote,
    progress: {
      completedStages,
      totalStages,
    },
  };
}

/**
 * Build an approval complete notification
 */
export function buildApprovalCompleteNotification(
  approval: ApprovalInstance,
  watchers: readonly PrincipalId[],
  actionUrl?: string
): ApprovalCompleteNotification {
  const statusText =
    approval.status === "approved"
      ? "has been approved"
      : approval.status === "rejected"
      ? "has been rejected"
      : `is now ${approval.status}`;

  return {
    type: "approval_complete",
    recipients: watchers,
    approvalId: approval.id,
    subject: `Approval ${approval.status}`,
    body: `The approval ${statusText}.`,
    actionUrl,
    finalStatus: approval.status,
  };
}

// ============================================================================
// NULL NOTIFICATION SERVICE
// ============================================================================

/**
 * A no-op notification service for testing or when notifications aren't needed
 */
export const nullNotificationService: NotificationService = {
  async send(_notification: NotificationPayload): Promise<void> {
    // No-op
  },
  async sendMany(_notifications: readonly NotificationPayload[]): Promise<void> {
    // No-op
  },
};
