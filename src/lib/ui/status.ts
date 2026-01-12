/**
 * Status Display Primitives
 *
 * Type-safe status configuration and display helpers.
 */

import type { Timestamp } from '../../engines/_kernel';

// ============================================================================
// Status Badge Configuration
// ============================================================================

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

export interface StatusBadgeConfig<S extends string = string> {
  /** The status value */
  status: S;
  /** Display label */
  label: string;
  /** Visual variant */
  variant: StatusVariant;
  /** Optional icon name (for icon libraries) */
  icon?: string;
  /** Optional description/tooltip */
  description?: string;
}

/**
 * Create a status configuration map for type-safe status display.
 *
 * @example
 * const poStatuses = createStatusConfig({
 *   draft: { label: 'Draft', variant: 'muted', icon: 'file' },
 *   pending: { label: 'Pending Approval', variant: 'warning', icon: 'clock' },
 *   approved: { label: 'Approved', variant: 'success', icon: 'check' },
 *   rejected: { label: 'Rejected', variant: 'error', icon: 'x' },
 * });
 *
 * const config = poStatuses.get('approved');
 * // { status: 'approved', label: 'Approved', variant: 'success', icon: 'check' }
 */
export function createStatusConfig<S extends string>(
  config: Record<S, Omit<StatusBadgeConfig<S>, 'status'>>
): StatusConfigMap<S> {
  const entries = Object.entries(config) as [S, Omit<StatusBadgeConfig<S>, 'status'>][];
  const map = new Map<S, StatusBadgeConfig<S>>();

  for (const [status, conf] of entries) {
    map.set(status, { status, ...conf } as StatusBadgeConfig<S>);
  }

  return {
    get(status: S): StatusBadgeConfig<S> {
      const result = map.get(status);
      if (!result) {
        return {
          status,
          label: status,
          variant: 'default',
        };
      }
      return result;
    },
    all(): StatusBadgeConfig<S>[] {
      return Array.from(map.values());
    },
    statuses(): S[] {
      return Array.from(map.keys());
    },
  };
}

export interface StatusConfigMap<S extends string> {
  /** Get config for a specific status */
  get(status: S): StatusBadgeConfig<S>;
  /** Get all status configs */
  all(): StatusBadgeConfig<S>[];
  /** Get all status values */
  statuses(): S[];
}

// ============================================================================
// Pre-built Status Configs
// ============================================================================

/** Common approval statuses */
export const APPROVAL_STATUSES = createStatusConfig({
  pending: { label: 'Pending', variant: 'warning', icon: 'clock', description: 'Awaiting approval' },
  approved: { label: 'Approved', variant: 'success', icon: 'check', description: 'Has been approved' },
  rejected: { label: 'Rejected', variant: 'error', icon: 'x', description: 'Has been rejected' },
  cancelled: { label: 'Cancelled', variant: 'muted', icon: 'ban', description: 'Was cancelled' },
  expired: { label: 'Expired', variant: 'muted', icon: 'clock', description: 'Approval window expired' },
  escalated: { label: 'Escalated', variant: 'info', icon: 'arrow-up', description: 'Escalated to higher authority' },
});

/** Common document statuses */
export const DOCUMENT_STATUSES = createStatusConfig({
  draft: { label: 'Draft', variant: 'muted', icon: 'file', description: 'Work in progress' },
  submitted: { label: 'Submitted', variant: 'info', icon: 'send', description: 'Submitted for review' },
  in_review: { label: 'In Review', variant: 'warning', icon: 'eye', description: 'Under review' },
  approved: { label: 'Approved', variant: 'success', icon: 'check', description: 'Approved' },
  rejected: { label: 'Rejected', variant: 'error', icon: 'x', description: 'Rejected' },
  published: { label: 'Published', variant: 'success', icon: 'globe', description: 'Published and active' },
  archived: { label: 'Archived', variant: 'muted', icon: 'archive', description: 'Archived' },
});

/** Purchase Order statuses */
export const PO_STATUSES = createStatusConfig({
  draft: { label: 'Draft', variant: 'muted', icon: 'file' },
  pending_approval: { label: 'Pending Approval', variant: 'warning', icon: 'clock' },
  approved: { label: 'Approved', variant: 'success', icon: 'check' },
  sent: { label: 'Sent to Vendor', variant: 'info', icon: 'send' },
  acknowledged: { label: 'Acknowledged', variant: 'info', icon: 'check-circle' },
  partially_received: { label: 'Partially Received', variant: 'warning', icon: 'package' },
  received: { label: 'Received', variant: 'success', icon: 'package-check' },
  invoiced: { label: 'Invoiced', variant: 'info', icon: 'file-text' },
  closed: { label: 'Closed', variant: 'muted', icon: 'lock' },
  cancelled: { label: 'Cancelled', variant: 'error', icon: 'x' },
});

/** Task/Action statuses */
export const TASK_STATUSES = createStatusConfig({
  pending: { label: 'To Do', variant: 'muted', icon: 'circle' },
  in_progress: { label: 'In Progress', variant: 'info', icon: 'loader' },
  blocked: { label: 'Blocked', variant: 'error', icon: 'alert-triangle' },
  completed: { label: 'Completed', variant: 'success', icon: 'check-circle' },
  skipped: { label: 'Skipped', variant: 'muted', icon: 'skip-forward' },
});

// ============================================================================
// Status Timeline
// ============================================================================

