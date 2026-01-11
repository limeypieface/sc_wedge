/**
 * Cancel Approval Use Case
 *
 * Handles cancellation of pending approvals by the initiator.
 *
 * Design principles:
 * - Only the initiator can cancel
 * - Only pending approvals can be cancelled
 * - Notifications sent to all watchers
 */

import {
  ApprovalInstance,
  EntityId,
  cancelApproval,
  getCapabilities,
  EngineResult,
  success,
  failure,
  entityId,
  PrincipalId,
} from "../../domain/approval-engine";
import { ApprovalRepository } from "../ports/approval-repository.port";
import { NotificationService, NotificationPayload } from "../ports/notification.port";

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Input for cancelling an approval
 */
export interface CancelApprovalInput {
  readonly approvalId: string;
  readonly cancellerId: string;
  readonly reason?: string;
  readonly actionUrl?: string;
}

/**
 * Output from cancelling an approval
 */
export interface CancelApprovalOutput {
  readonly approval: ApprovalInstance;
}

// ============================================================================
// USE CASE DEPENDENCIES
// ============================================================================

export interface CancelApprovalDependencies {
  readonly repository: ApprovalRepository;
  readonly notificationService: NotificationService;
}

// ============================================================================
// USE CASE IMPLEMENTATION
// ============================================================================

/**
 * Create the cancel approval use case
 */
export function createCancelApprovalUseCase(deps: CancelApprovalDependencies) {
  return async function cancelApprovalUseCase(
    input: CancelApprovalInput
  ): Promise<EngineResult<CancelApprovalOutput>> {
    const { repository, notificationService } = deps;

    // 1. Fetch the approval
    const approval = await repository.findById(entityId(input.approvalId));
    if (!approval) {
      return failure("NOT_FOUND", `Approval ${input.approvalId} not found`);
    }

    // 2. Check capabilities
    const capabilities = getCapabilities(approval, input.cancellerId);
    if (!capabilities.canCancel) {
      const reason =
        capabilities.denialReasons["canCancel"] ?? "Not authorized to cancel";
      return failure("NOT_AUTHORIZED", reason);
    }

    // 3. Cancel the approval
    const cancelResult = cancelApproval(
      approval,
      input.cancellerId,
      input.reason
    );

    if (!cancelResult.success) {
      return failure(cancelResult.error.code, cancelResult.error.message);
    }

    // 4. Save to repository
    const saveResult = await repository.save(cancelResult.value);
    if (!saveResult.success) {
      return failure(saveResult.error.code, saveResult.error.message);
    }

    // 5. Send notifications
    const watchers = getWatchers(approval);
    const notification: NotificationPayload = {
      type: "approval_cancelled",
      recipients: watchers.filter((w) => w !== input.cancellerId),
      approvalId: approval.id,
      subject: "Approval cancelled",
      body: input.reason
        ? `The approval was cancelled. Reason: ${input.reason}`
        : "The approval was cancelled.",
      actionUrl: input.actionUrl,
      metadata: { cancellerId: input.cancellerId, reason: input.reason },
    };
    await notificationService.send(notification);

    return success({
      approval: saveResult.value,
    });
  };
}

/**
 * Get all principals who should be notified
 */
function getWatchers(approval: ApprovalInstance): readonly PrincipalId[] {
  const watchers = new Set<PrincipalId>();
  watchers.add(approval.initiatorId);
  for (const stage of approval.stages) {
    for (const approver of stage.approvers) {
      watchers.add(approver);
    }
  }
  return Array.from(watchers);
}

/**
 * Type for the use case function
 */
export type CancelApprovalUseCase = ReturnType<
  typeof createCancelApprovalUseCase
>;
