/**
 * State Machine Engine
 *
 * A pure, deterministic state machine implementation.
 * No side effects, no UI dependencies, fully testable.
 *
 * Usage:
 * ```typescript
 * const orderMachine = createStateMachine(purchaseOrderDefinition)
 * const instance = orderMachine.create()
 * const result = orderMachine.transition(instance, 'submit')
 * const capabilities = orderMachine.getCapabilities(instance)
 * ```
 */

import type {
  StateMachineDefinition,
  StateMachineInstance,
  State,
  Transition,
  TransitionResult,
  TransitionContext,
  StateHistoryEntry,
  AvailableAction,
  StateMachineCapabilities,
} from "./types"

export * from "./types"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// STATE MACHINE FACTORY
// ============================================================================

/**
 * Create a state machine from a definition
 */
export function createStateMachine<
  TStatus extends string,
  TAction extends string = string
>(definition: StateMachineDefinition<TStatus, TAction>) {
  // Index states and transitions for fast lookup
  const stateMap = new Map<TStatus, State<TStatus>>()
  const transitionsByFrom = new Map<TStatus, Transition<TStatus, TAction>[]>()

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
    /** The machine definition */
    definition,

    /**
     * Create a new instance of this state machine
     */
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

    /**
     * Get a state by ID
     */
    getState(stateId: TStatus): State<TStatus> | undefined {
      return stateMap.get(stateId)
    },

    /**
     * Get all states
     */
    getAllStates(): State<TStatus>[] {
      return definition.states
    },

    /**
     * Get transitions available from a given state
     */
    getTransitionsFrom(stateId: TStatus): Transition<TStatus, TAction>[] {
      return transitionsByFrom.get(stateId) || []
    },

    /**
     * Find a specific transition
     */
    findTransition(from: TStatus, action: TAction): Transition<TStatus, TAction> | undefined {
      const transitions = transitionsByFrom.get(from) || []
      return transitions.find((t) => t.action === action)
    },

    /**
     * Check if a transition is valid (without executing it)
     */
    canTransition(
      instance: StateMachineInstance<TStatus>,
      action: TAction,
      payload?: unknown
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
        payload,
        meta: instance.meta,
      }

      // Check global guards
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

      // Check transition-specific guard
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

    /**
     * Execute a transition
     * Returns a new instance (immutable) and a result
     */
    transition(
      instance: StateMachineInstance<TStatus>,
      action: TAction,
      payload?: { actor?: string; notes?: string; data?: unknown }
    ): { instance: StateMachineInstance<TStatus>; result: TransitionResult } {
      const canResult = this.canTransition(instance, action, payload?.data)

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
      const context: TransitionContext<TStatus> = {
        currentState: instance.currentState,
        targetState: transition.to,
        action,
        payload: payload?.data,
        meta: instance.meta,
      }

      // Execute beforeTransition hook
      if (transition.beforeTransition) {
        const hookResult = transition.beforeTransition(context)
        if (hookResult && !hookResult.success) {
          return {
            instance,
            result: hookResult,
          }
        }
      }

      // Create history entry
      const historyEntry: StateHistoryEntry<TStatus> = {
        id: generateId(),
        from: instance.currentState,
        to: transition.to,
        action,
        timestamp: new Date(),
        actor: payload?.actor,
        notes: payload?.notes,
        payload: payload?.data,
      }

      // Create new instance (immutable)
      const newInstance: StateMachineInstance<TStatus> = {
        ...instance,
        currentState: transition.to,
        history: [...instance.history, historyEntry],
        updatedAt: new Date(),
      }

      // Execute afterTransition hook
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
          timestamp: historyEntry.timestamp,
        },
      }
    },

    /**
     * Get available actions from current state
     */
    getAvailableActions(
      instance: StateMachineInstance<TStatus>,
      payload?: unknown
    ): AvailableAction<TAction>[] {
      const transitions = this.getTransitionsFrom(instance.currentState)

      return transitions.map((t) => {
        const canResult = this.canTransition(instance, t.action, payload)
        return {
          action: t.action,
          label: t.label,
          description: t.description,
          targetState: t.to,
          enabled: canResult.allowed,
          disabledReason: canResult.reason,
        }
      })
    },

    /**
     * Get full capabilities from current state
     */
    getCapabilities(
      instance: StateMachineInstance<TStatus>,
      payload?: unknown
    ): StateMachineCapabilities<TAction> {
      const state = stateMap.get(instance.currentState)
      const actions = this.getAvailableActions(instance, payload)

      return {
        currentState: instance.currentState,
        currentStateLabel: state?.label || instance.currentState,
        isTerminal: state?.terminal ?? false,
        availableActions: actions,
        canTransition: actions.some((a) => a.enabled),
      }
    },

    /**
     * Check if instance is in a terminal state
     */
    isTerminal(instance: StateMachineInstance<TStatus>): boolean {
      const state = stateMap.get(instance.currentState)
      return state?.terminal ?? false
    },

    /**
     * Get the full history of an instance
     */
    getHistory(instance: StateMachineInstance<TStatus>): StateHistoryEntry<TStatus>[] {
      return instance.history
    },

    /**
     * Validate that a state exists
     */
    hasState(stateId: TStatus): boolean {
      return stateMap.has(stateId)
    },

    /**
     * Get terminal states
     */
    getTerminalStates(): State<TStatus>[] {
      return definition.states.filter((s) => s.terminal)
    },
  }
}

