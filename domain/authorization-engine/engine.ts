/**
 * Authorization Lifecycle Engine
 *
 * Request → authorize → execute → resolve patterns.
 * Pure authorization logic with no persistence dependencies.
 */

import { defaultIdGenerator } from "../core/utils"
import type { Actor, ObjectReference } from "../core/types"
import type {
  Permission,
  AuthorizationDecision,
  AuthorizationResult,
  Role,
  RolePermission,
  ConditionType,
  AuthorizationRequest,
  Capabilities,
  PermissionCapability,
  ActionCapability,
  AuthorizationContext,
  AuthorizationEngineConfig,
  AuthorizationCheckInput,
  ComputeCapabilitiesInput,
  ConditionEvaluator,
  AuthorizationAuditEntry,
} from "./types"

// ============================================================================
// AUTHORIZATION ENGINE
// ============================================================================

/**
 * Create an authorization engine
 */
export function createAuthorizationEngine(
  roles: readonly Role[],
  config: AuthorizationEngineConfig = {}
) {
  const {
    conditionEvaluators = new Map(),
    defaultPermissions = [],
    superAdminRoles = ["admin", "superadmin"],
    generateId = defaultIdGenerator.generate,
  } = config

  // Index roles by ID
  const rolesById = new Map<string, Role>()
  for (const role of roles) {
    rolesById.set(role.id, role)
  }

  // Resolve role inheritance
  function resolveRolePermissions(roleId: string): RolePermission[] {
    const role = rolesById.get(roleId)
    if (!role) return []

    const permissions = [...role.permissions]

    // Add inherited permissions
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        permissions.push(...resolveRolePermissions(inheritedRoleId))
      }
    }

    return permissions
  }

  return {
    /**
     * Check if an actor has specific permissions on a resource
     */
    checkAuthorization(input: AuthorizationCheckInput): AuthorizationResult {
      const { actor, resource, permissions, resourceData } = input

      // Check for super admin
      const isSuperAdmin = actor.roles?.some((r) => superAdminRoles.includes(r)) ?? false
      if (isSuperAdmin) {
        return {
          decision: "allowed",
          permissions,
          deniedPermissions: [],
          reasons: ["Super admin access"],
        }
      }

      const context: AuthorizationContext = {
        actor,
        resource,
        resourceData,
        requestedPermissions: permissions,
        timestamp: new Date(),
      }

      // Collect permissions from all roles
      const allRolePermissions: RolePermission[] = []
      for (const roleId of actor.roles || []) {
        allRolePermissions.push(...resolveRolePermissions(roleId))
      }

      // Add default permissions
      const defaultRolePerms: RolePermission = {
        resource: "*",
        permissions: [...defaultPermissions],
      }
      allRolePermissions.push(defaultRolePerms)

      // Check each requested permission
      const grantedPermissions: Permission[] = []
      const deniedPermissions: Permission[] = []
      const reasons: string[] = []

      for (const permission of permissions) {
        const hasPermission = checkPermission(
          permission,
          resource,
          allRolePermissions,
          context,
          conditionEvaluators
        )

        if (hasPermission.granted) {
          grantedPermissions.push(permission)
          if (hasPermission.reason) reasons.push(hasPermission.reason)
        } else {
          deniedPermissions.push(permission)
          if (hasPermission.reason) reasons.push(hasPermission.reason)
        }
      }

      const decision: AuthorizationDecision =
        deniedPermissions.length === 0
          ? "allowed"
          : grantedPermissions.length === 0
          ? "denied"
          : "denied" // Partial permissions = denied

      return {
        decision,
        permissions: grantedPermissions,
        deniedPermissions,
        reasons,
      }
    },

    /**
     * Compute capabilities for an actor on a resource
     */
    computeCapabilities(input: ComputeCapabilitiesInput): Capabilities {
      const { actor, resource, resourceData, availableActions = [] } = input

      // Check for super admin
      const isSuperAdmin = actor.roles?.some((r) => superAdminRoles.includes(r)) ?? false

      const context: AuthorizationContext = {
        actor,
        resource,
        resourceData,
        timestamp: new Date(),
      }

      // All possible permissions
      const allPermissions: Permission[] = [
        "create", "read", "update", "delete", "execute", "approve", "submit", "cancel", "admin"
      ]

      // Check each permission
      const permissionCapabilities: PermissionCapability[] = allPermissions.map((permission) => {
        if (isSuperAdmin) {
          return { permission, granted: true, reason: "Super admin" }
        }

        const allRolePermissions: RolePermission[] = []
        for (const roleId of actor.roles || []) {
          allRolePermissions.push(...resolveRolePermissions(roleId))
        }

        const result = checkPermission(
          permission,
          resource,
          allRolePermissions,
          context,
          conditionEvaluators
        )

        return {
          permission,
          granted: result.granted,
          reason: result.reason,
          conditions: result.conditions,
        }
      })

      // Check each action
      const actionCapabilities: ActionCapability[] = availableActions.map((actionDef) => {
        const hasAllPermissions = actionDef.requiredPermissions.every((p) => {
          const cap = permissionCapabilities.find((pc) => pc.permission === p)
          return cap?.granted ?? false
        })

        // Check action-specific conditions
        let conditionsMet = true
        let disabledReason: string | undefined

        if (hasAllPermissions && actionDef.conditions) {
          for (const condition of actionDef.conditions) {
            const evaluator = conditionEvaluators.get(condition.type)
            if (evaluator && !evaluator(context, condition.config)) {
              conditionsMet = false
              disabledReason = `Condition not met: ${condition.type}`
              break
            }
          }
        }

        return {
          action: actionDef.action,
          label: actionDef.label,
          enabled: hasAllPermissions && conditionsMet,
          disabledReason: !hasAllPermissions
            ? `Missing permissions: ${actionDef.requiredPermissions.filter(p => !permissionCapabilities.find(pc => pc.permission === p)?.granted).join(", ")}`
            : disabledReason,
          requiredPermissions: [...actionDef.requiredPermissions],
        }
      })

      // Determine permissions requiring elevation
      const elevationRequired = permissionCapabilities
        .filter((pc) => !pc.granted)
        .map((pc) => pc.permission)

      return {
        actor,
        resource,
        permissions: permissionCapabilities,
        actions: actionCapabilities,
        elevationRequired,
        computed: new Date(),
      }
    },

    /**
     * Create an authorization request for elevated access
     */
    createAuthorizationRequest(input: {
      requestType: string
      resource: ObjectReference
      requester: Actor
      requestedPermissions: readonly Permission[]
      reason: string
      validityDuration?: { value: number; unit: "hours" | "days" | "weeks" }
    }): AuthorizationRequest {
      const now = new Date()
      let validUntil: Date | undefined

      if (input.validityDuration) {
        validUntil = new Date(now)
        switch (input.validityDuration.unit) {
          case "hours":
            validUntil.setHours(validUntil.getHours() + input.validityDuration.value)
            break
          case "days":
            validUntil.setDate(validUntil.getDate() + input.validityDuration.value)
            break
          case "weeks":
            validUntil.setDate(validUntil.getDate() + input.validityDuration.value * 7)
            break
        }
      }

      return {
        id: generateId("authreq"),
        requestType: input.requestType,
        resource: input.resource,
        requester: input.requester,
        requestedPermissions: [...input.requestedPermissions],
        reason: input.reason,
        status: "pending",
        validFrom: now,
        validUntil,
        createdAt: now,
        updatedAt: now,
      }
    },

    /**
     * Approve an authorization request
     */
    approveRequest(
      request: AuthorizationRequest,
      approver: Actor,
      notes?: string
    ): AuthorizationRequest {
      const now = new Date()
      return {
        ...request,
        status: "authorized",
        decision: "allowed",
        decisionBy: approver,
        decisionAt: now,
        decisionNotes: notes,
        updatedAt: now,
      }
    },

    /**
     * Deny an authorization request
     */
    denyRequest(
      request: AuthorizationRequest,
      denier: Actor,
      notes?: string
    ): AuthorizationRequest {
      const now = new Date()
      return {
        ...request,
        status: "denied",
        decision: "denied",
        decisionBy: denier,
        decisionAt: now,
        decisionNotes: notes,
        updatedAt: now,
      }
    },

    /**
     * Cancel an authorization request
     */
    cancelRequest(request: AuthorizationRequest): AuthorizationRequest {
      return {
        ...request,
        status: "cancelled",
        updatedAt: new Date(),
      }
    },

    /**
     * Check if an authorization request is still valid
     */
    isRequestValid(request: AuthorizationRequest): boolean {
      if (request.status !== "authorized") return false

      const now = new Date()
      if (request.validFrom && now < request.validFrom) return false
      if (request.validUntil && now > request.validUntil) return false

      return true
    },

    /**
     * Create an audit entry
     */
    createAuditEntry(
      actor: Actor,
      resource: ObjectReference,
      action: string,
      permissions: readonly Permission[],
      result: AuthorizationResult
    ): AuthorizationAuditEntry {
      return {
        id: generateId("audit"),
        actor,
        resource,
        action,
        permissions: [...permissions],
        decision: result.decision,
        reasons: [...result.reasons],
        timestamp: new Date(),
      }
    },

    /**
     * Get all roles
     */
    getRoles(): Role[] {
      return [...roles]
    },

    /**
     * Get role by ID
     */
    getRole(roleId: string): Role | undefined {
      return rolesById.get(roleId)
    },
  }
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

