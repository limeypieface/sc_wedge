/**
 * Sales Order Types
 *
 * Sales Order-specific types that extend the shared order-core abstractions.
 * Defines the complete structure of a Sales Order document.
 */

import type { EntityId, PrincipalId, ISOTimestamp } from "@/domain/shared";
import type {
  BaseOrder,
  ScheduledLineItem,
  OrderStatusMeta,
  OrderTypeConfig,
  OrderTerminology,
} from "@/domain/order-core";
import type { Customer, CustomerShipTo, PaymentTerms } from "./customer.types";

// =============================================================================
// SALES ORDER STATUS
// =============================================================================

/**
 * Sales Order status lifecycle.
 */
export type SalesOrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "on_hold";

/**
 * Status metadata for UI rendering.
 */
export const SALES_ORDER_STATUS_META: Record<SalesOrderStatus, OrderStatusMeta<SalesOrderStatus>> = {
  draft: {
    status: "draft",
    label: "Draft",
    description: "Order is being prepared",
    color: "default",
    isTerminal: false,
    allowedTransitions: ["pending_approval", "cancelled"],
  },
  pending_approval: {
    status: "pending_approval",
    label: "Pending Approval",
    description: "Awaiting internal approval",
    color: "warning",
    isTerminal: false,
    allowedTransitions: ["approved", "draft", "cancelled"],
  },
  approved: {
    status: "approved",
    label: "Approved",
    description: "Approved, ready to send",
    color: "success",
    isTerminal: false,
    allowedTransitions: ["sent", "cancelled"],
  },
  sent: {
    status: "sent",
    label: "Sent",
    description: "Sent to customer",
    color: "info",
    isTerminal: false,
    allowedTransitions: ["confirmed", "cancelled"],
  },
  confirmed: {
    status: "confirmed",
    label: "Confirmed",
    description: "Confirmed by customer",
    color: "success",
    isTerminal: false,
    allowedTransitions: ["processing", "on_hold", "cancelled"],
  },
  processing: {
    status: "processing",
    label: "Processing",
    description: "Order is being fulfilled",
    color: "info",
    isTerminal: false,
    allowedTransitions: ["shipped", "on_hold", "cancelled"],
  },
  shipped: {
    status: "shipped",
    label: "Shipped",
    description: "Order has been shipped",
    color: "info",
    isTerminal: false,
    allowedTransitions: ["delivered"],
  },
  delivered: {
    status: "delivered",
    label: "Delivered",
    description: "Order delivered to customer",
    color: "success",
    isTerminal: false,
    allowedTransitions: ["completed"],
  },
  completed: {
    status: "completed",
    label: "Completed",
    description: "Order complete and invoiced",
    color: "success",
    isTerminal: true,
    allowedTransitions: [],
  },
  cancelled: {
    status: "cancelled",
    label: "Cancelled",
    description: "Order has been cancelled",
    color: "danger",
    isTerminal: true,
    allowedTransitions: [],
  },
  on_hold: {
    status: "on_hold",
    label: "On Hold",
    description: "Order is on hold",
    color: "warning",
    isTerminal: false,
    allowedTransitions: ["processing", "cancelled"],
  },
};

// =============================================================================
// SALES ORDER LINE ITEM
// =============================================================================

/**
 * Sales Order line item with pricing and fulfillment details.
 */
export interface SalesOrderLine extends ScheduledLineItem {
  /** Customer's part number (if different from our item code) */
  readonly customerPartNumber?: string;

  /** Original list price before discounts */
  readonly listPrice: number;

  /** Discount percentage applied */
  readonly discountPercent: number;

  /** Discount amount */
  readonly discountAmount: number;

  /** Net unit price after discount */
  readonly netPrice: number;

  /** Margin percentage */
  readonly marginPercent?: number;

  /** Quantity available in inventory */
  readonly availableQuantity?: number;

  /** Quantity allocated to this order */
  readonly allocatedQuantity?: number;

  /** Quantity shipped */
  readonly shippedQuantity?: number;

  /** Quantity backordered */
  readonly backorderedQuantity?: number;

  /** Line status */
  readonly lineStatus: SalesOrderLineStatus;

  /** Warehouse/location to ship from */
  readonly shipFromWarehouse?: string;
}

export type SalesOrderLineStatus =
  | "open"
  | "allocated"
  | "partial"
  | "shipped"
  | "backordered"
  | "cancelled";

// =============================================================================
// SALES ORDER
// =============================================================================

/**
 * Complete Sales Order document.
 */
export interface SalesOrder extends BaseOrder<Customer, SalesOrderLine, SalesOrderStatus> {
  // Sales-specific fields

  /** Customer's PO number (their reference) */
  readonly customerPO?: string;

  /** Quote this order originated from */
  readonly quoteNumber?: string;

