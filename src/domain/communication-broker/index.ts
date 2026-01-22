/**
 * Communication Broker Engine
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * WHAT THIS ENGINE OWNS:
 * - Thread-based conversation management
 * - Message creation and template rendering
 * - Participant and recipient management
 * - Notification batching and prioritization
 * - Channel routing logic
 *
 * WHAT THIS ENGINE REFUSES TO OWN:
 * - Actual message delivery (adapter responsibility)
 * - User preferences storage
 * - Real-time WebSocket handling
 *
 * GUARANTEES:
 * - Determinism: Same inputs → same message structure
 * - Immutability: All operations return new objects
 * - Traceability: Message history preserved
 *
 * CALLER MUST PROVIDE:
 * - Message templates with variables
 * - Recipient resolution
 * - Channel configuration
 *
 * ============================================================================
 */

export * from "./types"
export * from "./engine"
