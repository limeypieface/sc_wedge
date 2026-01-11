/**
 * Clock Port
 *
 * Time provider interface for deterministic testing.
 * Allows injecting a controlled clock for unit tests.
 */

import type { Timestamp, Duration } from "../core/types"

// ============================================================================
// CLOCK PORT
// ============================================================================

/**
 * Clock interface for time operations
 */
export interface ClockPort {
  /**
   * Get current timestamp
   */
  now(): Timestamp

  /**
   * Get current date (start of day)
   */
  today(): Date

  /**
   * Get current timestamp in milliseconds
   */
  nowMs(): number

  /**
   * Add duration to a date
   */
  add(date: Date, duration: Duration): Date

  /**
   * Check if date is in the past
   */
  isPast(date: Date): boolean

  /**
   * Check if date is in the future
   */
  isFuture(date: Date): boolean
}

// ============================================================================
// IMPLEMENTATIONS
// ============================================================================

/**
 * System clock using real time
 */
export const systemClock: ClockPort = {
  now: () => new Date(),
  today: () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  },
  nowMs: () => Date.now(),
  add: (date, duration) => {
    const result = new Date(date)
    switch (duration.unit) {
      case "seconds":
        result.setSeconds(result.getSeconds() + duration.value)
        break
      case "minutes":
        result.setMinutes(result.getMinutes() + duration.value)
        break
      case "hours":
        result.setHours(result.getHours() + duration.value)
        break
      case "days":
        result.setDate(result.getDate() + duration.value)
        break
      case "weeks":
        result.setDate(result.getDate() + duration.value * 7)
        break
      case "months":
        result.setMonth(result.getMonth() + duration.value)
        break
    }
    return result
  },
  isPast: (date) => date.getTime() < Date.now(),
  isFuture: (date) => date.getTime() > Date.now(),
}

/**
 * Create a fixed clock for testing
 */
export function createFixedClock(fixedTime: Date): ClockPort {
  return {
    now: () => new Date(fixedTime),
    today: () => {
      const d = new Date(fixedTime)
      d.setHours(0, 0, 0, 0)
      return d
    },
    nowMs: () => fixedTime.getTime(),
    add: (date, duration) => systemClock.add(date, duration),
    isPast: (date) => date.getTime() < fixedTime.getTime(),
    isFuture: (date) => date.getTime() > fixedTime.getTime(),
  }
}

/**
 * Create a controllable clock for testing
 */
export function createControllableClock(initialTime: Date = new Date()): ClockPort & {
  advance: (duration: Duration) => void
  set: (time: Date) => void
} {
  let currentTime = new Date(initialTime)

  return {
    now: () => new Date(currentTime),
    today: () => {
      const d = new Date(currentTime)
      d.setHours(0, 0, 0, 0)
      return d
    },
    nowMs: () => currentTime.getTime(),
    add: (date, duration) => systemClock.add(date, duration),
    isPast: (date) => date.getTime() < currentTime.getTime(),
    isFuture: (date) => date.getTime() > currentTime.getTime(),
    advance: (duration) => {
      currentTime = systemClock.add(currentTime, duration)
    },
    set: (time) => {
      currentTime = new Date(time)
    },
  }
}
