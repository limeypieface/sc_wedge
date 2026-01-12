"use client"

import { LineItemStatus, LineItemStatusMeta } from "@/types/line-item-status"

interface LineStatusPillProps {
  status: string
  size?: "sm" | "md"
}

export function LineStatusPill({ status, size = "md" }: LineStatusPillProps) {
  // Normalize status string to enum value
  const normalizedStatus = status.toLowerCase() as LineItemStatus;

  // Get meta for the status, fallback to Open if not found
  const meta = LineItemStatusMeta.meta[normalizedStatus] || LineItemStatusMeta.meta[LineItemStatus.Open];

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
export function LineStatusDisplay({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase() as LineItemStatus;
  const meta = LineItemStatusMeta.meta[normalizedStatus] || LineItemStatusMeta.meta[LineItemStatus.Open];

  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <span className="h-4 w-4">
        {meta?.icon}
      </span>
      <span>{meta?.label || status}</span>
    </div>
  );
}