function checkPermission(
  permission: Permission,
  resource: ObjectReference,
  rolePermissions: RolePermission[],
  context: AuthorizationContext,
  conditionEvaluators: Map<ConditionType, ConditionEvaluator>
): { granted: boolean; reason?: string; conditions?: string[] } {
  // Find matching role permissions
  const matchingPerms = rolePermissions.filter((rp) => {
    // Check resource match (exact or wildcard)
    const resourceMatch =
      rp.resource === "*" ||
      rp.resource === resource.type ||
      rp.resource === `${resource.type}:${resource.id}`

    // Check permission match
    const permMatch =
      rp.permissions.includes(permission) ||
      rp.permissions.includes("admin") // Admin implies all permissions

    return resourceMatch && permMatch
  })

  if (matchingPerms.length === 0) {
    return { granted: false, reason: `No role grants ${permission} on ${resource.type}` }
  }

  // Check conditions
  for (const perm of matchingPerms) {
    if (!perm.conditions || perm.conditions.length === 0) {
      return { granted: true, reason: `Granted by role` }
    }

    // All conditions must pass
    const conditionResults: string[] = []
    let allConditionsMet = true

    for (const condition of perm.conditions) {
      const evaluator = conditionEvaluators.get(condition.type)
      if (evaluator) {
        const met = evaluator(context, condition.config)
        if (!met) {
          allConditionsMet = false
          conditionResults.push(`${condition.type}: failed`)
        } else {
          conditionResults.push(`${condition.type}: passed`)
        }
      }
    }

    if (allConditionsMet) {
      return { granted: true, reason: "Granted with conditions", conditions: conditionResults }
    }
  }

  return { granted: false, reason: "Conditions not met" }
}

