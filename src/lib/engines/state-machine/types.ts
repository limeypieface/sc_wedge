/**
 * State Machine Engine - Types
 *
 * A generic, reusable state machine that can be applied to any domain:
 * - Purchase Order statuses
 * - Sales Order statuses
 * - Approval workflows
 * - RMA lifecycles
 * - Shipment tracking
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * A state in the machine
 */
export interface State<TStatus extends string> {
  id: TStatus
  label: string
  description?: string
  /** Visual indicator type */
  variant?: "default" | "success" | "warning" | "error" | "info" | "muted"
  /** Whether this is a terminal state (no outgoing transitions) */
  terminal?: boolean
  /** Metadata for this state */
  meta?: Record<string, unknown>
}

/**
 * A transition between states
 */
export interface Transition<TStatus extends string, TAction extends string = string> {
  id: string
  from: TStatus | TStatus[]
  to: TStatus
  action: TAction
  label: string
  description?: string
  /** Guard condition - return false to prevent transition */
  guard?: TransitionGuard<TStatus>
  /** Side effects or validations to run before transition */
  beforeTransition?: TransitionHook<TStatus>
  /** Side effects to run after transition */
  afterTransition?: TransitionHook<TStatus>
  /** Required permissions/roles */
  requiredPermissions?: string[]
  /** Metadata for this transition */
  meta?: Record<string, unknown>
}

/**
 * Guard function to validate if a transition is allowed
 */
export type TransitionGuard<TStatus extends string> = (
  context: TransitionContext<TStatus>
) => boolean | { allowed: boolean; reason?: string }

/**
 * Hook function for before/after transition
 */
export type TransitionHook<TStatus extends string> = (
  context: TransitionContext<TStatus>
) => void | TransitionResult

/**
 * Context passed to guards and hooks
 */
export interface TransitionContext<TStatus extends string> {
  currentState: TStatus
  targetState: TStatus
  action: string
  payload?: unknown
  /** Any domain-specific context */
  meta?: Record<string, unknown>
}

/**
 * Result of a transition attempt
 */
export interface TransitionResult {
  success: boolean
  previousState?: string
  currentState?: string
  action?: string
  timestamp?: Date
  error?: string
  warnings?: string[]
}

// ============================================================================
// STATE MACHINE DEFINITION
// ============================================================================

/**
 * Complete state machine definition
 */
export interface StateMachineDefinition<
  TStatus extends string,
  TAction extends string = string
> {
  id: string
  name: string
  description?: string
  /** Initial state when machine is created */
  initialState: TStatus
  /** All possible states */
  states: State<TStatus>[]
  /** All possible transitions */
  transitions: Transition<TStatus, TAction>[]
  /** Global guards applied to all transitions */
  globalGuards?: TransitionGuard<TStatus>[]
}

/**
 * Runtime state of a state machine instance
 */
export interface StateMachineInstance<TStatus extends string> {
  definitionId: string
  currentState: TStatus
  history: StateHistoryEntry<TStatus>[]
  createdAt: Date
  updatedAt: Date
  meta?: Record<string, unknown>
}

/**
 * Entry in the state history
 */
export interface StateHistoryEntry<TStatus extends string> {
  id: string
  from: TStatus
  to: TStatus
  action: string
  timestamp: Date
  actor?: string
  notes?: string
  payload?: unknown
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Available action from current state
 */
export interface AvailableAction<TAction extends string = string> {
  action: TAction
  label: string
  description?: string
  targetState: string
  enabled: boolean
  disabledReason?: string
}

/**
 * State machine capabilities from current state
 */
export interface StateMachineCapabilities<TAction extends string = string> {
  currentState: string
  currentStateLabel: string
  isTerminal: boolean
  availableActions: AvailableAction<TAction>[]
  canTransition: boolean
}
