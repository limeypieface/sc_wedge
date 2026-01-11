/**
 * Approval Workflow Engine
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * WHAT THIS ENGINE OWNS:
 * - Policy definition and trigger evaluation
 * - Multi-stage workflow orchestration (sequential, parallel, conditional)
 * - Approval request lifecycle (create, decide, cancel, expire)
 * - Step-level decision collection and aggregation
 * - Escalation rule evaluation
 * - Capability computation for actors
 * - Audit logging for all decisions
 *
 * WHAT THIS ENGINE REFUSES TO OWN:
 * - Approver resolution (caller provides resolveApprovers callback)
 * - Notification delivery (emits events, caller handles delivery)
 * - Persistence of requests (caller uses returned immutable requests)
 * - Time scheduling (caller handles timeout checks)
 * - User authentication (caller provides Actor objects)
 *
 * GUARANTEES:
 * - Determinism: Same inputs + policy → same outputs
 * - Auditability: Every decision produces audit entries
 * - Immutability: All returned requests are new objects
 * - Traceability: Full history preserved in audit log
 *
 * CALLER MUST PROVIDE:
 * - Approval policies with workflow definitions
 * - Actor performing actions
 * - Callback to resolve approvers from config
 * - Custom rule evaluators (if using custom triggers)
 * - ID generator (optional, defaults to timestamp-based)
 *
 * ============================================================================
 */

export * from "./types"
export * from "./engine"
export * from "./policies"
