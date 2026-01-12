import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  getStatusIcon,
  createStatusStageMapping,
  type StatusStage,
} from "@/lib/ui/status-icons";

/**
 * Sales Order Line Status
 *
 * Tracks the fulfillment status of individual SO lines.
 * Different from PO line statuses which track receiving.
 */
export enum SOLineStatus {
  Open = "open",
  Allocated = "allocated",
  Partial = "partial",
  Shipped = "shipped",
  Backordered = "backordered",
  Cancelled = "cancelled",
}

/**
 * Mapping from SOLineStatus to universal status stages.
 * This ensures consistent icons with other status types.
 */
export const SO_LINE_STATUS_STAGES: Record<SOLineStatus, StatusStage> = {
  [SOLineStatus.Open]: "open",
  [SOLineStatus.Allocated]: "started",
  [SOLineStatus.Partial]: "partial",
  [SOLineStatus.Shipped]: "complete",
  [SOLineStatus.Backordered]: "backordered",
  [SOLineStatus.Cancelled]: "cancelled",
};

/**
 * Helper for getting icons and stage info for SO line statuses.
 */
export const SOLineStatusMapping = createStatusStageMapping(SO_LINE_STATUS_STAGES);

export const SOLineStatusMeta = createEnumMeta(
  SOLineStatus,
  {
    [SOLineStatus.Open]: {
      label: "Open",
      icon: getStatusIcon("open"),
    },
    [SOLineStatus.Allocated]: {
      label: "Allocated",
      icon: getStatusIcon("started"),
    },
    [SOLineStatus.Partial]: {
      label: "Partial",
      icon: getStatusIcon("partial"),
    },
    [SOLineStatus.Shipped]: {
      label: "Shipped",
      icon: getStatusIcon("complete"),
    },
    [SOLineStatus.Backordered]: {
      label: "Backordered",
      icon: getStatusIcon("backordered"),
    },
    [SOLineStatus.Cancelled]: {
      label: "Cancelled",
      icon: getStatusIcon("cancelled"),
    },
  },
  // Display order
  [
    SOLineStatus.Open,
    SOLineStatus.Allocated,
    SOLineStatus.Partial,
    SOLineStatus.Shipped,
    SOLineStatus.Backordered,
    SOLineStatus.Cancelled,
  ]
);
