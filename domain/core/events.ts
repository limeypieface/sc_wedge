/**
 * Domain Events
 *
 * Events emitted by domain engines as data, not side effects.
 * These enable auditability, replayability, and traceability.
 *
 * Design Principles:
 * - Events are immutable data structures
 * - Each event captures who, what, when, and context
 * - Events can be serialized and replayed
 * - No side effects in event creation
 */

import type { EntityId, Actor, Timestamp, ObjectReference } from "./types"

// ============================================================================
// BASE EVENT TYPES
// ============================================================================

/**
 * Base domain event interface
 */
export interface DomainEvent {
  readonly id: EntityId
  readonly type: string
  readonly timestamp: Timestamp
  readonly actor: Actor
  readonly correlationId?: string
  readonly causationId?: string
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Event with associated aggregate
 */
export interface AggregateEvent extends DomainEvent {
  readonly aggregateType: string
  readonly aggregateId: EntityId
  readonly aggregateVersion?: number
}

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

/**
 * Entity created event
 */
export interface EntityCreatedEvent extends AggregateEvent {
  readonly type: "entity.created"
  readonly data: Readonly<Record<string, unknown>>
}

/**
 * Entity updated event
 */
export interface EntityUpdatedEvent extends AggregateEvent {
  readonly type: "entity.updated"
  readonly changes: readonly FieldChange[]
}

/**
 * Entity deleted event
 */
export interface EntityDeletedEvent extends AggregateEvent {
  readonly type: "entity.deleted"
  readonly reason?: string
}

/**
 * Field change record
 */
export interface FieldChange {
  readonly field: string
  readonly previousValue: unknown
  readonly newValue: unknown
}

// ============================================================================
// STATE EVENTS
// ============================================================================

/**
 * State transition event
 */
export interface StateTransitionEvent extends AggregateEvent {
  readonly type: "state.transition"
  readonly fromState: string
  readonly toState: string
  readonly trigger?: string
  readonly reason?: string
}

// ============================================================================
// APPROVAL EVENTS
// ============================================================================

/**
 * Approval requested event
 */
export interface ApprovalRequestedEvent extends DomainEvent {
  readonly type: "approval.requested"
  readonly requestId: EntityId
  readonly objectRef: ObjectReference
  readonly policyId: EntityId
  readonly reason: string
}

/**
 * Approval decision event
 */
export interface ApprovalDecisionEvent extends DomainEvent {
  readonly type: "approval.decision"
  readonly requestId: EntityId
  readonly stepId: EntityId
  readonly decision: "approved" | "rejected" | "deferred" | "escalated"
  readonly notes?: string
}

/**
 * Approval completed event
 */
export interface ApprovalCompletedEvent extends DomainEvent {
  readonly type: "approval.completed"
  readonly requestId: EntityId
  readonly objectRef: ObjectReference
  readonly outcome: "approved" | "rejected"
}

// ============================================================================
// COMMUNICATION EVENTS
// ============================================================================

/**
 * Message sent event
 */
export interface MessageSentEvent extends DomainEvent {
  readonly type: "communication.message_sent"
  readonly threadId: EntityId
  readonly messageId: EntityId
  readonly channel: string
  readonly recipients: readonly string[]
}

/**
 * Message delivered event
 */
export interface MessageDeliveredEvent extends DomainEvent {
  readonly type: "communication.message_delivered"
  readonly messageId: EntityId
  readonly deliveredTo: string
}

// ============================================================================
// DETECTION EVENTS
// ============================================================================

/**
 * Issue detected event
 */
export interface IssueDetectedEvent extends DomainEvent {
  readonly type: "detection.issue_detected"
  readonly issueId: EntityId
  readonly severity: string
  readonly category: string
  readonly objectRef: ObjectReference
  readonly ruleId: EntityId
}

/**
 * Issue resolved event
 */
export interface IssueResolvedEvent extends DomainEvent {
  readonly type: "detection.issue_resolved"
  readonly issueId: EntityId
  readonly resolution: string
}

// ============================================================================
// EVENT LOG TYPES
// ============================================================================

/**
 * Event log for an aggregate
 */
export interface EventLog {
  readonly events: readonly DomainEvent[]
  readonly version: number
  readonly aggregateId: EntityId
}

/**
 * Event store interface (for adapters)
 */
export interface EventStorePort {
  append(event: DomainEvent): Promise<void>
  getEvents(aggregateId: EntityId, afterVersion?: number): Promise<readonly DomainEvent[]>
  getAllEvents(afterTimestamp?: Timestamp): Promise<readonly DomainEvent[]>
}

// ============================================================================
// EVENT FACTORY
// ============================================================================

/**
 * Create a base event with common fields
 */
export function createEvent<T extends Omit<DomainEvent, "id" | "timestamp">>(
  event: T,
  generateId: () => EntityId,
  getTimestamp: () => Timestamp = () => new Date()
): T & { id: EntityId; timestamp: Timestamp } {
  return {
    ...event,
    id: generateId(),
    timestamp: getTimestamp(),
  }
}
