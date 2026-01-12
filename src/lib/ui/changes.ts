/**
 * Change Indicator Primitives
 *
 * Utilities for tracking, comparing, and displaying changes between values.
 * Useful for revision diffs, audit trails, and edit indicators.
 */

import type { Money, Quantity, Timestamp } from '../../engines/_kernel';
import { moneyToDecimal, compareMoney } from '../../engines/_kernel';
import { formatMoney, formatQuantity, formatDate, formatMoneyDelta } from './formatters';

// ============================================================================
// Field Change Types
// ============================================================================

export type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface FieldChange<T = unknown> {
  /** Field path (e.g., "header.vendor.name" or "lines[0].quantity") */
  field: string;
  /** Human-readable field label */
  label: string;
  /** Previous value (undefined if added) */
  oldValue?: T;
  /** New value (undefined if removed) */
  newValue?: T;
  /** Type of change */
  changeType: ChangeType;
  /** Formatted old value for display */
  formattedOld?: string;
  /** Formatted new value for display */
  formattedNew?: string;
}

export interface ChangeSet {
  /** All field changes */
  changes: FieldChange[];
  /** Number of fields added */
  addedCount: number;
  /** Number of fields removed */
  removedCount: number;
  /** Number of fields modified */
  modifiedCount: number;
  /** Total number of changes */
  totalChanges: number;
  /** Whether there are any changes */
  hasChanges: boolean;
}

// ============================================================================
// Change Detection
// ============================================================================

/**
 * Compare two values and determine the change type.
 */
export function detectChangeType<T>(oldValue: T | undefined, newValue: T | undefined): ChangeType {
  if (oldValue === undefined && newValue !== undefined) return 'added';
  if (oldValue !== undefined && newValue === undefined) return 'removed';
  if (oldValue === newValue) return 'unchanged';
  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return 'unchanged';
  }
  return 'modified';
}

/**
 * Create a field change record.
 */
export function createFieldChange<T>(
  field: string,
  label: string,
  oldValue: T | undefined,
  newValue: T | undefined,
  formatter?: (value: T) => string
): FieldChange<T> {
  const changeType = detectChangeType(oldValue, newValue);

  return {
    field,
    label,
    oldValue,
    newValue,
    changeType,
    formattedOld: oldValue !== undefined && formatter ? formatter(oldValue) : String(oldValue ?? ''),
    formattedNew: newValue !== undefined && formatter ? formatter(newValue) : String(newValue ?? ''),
  };
}

/**
 * Compare two objects and return all field changes.
 */
export function compareObjects<T extends Record<string, unknown>>(
  oldObj: T | undefined,
  newObj: T | undefined,
  options: {
    /** Fields to include (default: all) */
    includeFields?: (keyof T)[];
    /** Fields to exclude */
    excludeFields?: (keyof T)[];
    /** Field labels */
    labels?: Partial<Record<keyof T, string>>;
    /** Custom formatters per field */
    formatters?: Partial<Record<keyof T, (value: unknown) => string>>;
  } = {}
): ChangeSet {
  const { includeFields, excludeFields = [] } = options;
  const labels = options.labels ?? {} as Partial<Record<keyof T, string>>;
  const formatters = options.formatters ?? {} as Partial<Record<keyof T, (value: unknown) => string>>;

  const changes: FieldChange[] = [];

  // Get all keys from both objects
  const allKeys = new Set<keyof T>([
    ...Object.keys(oldObj ?? {}),
    ...Object.keys(newObj ?? {}),
  ] as (keyof T)[]);

  // Filter keys
  let keys = Array.from(allKeys);
  if (includeFields) {
    keys = keys.filter((k) => includeFields.includes(k));
  }
  keys = keys.filter((k) => !excludeFields.includes(k));

  for (const key of keys) {
    const oldValue = oldObj?.[key];
    const newValue = newObj?.[key];
    const changeType = detectChangeType(oldValue, newValue);

    if (changeType !== 'unchanged') {
      const formatter = formatters[key] as ((v: unknown) => string) | undefined;
      changes.push({
        field: String(key),
        label: (labels[key] as string) ?? String(key),
        oldValue,
        newValue,
        changeType,
        formattedOld: oldValue !== undefined ? (formatter ? formatter(oldValue) : String(oldValue)) : undefined,
        formattedNew: newValue !== undefined ? (formatter ? formatter(newValue) : String(newValue)) : undefined,
      });
    }
  }

  return buildChangeSet(changes);
}

/**
 * Build a ChangeSet from an array of changes.
 */