export interface StatusTimelineEntry<S extends string = string> {
  /** The status at this point */
  status: S;
  /** When this status was entered */
  timestamp: Timestamp;
  /** Who triggered the status change */
  actor?: { id: string; name: string };
  /** Optional note/comment */
  note?: string;
  /** Duration in this status (ms), if not current */
  durationMs?: number;
}

export interface StatusTimeline<S extends string = string> {
  /** All status entries in chronological order */
  entries: StatusTimelineEntry<S>[];
  /** The current (most recent) status */
  currentStatus: S;
  /** When the current status was entered */
  currentSince: Timestamp;
  /** Total duration from first to current (ms) */
  totalDurationMs: number;
}

/**
 * Build a status timeline from history entries.
 *
 * @param entries - Array of { status, timestamp, actor?, note? }
 * @param currentTime - The current timestamp for duration calculation
 */
export function buildStatusTimeline<S extends string>(
  entries: Omit<StatusTimelineEntry<S>, 'durationMs'>[],
  currentTime: Timestamp
): StatusTimeline<S> {
  if (entries.length === 0) {
    throw new Error('Timeline must have at least one entry');
  }

  // Sort by timestamp
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate durations
  const withDurations: StatusTimelineEntry<S>[] = sorted.map((entry, index) => {
    const nextTimestamp = sorted[index + 1]?.timestamp ?? currentTime;
    const durationMs = new Date(nextTimestamp).getTime() - new Date(entry.timestamp).getTime();
    return { ...entry, durationMs };
  });

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalDurationMs = new Date(currentTime).getTime() - new Date(first.timestamp).getTime();

  return {
    entries: withDurations,
    currentStatus: last.status,
    currentSince: last.timestamp,
    totalDurationMs,
  };
}

/**
 * Get time spent in each status from a timeline.
 */
export function getStatusDurations<S extends string>(
  timeline: StatusTimeline<S>
): Map<S, number> {
  const durations = new Map<S, number>();

  for (const entry of timeline.entries) {
    const current = durations.get(entry.status) ?? 0;
    durations.set(entry.status, current + (entry.durationMs ?? 0));
  }

  return durations;
}

// ============================================================================
// Progress Indicator
// ============================================================================

export interface ProgressStep<S extends string = string> {
  /** Step identifier */
  id: string;
  /** Display label */
  label: string;
  /** Step status */
  status: 'pending' | 'current' | 'completed' | 'skipped' | 'error';
  /** Optional description */
  description?: string;
  /** Associated domain status (if any) */
  domainStatus?: S;
}

export interface ProgressIndicator<S extends string = string> {
  /** All steps */
  steps: ProgressStep<S>[];
  /** Current step index (0-based) */
  currentIndex: number;
  /** Number of completed steps */
  completedCount: number;
  /** Total number of steps */
  totalSteps: number;
  /** Completion percentage (0-100) */
  percentComplete: number;
}

/**
 * Build a progress indicator from step definitions and current status.
 *
 * @example
 * const progress = buildProgressIndicator(
 *   [
 *     { id: 'draft', label: 'Draft', domainStatus: 'draft' },
 *     { id: 'review', label: 'Review', domainStatus: 'pending_approval' },
 *     { id: 'approved', label: 'Approved', domainStatus: 'approved' },
 *     { id: 'sent', label: 'Sent', domainStatus: 'sent' },
 *   ],
 *   'pending_approval'
 * );
 */
export function buildProgressIndicator<S extends string>(
  stepDefs: { id: string; label: string; description?: string; domainStatus?: S }[],
  currentStatus: S,
  options: { completedStatuses?: S[]; errorStatuses?: S[]; skippedSteps?: string[] } = {}
): ProgressIndicator<S> {
  const { completedStatuses = [], errorStatuses = [], skippedSteps = [] } = options;

  // Find current step index
  let currentIndex = stepDefs.findIndex((s) => s.domainStatus === currentStatus);
  if (currentIndex === -1) currentIndex = 0;

  const isError = errorStatuses.includes(currentStatus);

  const steps: ProgressStep<S>[] = stepDefs.map((def, index) => {
    let status: ProgressStep<S>['status'];

    if (skippedSteps.includes(def.id)) {
      status = 'skipped';
    } else if (index < currentIndex || completedStatuses.includes(def.domainStatus as S)) {
      status = 'completed';
    } else if (index === currentIndex) {
      status = isError ? 'error' : 'current';
    } else {
      status = 'pending';
    }

    return {
      id: def.id,
      label: def.label,
      description: def.description,
      status,
      domainStatus: def.domainStatus,
    };
  });

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalSteps = steps.filter((s) => s.status !== 'skipped').length;
  const percentComplete = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return {
    steps,
    currentIndex,
    completedCount,
    totalSteps,
    percentComplete,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a status is terminal (no further transitions expected).
 */
export function isTerminalStatus<S extends string>(
  status: S,
  terminalStatuses: readonly S[]
): boolean {
  return terminalStatuses.includes(status);
}

/**
 * Get CSS class name for a status variant.
 */
export function getStatusVariantClass(variant: StatusVariant): string {
  const classes: Record<StatusVariant, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    muted: 'bg-gray-50 text-gray-500',
  };
  return classes[variant];
}

/**
 * Get Tailwind classes for status badge styling.
 */
export function getStatusBadgeClasses(variant: StatusVariant): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const variants: Record<StatusVariant, { bg: string; text: string; border: string; dot: string }> = {
    default: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
    success: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    muted: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-100', dot: 'bg-gray-400' },
  };
  return variants[variant];
}
