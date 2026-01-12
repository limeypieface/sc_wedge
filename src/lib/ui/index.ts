/**
 * UI Primitives
 *
 * Type-safe utilities for displaying and formatting domain values.
 */

// Formatters
export {
  // Money
  formatMoney,
  formatMoneyValue,
  formatMoneyCompact,
  type FormatMoneyOptions,
  // Quantity
  formatQuantity,
  formatQuantityValue,
  type FormatQuantityOptions,
  // Date/Time
  formatDate,
  formatRelativeTime,
  type DateFormat,
  type FormatDateOptions,
  // Duration
  formatDuration,
  type FormatDurationOptions,
  // Percentage
  formatPercentage,
  formatDecimalAsPercent,
  type FormatPercentageOptions,
  // Delta
  formatMoneyDelta,
  formatQuantityDelta,
  type FormatDeltaOptions,
  // Numbers
  formatNumber,
  formatCompactNumber,
} from './formatters';

// Status Display
export {
  // Badge config
  createStatusConfig,
  type StatusVariant,
  type StatusBadgeConfig,
  type StatusConfigMap,
  // Pre-built configs
  APPROVAL_STATUSES,
  DOCUMENT_STATUSES,
  PO_STATUSES,
  TASK_STATUSES,
  // Timeline
  buildStatusTimeline,
  getStatusDurations,
  type StatusTimelineEntry,
  type StatusTimeline,
  // Progress
  buildProgressIndicator,
  type ProgressStep,
  type ProgressIndicator,
  // Utilities
  isTerminalStatus,
  getStatusVariantClass,
  getStatusBadgeClasses,
} from './status';

// Status Icons (Universal)
export {
  // Core functions
  getStatusIcon,
  getStatusPercent,
  getStatusDescription,
  createProgressIcon,
  // Stage mapping
  createStatusStageMapping,
  type StatusStage,
  type StatusStageMapping,
  // Reference patterns
  STATUS_STAGE_PERCENT,
  COMMON_STAGE_PATTERNS,
} from './status-icons';

// Change Indicators
export {
  // Types
  type ChangeType,
  type FieldChange,
  type ChangeSet,
  type DeltaDirection,
  type DeltaDisplay,
  type HighlightConfig,
  type DirtyState,
  type ChangeSummary,
  // Detection
  detectChangeType,
  createFieldChange,
  compareObjects,
  buildChangeSet,
  // Specialized comparisons
  compareMoneyFields,
  compareQuantityFields,
  compareDateFields,
  // Delta display
  createMoneyDelta,
  createNumericDelta,
  // Highlighting
  DEFAULT_HIGHLIGHT_CONFIG,
  getChangeHighlightClass,
  getChangeIcon,
  getDeltaIcon,
  getDeltaClass,
  // Form state
  createDirtyState,
  // Summary
  summarizeChanges,
} from './changes';
