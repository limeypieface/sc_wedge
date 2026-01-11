/**
 * PO Revision Types
 *
 * Type definitions for tracking changes to Purchase Orders.
 * Revisions allow amendments to be tracked, approved, and sent to vendors.
 *
 * Version Numbering:
 * - Major versions (1.0, 2.0) for critical changes requiring approval
 * - Minor versions (1.1, 1.2) for non-critical changes
 *
 * Edit Types:
 * - Critical: Quantity, price, add/remove lines → new major version
 * - Non-critical: Notes, dates, project codes → minor version
 */

import { RevisionStatus } from "@/types/enums";
import { ApprovalChain } from "./approval.types";
import { LineItem, POCharge, PODiscount } from "./purchase-order.types";

// ============================================================================
// EDIT CLASSIFICATION
// ============================================================================

/**
 * Fields that constitute critical edits (require new major version)
 *
 * Changes to these fields significantly impact the PO value or scope.
 */
export const CRITICAL_EDIT_FIELDS = [
  "quantity",
  "unitPrice",
  "lineTotal",
  "addLine",
  "removeLine",
  "addCharge",
  "removeCharge",
] as const;

/**
 * Fields that constitute non-critical edits (minor version update)
 *
 * Changes to these fields don't significantly impact PO value.
 */
export const NON_CRITICAL_EDIT_FIELDS = [
  "notes",
  "shippingInstructions",
  "promisedDate",
  "projectCode",
  "internalNotes",
] as const;

export type CriticalEditField = (typeof CRITICAL_EDIT_FIELDS)[number];
export type NonCriticalEditField = (typeof NON_CRITICAL_EDIT_FIELDS)[number];
export type EditType = "critical" | "non_critical";

/**
 * Determine if a field is a critical edit
 */
export function isCriticalEdit(field: string): boolean {
  return CRITICAL_EDIT_FIELDS.includes(field as CriticalEditField);
}

// ============================================================================
// CHANGE TRACKING
// ============================================================================

/**
 * Record of a single change made to a revision
 *
 * Captures what changed, old/new values, and who made the change.
 */
export interface RevisionChange {
  id: string;

  /** Field that was changed */
  field: string;

  /** Line number if this is a line-level change */
  lineNumber?: number;

  /** Value before the change */
  previousValue: unknown;

  /** Value after the change */
  newValue: unknown;

  /** Classification of the change */
  editType: EditType;

  /** Who made the change */
  changedBy: string;

  /** When the change was made */
  changedAt: string;

  /** Human-readable description */
  description: string;
}

/**
 * Input for creating a new change record
 */
export interface RevisionChangeInput {
  field: string;
  lineNumber?: number;
  previousValue: unknown;
  newValue: unknown;
  editType: EditType;
  description: string;
}

// ============================================================================
// REVISION TYPES
// ============================================================================

/**
 * Tolerance status for requisition-based authorization
 */
export type ToleranceStatus = "within" | "warning" | "exceeded";

/**
 * PO Revision
 *
 * Represents a version of a Purchase Order with its changes and approval state.
 */
export interface PORevision {
  id: string;

  /** Parent PO number */
  poNumber: string;

  /** Version string (e.g., "1.0", "2.0", "2.1") */
  version: string;

  /** Current workflow status */
  status: RevisionStatus;

  /** Snapshot of line items at this revision */
  lineItems: LineItem[];

  /** Snapshot of charges at this revision */
  charges?: POCharge[];

  /** Snapshot of discounts at this revision */
  discounts?: PODiscount[];

  /** List of changes from previous version */
  changes: RevisionChange[];

  /** Whether this is the currently active (acknowledged) version */
  isActive: boolean;

  /** Whether this revision is still being edited */
  isDraft: boolean;

  /** Approval chain if in approval workflow */
  approvalChain?: ApprovalChain;

  // Submission metadata
  submittedBy?: string;
  submittedAt?: string;
  submissionNotes?: string;

  // Rejection metadata
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionNotes?: string;

  // Approval metadata
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;

  // Sent to vendor metadata
  sentBy?: string;
  sentAt?: string;

  // Acknowledgment metadata
  acknowledgedBy?: string;
  acknowledgedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VERSION UTILITIES
// ============================================================================

/**
 * Parse version string into major and minor components
 *
 * @example
 * parseVersion("2.1") // { major: 2, minor: 1 }
 */
export function parseVersion(version: string): { major: number; minor: number } {
  const [major, minor] = version.split(".").map(Number);
  return { major: major || 1, minor: minor || 0 };
}

/**
 * Get next version number based on edit type
 *
 * @param currentVersion - Current version string
 * @param editType - Type of edit being made
 * @returns Next version string
 *
 * @example
 * getNextVersion("1.0", "critical") // "2.0"
 * getNextVersion("1.0", "non_critical") // "1.1"
 */
export function getNextVersion(
  currentVersion: string,
  editType: EditType
): string {
  const { major, minor } = parseVersion(currentVersion);

  if (editType === "critical") {
    return `${major + 1}.0`;
  } else {
    return `${major}.${minor + 1}`;
  }
}

/**
 * Compare two version strings
 *
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }
  return versionA.minor - versionB.minor;
}
