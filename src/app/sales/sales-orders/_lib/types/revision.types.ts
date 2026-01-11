/**
 * Sales Order Revision Types
 *
 * Types for tracking revisions and changes to Sales Orders.
 * Uses the shared Versioning Engine for revision logic.
 */

import type { EntityId, PrincipalId, ISOTimestamp } from "@/domain/shared";
import type { ApprovalChain, ApprovalCycle } from "@/types/approval-types";
import type { SalesOrder, SalesOrderLine, SalesOrderEditType } from "./sales-order.types";

// =============================================================================
// REVISION STATUS
// =============================================================================

/**
 * Status of a Sales Order revision.
 */
export type SORevisionStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "confirmed"
  | "rejected";

/**
 * Revision status metadata.
 */
export const SO_REVISION_STATUS_META: Record<SORevisionStatus, {
  label: string;
  color: string;
  icon?: string;
}> = {
  draft: {
    label: "Draft",
    color: "muted",
  },
  pending_approval: {
    label: "Pending Approval",
    color: "amber",
  },
  approved: {
    label: "Approved",
    color: "primary",
  },
  sent: {
    label: "Sent",
    color: "blue",
  },
  confirmed: {
    label: "Confirmed",
    color: "green",
  },
  rejected: {
    label: "Rejected",
    color: "destructive",
  },
};

// =============================================================================
// REVISION CHANGE
// =============================================================================

/**
 * A single change within a revision.
 */
export interface SORevisionChange {
  readonly id: EntityId;
  readonly field: string;
  readonly lineNumber?: number;
  readonly previousValue: unknown;
  readonly newValue: unknown;
  readonly editType: SalesOrderEditType;
  readonly changedBy: PrincipalId;
  readonly changedAt: ISOTimestamp;
  readonly description: string;
}

// =============================================================================
// REVISION
// =============================================================================

/**
 * A Sales Order revision (version).
 */
export interface SORevision {
  readonly id: EntityId;
  readonly orderNumber: string;
  readonly version: string;
  readonly status: SORevisionStatus;

  // Snapshot of order data at this revision
  readonly lineItems: readonly SalesOrderLine[];
  readonly notes?: string;
  readonly shippingInstructions?: string;

  // Revision metadata
  readonly createdAt: ISOTimestamp;
  readonly createdBy: PrincipalId;
  readonly submittedAt?: ISOTimestamp;
  readonly submittedBy?: PrincipalId;
  readonly approvedAt?: ISOTimestamp;
  readonly sentAt?: ISOTimestamp;
  readonly sentBy?: PrincipalId;
  readonly confirmedAt?: ISOTimestamp;
  readonly confirmedBy?: string;

  // Changes from previous version
  readonly changes: readonly SORevisionChange[];
  readonly changesSummary: string;
  readonly previousVersion?: string;

  // Submission info
  readonly submissionNotes?: string;

  // Approval workflow
  readonly approvalChain?: ApprovalChain;
  readonly approvalHistory?: readonly ApprovalCycle[];
  readonly rejectionNotes?: string;
  readonly rejectedAt?: ISOTimestamp;
  readonly rejectedBy?: PrincipalId;

  // Flags
  readonly isActive: boolean;
  readonly isDraft: boolean;
}

// =============================================================================
// REVISION STATE
// =============================================================================

/**
 * State container for Sales Order revisions.
 */
export interface SORevisionState {
  readonly activeRevision: SORevision | null;
  readonly pendingDraftRevision: SORevision | null;
  readonly revisionHistory: readonly SORevision[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine if a field change requires approval.
 */
export function isCriticalChange(field: string): boolean {
  const criticalFields = [
    "quantity",
    "unitPrice",
    "discountPercent",
    "lineTotal",
    "addLine",
    "removeLine",
    "shipTo",
    "paymentTerms",
  ];
  return criticalFields.includes(field);
}

/**
 * Get the next version number based on change types.
 */
export function getNextVersion(
  currentVersion: string,
  hasCriticalChanges: boolean
): string {
  const parts = currentVersion.split(".");
  const major = parseInt(parts[0], 10);
  const minor = parts[1] ? parseInt(parts[1], 10) : 0;

  if (hasCriticalChanges) {
    return `${major + 1}.0`;
  }
  return `${major}.${minor + 1}`;
}

/**
 * Format version for display.
 */
export function formatVersion(version: string, status: SORevisionStatus): string {
  const prefix = `v${version}`;
  const meta = SO_REVISION_STATUS_META[status];

  if (status === "confirmed") {
    return prefix; // Active version, no suffix needed
  }

  return `${prefix} (${meta.label})`;
}

/**
 * Check if a revision can be edited.
 */
export function canEditRevision(revision: SORevision): boolean {
  return revision.status === "draft" || revision.status === "rejected";
}

/**
 * Check if a revision can be submitted for approval.
 */
export function canSubmitRevision(revision: SORevision): boolean {
  return revision.status === "draft" && revision.changes.length > 0;
}