// ============================================================================
// BUILT-IN CONDITION EVALUATORS
// ============================================================================

/**
 * Ownership condition - user owns the resource
 */
export const ownershipEvaluator: ConditionEvaluator = (context, config) => {
  const ownerField = (config.ownerField as string) || "ownerId"
  const ownerId = context.resourceData?.[ownerField]
  return ownerId === context.actor.id
}

/**
 * Department condition - user is in same department
 */
export const departmentEvaluator: ConditionEvaluator = (context, config) => {
  const deptField = (config.departmentField as string) || "department"
  const resourceDept = context.resourceData?.[deptField]
  return resourceDept === context.actor.department
}

/**
 * Status condition - resource is in specific status
 */
export const statusEvaluator: ConditionEvaluator = (context, config) => {
  const allowedStatuses = (config.allowedStatuses as string[]) || []
  const resourceStatus = context.resourceData?.status as string
  return allowedStatuses.includes(resourceStatus)
}

/**
 * Value threshold condition - value is below threshold
 */
export const valueThresholdEvaluator: ConditionEvaluator = (context, config) => {
  const valueField = (config.valueField as string) || "value"
  const threshold = (config.threshold as number) || 0
  const value = context.resourceData?.[valueField] as number
  return typeof value === "number" && value <= threshold
}

/**
 * Get default condition evaluators
 */
export function getDefaultConditionEvaluators(): Map<ConditionType, ConditionEvaluator> {
  return new Map([
    ["ownership", ownershipEvaluator],
    ["department", departmentEvaluator],
    ["status", statusEvaluator],
    ["value_threshold", valueThresholdEvaluator],
  ])
}
