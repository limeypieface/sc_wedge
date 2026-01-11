/**
 * Order Core - Shared Types
 *
 * Base abstractions for all order types (Purchase Orders, Sales Orders, etc.)
 * These types define the common structure that order-specific implementations extend.
 *
 * Design Principles:
 * - Order-agnostic: No assumptions about buy vs sell direction
 * - Extensible: Easy to add new order types
 * - Type-safe: Full TypeScript support with generics
 */

import type { EntityId, PrincipalId, ISOTimestamp } from "../shared"

// =============================================================================
// ORDER DIRECTION
// =============================================================================

/**
 * The direction of the order from our perspective.
 * - inbound: We are receiving goods/services (Purchase Order)
 * - outbound: We are providing goods/services (Sales Order)
 */
export type OrderDirection = "inbound" | "outbound";

// =============================================================================
// PARTY TYPES
// =============================================================================

/**
 * A party involved in an order transaction.
 * Could be a vendor (for PO) or customer (for SO).
 */
export interface OrderParty {
  readonly id: EntityId;
  readonly name: string;
  readonly code?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: OrderAddress;
  readonly contacts?: OrderContact[];
}

export interface OrderAddress {
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly state?: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface OrderContact {
  readonly id: EntityId;
  readonly name: string;
  readonly role?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly isPrimary: boolean;
}

// =============================================================================
// LINE ITEM TYPES
// =============================================================================

/**
 * Base line item that all order types share.
 * Specific order types can extend with additional fields.
 */
export interface BaseLineItem {
  readonly id: EntityId;
  readonly lineNumber: number;
  readonly itemCode: string;
  readonly description: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPrice: number;
  readonly lineTotal: number;
  readonly taxRate?: number;
  readonly taxAmount?: number;
  readonly notes?: string;
}

/**
 * Extended line item with scheduling information.
 */
export interface ScheduledLineItem extends BaseLineItem {
  readonly requestedDate?: ISOTimestamp;
  readonly promisedDate?: ISOTimestamp;
  readonly shipDate?: ISOTimestamp;
}

// =============================================================================
// ORDER STATUS
// =============================================================================

/**
 * Common order statuses applicable to all order types.
 * Individual order types may use a subset or extend with custom statuses.
 */
export type BaseOrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "acknowledged"
  | "in_progress"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "on_hold";

/**
 * Status metadata for UI rendering.
 */
export interface OrderStatusMeta<TStatus extends string> {
  readonly status: TStatus;
  readonly label: string;
  readonly description?: string;
  readonly color: "default" | "primary" | "success" | "warning" | "danger" | "info";
  readonly icon?: string;
  readonly isTerminal: boolean;
  readonly allowedTransitions: readonly TStatus[];
}

// =============================================================================
// ORDER DOCUMENT
// =============================================================================

/**
 * Base order document structure.
 * All order types (PO, SO, etc.) extend this interface.
 *
 * @typeParam TParty - The external party type (Vendor, Customer, etc.)
 * @typeParam TLine - The line item type
 * @typeParam TStatus - The status enum type
 */
export interface BaseOrder<
  TParty extends OrderParty,
  TLine extends BaseLineItem,
  TStatus extends string
> {
  readonly id: EntityId;
  readonly orderNumber: string;
  readonly direction: OrderDirection;
  readonly status: TStatus;

  // Parties
  readonly externalParty: TParty;
  readonly internalOwner: PrincipalId;

  // Line items
  readonly lineItems: readonly TLine[];

  // Totals
  readonly subtotal: number;
  readonly taxTotal: number;
  readonly chargesTotal: number;
  readonly discountsTotal: number;
  readonly grandTotal: number;
  readonly currency: string;

  // Dates
  readonly orderDate: ISOTimestamp;
  readonly requiredDate?: ISOTimestamp;
  readonly promisedDate?: ISOTimestamp;

  // References
  readonly reference?: string;
  readonly projectCode?: string;
  readonly costCenter?: string;

  // Notes
  readonly notes?: string;
  readonly internalNotes?: string;

  // Audit
  readonly createdAt: ISOTimestamp;
  readonly createdBy: PrincipalId;
  readonly updatedAt?: ISOTimestamp;
  readonly updatedBy?: PrincipalId;
}

// =============================================================================
// ORDER CONFIGURATION
// =============================================================================

/**
 * Configuration for an order type.
 * Defines terminology, approval rules, and UI settings.
 */
export interface OrderTypeConfig<TStatus extends string> {
  /** Unique identifier for this order type */
  readonly typeId: string;

