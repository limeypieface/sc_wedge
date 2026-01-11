/**
 * Authorization Lifecycle Engine - Types
 *
 * Request → authorize → execute → resolve patterns.
 * Pure authorization logic with no persistence dependencies.
 */

import type { EntityId, Actor, Timestamp, ObjectReference } from "../core/types"

// ============================================================================
// CORE AUTHORIZATION TYPES
// ============================================================================

/**
 * Permission types
 */
export type Permission =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "execute"
  | "approve"
  | "submit"
  | "cancel"
  | "admin"

/**
 * Authorization decision
 */
export type AuthorizationDecision = "allowed" | "denied" | "requires_elevation"

/**
 * Authorization check result
 */
export interface AuthorizationResult {
  readonly decision: AuthorizationDecision
  readonly permissions: readonly Permission[]
  readonly deniedPermissions: readonly Permission[]
  readonly reasons: readonly string[]
  readonly requiredRoles?: readonly string[]
  readonly context?: Readonly<Record<string, unknown>>
}

// ============================================================================
// ROLE & POLICY TYPES
// ============================================================================

/**
 * A role definition
 */
export interface Role {
  readonly id: EntityId
  readonly name: string
  readonly description?: string
  readonly permissions: readonly RolePermission[]
  readonly inherits?: readonly EntityId[]
  readonly priority: number
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Permission within a role
 */
export interface RolePermission {
  readonly resource: string
  readonly permissions: readonly Permission[]
  readonly conditions?: readonly PermissionCondition[]
}

/**
 * Condition for permission
 */
export interface PermissionCondition {
  readonly type: ConditionType
  readonly config: Readonly<Record<string, unknown>>
}

/**
 * Types of conditions
 */
export type ConditionType =
  | "ownership"         // User owns the resource
  | "department"        // User is in same department
  | "team"             // User is on same team
  | "status"           // Resource is in specific status
  | "value_threshold"  // Value below threshold
  | "time_based"       // Within specific time
  | "custom"           // Custom condition

// ============================================================================
// AUTHORIZATION REQUEST TYPES
// ============================================================================

/**
 * Authorization request status
 */
export type AuthorizationRequestStatus =
  | "pending"
  | "authorized"
  | "denied"
  | "expired"
  | "cancelled"

/**
 * An authorization request for elevated access
 */
export interface AuthorizationRequest {
  readonly id: EntityId
  readonly requestType: string
  readonly resource: ObjectReference
  readonly requester: Actor
  readonly requestedPermissions: readonly Permission[]
  readonly reason: string

  readonly status: AuthorizationRequestStatus
  readonly decision?: AuthorizationDecision
  readonly decisionBy?: Actor
  readonly decisionAt?: Timestamp
  readonly decisionNotes?: string

  /** Validity period if granted */
  readonly validFrom?: Timestamp
  readonly validUntil?: Timestamp

  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp

  readonly meta?: Readonly<Record<string, unknown>>
}

// ============================================================================
// CAPABILITY TYPES
// ============================================================================

/**
 * Capabilities computed for an actor
 */
export interface Capabilities {
  readonly actor: Actor
  readonly resource: ObjectReference
  readonly permissions: readonly PermissionCapability[]
  readonly actions: readonly ActionCapability[]
  readonly elevationRequired: readonly Permission[]
  readonly computed: Timestamp
}

/**
 * A permission capability
 */
export interface PermissionCapability {
  readonly permission: Permission
  readonly granted: boolean
  readonly reason?: string
  readonly conditions?: readonly string[]
}

/**
 * An action capability
 */
export interface ActionCapability {
  readonly action: string
  readonly label: string
  readonly enabled: boolean
  readonly disabledReason?: string
  readonly requiredPermissions: readonly Permission[]
}

// ============================================================================
// ENGINE TYPES
// ============================================================================

/**
 * Authorization context
 */
export interface AuthorizationContext {
  readonly actor: Actor
  readonly resource: ObjectReference
  readonly resourceData?: Readonly<Record<string, unknown>>
  readonly action?: string
  readonly requestedPermissions?: readonly Permission[]
  readonly timestamp?: Timestamp
}

/**
 * Configuration for authorization engine
 */
export interface AuthorizationEngineConfig {
  /** Custom condition evaluators */
  readonly conditionEvaluators?: Map<ConditionType, ConditionEvaluator>
  /** Default permissions for unauthenticated access */
  readonly defaultPermissions?: readonly Permission[]
  /** Super admin roles that bypass checks */
  readonly superAdminRoles?: readonly string[]
  /** ID generator function */
  readonly generateId?: (prefix?: string) => EntityId
}

/**
 * Condition evaluator function
 */
export type ConditionEvaluator = (
  context: AuthorizationContext,
  config: Readonly<Record<string, unknown>>
) => boolean

/**
 * Input for checking authorization
 */
export interface AuthorizationCheckInput {
  readonly actor: Actor
  readonly resource: ObjectReference
  readonly permissions: readonly Permission[]
  readonly resourceData?: Readonly<Record<string, unknown>>
}

/**
 * Input for computing capabilities
 */
export interface ComputeCapabilitiesInput {
  readonly actor: Actor
  readonly resource: ObjectReference
  readonly resourceData?: Readonly<Record<string, unknown>>
  readonly availableActions?: readonly ActionDefinition[]
}

/**
 * Action definition for capability computation
 */
export interface ActionDefinition {
  readonly action: string
  readonly label: string
  readonly requiredPermissions: readonly Permission[]
  readonly conditions?: readonly PermissionCondition[]
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

/**
 * Authorization audit entry
 */
export interface AuthorizationAuditEntry {
  readonly id: EntityId
  readonly actor: Actor
  readonly resource: ObjectReference
  readonly action: string
  readonly permissions: readonly Permission[]
  readonly decision: AuthorizationDecision
  readonly reasons: readonly string[]
  readonly timestamp: Timestamp
  readonly context?: Readonly<Record<string, unknown>>
}
