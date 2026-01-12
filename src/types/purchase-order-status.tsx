import React from "react";
import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  CircleDashed,
  CircleDotDashed,
  Circle,
  CircleX
} from "lucide-react";
import { StatusIcon } from "@/components/icons/status-icon";

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

export const PurchaseOrderStatusMeta = createEnumMeta(
  PurchaseOrderStatus,
  {
    [PurchaseOrderStatus.Draft]:     { label: "Draft",     icon: React.createElement(CircleDashed, { className: "h-4 w-4" }) },
    [PurchaseOrderStatus.Planned]:   { label: "Planned",   icon: React.createElement(CircleDotDashed, { className: "h-4 w-4" }) },
    [PurchaseOrderStatus.Submitted]: { label: "Submitted", icon: React.createElement(Circle, { className: "h-4 w-4" }) },
    [PurchaseOrderStatus.Approved]:  { label: "Approved",  icon: React.createElement(StatusIcon, { percent: 25, className: "h-4 w-4" }) },
    [PurchaseOrderStatus.Received]:  { label: "Received",  icon: React.createElement(StatusIcon, { percent: 75, className: "h-4 w-4" }) },
    [PurchaseOrderStatus.Fulfilled]: { label: "Fulfilled", icon: React.createElement(StatusIcon, { percent: 100, className: "h-4 w-4" }) },
    [PurchaseOrderStatus.Cancelled]: { label: "Cancelled", icon: React.createElement(CircleX, { className: "h-4 w-4" }) },
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
