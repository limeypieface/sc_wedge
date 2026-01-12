import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  getStatusIcon,
  createStatusStageMapping,
  type StatusStage,
} from "@/lib/ui/status-icons";

// Define the SO line item status enum (outbound/shipping focused)
export enum SOLineItemStatus {
  Draft = "draft",
  Confirmed = "confirmed",
  Open = "open",
  PartiallyShipped = "partially shipped",
  Shipped = "shipped",
  Delivered = "delivered",
  Closed = "closed",
  OnHold = "on hold",
  Canceled = "canceled",
}

/**
 * Mapping from SOLineItemStatus to universal status stages.
 * This ensures consistent icons with other status types.
 */
export const SO_LINE_ITEM_STATUS_STAGES: Record<SOLineItemStatus, StatusStage> = {
  [SOLineItemStatus.Draft]: "draft",
  [SOLineItemStatus.Confirmed]: "started",
  [SOLineItemStatus.Open]: "open",
  [SOLineItemStatus.PartiallyShipped]: "partial",
  [SOLineItemStatus.Shipped]: "mostlyComplete",
  [SOLineItemStatus.Delivered]: "nearComplete",
  [SOLineItemStatus.Closed]: "complete",
  [SOLineItemStatus.OnHold]: "onHold",
  [SOLineItemStatus.Canceled]: "cancelled",
};

/**
 * Helper for getting icons and stage info for SO line item statuses.
 */
export const SOLineItemStatusMapping = createStatusStageMapping(SO_LINE_ITEM_STATUS_STAGES);

export const SOLineItemStatusMeta = createEnumMeta(
  SOLineItemStatus,
  {
    [SOLineItemStatus.Draft]:            { label: "Draft",             icon: getStatusIcon("draft") },
    [SOLineItemStatus.Confirmed]:        { label: "Confirmed",         icon: getStatusIcon("started") },
    [SOLineItemStatus.Open]:             { label: "Open",              icon: getStatusIcon("open") },
    [SOLineItemStatus.PartiallyShipped]: { label: "Partially Shipped", icon: getStatusIcon("partial") },
    [SOLineItemStatus.Shipped]:          { label: "Shipped",           icon: getStatusIcon("mostlyComplete") },
    [SOLineItemStatus.Delivered]:        { label: "Delivered",         icon: getStatusIcon("nearComplete") },
    [SOLineItemStatus.Closed]:           { label: "Closed",            icon: getStatusIcon("complete") },
    [SOLineItemStatus.OnHold]:           { label: "On Hold",           icon: getStatusIcon("onHold") },
    [SOLineItemStatus.Canceled]:         { label: "Canceled",          icon: getStatusIcon("cancelled") },
  },
  // Define the display order
  [
    SOLineItemStatus.Draft,
    SOLineItemStatus.Confirmed,
    SOLineItemStatus.Open,
    SOLineItemStatus.PartiallyShipped,
    SOLineItemStatus.Shipped,
    SOLineItemStatus.Delivered,
    SOLineItemStatus.Closed,
    SOLineItemStatus.OnHold,
    SOLineItemStatus.Canceled,
  ]
);

// Map PO statuses to SO statuses for data compatibility
export function mapPOStatusToSOStatus(poStatus: string): SOLineItemStatus {
  const statusMap: Record<string, SOLineItemStatus> = {
    "draft": SOLineItemStatus.Draft,
    "issued": SOLineItemStatus.Confirmed,
    "open": SOLineItemStatus.Open,
    "partially received": SOLineItemStatus.PartiallyShipped,
    "received": SOLineItemStatus.Shipped,
    "closed": SOLineItemStatus.Closed,
    "on hold": SOLineItemStatus.OnHold,
    "canceled": SOLineItemStatus.Canceled,
  };
  return statusMap[poStatus.toLowerCase()] || SOLineItemStatus.Open;
}
