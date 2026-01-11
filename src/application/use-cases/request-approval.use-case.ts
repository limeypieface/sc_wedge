/**
 * Request Approval Use Case
 *
 * Handles the creation and submission of new approval requests.
 * Orchestrates domain logic, persistence, and notifications.
 *
 * Design principles:
 * - Single responsibility: creating approvals
 * - Depends only on ports, not implementations
 * - Returns result types, doesn't throw
 */

import {
  ApprovalInstance,
  ApprovalContext,
  ApprovalPolicy,
  PrincipalId,
  StageTemplate,
  createApproval,
  submitApproval,
  EngineResult,
  success,
  failure,
  entityId,
  principalId,
} from "../../domain/approval-engine";
import {
  ApprovalRepository,
  ApprovalReference,
  LinkedApprovalRepository,
} from "../ports/approval-repository.port";
import {
  PolicyProvider,
  ApproverResolver,
  ApproverResolutionContext,
} from "../ports/policy-provider.port";
import {
  NotificationService,
  buildApprovalRequestedNotification,
} from "../ports/notification.port";
import { findMatchingPolicies } from "../../domain/approval-engine";

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Input for requesting approval
 */
export interface RequestApprovalInput {
  /** Unique ID for the approval (client-generated) */
  readonly approvalId: string;
  /** Who is requesting the approval */
  readonly requesterId: string;
  /** Entity type being approved */
  readonly entityType: string;
  /** Reference to the external entity */
  readonly entityReference?: ApprovalReference;
  /** Context for policy evaluation */
  readonly context: ApprovalContext;
  /** Whether to auto-submit after creation */
  readonly autoSubmit?: boolean;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
  /** URL for viewing the approval */
  readonly actionUrl?: string;
}

/**
 * Output from requesting approval
 */
export interface RequestApprovalOutput {
  /** The created approval instance */
  readonly approval: ApprovalInstance;
  /** Whether approval was required */
  readonly approvalRequired: boolean;
  /** The policy that was applied */
  readonly appliedPolicy?: ApprovalPolicy;
}

// ============================================================================
// USE CASE DEPENDENCIES
// ============================================================================

export interface RequestApprovalDependencies {
  readonly repository: ApprovalRepository | LinkedApprovalRepository;
  readonly policyProvider: PolicyProvider;
  readonly approverResolver: ApproverResolver;
  readonly notificationService: NotificationService;
}

// ============================================================================
// USE CASE IMPLEMENTATION
// ============================================================================

/**
 * Create the request approval use case
 */
export function createRequestApprovalUseCase(deps: RequestApprovalDependencies) {
  return async function requestApproval(
    input: RequestApprovalInput
  ): Promise<EngineResult<RequestApprovalOutput>> {
    const { repository, policyProvider, approverResolver, notificationService } =
      deps;

    // 1. Get applicable policies
    const policies = await policyProvider.getPoliciesForEntityType(
      input.entityType
    );

    // 2. Find matching policies
    const matchingPolicies = findMatchingPolicies(policies, input.context);

    if (matchingPolicies.length === 0) {
      // No approval required
      return success({
        approval: null as unknown as ApprovalInstance, // Type hack for no-approval case
        approvalRequired: false,
        appliedPolicy: undefined,
      });
    }

    // 3. Use the highest-priority policy
    const policy = matchingPolicies[0];

    // 4. Resolve approvers for each stage
    const approverContext: ApproverResolutionContext = {
      requestingPrincipal: principalId(input.requesterId),
      entityType: input.entityType,
      metadata: input.metadata ?? {},
    };

    const resolveApprovers = async (
      selector: StageTemplate["approverSelector"]
    ): Promise<readonly PrincipalId[]> => {
      return approverResolver.resolve(selector, approverContext);
    };

    // Pre-resolve all approvers
    const resolvedStages = await Promise.all(
      policy.requiredStages.map(async (template) => ({
        ...template,
        resolvedApprovers: await resolveApprovers(template.approverSelector),
      }))
    );

    // 5. Create the approval instance
    const createResult = createApproval(
      input.approvalId,
      input.requesterId,
      policy,
      policy.requiredStages,
      (selector) => {
        // Find the pre-resolved approvers
        const stage = resolvedStages.find(
          (s) => s.approverSelector === selector
        );
        return stage?.resolvedApprovers ?? [];
      },
      input.metadata
    );

    if (!createResult.success) {
      return failure(createResult.error.code, createResult.error.message);
    }

    let approval = createResult.value;

    // 6. Auto-submit if requested
    if (input.autoSubmit) {
      const submitResult = submitApproval(approval, input.requesterId);
      if (!submitResult.success) {
        return failure(submitResult.error.code, submitResult.error.message);
      }
      approval = submitResult.value;
    }

    // 7. Save to repository
    const isLinkedRepo = "saveWithReference" in repository;
    let saveResult: EngineResult<ApprovalInstance>;

    if (isLinkedRepo && input.entityReference) {
      saveResult = await (repository as LinkedApprovalRepository).saveWithReference(
        approval,
        input.entityReference
      );
    } else {
      saveResult = await repository.save(approval);
    }

    if (!saveResult.success) {
      return failure(saveResult.error.code, saveResult.error.message);
    }

    // 8. Send notifications to first stage approvers
    if (input.autoSubmit && approval.stages.length > 0) {
      const firstStage = approval.stages[0];
      const notification = buildApprovalRequestedNotification(
        approval,
        firstStage.name,
        firstStage.approvers,
        input.actionUrl
      );
      await notificationService.send(notification);
    }

    return success({
      approval: saveResult.value,
      approvalRequired: true,
      appliedPolicy: policy,
    });
  };
}

/**
 * Type for the use case function
 */
export type RequestApprovalUseCase = ReturnType<
  typeof createRequestApprovalUseCase
>;
