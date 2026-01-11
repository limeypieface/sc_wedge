/**
 * State Machine Engine
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * WHAT THIS ENGINE OWNS:
 * - State definition and validation
 * - Transition rules and guards
 * - State history tracking
 * - Terminal state detection
 * - Capability computation (allowed transitions)
 *
 * WHAT THIS ENGINE REFUSES TO OWN:
 * - Side effects of transitions (notifications, persistence)
 * - Business rule validation beyond state rules
 * - UI rendering of states
 *
 * GUARANTEES:
 * - Determinism: Same state + action → same result
 * - Immutability: Returns new state instances
 * - Auditability: Complete transition history
 *
 * CALLER MUST PROVIDE:
 * - State machine definition with states and transitions
 * - Actor performing transitions
 * - Guard context (for conditional transitions)
 *
 * ============================================================================
 */

export * from "./types"
export * from "./engine"
