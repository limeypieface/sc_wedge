/**
 * Mock Revision Data - Self-contained within sindri-prototype
 *
 * Provides mock revision, approver, and user data for the prototype.
 */

import { RevisionStatus } from "@/types/enums";
import type {
  PORevision,
  Approver,
  CurrentUser,
  LineItem,
} from "../types";
import { lineItems, poCharges, poDiscounts } from "./index";

// ============================================================================
// APPROVERS
// ============================================================================

export const approvers: Approver[] = [
  {
    id: "approver-1",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "Purchasing Manager",
    level: 1,
  },
  {
    id: "approver-2",
    name: "Jennifer Martinez",
    email: "jennifer.martinez@company.com",
    role: "Finance Director",
    level: 2,
  },
  {
    id: "approver-3",
    name: "Robert Johnson",
    email: "robert.johnson@company.com",
    role: "VP Operations",
    level: 3,
  },
];

// ============================================================================
// SIMULATED USERS
// ============================================================================

export const simulatedUsers: CurrentUser[] = [
  {
    id: "user-1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "buyer",
    isApprover: false,
  },
  {
    id: "user-2",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "approver",
    isApprover: true,
    approvalLevel: 1,
  },
  {
    id: "user-3",
    name: "Jennifer Martinez",
    email: "jennifer.martinez@company.com",
    role: "approver",
    isApprover: true,
    approvalLevel: 2,
  },
];

// ============================================================================
// INITIAL REVISIONS
// ============================================================================

/**
 * Initial revision data representing the current state of PO-0861
 */
export const initialRevisions: PORevision[] = [
  {
    id: "rev-001",
    poNumber: "PO-0861",
    version: "1.0",
    status: RevisionStatus.Acknowledged,
    lineItems: lineItems.map((line): LineItem => ({
      id: line.id,
      sku: line.sku,
      name: line.name,
      quantity: line.quantity,
      quantityReceived: line.quantityReceived,
      quantityInQualityHold: line.quantityInQualityHold,
      uom: line.uom,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      status: line.status,
      promisedDate: line.promisedDate,
      projectCode: line.projectCode,
      need: line.need,
      compliance: line.compliance,
    })),
    charges: poCharges.map(c => ({ ...c })),
    discounts: poDiscounts.map(d => ({ ...d })),
    changes: [],
    isActive: true,
    isDraft: false,
    createdAt: "2026-01-03T10:00:00Z",
    updatedAt: "2026-01-06T14:30:00Z",
    submittedBy: "Sarah Johnson",
    submittedAt: "2026-01-03T14:00:00Z",
    submissionNotes: "Initial PO submission",
    approvedBy: "Michael Chen",
    approvedAt: "2026-01-04T09:15:00Z",
    approvalNotes: "Approved per standard procurement policy",
    sentBy: "Sarah Johnson",
    sentAt: "2026-01-05T08:00:00Z",
    acknowledgedBy: "Vendor",
    acknowledgedAt: "2026-01-06T14:30:00Z",
    approvalChain: {
      id: "chain-rev-001",
      revisionId: "rev-001",
      steps: [
        {
          id: "step-approver-1",
          level: 1,
          approver: approvers[0],
          status: "approved",
          action: "approve",
          notes: "Approved per standard procurement policy",
          actionDate: "2026-01-04T09:15:00Z",
          actionBy: "Michael Chen",
        },
      ],
      currentLevel: 1,
      isComplete: true,
      startedAt: "2026-01-03T14:00:00Z",
      completedAt: "2026-01-04T09:15:00Z",
      outcome: "approved",
    },
  },
];
