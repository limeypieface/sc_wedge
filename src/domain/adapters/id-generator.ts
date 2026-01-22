/**
 * ID Generator Port
 *
 * ID generation interface for deterministic testing.
 * Allows injecting a controlled ID generator for unit tests.
 */

import type { EntityId } from "../core/types"

// ============================================================================
// ID GENERATOR PORT
// ============================================================================

/**
 * ID generator interface
 */
export interface IdGeneratorPort {
  /**
   * Generate a new unique ID
   */
  generate(prefix?: string): EntityId

  /**
   * Generate a sequential ID
   */
  generateSequential(prefix: string, sequence: number, padLength?: number): EntityId
}

// ============================================================================
// IMPLEMENTATIONS
// ============================================================================

/**
 * Default ID generator using timestamp + random
 */
export const defaultIdGenerator: IdGeneratorPort = {
  generate(prefix?: string): EntityId {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 11)
    const id = `${timestamp}-${random}`
    return (prefix ? `${prefix}-${id}` : id) as EntityId
  },
  generateSequential(prefix: string, sequence: number, padLength = 6): EntityId {
    return `${prefix}-${String(sequence).padStart(padLength, "0")}` as EntityId
  },
}

/**
 * UUID-like ID generator
 */
export const uuidGenerator: IdGeneratorPort = {
  generate(prefix?: string): EntityId {
    const uuid = generateUUID()
    return (prefix ? `${prefix}-${uuid}` : uuid) as EntityId
  },
  generateSequential(prefix: string, sequence: number, padLength = 6): EntityId {
    return `${prefix}-${String(sequence).padStart(padLength, "0")}` as EntityId
  },
}

/**
 * Create a deterministic ID generator for testing
 */
export function createDeterministicIdGenerator(startingSequence = 0): IdGeneratorPort & {
  reset: () => void
  getNextSequence: () => number
} {
  let sequence = startingSequence

  return {
    generate(prefix?: string): EntityId {
      sequence++
      const id = `test-${sequence}`
      return (prefix ? `${prefix}-${id}` : id) as EntityId
    },
    generateSequential(prefix: string, seq: number, padLength = 6): EntityId {
      return `${prefix}-${String(seq).padStart(padLength, "0")}` as EntityId
    },
    reset() {
      sequence = startingSequence
    },
    getNextSequence() {
      return sequence + 1
    },
  }
}

/**
 * Create an ID generator from a list of predetermined IDs
 */
export function createPredeterminedIdGenerator(ids: readonly string[]): IdGeneratorPort {
  let index = 0

  return {
    generate(prefix?: string): EntityId {
      if (index >= ids.length) {
        throw new Error(`Predetermined IDs exhausted at index ${index}`)
      }
      const id = ids[index]
      index++
      return (prefix ? `${prefix}-${id}` : id) as EntityId
    },
    generateSequential(prefix: string, sequence: number, padLength = 6): EntityId {
      return `${prefix}-${String(sequence).padStart(padLength, "0")}` as EntityId
    },
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateUUID(): string {
  // RFC 4122 version 4 compliant UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
