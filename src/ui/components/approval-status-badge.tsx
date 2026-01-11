/**
 * ApprovalStatusBadge Component
 *
 * Displays the current approval status as a styled badge.
 *
 * Design principles:
 * - Clear visual distinction between statuses
 * - Accessible color usage
 * - Compact and reusable
 */

import React from "react";
import { ApprovalStatus } from "../../domain/approval-engine";

// ============================================================================
// TYPES
// ============================================================================

export interface ApprovalStatusBadgeProps {
  /** Current status */
  readonly status: ApprovalStatus;
  /** Optional size variant */
  readonly size?: "small" | "medium" | "large";
  /** Custom class name */
  readonly className?: string;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    color: "#92400e",
    bgColor: "#fef3c7",
  },
  approved: {
    label: "Approved",
    color: "#065f46",
    bgColor: "#d1fae5",
  },
  rejected: {
    label: "Rejected",
    color: "#991b1b",
    bgColor: "#fee2e2",
  },
  expired: {
    label: "Expired",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
  cancelled: {
    label: "Cancelled",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
};

const SIZE_CONFIG = {
  small: { padding: "2px 8px", fontSize: "12px" },
  medium: { padding: "4px 12px", fontSize: "14px" },
  large: { padding: "6px 16px", fontSize: "16px" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ApprovalStatusBadge({
  status,
  size = "medium",
  className = "",
}: ApprovalStatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={`approval-status-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize,
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bgColor,
        borderRadius: "9999px",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

// ============================================================================
// STAGE STATUS BADGE
// ============================================================================

export interface StageStatusBadgeProps {
  readonly status: "pending" | "active" | "approved" | "rejected" | "skipped";
  readonly size?: "small" | "medium" | "large";
  readonly className?: string;
}

const STAGE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
  active: {
    label: "Awaiting Approval",
    color: "#1e40af",
    bgColor: "#dbeafe",
  },
  approved: {
    label: "Approved",
    color: "#065f46",
    bgColor: "#d1fae5",
  },
  rejected: {
    label: "Rejected",
    color: "#991b1b",
    bgColor: "#fee2e2",
  },
  skipped: {
    label: "Skipped",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
};

export function StageStatusBadge({
  status,
  size = "small",
  className = "",
}: StageStatusBadgeProps): React.ReactElement {
  const config = STAGE_STATUS_CONFIG[status] ?? STAGE_STATUS_CONFIG["pending"];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={`stage-status-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize,
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bgColor,
        borderRadius: "9999px",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}
