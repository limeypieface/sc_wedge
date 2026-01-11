/**
 * Domain Utilities
 *
 * Pure utility functions used across all engines.
 * No side effects, fully deterministic (when using injected time/randomness).
 *
 * Design Principles:
 * - All functions are pure (same input → same output)
 * - No external dependencies
 * - Immutable operations (return new objects)
 * - Time and randomness are injectable for testing
 */

import type { EntityId, Duration, Timestamp, ExecutionContext, Actor, Priority } from "./types"
import { PRIORITY_ORDER } from "./types"

// Re-export for convenience
export { PRIORITY_ORDER }
export type { Priority }

// ============================================================================
// ID GENERATION (injectable for determinism)
// ============================================================================

/**
 * ID generator interface
 */
export interface IdGenerator {
  generate(prefix?: string): EntityId
  generateSequential(prefix: string, sequence: number, padLength?: number): EntityId
}

/**
 * Default ID generator (uses timestamp + random)
 */
export const defaultIdGenerator: IdGenerator = {
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

// ============================================================================
// TIME UTILITIES (injectable for determinism)
// ============================================================================

/**
 * Clock interface for injectable time
 */
export interface Clock {
  now(): Timestamp
  today(): Date
}

/**
 * Default clock using system time
 */
export const defaultClock: Clock = {
  now: () => new Date(),
  today: () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  },
}

/**
 * Add duration to date
 */
export function addDuration(
  date: Date,
  value: number,
  unit: Duration["unit"]
): Date {
  const result = new Date(date)

  switch (unit) {
    case "seconds":
      result.setSeconds(result.getSeconds() + value)
      break
    case "minutes":
      result.setMinutes(result.getMinutes() + value)
      break
    case "hours":
      result.setHours(result.getHours() + value)
      break
    case "days":
      result.setDate(result.getDate() + value)
      break
    case "weeks":
      result.setDate(result.getDate() + value * 7)
      break
    case "months":
      result.setMonth(result.getMonth() + value)
      break
  }

  return result
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date, clock: Clock = defaultClock): boolean {
  return date.getTime() < clock.now().getTime()
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date, clock: Clock = defaultClock): boolean {
  return date.getTime() > clock.now().getTime()
}

/**
 * Get difference between dates in specified unit
 */
export function dateDiff(
  start: Date,
  end: Date,
  unit: "seconds" | "minutes" | "hours" | "days"
): number {
  const diffMs = end.getTime() - start.getTime()

  switch (unit) {
    case "seconds":
      return Math.floor(diffMs / 1000)
    case "minutes":
      return Math.floor(diffMs / (1000 * 60))
    case "hours":
      return Math.floor(diffMs / (1000 * 60 * 60))
    case "days":
      return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }
}

/**
 * Format date to ISO string (date only)
 */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0]
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clone an object (immutable-safe)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T
  }

  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Deep equality check
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === "object") {
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((item, index) => deepEqual(item, b[index]))
    }

    if (isPlainObject(a) && isPlainObject(b)) {
      const aObj = a as Record<string, unknown>
      const bObj = b as Record<string, unknown>
      const keysA = Object.keys(aObj)
      const keysB = Object.keys(bObj)
      if (keysA.length !== keysB.length) return false
      return keysA.every((key) => deepEqual(aObj[key], bObj[key]))
    }
  }

  return false
}

/**
 * Check if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Deep merge objects (immutable)
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  const result = deepClone(target)

  for (const source of sources) {
    if (!source) continue

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = result[key]

        if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
          (result as Record<string, unknown>)[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          )
        } else {
          (result as Record<string, unknown>)[key] = deepClone(sourceValue)
        }
      }
    }
  }

  return result
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result as Omit<T, K>
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Group array items by a key
 */
export function groupBy<T, K extends string | number>(
  items: readonly T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const existing = groups.get(key) || []
    existing.push(item)
    groups.set(key, existing)
  }
  return groups
}

/**
 * Create a map from array using a key function
 */
export function indexBy<T, K extends string | number>(
  items: readonly T[],
  keyFn: (item: T) => K
): Map<K, T> {
  const map = new Map<K, T>()
  for (const item of items) {
    map.set(keyFn(item), item)
  }
  return map
}

/**
 * Unique items by key
 */
export function uniqueBy<T, K>(items: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Sort array by multiple fields
 */
export function sortByMultiple<T>(
  items: readonly T[],
  comparators: Array<(a: T, b: T) => number>
): T[] {
  return [...items].sort((a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b)
      if (result !== 0) return result
    }
    return 0
  })
}

/**
 * Partition array into two groups
 */
export function partition<T>(
  items: readonly T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const pass: T[] = []
  const fail: T[] = []
  for (const item of items) {
    if (predicate(item)) {
      pass.push(item)
    } else {
      fail.push(item)
    }
  }
  return [pass, fail]
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Round to specified decimal places
 */
export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Round for currency (2 decimals)
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Calculate percentage (base * rate)
 */
export function calculatePercentage(base: number, rate: number): number {
  return roundCurrency(base * rate)
}

/**
 * Calculate percentage change
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue === 0 ? 0 : 100
  return round(((newValue - oldValue) / Math.abs(oldValue)) * 100, 2)
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert to title case
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ")
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number, suffix = "..."): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length) + suffix
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (isNil(value)) return true
  if (typeof value === "string") return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (isPlainObject(value)) return Object.keys(value).length === 0
  return false
}

/**
 * Assert condition
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

/**
 * Assert value is defined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = "Value is null or undefined"
): asserts value is T {
  if (isNil(value)) {
    throw new Error(message)
  }
}

// ============================================================================
// CONTEXT UTILITIES
// ============================================================================

/**
 * Create execution context from actor
 */
export function createContext(
  actor: Actor,
  idGenerator: IdGenerator = defaultIdGenerator,
  clock: Clock = defaultClock,
  meta?: Record<string, unknown>
): ExecutionContext {
  return {
    actor,
    timestamp: clock.now(),
    correlationId: idGenerator.generate("ctx"),
    meta,
  }
}
