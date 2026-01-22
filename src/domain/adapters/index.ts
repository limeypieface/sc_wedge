/**
 * Domain Adapters (Ports)
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * This module defines the interfaces (ports) that adapters must implement.
 * Engines depend on these abstractions, not concrete implementations.
 *
 * DESIGN PRINCIPLES:
 * - All ports are async to support various implementations
 * - Ports are generic where appropriate
 * - No implementation details leak into the domain
 * - Adapters are injected, never imported directly
 *
 * AVAILABLE PORTS:
 * - Repository: CRUD operations for any entity type
 * - Clock: Time provider (for deterministic testing)
 * - IdGenerator: ID generation (for deterministic testing)
 * - NotificationSender: Send notifications via various channels
 * - EventPublisher: Publish domain events
 *
 * ============================================================================
 */

export * from "./repository"
export * from "./clock"
export * from "./id-generator"
export * from "./notification"
export * from "./event-publisher"
