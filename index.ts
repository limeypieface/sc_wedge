/**
 * Sindri Prototype
 *
 * A collection of pure, domain-agnostic engines for enterprise workflows.
 *
 * ## Architecture
 *
 * This library follows hexagonal architecture principles:
 * - **Domain**: Pure domain logic with no external dependencies
 * - **Adapters**: Abstract interfaces for external services (ports)
 * - **Integration**: Workflow compositions combining multiple engines
 *
 * ## Available Engines
 *
 * - **State Machine**: Finite state machine with guards, hooks, and transitions
 * - **Financial**: Hierarchical cost calculations with charges, discounts, and taxes
 * - **Approval**: Policy-driven multi-stage approval workflows
 * - **Revision**: Semantic versioning and change tracking
 * - **Communication**: Multi-channel thread-based messaging
 * - **Detection**: Rule-based issue detection and prioritization
 * - **Authorization**: RBAC with capability computation
 *
 * ## Usage
 *
 * ```typescript
 * import { Domain } from "sindri-prototype"
 *
 * // Create a state machine
 * const sm = Domain.StateMachine.createStateMachine(definition)
 *
 * // Create an approval engine
 * const engine = Domain.Approval.createApprovalEngine(policies)
 *
 * // Calculate order totals
 * const totals = Domain.Financial.calculateOrderTotals(lines, policy)
 * ```
 *
 * @module sindri-prototype
 */

// ============================================================================
// DOMAIN LAYER
// ============================================================================
// The Domain module is the unified domain layer with:
// - Pure, deterministic engines
// - Contract-based design
// - Injectable adapters for testing
// - Full TypeScript support

export * as Domain from "./domain"

// ============================================================================
// INTEGRATION LAYER
// ============================================================================

export * as Integration from "./integration"

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

// Core types
export type {
  EntityId,
  PrincipalId,
  Actor,
  ActorType,
  Priority,
  Timestamp,
  Duration,
  ObjectReference,
  ExecutionContext,
  AuditEntry,
} from "./domain/core/types"

export { PRIORITY_ORDER, SYSTEM_ACTOR, DURATIONS } from "./domain/core/types"

// Result monad
export type { Result, SuccessResult, FailureResult, DomainError } from "./domain/core/errors"
export { success, failure, isSuccess, isFailure, mapResult } from "./domain/core/errors"

// State Machine
export type {
  StateDefinition,
  TransitionDefinition,
  StateMachineInstance,
  StateMachineDefinition,
} from "./domain/state-machine"

// Financial
export type {
  PricedLineItem,
  OrderTotals,
  CostDelta,
  FinancialPolicy,
} from "./domain/financial-engine"

// Approval
export type {
  ApprovalPolicy,
  ApprovalRequest,
  ApprovalStep,
} from "./domain/approval-engine"

// Revision
export type {
  Revision,
  VersionedDocument,
  ChangeSet,
  SemanticVersion,
} from "./domain/revision-engine"

// Communication
export type {
  Message,
  CommunicationThread,
  Notification,
  MessageTemplate,
} from "./domain/communication-broker"

// Detection
export type {
  Issue,
  DetectionRule,
  IssueStats,
} from "./domain/detection-engine"

// Authorization
export type {
  Permission,
  Role,
  Capabilities,
  AuthorizationRequest,
} from "./domain/authorization-engine"