export function buildChangeSet(changes: FieldChange[]): ChangeSet {
  const addedCount = changes.filter((c) => c.changeType === 'added').length;
  const removedCount = changes.filter((c) => c.changeType === 'removed').length;
  const modifiedCount = changes.filter((c) => c.changeType === 'modified').length;

  return {
    changes,
    addedCount,
    removedCount,
    modifiedCount,
    totalChanges: changes.length,
    hasChanges: changes.length > 0,
  };
}

// ============================================================================
// Specialized Comparisons
// ============================================================================

/**
 * Compare two Money values and create a change record.
 */
export function compareMoneyFields(
  field: string,
  label: string,
  oldValue: Money | undefined,
  newValue: Money | undefined
): FieldChange<Money> {
  let changeType: ChangeType = 'unchanged';

  if (oldValue === undefined && newValue !== undefined) {
    changeType = 'added';
  } else if (oldValue !== undefined && newValue === undefined) {
    changeType = 'removed';
  } else if (oldValue && newValue) {
    if (compareMoney(oldValue, newValue) !== 0) {
      changeType = 'modified';
    }
  }

  return {
    field,
    label,
    oldValue,
    newValue,
    changeType,
    formattedOld: oldValue ? formatMoney(oldValue) : undefined,
    formattedNew: newValue ? formatMoney(newValue) : undefined,
  };
}

/**
 * Compare two Quantity values and create a change record.
 */
export function compareQuantityFields(
  field: string,
  label: string,
  oldValue: Quantity | undefined,
  newValue: Quantity | undefined
): FieldChange<Quantity> {
  let changeType: ChangeType = 'unchanged';

  if (oldValue === undefined && newValue !== undefined) {
    changeType = 'added';
  } else if (oldValue !== undefined && newValue === undefined) {
    changeType = 'removed';
  } else if (oldValue && newValue) {
    if (oldValue.value !== newValue.value || oldValue.unit !== newValue.unit) {
      changeType = 'modified';
    }
  }

  return {
    field,
    label,
    oldValue,
    newValue,
    changeType,
    formattedOld: oldValue ? formatQuantity(oldValue) : undefined,
    formattedNew: newValue ? formatQuantity(newValue) : undefined,
  };
}

/**
 * Compare two dates and create a change record.
 */
export function compareDateFields(
  field: string,
  label: string,
  oldValue: Timestamp | undefined,
  newValue: Timestamp | undefined
): FieldChange<Timestamp> {
  const changeType = detectChangeType(oldValue, newValue);

  return {
    field,
    label,
    oldValue,
    newValue,
    changeType,
    formattedOld: oldValue ? formatDate(oldValue) : undefined,
    formattedNew: newValue ? formatDate(newValue) : undefined,
  };
}

// ============================================================================
// Delta Display Types
// ============================================================================

export type DeltaDirection = 'up' | 'down' | 'neutral';

export interface DeltaDisplay {
  /** The numeric difference */
  difference: number;
  /** Direction of change */
  direction: DeltaDirection;
  /** Formatted display string */
  formatted: string;
  /** Percentage change (if calculable) */
  percentChange?: number;
  /** Whether this is a significant change */
  isSignificant: boolean;
}

/**
 * Create a delta display for Money values.
 */
export function createMoneyDelta(
  current: Money,
  previous: Money,
  options: { significanceThreshold?: number } = {}
): DeltaDisplay {
  const { significanceThreshold = 0.01 } = options; // 1% by default

  const currentDecimal = moneyToDecimal(current);
  const previousDecimal = moneyToDecimal(previous);
  const difference = currentDecimal - previousDecimal;

  let direction: DeltaDirection = 'neutral';
  if (difference > 0) direction = 'up';
  else if (difference < 0) direction = 'down';

  const percentChange = previousDecimal !== 0
    ? (difference / Math.abs(previousDecimal)) * 100
    : undefined;

  const isSignificant = percentChange !== undefined
    ? Math.abs(percentChange) >= significanceThreshold * 100
    : Math.abs(difference) > 0;

  return {
    difference,
    direction,
    formatted: formatMoneyDelta(current, previous),
    percentChange,
    isSignificant,
  };
}

/**
 * Create a delta display for numeric values.
 */
export function createNumericDelta(
  current: number,
  previous: number,
  options: {
    significanceThreshold?: number;
    decimals?: number;
    suffix?: string;
  } = {}
): DeltaDisplay {
  const { significanceThreshold = 0.01, decimals = 2, suffix = '' } = options;

  const difference = current - previous;

  let direction: DeltaDirection = 'neutral';
  if (difference > 0) direction = 'up';
  else if (difference < 0) direction = 'down';

  const percentChange = previous !== 0
    ? (difference / Math.abs(previous)) * 100
    : undefined;

  const isSignificant = percentChange !== undefined
    ? Math.abs(percentChange) >= significanceThreshold * 100
    : Math.abs(difference) > 0;

  const sign = difference > 0 ? '+' : '';
  const formatted = `${sign}${difference.toFixed(decimals)}${suffix}`;

  return {
    difference,
    direction,
    formatted,
    percentChange,
    isSignificant,
  };
}

