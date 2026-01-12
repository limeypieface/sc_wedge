import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  getStatusIcon,
  createStatusStageMapping,
  type StatusStage,
} from "@/lib/ui/status-icons";

// Define the line item status enum
export enum LineItemStatus {
  Draft = "draft",
  Issued = "issued",
  Open = "open",
  PartiallyReceived = "partially received",
  Received = "received",
  Closed = "closed",
  OnHold = "on hold",
  Canceled = "canceled",
}

/**
 * Mapping from LineItemStatus to universal status stages.
 * This ensures consistent icons with other status types.
 */
export const LINE_ITEM_STATUS_STAGES: Record<LineItemStatus, StatusStage> = {
  [LineItemStatus.Draft]: "draft",
  [LineItemStatus.Issued]: "started",
  [LineItemStatus.Open]: "open",
  [LineItemStatus.PartiallyReceived]: "partial",
  [LineItemStatus.Received]: "mostlyComplete",
  [LineItemStatus.Closed]: "complete",
  [LineItemStatus.OnHold]: "onHold",
  [LineItemStatus.Canceled]: "cancelled",
};

/**
 * Helper for getting icons and stage info for line item statuses.
 */
export const LineItemStatusMapping = createStatusStageMapping(LINE_ITEM_STATUS_STAGES);

export const LineItemStatusMeta = createEnumMeta(
  LineItemStatus,
  {
    [LineItemStatus.Draft]:             { label: "Draft",              icon: getStatusIcon("draft") },
    [LineItemStatus.Issued]:            { label: "Issued",             icon: getStatusIcon("started") },
    [LineItemStatus.Open]:              { label: "Open",               icon: getStatusIcon("open") },
    [LineItemStatus.PartiallyReceived]: { label: "Partially Received", icon: getStatusIcon("partial") },
    [LineItemStatus.Received]:          { label: "Received",           icon: getStatusIcon("mostlyComplete") },
    [LineItemStatus.Closed]:            { label: "Closed",             icon: getStatusIcon("complete") },
    [LineItemStatus.OnHold]:            { label: "On Hold",            icon: getStatusIcon("onHold") },
    [LineItemStatus.Canceled]:          { label: "Canceled",           icon: getStatusIcon("cancelled") },
  },
  // Define the display order
  [
    LineItemStatus.Draft,
    LineItemStatus.Issued,
    LineItemStatus.Open,
    LineItemStatus.PartiallyReceived,
    LineItemStatus.Received,
    LineItemStatus.Closed,
    LineItemStatus.OnHold,
    LineItemStatus.Canceled,
  ]
);
