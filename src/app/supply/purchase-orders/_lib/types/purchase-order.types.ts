/**
 * Purchase Order Domain Types
 *
 * Core type definitions for Purchase Order entities.
 * These types represent the data structures returned from the backend
 * (or mock adapters in this prototype).
 *
 * In Sindri production: These would be generated from GraphQL schema.
 * In prototype: Manually defined to match expected backend shape.
 */

import { PurchaseOrderStatus } from "@/types/enums";
import { LineItemStatus } from "@/types/enums";

// ============================================================================
// VENDOR & SUPPLIER TYPES
// ============================================================================

/**
 * Supplier/Vendor information attached to a PO
 */
export interface Supplier {
  id: string;
  name: string;
  code: string;
}

/**
 * Contact person at the vendor
 */
export interface VendorContact {
  name: string;
  title: string;
  phone: string;
  email: string;
  company: string;
}

// ============================================================================
// BUYER TYPES
// ============================================================================

/**
 * Buyer assigned to the PO
 */
export interface Buyer {
  name: string;
  email: string;
}

// ============================================================================
// PO HEADER TYPES
// ============================================================================

/**
 * Key dates associated with the PO lifecycle
 */
export interface PODates {
  created: string;
  issued: string | null;
  acknowledged: string | null;
  expectedCompletion: string | null;
}

/**
 * Shipping configuration
 */
export interface POShipping {
  method: string;
  terms: string;
  destination: string;
  address: string;
}

/**
 * Payment configuration
 */
export interface POPayment {
  terms: string;
  currency: string;
}

/**
 * PO Header - Top-level purchase order information
 *
 * Contains all metadata about the PO except line items.
 */
export interface POHeader {
  /** Unique PO identifier (e.g., "PO-0861") */
  poNumber: string;

  /** Current overall status */
  status: "open" | "partially_received" | "received" | "closed" | "cancelled";

  /** Priority level */
  urgency: "standard" | "high" | "critical";

  /** Vendor information */
  supplier: Supplier;

  /** Buyer information */
  buyer: Buyer;

  /** Lifecycle dates */
  dates: PODates;

  /** Shipping details */
  shipping: POShipping;

  /** Payment terms */
  payment: POPayment;

  /** Internal notes */
  notes: string;
}

// ============================================================================
// LINE ITEM TYPES
// ============================================================================

/**
 * Compliance requirements for a line item
 */
export interface ComplianceRequirements {
  /** Requires inspection on receipt */
  inspectionRequired: boolean;

  /** Requires Certificate of Conformance */
  cocRequired: boolean;

  /** Requires First Article Inspection */
  faiRequired: boolean;

  /** Requires Material Test Report */
  mtrRequired: boolean;

  /** Source inspection required */
  sourceInspection: boolean;
}

/**
 * Need/demand information for a line item
 */
export interface LineItemNeed {
  needDate: string;
  demandSource: string;
  priority: "low" | "medium" | "high" | "critical";
}

/**
 * Line Item on a Purchase Order
 *
 * Represents a single item being purchased, with quantity, pricing,
 * and receiving status.
 */
export interface LineItem {
  /** Line number (1-based) */
  id: number;

  /** Part/SKU number */
  sku: string;

  /** Item description */
  name: string;

  /** Ordered quantity */
  quantity: number;

  /** Quantity received so far */
  quantityReceived?: number;

  /** Quantity in quality hold */
  quantityInQualityHold?: number;

  /** Unit of measure */
  uom: string;

  /** Unit price */
  unitPrice: number;

  /** Line total (quantity * unitPrice) */
  lineTotal: number;

  /** Current receiving status */
  status: LineItemStatus;

  /** Vendor's promised delivery date */
  promisedDate?: string;

  /** Internal project code */
  projectCode?: string;

  /** Need/demand information */
  need?: LineItemNeed;

  /** Compliance requirements */
  compliance?: ComplianceRequirements;
}

// ============================================================================
// CHARGES & DISCOUNTS
// ============================================================================

/**
 * Types of charges that can be applied
 */
export type ChargeType =
  | "shipping"
  | "freight"
  | "expedite"
  | "duty"
  | "handling"
  | "insurance"
  | "packaging"
  | "other";

/**
 * Types of discounts that can be applied
 */
export type DiscountType =
  | "volume"
  | "promotional"
  | "trade"
  | "early_payment"
  | "contract"
  | "seasonal"
  | "other";

/**
 * How a charge/discount is calculated
 */
export type CalculationType = "fixed" | "percentage" | "per_unit";

/**
 * Charge/fee applied to the PO
 *
 * Can apply to the entire PO or specific lines.
 */
export interface POCharge {
  id: string;
  type: ChargeType;
  name: string;
  calculation: CalculationType;
  rate: number;
  baseAmount?: number;
  amount: number;
  /** Line IDs this applies to (empty = header-level) */
  appliesToLines?: number[];
  taxable: boolean;
  billable: boolean;
  notes?: string;
}

/**
 * Discount applied to the PO
 */
export interface PODiscount {
  id: string;
  type: DiscountType;
  name: string;
  calculation: "fixed" | "percentage";
  rate: number;
  amount: number;
  /** Line IDs this applies to (empty = header-level) */
  appliesToLines?: number[];
  isApplied: boolean;
  /** Early payment discount terms */
  paymentTerms?: {
    discountPercent: number;
    discountDays: number;
    netDays: number;
    deadline: string;
  };
}

// ============================================================================
// TOTALS
// ============================================================================

/**
 * Computed totals for the PO
 */
export interface POTotals {
  subtotal: number;
  totalCharges: number;
  totalDiscounts: number;
  taxAmount: number;
  grandTotal: number;
}

// ============================================================================
// COMPLETE PO TYPE
// ============================================================================

/**
 * Complete Purchase Order
 *
 * Combines header, line items, charges, and discounts
 * into a full PO representation.
 */
export interface PurchaseOrder {
  header: POHeader;
  lineItems: LineItem[];
  charges: POCharge[];
  discounts: PODiscount[];
  totals: POTotals;
  vendorContact: VendorContact;
}
