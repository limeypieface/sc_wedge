/**
 * Application Use Cases - Public API
 *
 * Use cases orchestrate domain logic with infrastructure concerns.
 * They define the application's behavior independent of UI or transport.
 */

// Request Approval
export type {
  RequestApprovalInput,
  RequestApprovalOutput,
  RequestApprovalDependencies,
  RequestApprovalUseCase,
} from "./request-approval.use-case";

export { createRequestApprovalUseCase } from "./request-approval.use-case";

// Process Vote
export type {
  ProcessVoteInput,
  ProcessVoteOutput,
  ProcessVoteDependencies,
  ProcessVoteUseCase,
} from "./process-vote.use-case";

export { createProcessVoteUseCase } from "./process-vote.use-case";

// Get Approval Status
export type {
  GetApprovalByIdInput,
  GetApprovalByReferenceInput,
  ApprovalStatusViewModel,
  StageViewModel,
  GetApprovalStatusDependencies,
  GetApprovalStatusUseCase,
} from "./get-approval-status.use-case";

export { createGetApprovalStatusUseCase } from "./get-approval-status.use-case";

// Cancel Approval
export type {
  CancelApprovalInput,
  CancelApprovalOutput,
  CancelApprovalDependencies,
  CancelApprovalUseCase,
} from "./cancel-approval.use-case";

export { createCancelApprovalUseCase } from "./cancel-approval.use-case";
