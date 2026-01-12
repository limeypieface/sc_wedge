import React from "react";
import { createEnumMeta } from "@/lib/utils/create-enum-meta";
import {
  CircleDashed,
  CircleDotDashed,
  Circle,
  CircleX
} from "lucide-react";
import { StatusIcon } from "@/components/icons/status-icon";

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

export const SalesOrderStatusMeta = createEnumMeta(
  SalesOrderStatus,
  {
    [SalesOrderStatus.Pending]:           { label: "Pending",           icon: React.createElement(CircleDashed, { className: "h-4 w-4" }) },
    [SalesOrderStatus.Confirmed]:         { label: "Confirmed",         icon: React.createElement(StatusIcon, { percent: 15, className: "h-4 w-4" }) },
    [SalesOrderStatus.PartiallyShipped]:  { label: "Partially Shipped", icon: React.createElement(StatusIcon, { percent: 40, className: "h-4 w-4" }) },
    [SalesOrderStatus.Shipped]:           { label: "Shipped",           icon: React.createElement(StatusIcon, { percent: 60, className: "h-4 w-4" }) },
    [SalesOrderStatus.PartiallyInvoiced]: { label: "Partially Invoiced", icon: React.createElement(StatusIcon, { percent: 80, className: "h-4 w-4" }) },
    [SalesOrderStatus.Invoiced]:          { label: "Invoiced",          icon: React.createElement(StatusIcon, { percent: 100, className: "h-4 w-4" }) },
    [SalesOrderStatus.Closed]:            { label: "Closed",            icon: React.createElement(CircleX, { className: "h-4 w-4" }) },
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
