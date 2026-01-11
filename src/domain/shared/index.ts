/**
 * Shared Domain Module - Public API
 *
 * Re-exports from the consolidated domain/core module.
 * @deprecated Import from '../../domain' instead
 */

// Re-export all types from domain/core/types
export type {
  EntityId,
  PrincipalId,
  ISOTimestamp,
  DurationMs,
  Timestamp,
  Duration,
  DateRange,
  Actor,
  ActorType,
  Priority,
  Status,
  PaginationRequest,
  PaginationResponse,
  PaginatedResult,
  SortDirection,
  SortSpec,
  Auditable,
  SoftDeletable,
  AuditEntry,
  ObjectReference,
  ExecutionContext,
  DeepPartial,
  DeepReadonly,
  PartialBy,
  RequiredBy,
  StringKeys,
  DataOnly,
} from "../../../domain/core/types"

export {
  entityId,
  principalId,
  isoTimestamp,
  parseTimestamp,
  durationMs,
  DURATIONS,
  PRIORITY_ORDER,
  SYSTEM_ACTOR,
} from "../../../domain/core/types"

// Re-export all from domain/core/errors
export type {
  Result,
  SuccessResult,
  FailureResult,
  DomainError,
  ValidationResult,
  ValidationError,
} from "../../../domain/core/errors"

export {
  success,
  failure,
  failureFromError,
  isSuccess,
  isFailure,
  mapResult,
  flatMapResult,
  unwrap,
  unwrapOr,
  combineResults,
  domainError,
  ErrorCodes,
  valid,
  invalid,
  combineValidations,
  validationToResult,
} from "../../../domain/core/errors"

// Re-export SortOption type alias for backward compatibility
export type { SortSpec as SortOption } from "../../../domain/core/types"
