/**
 * State Machine Engine
 *
 * A pure, deterministic state machine implementation.
 * No side effects, no UI dependencies, fully testable.
 */

import { defaultIdGenerator } from "../core/utils"
import type {
  StateMachineDefinition,
  StateMachineInstance,
  StateDefinition,
  TransitionDefinition,
  TransitionContext,
  TransitionResult,
  TransitionInput,
  AvailableAction,
  StateMachineCapabilities,
  StateHistoryEntry,
  StateMachineConfig,
} from "./types"

// ============================================================================
// STATE MACHINE FACTORY
// ============================================================================

/**
 * Create a state machine from a definition
 */
export function createStateMachine<
  TStatus extends string,
  TAction extends string = string
>(
  definition: StateMachineDefinition<TStatus, TAction>,
  config: StateMachineConfig = {}
) {
  const { generateId = defaultIdGenerator.generate } = config

  const stateMap = new Map<TStatus, StateDefinition<TStatus>>()
  const transitionsByFrom = new Map<TStatus, TransitionDefinition<TStatus, TAction>[]>()

  for (const state of definition.states) {
    stateMap.set(state.id, state)
  }

  for (const transition of definition.transitions) {
    const fromStates = Array.isArray(transition.from) ? transition.from : [transition.from]
    for (const from of fromStates) {
      const existing = transitionsByFrom.get(from) || []
      existing.push(transition)
      transitionsByFrom.set(from, existing)
    }
  }

  return {
    definition,

    create(initialMeta?: Record<string, unknown>): StateMachineInstance<TStatus> {
      const now = new Date()
      return {
        definitionId: definition.id,
        currentState: definition.initialState,
        history: [],
        createdAt: now,
        updatedAt: now,
        meta: initialMeta,
      }
    },

    getState(stateId: TStatus): StateDefinition<TStatus> | undefined {
      return stateMap.get(stateId)
    },

    getAllStates(): StateDefinition<TStatus>[] {
      return [...definition.states]
    },

    getTransitionsFrom(stateId: TStatus): TransitionDefinition<TStatus, TAction>[] {
      return transitionsByFrom.get(stateId) || []
    },

    findTransition(
      from: TStatus,
      action: TAction
    ): TransitionDefinition<TStatus, TAction> | undefined {
      const transitions = transitionsByFrom.get(from) || []
      return transitions.find((t) => t.action === action)
    },

    canTransition(
      instance: StateMachineInstance<TStatus>,
      action: TAction,
      input?: TransitionInput
    ): { allowed: boolean; reason?: string } {
      const transition = this.findTransition(instance.currentState, action)

      if (!transition) {
        return {
          allowed: false,
          reason: `No transition '${action}' from state '${instance.currentState}'`,
        }
      }

      const context: TransitionContext<TStatus> = {
        currentState: instance.currentState,
        targetState: transition.to,
        action,
        actor: input?.actor,
        payload: input?.payload,
        meta: instance.meta,
      }

      if (definition.globalGuards) {
        for (const guard of definition.globalGuards) {
          const result = guard(context)
          if (typeof result === "boolean" && !result) {
            return { allowed: false, reason: "Global guard rejected transition" }
          }
          if (typeof result === "object" && !result.allowed) {
            return result
          }
        }
      }

      if (transition.guard) {
        const result = transition.guard(context)
        if (typeof result === "boolean" && !result) {
          return { allowed: false, reason: "Transition guard rejected" }
        }
        if (typeof result === "object" && !result.allowed) {
          return result
        }
      }

      return { allowed: true }
    },

    transition(
      instance: StateMachineInstance<TStatus>,
      action: TAction,
      input?: TransitionInput
    ): { instance: StateMachineInstance<TStatus>; result: TransitionResult<TStatus> } {
      const canResult = this.canTransition(instance, action, input)

      if (!canResult.allowed) {
        return {
          instance,
          result: {
            success: false,
            error: canResult.reason,
            currentState: instance.currentState,
          },
        }
      }

      const transition = this.findTransition(instance.currentState, action)!
      const now = new Date()

      const context: TransitionContext<TStatus> = {
        currentState: instance.currentState,
        targetState: transition.to,
        action,
        actor: input?.actor,
        payload: input?.payload,
        meta: instance.meta,
      }

      if (transition.beforeTransition) {
        const hookResult = transition.beforeTransition(context)
        if (hookResult && !hookResult.success) {
          return {
            instance,
            result: {
              success: false,
              error: hookResult.error || "Before transition hook failed",
              currentState: instance.currentState,
            },
          }
        }
      }

      const lastEntry = instance.history[instance.history.length - 1]
      const stateStartTime = lastEntry ? lastEntry.timestamp : instance.createdAt
      const duration = now.getTime() - stateStartTime.getTime()

      const historyEntry: StateHistoryEntry<TStatus> = {
        id: generateId("sh"),
        from: instance.currentState,
        to: transition.to,
        action,
        timestamp: now,
        actor: input?.actor,
        notes: input?.notes,
        payload: input?.payload,
        duration,
      }

      const newInstance: StateMachineInstance<TStatus> = {
        ...instance,
        currentState: transition.to,
        history: [...instance.history, historyEntry],
        updatedAt: now,
      }

      if (transition.afterTransition) {
        transition.afterTransition({
          ...context,
          currentState: transition.to,
        })
      }

      return {
        instance: newInstance,
        result: {
          success: true,
          previousState: instance.currentState,
          currentState: transition.to,
          action,
          timestamp: now,
        },
      }
    },

    getAvailableActions(
      instance: StateMachineInstance<TStatus>,
      input?: TransitionInput
    ): AvailableAction<TAction, TStatus>[] {
      const transitions = this.getTransitionsFrom(instance.currentState)

      return transitions.map((t) => {
        const canResult = this.canTransition(instance, t.action, input)
        return {
          action: t.action,
          label: t.label,
          description: t.description,
          targetState: t.to,
          enabled: canResult.allowed,
          disabledReason: canResult.reason,
          requiredRoles: t.requiredRoles,
        }
      })
    },

    getCapabilities(
      instance: StateMachineInstance<TStatus>,
      input?: TransitionInput
    ): StateMachineCapabilities<TAction, TStatus> {
      const state = stateMap.get(instance.currentState)
      const actions = this.getAvailableActions(instance, input)

      return {
        currentState: instance.currentState,
        currentStateLabel: state?.label || instance.currentState,
        isTerminal: state?.terminal ?? false,
        availableActions: actions,
        canTransition: actions.some((a) => a.enabled),
      }
    },

    isTerminal(instance: StateMachineInstance<TStatus>): boolean {
      const state = stateMap.get(instance.currentState)
      return state?.terminal ?? false
    },

    getHistory(instance: StateMachineInstance<TStatus>): StateHistoryEntry<TStatus>[] {
      return [...instance.history]
    },

    hasState(stateId: TStatus): boolean {
      return stateMap.has(stateId)
    },

    getTerminalStates(): StateDefinition<TStatus>[] {
      return definition.states.filter((s) => s.terminal)
    },

    getNonTerminalStates(): StateDefinition<TStatus>[] {
      return definition.states.filter((s) => !s.terminal)
    },

    getStateTimeAnalysis(instance: StateMachineInstance<TStatus>): Map<TStatus, number> {
      const timeByState = new Map<TStatus, number>()

      for (const entry of instance.history) {
        if (entry.duration) {
          const existing = timeByState.get(entry.from) || 0
          timeByState.set(entry.from, existing + entry.duration)
        }
      }

      return timeByState
    },

    getTransitionCounts(instance: StateMachineInstance<TStatus>): Map<string, number> {
      const countByAction = new Map<string, number>()

      for (const entry of instance.history) {
        const existing = countByAction.get(entry.action) || 0
        countByAction.set(entry.action, existing + 1)
      }

      return countByAction
    },
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compose multiple guards into one
 */
export function composeGuards<TStatus extends string>(
  ...guards: Array<(context: TransitionContext<TStatus>) => boolean | { allowed: boolean; reason?: string }>
): (context: TransitionContext<TStatus>) => { allowed: boolean; reason?: string } {
  return (context) => {
    for (const guard of guards) {
      const result = guard(context)
      if (typeof result === "boolean") {
        if (!result) return { allowed: false, reason: "Guard rejected" }
      } else {
        if (!result.allowed) return result
      }
    }
    return { allowed: true }
  }
}

/**
 * Create a role-based guard
 */
export function createRoleGuard<TStatus extends string>(
  requiredRoles: readonly string[]
): (context: TransitionContext<TStatus>) => { allowed: boolean; reason?: string } {
  return (context) => {
    const userRoles = context.actor?.roles || []
    const hasRole = requiredRoles.some((role) => userRoles.includes(role))
    return hasRole
      ? { allowed: true }
      : { allowed: false, reason: `Requires one of roles: ${requiredRoles.join(", ")}` }
  }
}

/**
 * Create a conditional guard based on metadata
 */
export function createMetaGuard<TStatus extends string>(
  predicate: (meta: Record<string, unknown> | undefined) => boolean,
  failureReason = "Condition not met"
): (context: TransitionContext<TStatus>) => { allowed: boolean; reason?: string } {
  return (context) => {
    return predicate(context.meta as Record<string, unknown> | undefined)
      ? { allowed: true }
      : { allowed: false, reason: failureReason }
  }
}
