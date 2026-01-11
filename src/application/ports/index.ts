/**
 * Application Ports - Public API
 *
 * Ports define the interfaces that adapters must implement.
 * This is the boundary between application and infrastructure.
 */

// Repository
export type {
  ApprovalRepository,
  LinkedApprovalRepository,
  ApprovalQueryFilters,
  ApprovalQueryOptions,
  PaginatedResult,
  ApprovalReference,
} from "./approval-repository.port";

// Policy
export type {
  PolicyProvider,
  ApproverResolver,
  PolicyEvaluationService,
  PolicyEvaluationResult,
  ResolvedStage,
  ApproverResolutionContext,
} from "./policy-provider.port";

export {
  createStaticPolicyProvider,
  createExplicitApproverResolver,
} from "./policy-provider.port";

// Notifications
export type {
  NotificationService,
  NotificationPayload,
  NotificationType,
  ApprovalRequestedNotification,
  VoteRecordedNotification,
  ApprovalCompleteNotification,
} from "./notification.port";

export {
  buildApprovalRequestedNotification,
  buildVoteRecordedNotification,
  buildApprovalCompleteNotification,
  nullNotificationService,
} from "./notification.port";
