/**
 * Sindri Prototype - Domain Module
 *
 * Re-exports from the consolidated domain engines.
 * @deprecated Import from '../../domain' instead
 */

// ============================================================================
// SHARED TYPES - Re-export from domain/core
// ============================================================================

export * from "./shared"

// ============================================================================
// DOMAIN ENGINES - Re-export from consolidated domain module
// ============================================================================

// Approval Engine
export * as ApprovalEngine from "../../domain/approval-engine"

// Financial Engine
export * as FinancialEngine from "../../domain/financial-engine"

// Revision Engine (formerly Versioning Engine)
export * as VersioningEngine from "../../domain/revision-engine"

// State Machine
export * as StateMachine from "../../domain/state-machine"

// Communication Broker
export * as CommunicationBroker from "../../domain/communication-broker"

// Detection Engine (formerly Issue Detection)
export * as IssueDetection from "../../domain/detection-engine"

// Authorization Engine (formerly Authorization Lifecycle)
export * as AuthorizationLifecycle from "../../domain/authorization-engine"

// ============================================================================
// ORDER CORE - Application-specific (kept locally)
// ============================================================================

export * as OrderCore from "./order-core"
