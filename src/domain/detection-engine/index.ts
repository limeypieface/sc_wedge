/**
 * Issue and Task Detection Engine
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * WHAT THIS ENGINE OWNS:
 * - Rule-based issue detection
 * - Issue categorization and prioritization
 * - Suggested action generation
 * - Batch detection with summary statistics
 * - Issue lifecycle (detect, acknowledge, resolve)
 *
 * WHAT THIS ENGINE REFUSES TO OWN:
 * - Issue persistence
 * - Notification delivery
 * - User assignment logic
 *
 * GUARANTEES:
 * - Determinism: Same data + rules → same issues detected
 * - Immutability: All operations return new objects
 * - Auditability: Detection history preserved
 *
 * CALLER MUST PROVIDE:
 * - Detection rules with evaluators
 * - Data to scan for issues
 * - Priority configuration
 *
 * ============================================================================
 */

export * from "./types"
export * from "./engine"