  /** Sales rep who owns this order */
  readonly salesRep: SalesRep;

  /** Ship-to address (may differ from bill-to) */
  readonly shipTo: CustomerShipTo;

  /** Payment terms for this order */
  readonly paymentTerms: PaymentTerms;

  /** Shipping details */
  readonly shipping: ShippingDetails;

  /** Pricing summary */
  readonly pricing: PricingSummary;

  /** Credit check result */
  readonly creditCheck?: CreditCheckResult;

  /** Order priority */
  readonly priority: OrderPriority;

  /** Requested ship date */
  readonly requestedShipDate?: ISOTimestamp;

  /** Promised ship date */
  readonly promisedShipDate?: ISOTimestamp;

  /** Actual ship date */
  readonly actualShipDate?: ISOTimestamp;
}

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

export interface SalesRep {
  readonly id: EntityId;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly territory?: string;
  readonly commissionRate?: number;
}

export interface ShippingDetails {
  readonly method: string;
  readonly carrier?: string;
  readonly accountNumber?: string;
  readonly freightTerms: FreightTerms;
  readonly estimatedCost?: number;
  readonly actualCost?: number;
  readonly trackingNumber?: string;
  readonly instructions?: string;
}

export type FreightTerms =
  | "prepaid"        // Seller pays freight
  | "collect"        // Buyer pays freight
  | "prepaid_add"    // Seller pays, adds to invoice
  | "third_party";   // Third party pays

export interface PricingSummary {
  /** Total list price before discounts */
  readonly listTotal: number;

  /** Total discount amount */
  readonly discountTotal: number;

  /** Discount percentage overall */
  readonly discountPercent: number;

  /** Net total after discounts */
  readonly netTotal: number;

  /** Total margin amount */
  readonly marginTotal?: number;

  /** Overall margin percentage */
  readonly marginPercent?: number;
}

export interface CreditCheckResult {
  readonly passed: boolean;
  readonly checkedAt: ISOTimestamp;
  readonly checkedBy: PrincipalId;
  readonly availableCredit: number;
  readonly orderTotal: number;
  readonly notes?: string;
  readonly overrideApproved?: boolean;
  readonly overrideBy?: PrincipalId;
}

export type OrderPriority = "low" | "normal" | "high" | "rush";

// =============================================================================
// SALES ORDER CONFIGURATION
// =============================================================================

/**
 * Sales Order terminology for UI.
 */
export const SALES_ORDER_TERMINOLOGY: OrderTerminology = {
  singular: "Sales Order",
  plural: "Sales Orders",
  code: "SO",
  externalParty: "Customer",
  externalPartyPlural: "Customers",
  internalOwner: "Sales Rep",
  sendAction: "Send to Customer",
  acknowledgeAction: "Confirmed by Customer",
};

/**
 * Sales Order type configuration.
 */
export const SALES_ORDER_CONFIG: OrderTypeConfig<SalesOrderStatus> = {
  typeId: "sales-order",
  typeName: "Sales Order",
  typeCode: "SO",
  direction: "outbound",
  terminology: SALES_ORDER_TERMINOLOGY,
  statusMeta: new Map(Object.entries(SALES_ORDER_STATUS_META)) as ReadonlyMap<
    SalesOrderStatus,
    OrderStatusMeta<SalesOrderStatus>
  >,
  initialStatus: "draft",
  approvalConfig: {
    requiresApproval: true,
    percentageThreshold: 0.10, // 10% discount triggers approval
    absoluteThreshold: 1000,   // $1000 discount triggers approval
    thresholdMode: "OR",
    approvalLevels: [
      {
        level: 1,
        name: "Sales Manager",
        maxAmount: 5000,
        approverRoles: ["sales_manager"],
      },
      {
        level: 2,
        name: "Sales Director",
        maxAmount: 25000,
        approverRoles: ["sales_director"],
      },
      {
        level: 3,
        name: "VP Sales",
        approverRoles: ["vp_sales"],
      },
    ],
  },
};

// =============================================================================
// REVISION TYPES (for Sales Order revisions)
// =============================================================================

export type SalesOrderEditType = "critical" | "non_critical";

/** Fields that require approval when changed */
export const CRITICAL_EDIT_FIELDS = [
  "quantity",
  "unitPrice",
  "discountPercent",
  "lineTotal",
  "addLine",
  "removeLine",
  "shipTo",
  "paymentTerms",
] as const;

/** Fields that can be changed without approval */
export const NON_CRITICAL_EDIT_FIELDS = [
  "notes",
  "shippingInstructions",
  "requestedShipDate",
  "customerPO",
  "internalNotes",
  "priority",
] as const;

export type CriticalEditField = (typeof CRITICAL_EDIT_FIELDS)[number];
export type NonCriticalEditField = (typeof NON_CRITICAL_EDIT_FIELDS)[number];
