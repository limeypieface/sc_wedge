import { RevisionStatus } from "./revision-status";
import { ApprovalChain } from "./approval-types";
import type { LineItem } from "@/lib/mock-data";

export type EditType = "critical" | "non_critical";

// Fields that constitute critical edits - require new revision
export const CRITICAL_EDIT_FIELDS = [
  "quantity",
  "unitPrice",
  "lineTotal",
  "addLine",
  "removeLine",
] as const;

// Fields that constitute non-critical edits - can edit current revision
export const NON_CRITICAL_EDIT_FIELDS = [
  "notes",
  "shippingInstructions",
  "promisedDate",
  "projectCode",
  "internalNotes",
  "expectedDeliveryDate",
] as const;

export type CriticalEditField = (typeof CRITICAL_EDIT_FIELDS)[number];
export type NonCriticalEditField = (typeof NON_CRITICAL_EDIT_FIELDS)[number];

export interface RevisionChange {
  id: string;
  field: string;
  lineNumber?: number;
  previousValue: unknown;
  newValue: unknown;
  editType: EditType;
  changedBy: string;
  changedAt: string;
  description: string; // Human-readable description of the change
}

// Audit log entry - tracks all actions and comments for full audit trail
export interface AuditLogEntry {
  id: string;
  action: "submitted" | "approved" | "rejected" | "changes_requested" | "resubmitted" | "sent";
  user: string;
  role?: string;
  date: string;
  notes?: string;
}

export interface PORevision {
  id: string;
  poNumber: string;
  version: string; // "1.0", "2.0", "2.1", "3.0"
  status: RevisionStatus;

  // Snapshot of PO data at this revision
  lineItems: LineItem[];
  notes: string;
  shippingInstructions?: string;

  // Revision metadata
  createdAt: string;
  createdBy: string;
  submittedAt?: string;
  submittedBy?: string;
  submissionNotes?: string;
  approvedAt?: string;
  sentAt?: string;
  sentBy?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;

  // Changes from previous version
  changes: RevisionChange[];
  changesSummary: string;
  previousVersion?: string;

  // Audit log - chronological record of all actions and comments
  auditLog?: AuditLogEntry[];

  // Approval workflow
  approvalChain?: ApprovalChain;
  rejectionNotes?: string;
  rejectedAt?: string;
  rejectedBy?: string;

  // Flags
  isActive: boolean; // Currently active revision (acknowledged by supplier)
  isDraft: boolean; // Currently being edited
}

export interface PORevisionState {
  activeRevision: PORevision | null;
  pendingDraftRevision: PORevision | null;
  revisionHistory: PORevision[];
}

// Helper functions

export function detectEditType(field: string): EditType {
  if (CRITICAL_EDIT_FIELDS.includes(field as CriticalEditField)) {
    return "critical";
  }
  return "non_critical";
}

export function shouldCreateNewRevision(changes: RevisionChange[]): boolean {
  return changes.some((change) => change.editType === "critical");
}

export function getNextVersionNumber(currentVersion: string, type: "major" | "minor" = "minor"): string {
  const parts = currentVersion.split(".");
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1] || "0", 10);

  if (type === "major") {
    // Major version for changes requiring approval (1.0 → 2.0, 1.1 → 2.0)
    return `${major + 1}.0`;
  } else {
    // Minor version for changes not requiring approval (1.0 → 1.1, 1.1 → 1.2)
    return `${major}.${minor + 1}`;
  }
}

export function upgradeToMajorVersion(currentVersion: string): string {
  const parts = currentVersion.split(".");
  const major = parseInt(parts[0], 10);
  // Upgrade to next major version (1.1 → 2.0)
  return `${major + 1}.0`;
}

export function formatVersionLabel(version: string, status: RevisionStatus): string {
  const prefix = `v${version}`;
  switch (status) {
    case RevisionStatus.Draft:
      return `${prefix} (Draft)`;
    case RevisionStatus.PendingApproval:
      return `${prefix} (Pending Approval)`;
    case RevisionStatus.Approved:
      return `${prefix} (Approved)`;
    case RevisionStatus.Sent:
      return `${prefix} (Sent)`;
    case RevisionStatus.Acknowledged:
      return `${prefix}`;
    case RevisionStatus.Rejected:
      return `${prefix} (Rejected)`;
    default:
      return prefix;
  }
}
