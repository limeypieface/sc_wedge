/**
 * State Machine Engine - Types
 *
 * Generic finite state machine with guards, hooks, and history tracking.
 */

import type { EntityId, Actor, Timestamp } from "../core/types"

// ============================================================================
// CORE STATE MACHINE TYPES
// ============================================================================

/**
 * State definition
 */
export interface StateDefinition<TStatus extends string = string> {
  readonly id: TStatus
  readonly label: string
  readonly description?: string
  readonly variant?: "info" | "success" | "warning" | "error" | "muted"
  readonly terminal?: boolean
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Transition definition
 */
export interface TransitionDefinition<
  TStatus extends string = string,
  TAction extends string = string
> {
  readonly id: string
  readonly from: TStatus | readonly TStatus[]
  readonly to: TStatus
  readonly action: TAction
  readonly label?: string
  readonly description?: string
  readonly guard?: TransitionGuard<TStatus>
  readonly beforeTransition?: TransitionHook<TStatus>
  readonly afterTransition?: TransitionHook<TStatus>
  readonly requiredRoles?: readonly string[]
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Complete state machine definition
 */
export interface StateMachineDefinition<
  TStatus extends string = string,
  TAction extends string = string
> {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly initialState: TStatus
  readonly states: readonly StateDefinition<TStatus>[]
  readonly transitions: readonly TransitionDefinition<TStatus, TAction>[]
  readonly globalGuards?: readonly TransitionGuard<TStatus>[]
  readonly meta?: Readonly<Record<string, unknown>>
}

// ============================================================================
// INSTANCE TYPES
// ============================================================================

/**
 * State machine instance (runtime state)
 */
export interface StateMachineInstance<TStatus extends string = string> {
  readonly definitionId: string
  readonly currentState: TStatus
  readonly history: readonly StateHistoryEntry<TStatus>[]
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * History entry for a state transition
 */
export interface StateHistoryEntry<TStatus extends string = string> {
  readonly id: EntityId
  readonly from: TStatus
  readonly to: TStatus
  readonly action: string
  readonly timestamp: Timestamp
  readonly actor?: Actor
  readonly notes?: string
  readonly payload?: unknown
  readonly duration?: number
}

// ============================================================================
// GUARD & HOOK TYPES
// ============================================================================

/**
 * Context passed to guards and hooks
 */
export interface TransitionContext<TStatus extends string = string> {
  readonly currentState: TStatus
  readonly targetState: TStatus
  readonly action: string
  readonly actor?: Actor
  readonly payload?: unknown
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Guard result
 */
export interface GuardResult {
  readonly allowed: boolean
  readonly reason?: string
}

/**
 * Transition guard function
 */
export type TransitionGuard<TStatus extends string = string> = (
  context: TransitionContext<TStatus>
) => boolean | GuardResult

/**
 * Transition hook result
 */
export interface HookResult {
  readonly success: boolean
  readonly error?: string
  readonly data?: Readonly<Record<string, unknown>>
}

/**
 * Transition hook function
 */
export type TransitionHook<TStatus extends string = string> = (
  context: TransitionContext<TStatus>
) => void | HookResult

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Result of a transition attempt
 */
export interface TransitionResult<TStatus extends string = string> {
  readonly success: boolean
  readonly previousState?: TStatus
  readonly currentState: TStatus
  readonly action?: string
  readonly timestamp?: Timestamp
  readonly error?: string
}

/**
 * Available action from current state
 */
export interface AvailableAction<TAction extends string = string, TStatus extends string = string> {
  readonly action: TAction
  readonly label?: string
  readonly description?: string
  readonly targetState: TStatus
  readonly enabled: boolean
  readonly disabledReason?: string
  readonly requiredRoles?: readonly string[]
}

/**
 * Capabilities from current state
 */
export interface StateMachineCapabilities<
  TAction extends string = string,
  TStatus extends string = string
> {
  readonly currentState: TStatus
  readonly currentStateLabel: string
  readonly isTerminal: boolean
  readonly availableActions: readonly AvailableAction<TAction, TStatus>[]
  readonly canTransition: boolean
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for executing a transition
 */
export interface TransitionInput {
  readonly actor?: Actor
  readonly notes?: string
  readonly payload?: unknown
}

/**
 * Configuration for state machine factory
 */
export interface StateMachineConfig {
  readonly generateId?: () => EntityId
  readonly defaultActor?: Actor
}
