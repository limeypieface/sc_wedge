import React from "react";
import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  CircleDashed,
  Circle,
  CircleX,
  CirclePause,
} from "lucide-react";
import { StatusIcon } from "@/components/icons/status-icon";

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

export const LineItemStatusMeta = createEnumMeta(
  LineItemStatus,
  {
    [LineItemStatus.Draft]:             { label: "Draft",              icon: React.createElement(CircleDashed, { className: "h-4 w-4" }) },
    [LineItemStatus.Issued]:            { label: "Issued",             icon: React.createElement(StatusIcon, { percent: 10, className: "h-4 w-4" }) },
    [LineItemStatus.Open]:              { label: "Open",               icon: React.createElement(Circle, { className: "h-4 w-4" }) },
    [LineItemStatus.PartiallyReceived]: { label: "Partially Received", icon: React.createElement(StatusIcon, { percent: 50, className: "h-4 w-4" }) },
    [LineItemStatus.Received]:          { label: "Received",           icon: React.createElement(StatusIcon, { percent: 75, className: "h-4 w-4" }) },
    [LineItemStatus.Closed]:            { label: "Closed",             icon: React.createElement(StatusIcon, { percent: 100, className: "h-4 w-4" }) },
    [LineItemStatus.OnHold]:            { label: "On Hold",            icon: React.createElement(CirclePause, { className: "h-4 w-4 text-muted-foreground" }) },
    [LineItemStatus.Canceled]:          { label: "Canceled",           icon: React.createElement(CircleX, { className: "h-4 w-4" }) },
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
