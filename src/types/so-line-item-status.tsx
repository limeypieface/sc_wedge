import React from "react";
import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  CircleDashed,
  Circle,
  CircleX,
  CirclePause,
} from "lucide-react";
import { StatusIcon } from "@/components/icons/status-icon";

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

export const SOLineItemStatusMeta = createEnumMeta(
  SOLineItemStatus,
  {
    [SOLineItemStatus.Draft]:            { label: "Draft",             icon: React.createElement(CircleDashed, { className: "h-4 w-4" }) },
    [SOLineItemStatus.Confirmed]:        { label: "Confirmed",         icon: React.createElement(StatusIcon, { percent: 10, className: "h-4 w-4" }) },
    [SOLineItemStatus.Open]:             { label: "Open",              icon: React.createElement(Circle, { className: "h-4 w-4" }) },
    [SOLineItemStatus.PartiallyShipped]: { label: "Partially Shipped", icon: React.createElement(StatusIcon, { percent: 50, className: "h-4 w-4" }) },
    [SOLineItemStatus.Shipped]:          { label: "Shipped",           icon: React.createElement(StatusIcon, { percent: 75, className: "h-4 w-4" }) },
    [SOLineItemStatus.Delivered]:        { label: "Delivered",         icon: React.createElement(StatusIcon, { percent: 90, className: "h-4 w-4" }) },
    [SOLineItemStatus.Closed]:           { label: "Closed",            icon: React.createElement(StatusIcon, { percent: 100, className: "h-4 w-4" }) },
    [SOLineItemStatus.OnHold]:           { label: "On Hold",           icon: React.createElement(CirclePause, { className: "h-4 w-4 text-muted-foreground" }) },
    [SOLineItemStatus.Canceled]:         { label: "Canceled",          icon: React.createElement(CircleX, { className: "h-4 w-4" }) },
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
