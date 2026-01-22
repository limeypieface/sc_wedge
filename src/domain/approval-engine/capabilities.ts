/**
 * Approval Engine - Capability Computation Module
 *
 * Pure functions for computing what actions a principal can take.
 * Capabilities are first-class outputs, not runtime checks.
 *
 * Design principles:
 * - Capabilities are computed, not checked
 * - All logic is explicit and traceable
 * - Denial reasons are always provided
 */

import {
  ApprovalCapabilities,
  ApprovalStatus,
  ApprovalStage,
  PrincipalId,
  Vote,
  NO_CAPABILITIES,
} from "./types";
import { getActiveStage, hasRejectedStage, allStagesApproved } from "./stages";
import { hasVoted } from "./voting";

// ============================================================================
// CAPABILITY TYPES
// ============================================================================

/**
 * Context needed to compute capabilities
 */
export interface CapabilityContext {
  /** Current approval status */
  readonly status: ApprovalStatus;
  /** All stages in the workflow */
  readonly stages: readonly ApprovalStage[];
  /** The principal we're computing capabilities for */
  readonly principalId: PrincipalId;
  /** Principal who initiated the approval request */
  readonly initiatorId: PrincipalId;
  /** Whether the policy allows skipping */
  readonly policyAllowsSkip: boolean;
  /** Whether the principal has a viewer role */
  readonly hasViewerRole: boolean;
}

/**
 * Builder for constructing capabilities
 */
interface CapabilityBuilder {
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  canCancel: boolean;
  canView: boolean;
  canSkip: boolean;
  denialReasons: Record<string, string>;
}

// ============================================================================
// CAPABILITY COMPUTATION
// ============================================================================

/**
 * Compute all capabilities for a principal
 */
export function computeCapabilities(
  context: CapabilityContext
): ApprovalCapabilities {
  const builder: CapabilityBuilder = {
    canSubmit: false,
    canApprove: false,
    canReject: false,
    canRequestChanges: false,
    canCancel: false,
    canView: false,
    canSkip: false,
    denialReasons: {},
  };

  // View capability
  computeViewCapability(builder, context);

  // Status-based capabilities
  switch (context.status) {
    case "pending":
      computePendingCapabilities(builder, context);
      break;
    case "approved":
    case "rejected":
    case "expired":
    case "cancelled":
      computeTerminalCapabilities(builder, context);
      break;
  }

  return Object.freeze({
    canSubmit: builder.canSubmit,
    canApprove: builder.canApprove,
    canReject: builder.canReject,
    canRequestChanges: builder.canRequestChanges,
    canCancel: builder.canCancel,
    canView: builder.canView,
    canSkip: builder.canSkip,
    denialReasons: Object.freeze(builder.denialReasons),
  });
}

/**
 * Compute view capability
 */
function computeViewCapability(
  builder: CapabilityBuilder,
  context: CapabilityContext
): void {
  // Initiator can always view
  if (context.principalId === context.initiatorId) {
    builder.canView = true;
    return;
  }

  // Approvers can view
  const isApprover = context.stages.some((stage) =>
    stage.approvers.includes(context.principalId)
  );
  if (isApprover) {
    builder.canView = true;
    return;
  }

  // Viewers can view
  if (context.hasViewerRole) {
    builder.canView = true;
    return;
  }

  builder.denialReasons["canView"] = "Not authorized to view this approval";
}

/**
 * Compute capabilities when status is pending
 */
function computePendingCapabilities(
  builder: CapabilityBuilder,
  context: CapabilityContext
): void {
  const activeStage = getActiveStage(context.stages);

  // Submit capability (only if no stages active yet, meaning awaiting submission)
  if (!activeStage && context.stages.every((s) => s.status === "pending")) {
    if (context.principalId === context.initiatorId) {
      builder.canSubmit = true;
    } else {
      builder.denialReasons["canSubmit"] = "Only the initiator can submit";
    }
  } else if (activeStage) {
    builder.denialReasons["canSubmit"] = "Already submitted";
  }

  // Approval capabilities
  if (activeStage) {
    computeApprovalCapabilities(builder, context, activeStage);
  }

  // Cancel capability
  computeCancelCapability(builder, context);

  // Skip capability
  computeSkipCapability(builder, context);
}

/**
 * Compute approval-related capabilities
 */
function computeApprovalCapabilities(
  builder: CapabilityBuilder,
  context: CapabilityContext,
  activeStage: ApprovalStage
): void {
  const isApprover = activeStage.approvers.includes(context.principalId);
  const alreadyVoted = hasVoted(activeStage.votes, context.principalId);

  if (!isApprover) {
    builder.denialReasons["canApprove"] =
      "Not an approver for the current stage";
    builder.denialReasons["canReject"] =
      "Not an approver for the current stage";
    builder.denialReasons["canRequestChanges"] =
      "Not an approver for the current stage";
    return;
  }

  if (alreadyVoted) {
    builder.denialReasons["canApprove"] = "Already voted on this stage";
    builder.denialReasons["canReject"] = "Already voted on this stage";
    builder.denialReasons["canRequestChanges"] = "Already voted on this stage";
    return;
  }

  // Principal can vote
  builder.canApprove = true;
  builder.canReject = true;
  builder.canRequestChanges = true;
}

/**
 * Compute cancel capability
 */
