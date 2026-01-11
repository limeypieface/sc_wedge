/**
 * Revision Adapter for Sales Orders
 *
 * Maps Sales Order revisions to the Versioning Engine.
 * Handles change tracking, version numbering, and revision lifecycle.
 */

import type { EntityId, PrincipalId, ISOTimestamp } from "@/domain/shared";
import type {
  SORevision,
  SORevisionChange,
  SORevisionStatus,
  SalesOrderLine,
} from "../_lib/types";
import { isCriticalChange, getNextVersion } from "../_lib/types";

// =============================================================================
// CHANGE DETECTION
// =============================================================================

/**
 * Detect changes between two line item arrays.
 */
export function detectLineChanges(
  previousLines: readonly SalesOrderLine[],
  currentLines: readonly SalesOrderLine[],
  changedBy: PrincipalId,
  changedAt: ISOTimestamp
): SORevisionChange[] {
  const changes: SORevisionChange[] = [];
  const previousMap = new Map(previousLines.map(l => [l.id, l]));
  const currentMap = new Map(currentLines.map(l => [l.id, l]));

  // Check for removed lines
  for (const prev of previousLines) {
    if (!currentMap.has(prev.id)) {
      changes.push({
        id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        field: "removeLine",
        lineNumber: prev.lineNumber,
        previousValue: prev,
        newValue: null,
        editType: "critical",
        changedBy,
        changedAt,
        description: `Removed line ${prev.lineNumber}: ${prev.description}`,
      });
    }
  }

  // Check for added and modified lines
  for (const curr of currentLines) {
    const prev = previousMap.get(curr.id);

    if (!prev) {
      changes.push({
        id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        field: "addLine",
        lineNumber: curr.lineNumber,
        previousValue: null,
        newValue: curr,
        editType: "critical",
        changedBy,
        changedAt,
        description: `Added line ${curr.lineNumber}: ${curr.description}`,
      });
    } else {
      // Check for field changes
      const fieldChanges = detectLineFieldChanges(prev, curr, changedBy, changedAt);
      changes.push(...fieldChanges);
    }
  }

  return changes;
}

/**
 * Detect field-level changes within a line item.
 */
function detectLineFieldChanges(
  prev: SalesOrderLine,
  curr: SalesOrderLine,
  changedBy: PrincipalId,
  changedAt: ISOTimestamp
): SORevisionChange[] {
  const changes: SORevisionChange[] = [];

  const fieldsToCheck: Array<{
    field: keyof SalesOrderLine;
    label: string;
    format?: (v: unknown) => string;
  }> = [
    { field: "quantity", label: "quantity", format: v => String(v) },
    { field: "unitPrice", label: "unit price", format: v => `$${(v as number).toFixed(2)}` },
    { field: "discountPercent", label: "discount", format: v => `${v}%` },
    { field: "requestedDate", label: "requested date" },
    { field: "promisedDate", label: "promised date" },
    { field: "notes", label: "notes" },
  ];

  for (const { field, label, format } of fieldsToCheck) {
    const prevValue = prev[field];
    const currValue = curr[field];

    if (prevValue !== currValue) {
      const formatValue = format ?? (v => String(v ?? "none"));

      changes.push({
        id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        field,
        lineNumber: curr.lineNumber,
        previousValue: prevValue,
        newValue: currValue,
        editType: isCriticalChange(field) ? "critical" : "non_critical",
        changedBy,
        changedAt,
        description: `Line ${curr.lineNumber}: Changed ${label} from ${formatValue(prevValue)} to ${formatValue(currValue)}`,
      });
    }
  }

  return changes;
}

// =============================================================================
// REVISION CREATION
// =============================================================================

/**
 * Create an initial revision for a new Sales Order.
 */
export function createInitialRevision(
  orderNumber: string,
  lineItems: readonly SalesOrderLine[],
  createdBy: PrincipalId
): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;

  return {
    id: `rev-${Date.now()}`,
    orderNumber,
    version: "1.0",
    status: "confirmed",
    lineItems,
    createdAt: now,
    createdBy,
    changes: [],
    changesSummary: "Initial release",
    isActive: true,
    isDraft: false,
  };
}

/**
 * Create a new draft revision from an active revision.
 */
