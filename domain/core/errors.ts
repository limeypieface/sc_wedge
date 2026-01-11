/**
 * Domain Errors and Result Types
 *
 * Standard error types and result monads for domain operations.
 * These enable explicit error handling without exceptions.
 *
 * Design Principles:
 * - Errors are data, not exceptions
 * - All operations return explicit results
 * - Error codes are standardized
 * - Results can be composed with map/flatMap
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standard domain error
 */
export interface DomainError {
  readonly code: string
  readonly message: string
  readonly details?: Readonly<Record<string, unknown>>
}

/**
 * Create a domain error
 */
export function domainError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): DomainError {
  return Object.freeze({ code, message, details })
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED: "MISSING_REQUIRED",
  VALIDATION_FAILED: "VALIDATION_FAILED",

  // State errors
  INVALID_STATE: "INVALID_STATE",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  STATE_CONFLICT: "STATE_CONFLICT",

  // Authorization errors
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // Not found errors
  NOT_FOUND: "NOT_FOUND",
  ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
  POLICY_NOT_FOUND: "POLICY_NOT_FOUND",

  // Conflict errors
  CONFLICT: "CONFLICT",
  DUPLICATE: "DUPLICATE",
  CONCURRENCY_CONFLICT: "CONCURRENCY_CONFLICT",

  // Business rule errors
  BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
  POLICY_VIOLATION: "POLICY_VIOLATION",
  THRESHOLD_EXCEEDED: "THRESHOLD_EXCEEDED",

  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  TIMEOUT: "TIMEOUT",
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Success result
 */
export interface SuccessResult<T> {
  readonly success: true
  readonly data: T
  readonly warnings?: readonly string[]
}

/**
 * Failure result
 */
export interface FailureResult {
  readonly success: false
  readonly error: DomainError
}

/**
 * Combined result type
 */
export type Result<T> = SuccessResult<T> | FailureResult

/**
 * Create a success result
 */
export function success<T>(data: T, warnings?: readonly string[]): SuccessResult<T> {
  return Object.freeze({ success: true, data, warnings })
}

/**
 * Create a failure result
 */
export function failure(
  code: string,
  message: string,
  details?: Record<string, unknown>
): FailureResult {
  return Object.freeze({
    success: false,
    error: domainError(code, message, details),
  })
}

/**
 * Create a failure from an existing error
 */
export function failureFromError(error: DomainError): FailureResult {
  return Object.freeze({ success: false, error })
}

// ============================================================================
// RESULT UTILITIES
// ============================================================================

/**
 * Check if result is successful
 */
export function isSuccess<T>(result: Result<T>): result is SuccessResult<T> {
  return result.success
}

/**
 * Check if result is failure
 */
export function isFailure<T>(result: Result<T>): result is FailureResult {
  return !result.success
}

/**
 * Map over a successful result
 */
export function mapResult<T, U>(
  result: Result<T>,
  fn: (data: T) => U
): Result<U> {
  if (result.success) {
    return success(fn(result.data), result.warnings)
  }
  return result
}

/**
 * FlatMap over a successful result
 */
export function flatMapResult<T, U>(
  result: Result<T>,
  fn: (data: T) => Result<U>
): Result<U> {
  if (result.success) {
    return fn(result.data)
  }
  return result
}

/**
 * Unwrap a result or throw
 */
export function unwrap<T>(result: Result<T>): T {
  if (result.success) {
    return result.data
  }
  throw new Error(`${result.error.code}: ${result.error.message}`)
}

/**
 * Unwrap a result or return default
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  if (result.success) {
    return result.data
  }
  return defaultValue
}

/**
 * Combine multiple results into one
 */
export function combineResults<T>(results: readonly Result<T>[]): Result<readonly T[]> {
  const data: T[] = []
  const allWarnings: string[] = []

  for (const result of results) {
    if (!result.success) {
      return result
    }
    data.push(result.data)
    if (result.warnings) {
      allWarnings.push(...result.warnings)
    }
  }

  return success(data, allWarnings.length > 0 ? allWarnings : undefined)
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation error
 */
export interface ValidationError {
  readonly field: string
  readonly message: string
  readonly code?: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: readonly ValidationError[]
}

/**
 * Create a valid result
 */
export function valid(): ValidationResult {
  return Object.freeze({ isValid: true, errors: [] })
}

/**
 * Create an invalid result
 */
export function invalid(errors: readonly ValidationError[]): ValidationResult {
  return Object.freeze({ isValid: false, errors })
}

/**
 * Combine validation results
 */
export function combineValidations(...results: readonly ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors)
  return Object.freeze({
    isValid: allErrors.length === 0,
    errors: allErrors,
  })
}

/**
 * Convert validation result to domain result
 */
export function validationToResult<T>(
  validation: ValidationResult,
  data: T
): Result<T> {
  if (validation.isValid) {
    return success(data)
  }
  return failure(
    ErrorCodes.VALIDATION_FAILED,
    "Validation failed",
    { errors: validation.errors }
  )
}
