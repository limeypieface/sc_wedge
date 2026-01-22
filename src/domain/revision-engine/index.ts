/**
 * Revision and Versioning Engine
 *
 * ============================================================================
 * CONTRACT
 * ============================================================================
 *
 * WHAT THIS ENGINE OWNS:
 * - Semantic version parsing and comparison
 * - Version increment logic (major, minor, patch)
 * - Change tracking and delta computation
 * - Change significance classification
 * - Revision comparison and diff generation
 *
 * WHAT THIS ENGINE REFUSES TO OWN:
 * - Revision persistence
 * - Conflict resolution strategies
 * - Merge operations
 *
 * GUARANTEES:
 * - Determinism: Same inputs → same outputs
 * - Immutability: All operations return new objects
 * - Auditability: Complete change history
 *
 * CALLER MUST PROVIDE:
 * - Document/entity data for versioning
 * - Change classification rules
 * - Actor making changes
 *
 * ============================================================================
 */

export * from "./types"
export * from "./engine"