export function createDraftRevision(
  activeRevision: SORevision,
  createdBy: PrincipalId
): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;

  return {
    id: `rev-${Date.now()}`,
    orderNumber: activeRevision.orderNumber,
    version: getNextVersion(activeRevision.version, false), // Preliminary version
    status: "draft",
    lineItems: [...activeRevision.lineItems],
    notes: activeRevision.notes,
    shippingInstructions: activeRevision.shippingInstructions,
    createdAt: now,
    createdBy,
    changes: [],
    changesSummary: "",
    previousVersion: activeRevision.version,
    isActive: false,
    isDraft: true,
  };
}

// =============================================================================
// REVISION UPDATES
// =============================================================================

/**
 * Add a change to a draft revision.
 */
export function addChangeToDraft(
  draft: SORevision,
  change: Omit<SORevisionChange, "id" | "changedAt"> & { changedAt?: ISOTimestamp }
): SORevision {
  const now = (change.changedAt ?? new Date().toISOString()) as ISOTimestamp;

  const newChange: SORevisionChange = {
    ...change,
    id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    changedAt: now,
  };

  const hasCritical = draft.changes.some(c => c.editType === "critical") || newChange.editType === "critical";

  return {
    ...draft,
    changes: [...draft.changes, newChange],
    version: getNextVersion(draft.previousVersion ?? "1.0", hasCritical),
  };
}

/**
 * Update the line items in a draft revision and detect changes.
 */
export function updateDraftLines(
  draft: SORevision,
  previousLines: readonly SalesOrderLine[],
  newLines: readonly SalesOrderLine[],
  changedBy: PrincipalId
): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;
  const detectedChanges = detectLineChanges(previousLines, newLines, changedBy, now);
  const allChanges = [...draft.changes, ...detectedChanges];
  const hasCritical = allChanges.some(c => c.editType === "critical");

  return {
    ...draft,
    lineItems: newLines,
    changes: allChanges,
    version: getNextVersion(draft.previousVersion ?? "1.0", hasCritical),
  };
}

// =============================================================================
// STATUS TRANSITIONS
// =============================================================================

/**
 * Submit a draft for approval.
 */
export function submitForApproval(
  draft: SORevision,
  submittedBy: PrincipalId,
  notes?: string
): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;

  return {
    ...draft,
    status: "pending_approval",
    submittedAt: now,
    submittedBy,
    submissionNotes: notes,
    rejectionNotes: undefined,
    rejectedAt: undefined,
    rejectedBy: undefined,
  };
}

/**
 * Approve a revision.
 */
export function approveRevision(draft: SORevision): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;

  return {
    ...draft,
    status: "approved",
    approvedAt: now,
  };
}

/**
 * Reject a revision with feedback.
 */
export function rejectRevision(
  draft: SORevision,
  rejectedBy: PrincipalId,
  notes: string
): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;

  return {
    ...draft,
    status: "rejected",
    rejectionNotes: notes,
    rejectedAt: now,
    rejectedBy,
  };
}

/**
 * Send a revision to the customer.
 */
export function sendRevision(
  revision: SORevision,
  sentBy: PrincipalId
): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;

  return {
    ...revision,
    status: "sent",
    sentAt: now,
    sentBy,
  };
}

/**
 * Mark a revision as confirmed by the customer.
 */
export function confirmRevision(
  revision: SORevision,
  confirmedBy: string
): SORevision {
  const now = new Date().toISOString() as ISOTimestamp;

  return {
    ...revision,
    status: "confirmed",
    confirmedAt: now,
    confirmedBy,
    isActive: true,
    isDraft: false,
  };
}

// =============================================================================
// CHANGE SUMMARY
// =============================================================================

/**
 * Generate a human-readable summary of changes.
 */
export function generateChangesSummary(changes: readonly SORevisionChange[]): string {
  if (changes.length === 0) {
    return "No changes";
  }

  const criticalCount = changes.filter(c => c.editType === "critical").length;
  const nonCriticalCount = changes.length - criticalCount;

  const parts: string[] = [];

  if (criticalCount > 0) {
    parts.push(`${criticalCount} pricing/quantity change${criticalCount > 1 ? "s" : ""}`);
  }

  if (nonCriticalCount > 0) {
    parts.push(`${nonCriticalCount} minor update${nonCriticalCount > 1 ? "s" : ""}`);
  }

  return parts.join(", ");
}
