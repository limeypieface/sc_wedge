"use client"

import { SOLineItemStatus, SOLineItemStatusMeta, mapPOStatusToSOStatus } from "@/types/so-line-item-status"

interface SOLineStatusPillProps {
  status: string
  size?: "sm" | "md"
}

export function SOLineStatusPill({ status, size = "md" }: SOLineStatusPillProps) {
  // Map PO status to SO status
  const soStatus = mapPOStatusToSOStatus(status);

  // Get meta for the status
  const meta = SOLineItemStatusMeta.meta[soStatus] || SOLineItemStatusMeta.meta[SOLineItemStatus.Open];

  // Clone the icon with the appropriate size class
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-2">
      <span className={sizeClass}>
        {meta?.icon}
      </span>
    </div>
  );
}

// Display with label
export function SOLineStatusDisplay({ status }: { status: string }) {
  const soStatus = mapPOStatusToSOStatus(status);
  const meta = SOLineItemStatusMeta.meta[soStatus] || SOLineItemStatusMeta.meta[SOLineItemStatus.Open];

  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <span className="h-4 w-4">
        {meta?.icon}
      </span>
      <span>{meta?.label || status}</span>
    </div>
  );
}