function computeCancelCapability(
  builder: CapabilityBuilder,
  context: CapabilityContext
): void {
  // Only initiator can cancel, and only while pending
  if (context.status !== "pending") {
    builder.denialReasons["canCancel"] = "Cannot cancel a completed approval";
    return;
  }

  if (context.principalId !== context.initiatorId) {
    builder.denialReasons["canCancel"] = "Only the initiator can cancel";
    return;
  }

  builder.canCancel = true;
}

/**
 * Compute skip capability
 */
function computeSkipCapability(
  builder: CapabilityBuilder,
  context: CapabilityContext
): void {
  if (!context.policyAllowsSkip) {
    builder.denialReasons["canSkip"] = "Policy does not allow skipping";
    return;
  }

  if (context.principalId !== context.initiatorId) {
    builder.denialReasons["canSkip"] = "Only the initiator can skip approval";
    return;
  }

  if (context.status !== "pending") {
    builder.denialReasons["canSkip"] = "Can only skip while pending";
    return;
  }

  builder.canSkip = true;
}

/**
 * Compute capabilities when in a terminal state
 */
function computeTerminalCapabilities(
  builder: CapabilityBuilder,
  context: CapabilityContext
): void {
  // In terminal states, only view is possible
  builder.denialReasons["canSubmit"] = `Approval is ${context.status}`;
  builder.denialReasons["canApprove"] = `Approval is ${context.status}`;
  builder.denialReasons["canReject"] = `Approval is ${context.status}`;
  builder.denialReasons["canRequestChanges"] = `Approval is ${context.status}`;
  builder.denialReasons["canCancel"] = `Approval is ${context.status}`;
  builder.denialReasons["canSkip"] = `Approval is ${context.status}`;
}

// ============================================================================
// CAPABILITY PREDICATES
// ============================================================================

/**
 * Check if any action is available
 */
export function hasAnyAction(capabilities: ApprovalCapabilities): boolean {
  return (
    capabilities.canSubmit ||
    capabilities.canApprove ||
    capabilities.canReject ||
    capabilities.canRequestChanges ||
    capabilities.canCancel ||
    capabilities.canSkip
  );
}

/**
 * Check if principal can vote (approve, reject, or request changes)
 */
export function canVote(capabilities: ApprovalCapabilities): boolean {
  return (
    capabilities.canApprove ||
    capabilities.canReject ||
    capabilities.canRequestChanges
  );
}

/**
 * Get all available actions
 */
export function getAvailableActions(
  capabilities: ApprovalCapabilities
): readonly string[] {
  const actions: string[] = [];

  if (capabilities.canSubmit) actions.push("submit");
  if (capabilities.canApprove) actions.push("approve");
  if (capabilities.canReject) actions.push("reject");
  if (capabilities.canRequestChanges) actions.push("request_changes");
  if (capabilities.canCancel) actions.push("cancel");
  if (capabilities.canSkip) actions.push("skip");

  return actions;
}

/**
 * Get denial reason for a specific capability
 */
export function getDenialReason(
  capabilities: ApprovalCapabilities,
  capability: keyof Omit<ApprovalCapabilities, "denialReasons">
): string | undefined {
  return capabilities.denialReasons[capability];
}

// ============================================================================
// CAPABILITY MERGING
// ============================================================================

/**
 * Merge capabilities (union of allowed actions)
 */
export function mergeCapabilities(
  a: ApprovalCapabilities,
  b: ApprovalCapabilities
): ApprovalCapabilities {
  return {
    canSubmit: a.canSubmit || b.canSubmit,
    canApprove: a.canApprove || b.canApprove,
    canReject: a.canReject || b.canReject,
    canRequestChanges: a.canRequestChanges || b.canRequestChanges,
    canCancel: a.canCancel || b.canCancel,
    canView: a.canView || b.canView,
    canSkip: a.canSkip || b.canSkip,
    // For denial reasons, only include if both deny
    denialReasons: Object.fromEntries(
      Object.keys({ ...a.denialReasons, ...b.denialReasons })
        .filter(
          (key) =>
            a.denialReasons[key] !== undefined &&
            b.denialReasons[key] !== undefined
        )
        .map((key) => [key, a.denialReasons[key]])
    ),
  };
}

/**
 * Restrict capabilities (intersection of allowed actions)
 */
export function restrictCapabilities(
  capabilities: ApprovalCapabilities,
  restrictions: Partial<ApprovalCapabilities>
): ApprovalCapabilities {
  return {
    canSubmit:
      capabilities.canSubmit && (restrictions.canSubmit ?? capabilities.canSubmit),
    canApprove:
      capabilities.canApprove &&
      (restrictions.canApprove ?? capabilities.canApprove),
    canReject:
      capabilities.canReject &&
      (restrictions.canReject ?? capabilities.canReject),
    canRequestChanges:
      capabilities.canRequestChanges &&
      (restrictions.canRequestChanges ?? capabilities.canRequestChanges),
    canCancel:
      capabilities.canCancel &&
      (restrictions.canCancel ?? capabilities.canCancel),
    canView:
      capabilities.canView && (restrictions.canView ?? capabilities.canView),
    canSkip:
      capabilities.canSkip && (restrictions.canSkip ?? capabilities.canSkip),
    denialReasons: {
      ...capabilities.denialReasons,
      ...restrictions.denialReasons,
    },
  };
}