  /** Human-readable name (e.g., "Purchase Order", "Sales Order") */
  readonly typeName: string;

  /** Short code (e.g., "PO", "SO") */
  readonly typeCode: string;

  /** Order direction */
  readonly direction: OrderDirection;

  /** Terminology for UI labels */
  readonly terminology: OrderTerminology;

  /** Status metadata for all statuses */
  readonly statusMeta: ReadonlyMap<TStatus, OrderStatusMeta<TStatus>>;

  /** Initial status for new orders */
  readonly initialStatus: TStatus;

  /** Approval configuration */
  readonly approvalConfig: OrderApprovalConfig;
}

/**
 * Terminology configuration for order-type-specific labels.
 */
export interface OrderTerminology {
  /** Singular name (e.g., "Purchase Order", "Sales Order") */
  readonly singular: string;

  /** Plural name (e.g., "Purchase Orders", "Sales Orders") */
  readonly plural: string;

  /** Short code (e.g., "PO", "SO") */
  readonly code: string;

  /** External party label (e.g., "Vendor", "Customer") */
  readonly externalParty: string;

  /** External party plural (e.g., "Vendors", "Customers") */
  readonly externalPartyPlural: string;

  /** Internal owner label (e.g., "Buyer", "Sales Rep") */
  readonly internalOwner: string;

  /** Action to send (e.g., "Send to Vendor", "Send to Customer") */
  readonly sendAction: string;

  /** Action when received (e.g., "Received from Vendor", "Confirmed by Customer") */
  readonly acknowledgeAction: string;
}

/**
 * Approval configuration for an order type.
 */
export interface OrderApprovalConfig {
  /** Whether approval is ever required for this order type */
  readonly requiresApproval: boolean;

  /** Percentage threshold that triggers approval (decimal, e.g., 0.05 = 5%) */
  readonly percentageThreshold: number;

  /** Absolute amount threshold that triggers approval */
  readonly absoluteThreshold: number;

  /** How thresholds are combined */
  readonly thresholdMode: "OR" | "AND";

  /** Approval chain levels */
  readonly approvalLevels: readonly ApprovalLevelConfig[];
}

export interface ApprovalLevelConfig {
  readonly level: number;
  readonly name: string;
  readonly minAmount?: number;
  readonly maxAmount?: number;
  readonly approverRoles: readonly string[];
}

// =============================================================================
// ORDER EVENTS
// =============================================================================

/**
 * Events that can occur on an order.
 * Used for audit trails and event sourcing.
 */
export type OrderEventType =
  | "created"
  | "updated"
  | "submitted"
  | "approved"
  | "rejected"
  | "sent"
  | "acknowledged"
  | "cancelled"
  | "line_added"
  | "line_updated"
  | "line_removed"
  | "note_added"
  | "status_changed";

export interface OrderEvent<TData = unknown> {
  readonly id: EntityId;
  readonly orderId: EntityId;
  readonly eventType: OrderEventType;
  readonly timestamp: ISOTimestamp;
  readonly actor: PrincipalId;
  readonly data?: TData;
  readonly notes?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract the line item type from an order type.
 */
export type LineItemOf<T> = T extends BaseOrder<infer _P, infer L, infer _S> ? L : never;

/**
 * Extract the party type from an order type.
 */
export type PartyOf<T> = T extends BaseOrder<infer P, infer _L, infer _S> ? P : never;

/**
 * Extract the status type from an order type.
 */
export type StatusOf<T> = T extends BaseOrder<infer _P, infer _L, infer S> ? S : never;
