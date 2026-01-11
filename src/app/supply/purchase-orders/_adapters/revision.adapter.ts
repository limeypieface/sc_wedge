/**
 * Revision Data Adapter
 *
 * Provides data access for PO Revision entities.
 * Manages the revision history, draft revisions, and approval workflows.
 *
 * In Sindri production:
 * - Replace with GraphQL queries for fetching revisions
 * - Replace with GraphQL mutations for creating/updating revisions
 *
 * Key Concepts:
 * - Active Revision: Currently acknowledged version (what vendor sees)
 * - Draft Revision: Revision being edited (not yet sent)
 * - Revision History: All previous versions for audit trail
 */

import { RevisionStatus } from "@/types/enums";
import type {
  PORevision,
  RevisionChange,
  RevisionChangeInput,
  Approver,
  ApprovalChain,
  CurrentUser,
} from "../_lib/types";
import { createApprovalChain, getNextVersion } from "../_lib/types";

// Import mock data
import {
  initialRevisions as mockRevisions,
  approvers as mockApprovers,
  simulatedUsers as mockUsers,
} from "@/lib/mock-data";

// ============================================================================
// LOCAL STATE SIMULATION
// ============================================================================

/**
 * In-memory state for revision management
 *
 * In Sindri, this state would live on the server and be
 * accessed through GraphQL queries/mutations.
 */
let revisionState: PORevision[] = [...(mockRevisions as unknown as PORevision[])];
let currentDraftId: string | null = null;

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch all revisions for a PO
 *
 * @param poNumber - The PO number
 * @returns All revisions, sorted by version (newest first)
 */
export async function fetchRevisions(poNumber: string): Promise<PORevision[]> {
  await simulateDelay(100);

  return revisionState
    .filter((r) => r.poNumber === poNumber)
    .sort((a, b) => compareVersions(b.version, a.version));
}

/**
 * Fetch the active (acknowledged) revision
 *
 * The active revision is what the vendor currently sees.
 * There can only be one active revision at a time.
 *
 * @param poNumber - The PO number
 */
export async function fetchActiveRevision(
  poNumber: string
): Promise<PORevision | null> {
  await simulateDelay(50);

  return (
    revisionState.find((r) => r.poNumber === poNumber && r.isActive) ?? null
  );
}

/**
 * Fetch the current draft revision (if any)
 *
 * @param poNumber - The PO number
 */
export async function fetchDraftRevision(
  poNumber: string
): Promise<PORevision | null> {
  await simulateDelay(50);

  return (
    revisionState.find((r) => r.poNumber === poNumber && r.isDraft) ?? null
  );
}

/**
 * Fetch available approvers
 */
export async function fetchApprovers(): Promise<Approver[]> {
  await simulateDelay(50);
  return mockApprovers as unknown as Approver[];
}

/**
 * Fetch available users (for user simulation)
 */
