/**
 * Line Item Status Enum
 *
 * Represents the fulfillment status of individual line items on a PO.
 * Each line item tracks its own receiving and quality status.
 */

export enum LineItemStatus {
  /** Line item is pending - no receiving activity yet */
  Pending = "PENDING",

  /** Partially received - some quantity received */
  PartiallyReceived = "PARTIALLY_RECEIVED",

  /** Fully received - all quantity received */
  Received = "RECEIVED",

  /** Items are in quality hold for inspection */
  QualityHold = "QUALITY_HOLD",

  /** Line item has been cancelled */
  Cancelled = "CANCELLED",

  /** Line item is back-ordered */
  Backordered = "BACKORDERED",

  /** Line item has quality issues - NCR raised */
  QualityIssue = "QUALITY_ISSUE",
}

/**
 * Metadata for each line item status
 */
export interface LineItemStatusMeta {
  label: string;
  description: string;
  className: string;
  iconName: "pending" | "partial" | "complete" | "warning" | "error";
  isComplete: boolean;
  hasIssue: boolean;
}

export const LineItemStatusMeta = {
  meta: {
    [LineItemStatus.Pending]: {
      label: "Pending",
      description: "Awaiting receipt",
      className: "bg-muted text-muted-foreground",
      iconName: "pending" as const,
      isComplete: false,
      hasIssue: false,
    },
    [LineItemStatus.PartiallyReceived]: {
      label: "Partial",
      description: "Some quantity received",
      className: "bg-primary/10 text-primary",
      iconName: "partial" as const,
      isComplete: false,
      hasIssue: false,
    },
    [LineItemStatus.Received]: {
      label: "Received",
      description: "All quantity received",
      className: "bg-primary/10 text-primary",
      iconName: "complete" as const,
      isComplete: true,
      hasIssue: false,
    },
    [LineItemStatus.QualityHold]: {
      label: "Quality Hold",
      description: "Awaiting quality inspection",
      className: "bg-primary/10 text-primary",
      iconName: "warning" as const,
      isComplete: false,
      hasIssue: false,
    },
    [LineItemStatus.Cancelled]: {
      label: "Cancelled",
      description: "Line item cancelled",
      className: "bg-muted text-muted-foreground",
      iconName: "error" as const,
      isComplete: true,
      hasIssue: false,
    },
    [LineItemStatus.Backordered]: {
      label: "Backordered",
      description: "Item is backordered",
      className: "bg-destructive/10 text-destructive",
      iconName: "warning" as const,
      isComplete: false,
      hasIssue: true,
    },
    [LineItemStatus.QualityIssue]: {
      label: "Quality Issue",
      description: "NCR or quality problem detected",
      className: "bg-destructive/10 text-destructive",
      iconName: "error" as const,
      isComplete: false,
      hasIssue: true,
    },
  } as Record<LineItemStatus, LineItemStatusMeta>,

  /**
   * Get statuses that indicate receiving is in progress
   */
  getInProgressStatuses(): LineItemStatus[] {
    return [LineItemStatus.PartiallyReceived, LineItemStatus.QualityHold];
  },

  /**
   * Get statuses that indicate problems
   */
  getIssueStatuses(): LineItemStatus[] {
    return Object.entries(this.meta)
      .filter(([_, meta]) => meta.hasIssue)
      .map(([status]) => status as LineItemStatus);
  },
};
