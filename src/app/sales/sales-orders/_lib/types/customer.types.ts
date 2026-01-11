/**
 * Customer Types
 *
 * Customer-specific types for Sales Orders.
 * Extends the base OrderParty with customer-specific fields.
 */

import type { EntityId } from "@/domain/shared";
import type { OrderParty, OrderAddress, OrderContact } from "@/domain/order-core";

// =============================================================================
// CUSTOMER
// =============================================================================

/**
 * A customer party for Sales Orders.
 * Extends OrderParty with customer-specific fields.
 */
export interface Customer extends OrderParty {
  /** Customer account number */
  readonly accountNumber: string;

  /** Customer type classification */
  readonly customerType: CustomerType;

  /** Credit information */
  readonly credit: CustomerCredit;

  /** Payment terms */
  readonly paymentTerms: PaymentTerms;

  /** Tax exemption status */
  readonly taxExempt: boolean;
  readonly taxExemptId?: string;

  /** Preferred shipping method */
  readonly preferredShippingMethod?: string;

  /** Customer tier for pricing/discounts */
  readonly pricingTier?: PricingTier;

  /** Sales rep assigned to this customer */
  readonly assignedSalesRep?: EntityId;

  /** Customer status */
  readonly status: CustomerStatus;
}

// =============================================================================
// CUSTOMER CLASSIFICATIONS
// =============================================================================

export type CustomerType =
  | "retail"
  | "wholesale"
  | "distributor"
  | "oem"
  | "government"
  | "internal";

export type CustomerStatus =
  | "active"
  | "inactive"
  | "on_hold"
  | "credit_hold"
  | "pending_approval";

export type PricingTier =
  | "standard"
  | "preferred"
  | "premium"
  | "vip"
  | "contract";

// =============================================================================
// CREDIT
// =============================================================================

export interface CustomerCredit {
  /** Total credit limit */
  readonly creditLimit: number;

  /** Current outstanding balance */
  readonly currentBalance: number;

  /** Available credit (limit - balance - pending) */
  readonly availableCredit: number;

  /** Orders pending shipment/invoicing */
  readonly pendingOrders: number;

  /** Credit terms in days */
  readonly termsDays: number;

  /** Credit rating */
  readonly rating?: CreditRating;

  /** Date of last credit review */
  readonly lastReviewDate?: string;
}

export type CreditRating = "excellent" | "good" | "fair" | "poor" | "not_rated";

// =============================================================================
// PAYMENT TERMS
// =============================================================================

export interface PaymentTerms {
  /** Terms code (e.g., "NET30", "2/10NET30") */
  readonly code: string;

  /** Description */
  readonly description: string;

  /** Due days from invoice date */
  readonly dueDays: number;

  /** Early payment discount percentage */
  readonly discountPercent?: number;

  /** Days to qualify for early payment discount */
  readonly discountDays?: number;
}

// =============================================================================
// SHIPPING ADDRESS
// =============================================================================

/**
 * A shipping destination for a customer.
 * Customers may have multiple ship-to addresses.
 */
export interface CustomerShipTo {
  readonly id: EntityId;
  readonly customerId: EntityId;
  readonly name: string;
  readonly address: OrderAddress;
  readonly contact?: OrderContact;
  readonly isDefault: boolean;
  readonly shippingInstructions?: string;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new customer credit object with defaults.
 */
export function createCustomerCredit(
  creditLimit: number,
  options: Partial<CustomerCredit> = {}
): CustomerCredit {
  return {
    creditLimit,
    currentBalance: options.currentBalance ?? 0,
    availableCredit: options.availableCredit ?? creditLimit,
    pendingOrders: options.pendingOrders ?? 0,
    termsDays: options.termsDays ?? 30,
    rating: options.rating,
    lastReviewDate: options.lastReviewDate,
  };
}

/**
 * Create standard payment terms.
 */
export function createPaymentTerms(
  code: string,
  dueDays: number,
  options: { discountPercent?: number; discountDays?: number } = {}
): PaymentTerms {
  const descriptions: Record<string, string> = {
    NET30: "Net 30 days",
    NET60: "Net 60 days",
    NET90: "Net 90 days",
    COD: "Cash on delivery",
    CIA: "Cash in advance",
    "2/10NET30": "2% discount if paid within 10 days, net 30",
  };

  return {
    code,
    description: descriptions[code] ?? `Net ${dueDays} days`,
    dueDays,
    discountPercent: options.discountPercent,
    discountDays: options.discountDays,
  };
}

// =============================================================================
// COMMON PAYMENT TERMS
// =============================================================================

export const PAYMENT_TERMS = {
  NET30: createPaymentTerms("NET30", 30),
  NET60: createPaymentTerms("NET60", 60),
  NET90: createPaymentTerms("NET90", 90),
  COD: createPaymentTerms("COD", 0),
  CIA: createPaymentTerms("CIA", 0),
  TWO_TEN_NET30: createPaymentTerms("2/10NET30", 30, { discountPercent: 2, discountDays: 10 }),
} as const;
