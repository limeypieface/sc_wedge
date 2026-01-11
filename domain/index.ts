/**
 * Sindri Domain Layer
 *
 * This module exports all domain engines, types, and policies.
 * It represents the core business logic that is:
 * - Pure and deterministic
 * - Framework-agnostic
 * - Fully testable in isolation
 * - Ready for backend migration
 *
 * IMPORT RULES:
 * - This layer MUST NOT import from `ui/` or `adapters/`
 * - This layer MUST NOT have external runtime dependencies
 * - All engines operate on abstract inputs and produce explicit outputs
 *
 * @module domain
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export * from "./core/types"
export * from "./core/events"
export * from "./core/errors"

// ============================================================================
// DOMAIN ENGINES
// ============================================================================

// State Machine Engine - Valid states, transitions, metadata, enforcement
export * as StateMachine from "./state-machine"

// Financial Engine - Hierarchical pricing, charges, discounts, taxes, totals
export * as Financial from "./financial-engine"

// Approval Engine - Policy-driven, multi-stage decision gating
export * as Approval from "./approval-engine"

// Revision Engine - Semantic versions, change tracking, deltas, audit trails
export * as Revision from "./revision-engine"

// Communication Broker - Multi-channel, thread-based, context-aware communications
export * as Communication from "./communication-broker"

// Detection Engine - Signal detection, prioritization, suggested actions
export * as Detection from "./detection-engine"

// Authorization Engine - Request → authorize → execute → resolve patterns
export * as Authorization from "./authorization-engine"

// ============================================================================
// ADAPTERS (PORTS)
// ============================================================================

// Adapter interfaces for dependency injection
export * as Adapters from "./adapters"
