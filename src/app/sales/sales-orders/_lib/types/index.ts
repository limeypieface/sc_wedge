/**
 * Sales Order Types - Public API
 *
 * All type definitions for the Sales Order module.
 */

// =============================================================================
// CUSTOMER TYPES
// =============================================================================

export type {
  Customer,
  CustomerType,
  CustomerStatus,
  PricingTier,
  CustomerCredit,
  CreditRating,
  PaymentTerms,
  CustomerShipTo,
} from "./customer.types";

export {
  createCustomerCredit,
  createPaymentTerms,
  PAYMENT_TERMS,
} from "./customer.types";

// =============================================================================
// SALES ORDER TYPES
// =============================================================================

export type {
  SalesOrderStatus,
  SalesOrderLine,
  SalesOrderLineStatus,
  SalesOrder,
  SalesRep,
  ShippingDetails,
  FreightTerms,
  PricingSummary,
  CreditCheckResult,
  OrderPriority,
  SalesOrderEditType,
  CriticalEditField,
  NonCriticalEditField,
} from "./sales-order.types";

export {
  SALES_ORDER_STATUS_META,
  SALES_ORDER_TERMINOLOGY,
  SALES_ORDER_CONFIG,
  CRITICAL_EDIT_FIELDS,
  NON_CRITICAL_EDIT_FIELDS,
} from "./sales-order.types";

// =============================================================================
// REVISION TYPES
// =============================================================================

export type {
  SORevisionStatus,
  SORevisionChange,
  SORevision,
  SORevisionState,
} from "./revision.types";

export {
  SO_REVISION_STATUS_META,
  isCriticalChange,
  getNextVersion,
  formatVersion,
  canEditRevision,
  canSubmitRevision,
} from "./revision.types";