// ============================================================================
// PREDEFINED STATE MACHINE DEFINITIONS
// ============================================================================

/**
 * Purchase Order Status State Machine
 */
export const purchaseOrderStatusDefinition: StateMachineDefinition<
  "draft" | "pending_approval" | "approved" | "sent" | "acknowledged" | "in_progress" | "completed" | "cancelled",
  "submit" | "approve" | "reject" | "send" | "acknowledge" | "start" | "complete" | "cancel" | "reopen"
> = {
  id: "purchase-order-status",
  name: "Purchase Order Status",
  description: "Tracks the lifecycle of a purchase order",
  initialState: "draft",
  states: [
    { id: "draft", label: "Draft", variant: "muted" },
    { id: "pending_approval", label: "Pending Approval", variant: "warning" },
    { id: "approved", label: "Approved", variant: "info" },
    { id: "sent", label: "Sent to Supplier", variant: "info" },
    { id: "acknowledged", label: "Acknowledged", variant: "success" },
    { id: "in_progress", label: "In Progress", variant: "info" },
    { id: "completed", label: "Completed", variant: "success", terminal: true },
    { id: "cancelled", label: "Cancelled", variant: "error", terminal: true },
  ],
  transitions: [
    { id: "t1", from: "draft", to: "pending_approval", action: "submit", label: "Submit for Approval" },
    { id: "t2", from: "draft", to: "sent", action: "send", label: "Send to Supplier" },
    { id: "t3", from: "pending_approval", to: "approved", action: "approve", label: "Approve" },
    { id: "t4", from: "pending_approval", to: "draft", action: "reject", label: "Reject" },
    { id: "t5", from: "approved", to: "sent", action: "send", label: "Send to Supplier" },
    { id: "t6", from: "sent", to: "acknowledged", action: "acknowledge", label: "Record Acknowledgment" },
    { id: "t7", from: "acknowledged", to: "in_progress", action: "start", label: "Start Fulfillment" },
    { id: "t8", from: "in_progress", to: "completed", action: "complete", label: "Mark Complete" },
    { id: "t9", from: ["draft", "pending_approval", "approved"], to: "cancelled", action: "cancel", label: "Cancel Order" },
    { id: "t10", from: "cancelled", to: "draft", action: "reopen", label: "Reopen Order" },
  ],
}

/**
 * Sales Order Status State Machine
 */
export const salesOrderStatusDefinition: StateMachineDefinition<
  "pending" | "confirmed" | "in_production" | "ready_to_ship" | "partially_shipped" | "shipped" | "delivered" | "invoiced" | "closed" | "cancelled",
  "confirm" | "start_production" | "ready" | "ship_partial" | "ship" | "deliver" | "invoice" | "close" | "cancel" | "reopen"
