import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  getStatusIcon,
  createStatusStageMapping,
  type StatusStage,
} from "@/lib/ui/status-icons";

// Define the enum for SO header status
export enum SalesOrderStatus {
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  PartiallyShipped = "PARTIALLY_SHIPPED",
  Shipped = "SHIPPED",
  PartiallyInvoiced = "PARTIALLY_INVOICED",
  Invoiced = "INVOICED",
  Closed = "CLOSED",
}

/**
 * Mapping from SalesOrderStatus to universal status stages.
 * This ensures consistent icons with other status types.
 */
export const SALES_ORDER_STATUS_STAGES: Record<SalesOrderStatus, StatusStage> = {
  [SalesOrderStatus.Pending]: "draft",
  [SalesOrderStatus.Confirmed]: "started",
  [SalesOrderStatus.PartiallyShipped]: "partial",
  [SalesOrderStatus.Shipped]: "mostlyComplete",
  [SalesOrderStatus.PartiallyInvoiced]: "mostlyComplete",
  [SalesOrderStatus.Invoiced]: "complete",
  [SalesOrderStatus.Closed]: "complete",
};

/**
 * Helper for getting icons and stage info for sales order statuses.
 */
export const SalesOrderStatusMapping = createStatusStageMapping(SALES_ORDER_STATUS_STAGES);

export const SalesOrderStatusMeta = createEnumMeta(
  SalesOrderStatus,
  {
    [SalesOrderStatus.Pending]:           { label: "Pending",            icon: getStatusIcon("draft") },
    [SalesOrderStatus.Confirmed]:         { label: "Confirmed",          icon: getStatusIcon("started") },
    [SalesOrderStatus.PartiallyShipped]:  { label: "Partially Shipped",  icon: getStatusIcon("partial") },
    [SalesOrderStatus.Shipped]:           { label: "Shipped",            icon: getStatusIcon("mostlyComplete") },
    [SalesOrderStatus.PartiallyInvoiced]: { label: "Partially Invoiced", icon: getStatusIcon("mostlyComplete") },
    [SalesOrderStatus.Invoiced]:          { label: "Invoiced",           icon: getStatusIcon("complete") },
    [SalesOrderStatus.Closed]:            { label: "Closed",             icon: getStatusIcon("complete") },
  },
  // Define the display order
  [
    SalesOrderStatus.Pending,
    SalesOrderStatus.Confirmed,
    SalesOrderStatus.PartiallyShipped,
    SalesOrderStatus.Shipped,
    SalesOrderStatus.PartiallyInvoiced,
    SalesOrderStatus.Invoiced,
    SalesOrderStatus.Closed,
  ]
);
