/**
 * PO Status Configuration
 *
 * Maps Purchase Order status enums to StatusPill configuration.
 * This file bridges the domain status enums to the generic UI component.
 *
 * Usage:
 *   import { PO_REVISION_STATUS_CONFIG } from "@/components/po/po-status-config";
 *   <StatusPill status={revision.status} config={PO_REVISION_STATUS_CONFIG} />
 */

import {
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileCheck,
  FileText,
  Package,
  AlertTriangle,
  Ban,
  type LucideIcon,
} from "lucide-react";
import type { StatusPillConfig, StatusPillColor } from "@/components/ui/status-pill";
import { RevisionStatus, LineItemStatus, PurchaseOrderStatus } from "@/types/enums";

// =============================================================================
// PO REVISION STATUS CONFIG
// =============================================================================

/**
 * Configuration for PO revision statuses.
 * Used in revision-status-panel and anywhere revision status is displayed.
 */
export const PO_REVISION_STATUS_CONFIG: StatusPillConfig<RevisionStatus> = {
  [RevisionStatus.Draft]: {
    label: "Draft",
    color: "gray",
    icon: FileText,
    description: "Revision is being prepared",
  },
  [RevisionStatus.PendingApproval]: {
    label: "Pending Approval",
    color: "amber",
    icon: Clock,
    description: "Awaiting approval from designated approvers",
  },
  [RevisionStatus.Approved]: {
    label: "Approved",
    color: "blue",
    icon: CheckCircle,
    description: "Revision has been approved, ready to send",
  },
  [RevisionStatus.Sent]: {
    label: "Sent",
    color: "blue",
    icon: Send,
    description: "Revision has been sent to vendor",
  },
  [RevisionStatus.Acknowledged]: {
    label: "Active",
    color: "green",
    icon: FileCheck,
    description: "Vendor has acknowledged this revision",
  },
  [RevisionStatus.Rejected]: {
    label: "Rejected",
    color: "red",
    icon: XCircle,
    description: "Revision was rejected - needs modification",
  },
};

// =============================================================================
// PO LINE ITEM STATUS CONFIG
// =============================================================================

/**
 * Configuration for PO line item statuses.
 * Used in line item displays and receiving workflows.
 */
export const PO_LINE_STATUS_CONFIG: StatusPillConfig<LineItemStatus> = {
  [LineItemStatus.Pending]: {
    label: "Pending",
    color: "gray",
    icon: Clock,
    description: "Awaiting receipt",
  },
  [LineItemStatus.PartiallyReceived]: {
    label: "Partial",
    color: "blue",
    icon: Package,
    description: "Some quantity received",
  },
  [LineItemStatus.Received]: {
    label: "Received",
    color: "green",
    icon: CheckCircle,
    description: "All quantity received",
  },
  [LineItemStatus.QualityHold]: {
    label: "Quality Hold",
    color: "amber",
    icon: AlertTriangle,
    description: "Awaiting quality inspection",
  },
  [LineItemStatus.Cancelled]: {
    label: "Cancelled",
    color: "gray",
    icon: Ban,
    description: "Line item cancelled",
  },
  [LineItemStatus.Backordered]: {
    label: "Backordered",
    color: "red",
    icon: AlertTriangle,
    description: "Item is backordered",
  },
  [LineItemStatus.QualityIssue]: {
    label: "Quality Issue",
    color: "red",
    icon: XCircle,
    description: "NCR or quality problem detected",
  },
};

// =============================================================================
// PURCHASE ORDER STATUS CONFIG
// =============================================================================

/**
 * Configuration for overall Purchase Order statuses.
 * Used in PO list views and header displays.
 */
export const PURCHASE_ORDER_STATUS_CONFIG: StatusPillConfig<PurchaseOrderStatus> = {
  [PurchaseOrderStatus.Draft]: {
    label: "Draft",
    color: "gray",
    icon: FileText,
    description: "Purchase order is being prepared",
  },
  [PurchaseOrderStatus.Planned]: {
    label: "Planned",
    color: "blue",
    icon: Clock,
    description: "Purchase order is scheduled for future release",
  },
  [PurchaseOrderStatus.Submitted]: {
    label: "Submitted",
    color: "blue",
    icon: Send,
    description: "Purchase order has been sent to vendor",
  },
  [PurchaseOrderStatus.Approved]: {
    label: "Approved",
    color: "green",
    icon: CheckCircle,
    description: "Purchase order has been approved and acknowledged",
  },
  [PurchaseOrderStatus.Received]: {
    label: "Received",
    color: "blue",
    icon: Package,
    description: "Some items have been received",
  },
  [PurchaseOrderStatus.Fulfilled]: {
    label: "Fulfilled",
    color: "green",
    icon: FileCheck,
    description: "All items received and order is complete",
  },
  [PurchaseOrderStatus.Cancelled]: {
    label: "Cancelled",
    color: "red",
    icon: Ban,
    description: "Purchase order has been cancelled",
  },
};

// =============================================================================
// APPROVAL STATUS CONFIG
// =============================================================================

/**
 * Approval status type for the approval workflow.
 */
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

/**
 * Configuration for approval statuses.
 * Used in approval workflows and approval chain displays.
 */
export const APPROVAL_STATUS_CONFIG: StatusPillConfig<ApprovalStatus> = {
  pending: {
    label: "Pending",
    color: "amber",
    icon: Clock,
    description: "Awaiting approval decision",
  },
  approved: {
    label: "Approved",
    color: "green",
    icon: CheckCircle,
    description: "Approval granted",
  },
  rejected: {
    label: "Rejected",
    color: "red",
    icon: XCircle,
    description: "Approval denied",
  },
  expired: {
    label: "Expired",
    color: "gray",
    description: "Approval request has expired",
  },
  cancelled: {
    label: "Cancelled",
    color: "gray",
    icon: Ban,
    description: "Approval request was cancelled",
  },
};

// =============================================================================
// STAGE STATUS CONFIG
// =============================================================================

/**
 * Stage status type for multi-stage approval chains.
 */
export type StageStatus = "pending" | "active" | "approved" | "rejected" | "skipped";

/**
 * Configuration for approval stage statuses.
 * Used in approval chain displays.
 */
export const STAGE_STATUS_CONFIG: StatusPillConfig<StageStatus> = {
  pending: {
    label: "Pending",
    color: "gray",
    description: "Stage not yet reached",
  },
  active: {
    label: "Awaiting Approval",
    color: "blue",
    icon: Clock,
    description: "Currently awaiting approval at this stage",
  },
  approved: {
    label: "Approved",
    color: "green",
    icon: CheckCircle,
    description: "Stage approved",
  },
  rejected: {
    label: "Rejected",
    color: "red",
    icon: XCircle,
    description: "Stage rejected",
  },
  skipped: {
    label: "Skipped",
    color: "gray",
    description: "Stage was skipped",
  },
};

// =============================================================================
// UTILITY: GET BORDER CLASS FOR PANELS
// =============================================================================

/**
 * Maps revision status to border class for status panels.
 * Preserves the existing visual design of revision-status-panel.
 */
export function getRevisionStatusBorderClass(status: RevisionStatus): string {
  const borderMap: Record<RevisionStatus, string> = {
    [RevisionStatus.Draft]: "border-l-muted-foreground",
    [RevisionStatus.PendingApproval]: "border-l-amber-500",
    [RevisionStatus.Approved]: "border-l-blue-500",
    [RevisionStatus.Sent]: "border-l-blue-500",
    [RevisionStatus.Acknowledged]: "border-l-green-500",
    [RevisionStatus.Rejected]: "border-l-red-500",
  };
  return borderMap[status];
}