> = {
  id: "sales-order-status",
  name: "Sales Order Status",
  description: "Tracks the lifecycle of a sales order",
  initialState: "pending",
  states: [
    { id: "pending", label: "Pending", variant: "muted" },
    { id: "confirmed", label: "Confirmed", variant: "info" },
    { id: "in_production", label: "In Production", variant: "warning" },
    { id: "ready_to_ship", label: "Ready to Ship", variant: "info" },
    { id: "partially_shipped", label: "Partially Shipped", variant: "warning" },
    { id: "shipped", label: "Shipped", variant: "info" },
    { id: "delivered", label: "Delivered", variant: "success" },
    { id: "invoiced", label: "Invoiced", variant: "success" },
    { id: "closed", label: "Closed", variant: "success", terminal: true },
    { id: "cancelled", label: "Cancelled", variant: "error", terminal: true },
  ],
  transitions: [
    { id: "t1", from: "pending", to: "confirmed", action: "confirm", label: "Confirm Order" },
    { id: "t2", from: "confirmed", to: "in_production", action: "start_production", label: "Start Production" },
    { id: "t3", from: ["confirmed", "in_production"], to: "ready_to_ship", action: "ready", label: "Mark Ready to Ship" },
    { id: "t4", from: "ready_to_ship", to: "partially_shipped", action: "ship_partial", label: "Ship Partial" },
    { id: "t5", from: ["ready_to_ship", "partially_shipped"], to: "shipped", action: "ship", label: "Ship Complete" },
    { id: "t6", from: "shipped", to: "delivered", action: "deliver", label: "Mark Delivered" },
    { id: "t7", from: "delivered", to: "invoiced", action: "invoice", label: "Invoice" },
    { id: "t8", from: "invoiced", to: "closed", action: "close", label: "Close Order" },
    { id: "t9", from: ["pending", "confirmed"], to: "cancelled", action: "cancel", label: "Cancel Order" },
    { id: "t10", from: "cancelled", to: "pending", action: "reopen", label: "Reopen Order" },
  ],
}

/**
 * RMA Status State Machine
 */
export const rmaStatusDefinition: StateMachineDefinition<
  "requested" | "authorized" | "pending_return" | "return_shipped" | "received" | "inspecting" | "approved" | "rejected" | "credit_issued" | "replacement_shipped" | "closed",
  "authorize" | "deny" | "ship_return" | "receive" | "inspect" | "approve" | "reject" | "issue_credit" | "ship_replacement" | "close"
> = {
  id: "rma-status",
  name: "RMA Status",
  description: "Tracks the return merchandise authorization lifecycle",
  initialState: "requested",
  states: [
    { id: "requested", label: "Requested", variant: "muted" },
    { id: "authorized", label: "Authorized", variant: "info" },
    { id: "pending_return", label: "Pending Return", variant: "warning" },
    { id: "return_shipped", label: "Return Shipped", variant: "info" },
    { id: "received", label: "Received", variant: "info" },
    { id: "inspecting", label: "Inspecting", variant: "warning" },
    { id: "approved", label: "Approved", variant: "success" },
    { id: "rejected", label: "Rejected", variant: "error" },
    { id: "credit_issued", label: "Credit Issued", variant: "success" },
    { id: "replacement_shipped", label: "Replacement Shipped", variant: "info" },
    { id: "closed", label: "Closed", variant: "muted", terminal: true },
  ],
  transitions: [
    { id: "t1", from: "requested", to: "authorized", action: "authorize", label: "Authorize Return" },
    { id: "t2", from: "requested", to: "rejected", action: "deny", label: "Deny Request" },
    { id: "t3", from: "authorized", to: "pending_return", action: "ship_return", label: "Label Generated" },
    { id: "t4", from: "pending_return", to: "return_shipped", action: "ship_return", label: "Return Shipped" },
    { id: "t5", from: "return_shipped", to: "received", action: "receive", label: "Receive Return" },
    { id: "t6", from: "received", to: "inspecting", action: "inspect", label: "Start Inspection" },
    { id: "t7", from: "inspecting", to: "approved", action: "approve", label: "Approve" },
    { id: "t8", from: "inspecting", to: "rejected", action: "reject", label: "Reject" },
    { id: "t9", from: "approved", to: "credit_issued", action: "issue_credit", label: "Issue Credit" },
    { id: "t10", from: "approved", to: "replacement_shipped", action: "ship_replacement", label: "Ship Replacement" },
    { id: "t11", from: ["credit_issued", "replacement_shipped", "rejected"], to: "closed", action: "close", label: "Close RMA" },
  ],
}
