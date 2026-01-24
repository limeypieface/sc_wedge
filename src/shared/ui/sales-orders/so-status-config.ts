/**
 * SO Status Configuration
 *
 * Maps Sales Order status enums to StatusPill configuration.
 * This file bridges the domain status enums to the generic UI component.
 *
 * Uses universal status icons from @/shared/ui/icons/status-icons for consistency
 * across PO, SO, and line item status displays.
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
  AlertTriangle,
  Ban,
} from "lucide-react";
import type { StatusPillConfig } from "@/shared/ui/status-pill";
import { SORevisionStatus } from "@/types/enums/so-revision-status";
import { SalesOrderStatus } from "@/types/sales-order-status";
import { SOLineStatus } from "@/types/so-line-status";
import { getStatusIcon } from "@/shared/ui/icons/status-icons";

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
 * Uses universal status icons for consistency.
 */
export const SALES_ORDER_STATUS_CONFIG: StatusPillConfig<SalesOrderStatus> = {
  [SalesOrderStatus.Pending]: {
    label: "Pending",
    color: "amber",
    icon: getStatusIcon("draft"),
    description: "Order is awaiting confirmation",
  },
  [SalesOrderStatus.Confirmed]: {
    label: "Confirmed",
    color: "green",
    icon: getStatusIcon("started"),
    description: "Order confirmed by customer",
  },
  [SalesOrderStatus.PartiallyShipped]: {
    label: "Partially Shipped",
    color: "blue",
    icon: getStatusIcon("partial"),
    description: "Order is being fulfilled",
  },
  [SalesOrderStatus.Shipped]: {
    label: "Shipped",
    color: "blue",
    icon: getStatusIcon("mostlyComplete"),
    description: "Order has been shipped",
  },
  [SalesOrderStatus.PartiallyInvoiced]: {
    label: "Partially Invoiced",
    color: "blue",
    icon: getStatusIcon("mostlyComplete"),
    description: "Order partially invoiced",
  },
  [SalesOrderStatus.Invoiced]: {
    label: "Invoiced",
    color: "green",
    icon: getStatusIcon("complete"),
    description: "Order invoiced",
  },
  [SalesOrderStatus.Closed]: {
    label: "Closed",
    color: "gray",
    icon: getStatusIcon("complete"),
    description: "Order closed",
  },
};

// =============================================================================
// SO LINE ITEM STATUS CONFIG
// =============================================================================

/**
 * Configuration for SO line item statuses.
 * Uses universal status icons for consistency.
 */
export const SO_LINE_STATUS_CONFIG: StatusPillConfig<SOLineStatus> = {
  open: {
    label: "Open",
    color: "gray",
    icon: getStatusIcon("open"),
    description: "Line is open for fulfillment",
  },
  allocated: {
    label: "Allocated",
    color: "blue",
    icon: getStatusIcon("started"),
    description: "Inventory allocated to this line",
  },
  partial: {
    label: "Partial",
    color: "amber",
    icon: getStatusIcon("partial"),
    description: "Partially shipped",
  },
  shipped: {
    label: "Shipped",
    color: "green",
    icon: getStatusIcon("complete"),
    description: "Line has been shipped",
  },
  backordered: {
    label: "Backordered",
    color: "red",
    icon: getStatusIcon("backordered"),
    description: "Item is backordered",
  },
  cancelled: {
    label: "Cancelled",
    color: "gray",
    icon: getStatusIcon("cancelled"),
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
