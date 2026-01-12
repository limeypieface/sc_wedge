/**
 * SO Status Configuration
 *
 * Maps Sales Order status enums to StatusPill configuration.
 * This file bridges the domain status enums to the generic UI component.
 *
 * Usage:
 *   import { SO_REVISION_STATUS_CONFIG } from "@/components/so/so-status-config";
 *   <StatusPill status={revision.status} config={SO_REVISION_STATUS_CONFIG} />
 */

import {
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileCheck,
  FileText,
  Package,
  Truck,
  AlertTriangle,
  Ban,
  ShoppingCart,
  PauseCircle,
} from "lucide-react";
import type { StatusPillConfig } from "@/components/ui/status-pill";
import { SORevisionStatus } from "@/types/enums/so-revision-status";
import type { SalesOrderStatus, SalesOrderLineStatus } from "@/app/sales/sales-orders/_lib/types";

// =============================================================================
// SO REVISION STATUS CONFIG
// =============================================================================

/**
 * Configuration for SO revision statuses.
 * Used in so-status-panel and anywhere revision status is displayed.
 */
export const SO_REVISION_STATUS_CONFIG: StatusPillConfig<SORevisionStatus> = {
  [SORevisionStatus.Draft]: {
    label: "Draft",
    color: "gray",
    icon: FileText,
    description: "Revision is being prepared",
  },
  [SORevisionStatus.PendingApproval]: {
    label: "Pending Approval",
    color: "amber",
    icon: Clock,
    description: "Awaiting approval from designated approvers",
  },
  [SORevisionStatus.Approved]: {
    label: "Approved",
    color: "blue",
    icon: CheckCircle,
    description: "Revision has been approved, ready to send",
  },
  [SORevisionStatus.Sent]: {
    label: "Sent",
    color: "blue",
    icon: Send,
    description: "Revision has been sent to customer",
  },
  [SORevisionStatus.Confirmed]: {
    label: "Confirmed",
    color: "green",
    icon: FileCheck,
    description: "Customer has confirmed this revision",
  },
  [SORevisionStatus.Rejected]: {
    label: "Rejected",
    color: "red",
    icon: XCircle,
    description: "Revision was rejected - needs modification",
  },
};

// =============================================================================
// SALES ORDER STATUS CONFIG
// =============================================================================

/**
 * Configuration for overall Sales Order statuses.
 * Used in SO list views and header displays.
 */
export const SALES_ORDER_STATUS_CONFIG: StatusPillConfig<SalesOrderStatus> = {
  draft: {
    label: "Draft",
    color: "gray",
    icon: FileText,
    description: "Order is being prepared",
  },
  pending_approval: {
    label: "Pending Approval",
    color: "amber",
    icon: Clock,
    description: "Awaiting internal approval",
  },
  approved: {
    label: "Approved",
    color: "green",
    icon: CheckCircle,
    description: "Approved, ready to send",
  },
  sent: {
    label: "Sent",
    color: "blue",
    icon: Send,
    description: "Sent to customer",
  },
  confirmed: {
    label: "Confirmed",
    color: "green",
    icon: FileCheck,
    description: "Confirmed by customer",
  },
  processing: {
    label: "Processing",
    color: "blue",
    icon: Package,
    description: "Order is being fulfilled",
  },
  shipped: {
    label: "Shipped",
    color: "blue",
    icon: Truck,
    description: "Order has been shipped",
  },
  delivered: {
    label: "Delivered",
    color: "green",
    icon: CheckCircle,
    description: "Order delivered to customer",
  },
  completed: {
    label: "Completed",
    color: "green",
    icon: FileCheck,
    description: "Order complete and invoiced",
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
    icon: Ban,
    description: "Order has been cancelled",
  },
  on_hold: {
    label: "On Hold",
    color: "amber",
    icon: PauseCircle,
    description: "Order is on hold",
  },
};

// =============================================================================
// SO LINE ITEM STATUS CONFIG
// =============================================================================

/**
 * Configuration for SO line item statuses.
 * Used in line item displays and fulfillment workflows.
 */
export const SO_LINE_STATUS_CONFIG: StatusPillConfig<SalesOrderLineStatus> = {
  open: {
    label: "Open",
    color: "gray",
    icon: ShoppingCart,
    description: "Line is open for fulfillment",
  },
  allocated: {
    label: "Allocated",
    color: "blue",
    icon: Package,
    description: "Inventory allocated to this line",
  },
  partial: {
    label: "Partial",
    color: "amber",
    icon: Package,
    description: "Partially shipped",
  },
  shipped: {
    label: "Shipped",
    color: "green",
    icon: Truck,
    description: "Line has been shipped",
  },
  backordered: {
    label: "Backordered",
    color: "red",
    icon: AlertTriangle,
    description: "Item is backordered",
  },
  cancelled: {
    label: "Cancelled",
    color: "gray",
    icon: Ban,
    description: "Line item cancelled",
  },
};

// =============================================================================
// UTILITY: GET BORDER CLASS FOR PANELS
// =============================================================================

/**
 * Maps SO revision status to border class for status panels.
 * Preserves the existing visual design of so-status-panel.
 */
export function getSORevisionStatusBorderClass(status: SORevisionStatus): string {
  const borderMap: Record<SORevisionStatus, string> = {
    [SORevisionStatus.Draft]: "border-l-muted-foreground",
    [SORevisionStatus.PendingApproval]: "border-l-amber-500",
    [SORevisionStatus.Approved]: "border-l-blue-500",
    [SORevisionStatus.Sent]: "border-l-blue-500",
    [SORevisionStatus.Confirmed]: "border-l-green-500",
    [SORevisionStatus.Rejected]: "border-l-red-500",
  };
  return borderMap[status];
}
