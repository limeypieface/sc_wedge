/**
 * Purchase Order Status Enum
 *
 * Represents the lifecycle states of a Purchase Order.
 * These statuses track the overall PO from creation to fulfillment.
 *
 * @see RevisionStatus for revision-specific states
 */

export enum PurchaseOrderStatus {
  /** Initial state - PO is being prepared, not yet submitted */
  Draft = "DRAFT",

  /** PO is planned for future release */
  Planned = "PLANNED",

  /** PO has been submitted to the vendor */
  Submitted = "SUBMITTED",

  /** PO has been approved internally and/or acknowledged by vendor */
  Approved = "APPROVED",

  /** Some line items have been received */
  Received = "RECEIVED",

  /** All line items have been received and closed */
  Fulfilled = "FULFILLED",

  /** PO has been cancelled */
  Cancelled = "CANCELLED",
}

/**
 * Metadata for each PO status
 * Provides display labels, styling, and behavioral flags
 */
export interface PurchaseOrderStatusMeta {
  /** Human-readable label */
  label: string;

  /** Short description for tooltips */
  description: string;

  /** CSS class for styling (Tailwind) */
  className: string;

  /** Whether the PO can be edited in this status */
  isEditable: boolean;

  /** Whether the PO is considered "active" */
  isActive: boolean;

  /** Whether the PO is in a terminal state */
  isTerminal: boolean;
}

/**
 * Status metadata lookup
 *
 * @example
 * const status = PurchaseOrderStatus.Draft;
 * const { label, className } = PurchaseOrderStatusMeta.meta[status];
 */
export const PurchaseOrderStatusMeta = {
  meta: {
    [PurchaseOrderStatus.Draft]: {
      label: "Draft",
      description: "Purchase order is being prepared",
      className: "bg-muted text-muted-foreground",
      isEditable: true,
      isActive: false,
      isTerminal: false,
    },
    [PurchaseOrderStatus.Planned]: {
      label: "Planned",
      description: "Purchase order is scheduled for future release",
      className: "bg-primary/10 text-primary",
      isEditable: true,
      isActive: false,
      isTerminal: false,
    },
    [PurchaseOrderStatus.Submitted]: {
      label: "Submitted",
      description: "Purchase order has been sent to vendor",
      className: "bg-primary/10 text-primary",
      isEditable: false,
      isActive: true,
      isTerminal: false,
    },
    [PurchaseOrderStatus.Approved]: {
      label: "Approved",
      description: "Purchase order has been approved and acknowledged",
      className: "bg-primary/10 text-primary",
      isEditable: false,
      isActive: true,
      isTerminal: false,
    },
    [PurchaseOrderStatus.Received]: {
      label: "Received",
      description: "Some items have been received",
      className: "bg-primary/10 text-primary",
      isEditable: false,
      isActive: true,
      isTerminal: false,
    },
    [PurchaseOrderStatus.Fulfilled]: {
      label: "Fulfilled",
      description: "All items received and order is complete",
      className: "bg-primary/10 text-primary",
      isEditable: false,
      isActive: false,
      isTerminal: true,
    },
    [PurchaseOrderStatus.Cancelled]: {
      label: "Cancelled",
      description: "Purchase order has been cancelled",
      className: "bg-destructive/10 text-destructive",
      isEditable: false,
      isActive: false,
      isTerminal: true,
    },
  } as Record<PurchaseOrderStatus, PurchaseOrderStatusMeta>,

  /**
   * Get all active statuses (for filtering)
   */
  getActiveStatuses(): PurchaseOrderStatus[] {
    return Object.entries(this.meta)
      .filter(([_, meta]) => meta.isActive)
      .map(([status]) => status as PurchaseOrderStatus);
  },

  /**
   * Get all editable statuses
   */
  getEditableStatuses(): PurchaseOrderStatus[] {
    return Object.entries(this.meta)
      .filter(([_, meta]) => meta.isEditable)
      .map(([status]) => status as PurchaseOrderStatus);
  },
};
