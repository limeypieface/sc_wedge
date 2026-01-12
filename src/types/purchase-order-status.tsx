import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  getStatusIcon,
  createStatusStageMapping,
  type StatusStage,
} from "@/lib/ui/status-icons";

// Define the enum locally since we don't have GraphQL codegen
export enum PurchaseOrderStatus {
  Draft = "DRAFT",
  Planned = "PLANNED",
  Submitted = "SUBMITTED",
  Approved = "APPROVED",
  Received = "RECEIVED",
  Fulfilled = "FULFILLED",
  Cancelled = "CANCELLED",
}

/**
 * Mapping from PurchaseOrderStatus to universal status stages.
 * This ensures consistent icons with other status types.
 */
export const PURCHASE_ORDER_STATUS_STAGES: Record<PurchaseOrderStatus, StatusStage> = {
  [PurchaseOrderStatus.Draft]: "draft",
  [PurchaseOrderStatus.Planned]: "planned",
  [PurchaseOrderStatus.Submitted]: "open",
  [PurchaseOrderStatus.Approved]: "started",
  [PurchaseOrderStatus.Received]: "mostlyComplete",
  [PurchaseOrderStatus.Fulfilled]: "complete",
  [PurchaseOrderStatus.Cancelled]: "cancelled",
};

/**
 * Helper for getting icons and stage info for purchase order statuses.
 */
export const PurchaseOrderStatusMapping = createStatusStageMapping(PURCHASE_ORDER_STATUS_STAGES);

export const PurchaseOrderStatusMeta = createEnumMeta(
  PurchaseOrderStatus,
  {
    [PurchaseOrderStatus.Draft]:     { label: "Draft",     icon: getStatusIcon("draft") },
    [PurchaseOrderStatus.Planned]:   { label: "Planned",   icon: getStatusIcon("planned") },
    [PurchaseOrderStatus.Submitted]: { label: "Submitted", icon: getStatusIcon("open") },
    [PurchaseOrderStatus.Approved]:  { label: "Approved",  icon: getStatusIcon("started") },
    [PurchaseOrderStatus.Received]:  { label: "Received",  icon: getStatusIcon("mostlyComplete") },
    [PurchaseOrderStatus.Fulfilled]: { label: "Fulfilled", icon: getStatusIcon("complete") },
    [PurchaseOrderStatus.Cancelled]: { label: "Cancelled", icon: getStatusIcon("cancelled") },
  },
  // Define the display order
  [
    PurchaseOrderStatus.Draft,
    PurchaseOrderStatus.Planned,
    PurchaseOrderStatus.Submitted,
    PurchaseOrderStatus.Approved,
    PurchaseOrderStatus.Received,
    PurchaseOrderStatus.Fulfilled,
    PurchaseOrderStatus.Cancelled,
  ]
);