// ============================================================================
// Change Highlighting Utilities
// ============================================================================

export interface HighlightConfig {
  /** CSS class for added content */
  addedClass: string;
  /** CSS class for removed content */
  removedClass: string;
  /** CSS class for modified content */
  modifiedClass: string;
}

export const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  addedClass: 'bg-green-100 text-green-800',
  removedClass: 'bg-red-100 text-red-800 line-through',
  modifiedClass: 'bg-yellow-100 text-yellow-800',
};

/**
 * Get CSS class for a change type.
 */
export function getChangeHighlightClass(
  changeType: ChangeType,
  config: HighlightConfig = DEFAULT_HIGHLIGHT_CONFIG
): string {
  switch (changeType) {
    case 'added':
      return config.addedClass;
    case 'removed':
      return config.removedClass;
    case 'modified':
      return config.modifiedClass;
    default:
      return '';
  }
}

/**
 * Get icon name for a change type.
 */
export function getChangeIcon(changeType: ChangeType): string {
  switch (changeType) {
    case 'added':
      return 'plus';
    case 'removed':
      return 'minus';
    case 'modified':
      return 'edit';
    default:
      return 'dot';
  }
}

/**
 * Get delta direction icon name.
 */
export function getDeltaIcon(direction: DeltaDirection): string {
  switch (direction) {
    case 'up':
      return 'arrow-up';
    case 'down':
      return 'arrow-down';
    default:
      return 'minus';
  }
}

/**
 * Get CSS class for delta direction.
 */
export function getDeltaClass(
  direction: DeltaDirection,
  options: { positiveIsGood?: boolean } = {}
): string {
  const { positiveIsGood = true } = options;

  if (direction === 'neutral') {
    return 'text-gray-500';
  }

  const isGood = positiveIsGood ? direction === 'up' : direction === 'down';
  return isGood ? 'text-green-600' : 'text-red-600';
}

// ============================================================================
// Form Dirty State Tracking
// ============================================================================

export interface DirtyState<T extends Record<string, unknown>> {
  /** Original values */
  original: T;
  /** Current values */
  current: T;
  /** Fields that have been modified */
  dirtyFields: Set<keyof T>;
  /** Whether any field is dirty */
  isDirty: boolean;
  /** Get the change for a specific field */
  getFieldChange(field: keyof T): FieldChange | null;
}

/**
 * Create a dirty state tracker for form values.
 */
export function createDirtyState<T extends Record<string, unknown>>(
  original: T,
  current: T
): DirtyState<T> {
  const dirtyFields = new Set<keyof T>();

  for (const key of Object.keys(original) as (keyof T)[]) {
    if (detectChangeType(original[key], current[key]) !== 'unchanged') {
      dirtyFields.add(key);
    }
  }

  return {
    original,
    current,
    dirtyFields,
    isDirty: dirtyFields.size > 0,
    getFieldChange(field: keyof T): FieldChange | null {
      if (!dirtyFields.has(field)) return null;
      return createFieldChange(
        String(field),
        String(field),
        original[field],
        current[field]
      );
    },
  };
}

// ============================================================================
// Change Summary
// ============================================================================

export interface ChangeSummary {
  /** Total number of changes */
  total: number;
  /** Summary text (e.g., "3 fields changed") */
  text: string;
  /** Detailed breakdown */
  breakdown: {
    added: number;
    removed: number;
    modified: number;
  };
}

/**
 * Generate a human-readable change summary.
 */
export function summarizeChanges(changeSet: ChangeSet): ChangeSummary {
  const { addedCount, removedCount, modifiedCount, totalChanges } = changeSet;

  const parts: string[] = [];
  if (addedCount > 0) parts.push(`${addedCount} added`);
  if (removedCount > 0) parts.push(`${removedCount} removed`);
  if (modifiedCount > 0) parts.push(`${modifiedCount} modified`);

  const text = totalChanges === 0
    ? 'No changes'
    : totalChanges === 1
      ? '1 field changed'
      : `${totalChanges} fields changed`;

  return {
    total: totalChanges,
    text,
    breakdown: {
      added: addedCount,
      removed: removedCount,
      modified: modifiedCount,
    },
  };
}
