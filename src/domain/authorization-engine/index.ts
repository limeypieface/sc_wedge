/**
 * Authorization Lifecycle Engine
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * WHAT THIS ENGINE OWNS:
 * - Role and permission definition
 * - Role hierarchy evaluation
 * - Capability computation
 * - Condition-based access control
 * - Authorization request lifecycle
 *
 * WHAT THIS ENGINE REFUSES TO OWN:
 * - Authentication (identity verification)
 * - Session management
 * - Token generation/validation
 *
 * GUARANTEES:
 * - Determinism: Same actor + resource → same permissions
 * - Immutability: All operations return new objects
 * - Auditability: Authorization decisions logged
 *
 * CALLER MUST PROVIDE:
 * - Role definitions with permissions
 * - Actor with assigned roles
 * - Resource context for conditions
 *
 * ============================================================================
 */

export * from "./types"
export * from "./engine"