export async function fetchUsers(): Promise<CurrentUser[]> {
  await simulateDelay(50);
  return mockUsers as unknown as CurrentUser[];
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Create a new draft revision
 *
 * Copies the active revision's line items and creates a new draft
 * with an incremented version number.
 *
 * @param poNumber - The PO number
 * @param activeRevision - The currently active revision to copy from
 * @param userId - ID of the user creating the draft
 * @returns The new draft revision
 */
export async function createDraftRevision(
  poNumber: string,
  activeRevision: PORevision,
  userId: string
): Promise<PORevision> {
  await simulateDelay(100);

  // Calculate next version (minor version for now, will be adjusted based on edits)
  const nextVersion = getNextVersion(activeRevision.version, "non_critical");

  const newDraft: PORevision = {
    id: `rev-${Date.now()}`,
    poNumber,
    version: nextVersion,
    status: RevisionStatus.Draft,
    lineItems: [...activeRevision.lineItems], // Copy line items
    charges: activeRevision.charges ? [...activeRevision.charges] : [],
    discounts: activeRevision.discounts ? [...activeRevision.discounts] : [],
    changes: [],
    isActive: false,
    isDraft: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  revisionState.push(newDraft);
  currentDraftId = newDraft.id;

  return newDraft;
}

/**
 * Add a change to the draft revision
 *
 * @param revisionId - ID of the draft revision
 * @param change - The change to record
 * @param userId - ID of the user making the change
 */
export async function addChangeToDraft(
  revisionId: string,
  change: RevisionChangeInput,
  userId: string
): Promise<PORevision> {
  await simulateDelay(50);

  const draft = revisionState.find((r) => r.id === revisionId && r.isDraft);
  if (!draft) {
    throw new Error("Draft revision not found");
  }

  const newChange: RevisionChange = {
    ...change,
    id: `chg-${Date.now()}`,
    changedBy: userId,
    changedAt: new Date().toISOString(),
  };

  draft.changes.push(newChange);
  draft.updatedAt = new Date().toISOString();

  return draft;
}

/**
 * Submit a draft revision for approval
 *
 * Creates an approval chain and moves the revision to PendingApproval status.
 *
 * @param revisionId - ID of the draft revision
 * @param notes - Submission notes
 * @param submittedBy - Name of the submitter
 */
export async function submitForApproval(
  revisionId: string,
  notes: string,
  submittedBy: string
): Promise<PORevision> {
  await simulateDelay(100);

  const draft = revisionState.find((r) => r.id === revisionId && r.isDraft);
  if (!draft) {
    throw new Error("Draft revision not found");
  }

  // Create approval chain
  const approvers = await fetchApprovers();
  const approvalChain = createApprovalChain(revisionId, approvers);

  draft.status = RevisionStatus.PendingApproval;
  draft.isDraft = false;
  draft.submittedBy = submittedBy;
  draft.submittedAt = new Date().toISOString();
  draft.submissionNotes = notes;
  draft.approvalChain = approvalChain;
  draft.updatedAt = new Date().toISOString();

  return draft;
}

/**
 * Approve a revision at the current level
 *
 * @param revisionId - ID of the revision
 * @param notes - Approval notes
 * @param approvedBy - Name of the approver
 */
export async function approveRevision(
  revisionId: string,
  notes: string,
  approvedBy: string
): Promise<PORevision> {
  await simulateDelay(100);

  const revision = revisionState.find(
    (r) => r.id === revisionId && r.status === RevisionStatus.PendingApproval
  );
  if (!revision || !revision.approvalChain) {
    throw new Error("Revision not found or not pending approval");
  }

  const chain = revision.approvalChain;
  const currentStep = chain.steps.find((s) => s.level === chain.currentLevel);

  if (currentStep) {
    currentStep.status = "approved";
    currentStep.action = "approve";
    currentStep.notes = notes;
    currentStep.actionDate = new Date().toISOString();
    currentStep.actionBy = approvedBy;
  }

  // Check if there are more levels
  const nextStep = chain.steps.find((s) => s.level === chain.currentLevel + 1);
  if (nextStep) {
    chain.currentLevel++;
  } else {
    // All approvals complete
    chain.isComplete = true;
    chain.completedAt = new Date().toISOString();
    chain.outcome = "approved";
    revision.status = RevisionStatus.Approved;
    revision.approvedBy = approvedBy;
    revision.approvedAt = new Date().toISOString();
    revision.approvalNotes = notes;
  }

  revision.updatedAt = new Date().toISOString();
  return revision;
}

/**
 * Reject a revision
 *
 * @param revisionId - ID of the revision
 * @param notes - Rejection reason (required)
 * @param rejectedBy - Name of the rejector
 */
export async function rejectRevision(
  revisionId: string,
  notes: string,
  rejectedBy: string
): Promise<PORevision> {
  await simulateDelay(100);

  const revision = revisionState.find(
    (r) => r.id === revisionId && r.status === RevisionStatus.PendingApproval
  );
  if (!revision || !revision.approvalChain) {
    throw new Error("Revision not found or not pending approval");
  }

  const chain = revision.approvalChain;
  const currentStep = chain.steps.find((s) => s.level === chain.currentLevel);

  if (currentStep) {
    currentStep.status = "rejected";
    currentStep.action = "reject";
    currentStep.notes = notes;
    currentStep.actionDate = new Date().toISOString();
    currentStep.actionBy = rejectedBy;
  }

  chain.isComplete = true;
  chain.completedAt = new Date().toISOString();
  chain.outcome = "rejected";

  revision.status = RevisionStatus.Rejected;
  revision.isDraft = true; // Allow editing again
  revision.rejectedBy = rejectedBy;
  revision.rejectedAt = new Date().toISOString();
  revision.rejectionNotes = notes;
  revision.updatedAt = new Date().toISOString();

  return revision;
}

/**
 * Send an approved revision to the vendor
 *
 * @param revisionId - ID of the approved revision
 * @param sentBy - Name of the sender
 */
export async function sendToVendor(
  revisionId: string,
  sentBy: string
): Promise<PORevision> {
  await simulateDelay(100);

  const revision = revisionState.find(
    (r) => r.id === revisionId && r.status === RevisionStatus.Approved
  );
  if (!revision) {
    throw new Error("Revision not found or not approved");
  }

  revision.status = RevisionStatus.Sent;
  revision.sentBy = sentBy;
  revision.sentAt = new Date().toISOString();
  revision.updatedAt = new Date().toISOString();

  return revision;
}

/**
 * Record vendor acknowledgment
 *
 * Makes this revision the new active version.
 *
 * @param revisionId - ID of the sent revision
 * @param acknowledgedBy - Name/identifier of acknowledger
 */
export async function recordAcknowledgment(
  revisionId: string,
  acknowledgedBy: string
): Promise<PORevision> {
  await simulateDelay(100);

  const revision = revisionState.find(
    (r) => r.id === revisionId && r.status === RevisionStatus.Sent
  );
  if (!revision) {
    throw new Error("Revision not found or not sent");
  }

  // Deactivate previous active revision
  const previousActive = revisionState.find(
    (r) => r.poNumber === revision.poNumber && r.isActive
  );
  if (previousActive) {
    previousActive.isActive = false;
  }

  // Activate this revision
  revision.status = RevisionStatus.Acknowledged;
  revision.isActive = true;
  revision.acknowledgedBy = acknowledgedBy;
  revision.acknowledgedAt = new Date().toISOString();
  revision.updatedAt = new Date().toISOString();

  return revision;
}

/**
 * Discard a draft revision
 *
 * @param revisionId - ID of the draft to discard
 */
export async function discardDraft(revisionId: string): Promise<void> {
  await simulateDelay(50);

  const index = revisionState.findIndex(
    (r) => r.id === revisionId && r.isDraft
  );
  if (index === -1) {
    throw new Error("Draft revision not found");
  }

  revisionState.splice(index, 1);
  currentDraftId = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compare two version strings
 */
function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);

  if (aMajor !== bMajor) return aMajor - bMajor;
  return aMinor - bMinor;
}

/**
 * Simulate network delay
 */
async function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reset state (for testing)
 */
export function resetRevisionState(): void {
  revisionState = [...(mockRevisions as unknown as PORevision[])];
  currentDraftId = null;
}
