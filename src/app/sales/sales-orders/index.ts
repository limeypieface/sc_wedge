/**
 * Sales Order Module - Public API
 *
 * The Sales Order module provides functionality for managing sales orders,
 * including revision workflows, customer communication, and approval processes.
 *
 * ## Module Structure
 * ```
 * sales-orders/
 * ├── _adapters/        # Domain engine adapters
 * ├── _components/      # UI components
 * ├── _lib/
 * │   ├── contexts/     # React contexts
 * │   ├── mock-data/    # Development data
 * │   └── types/        # TypeScript types
 * └── index.ts          # Public API (this file)
 * ```
 *
 * ## Usage
 * ```tsx
 * import {
 *   SalesOrderProvider,
 *   useSalesOrder,
 *   SOStatusPanel,
 * } from "@/app/sales/sales-orders";
 *
 * function SalesOrderPage() {
 *   return (
 *     <SalesOrderProvider {...props}>
 *       <SOStatusPanel />
 *     </SalesOrderProvider>
 *   );
 * }
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Customer types
  Customer,
  CustomerType,
  CustomerStatus,
  PricingTier,
  CustomerCredit,
  CreditRating,
  PaymentTerms,
  CustomerShipTo,

  // Sales order types
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

  // Revision types
  SORevisionStatus,
  SORevisionChange,
  SORevision,
  SORevisionState,
} from "./_lib/types";

export {
  // Customer helpers
  createCustomerCredit,
  createPaymentTerms,
  PAYMENT_TERMS,

  // Sales order config
  SALES_ORDER_STATUS_META,
  SALES_ORDER_TERMINOLOGY,
  SALES_ORDER_CONFIG,
  CRITICAL_EDIT_FIELDS,
  NON_CRITICAL_EDIT_FIELDS,

  // Revision helpers
  SO_REVISION_STATUS_META,
  isCriticalChange,
  getNextVersion,
  formatVersion,
  canEditRevision,
  canSubmitRevision,
} from "./_lib/types";

// =============================================================================
// ADAPTERS
// =============================================================================

export type {
  SalesOrderTotals,
  DiscountApprovalInfo,
  CreditCheckInfo,
} from "./_adapters";

export {
  // Financial calculations
  calculateSalesOrderLine,
  calculatePricingSummary,
  calculateSalesOrderTotals,
  checkDiscountApproval,
  calculateOrderDelta,
  checkCustomerCredit,

  // Revision operations
  detectLineChanges,
  createInitialRevision,
  createDraftRevision,
  addChangeToDraft,
  updateDraftLines,
  submitForApproval,
  approveRevision,
  rejectRevision,
  sendRevision,
  confirmRevision,
  generateChangesSummary,
} from "./_adapters";

// =============================================================================
// CONTEXTS
// =============================================================================

export { SalesOrderProvider, useSalesOrder } from "./_lib/contexts";

// =============================================================================
// COMPONENTS
// =============================================================================

export {
  SOStatusPanel,
  WorkflowProgress,
  CostDeltaIndicator,
  CustomerNotificationReminder,
  ApprovalChainDisplay,
  RevisionActions,
} from "./_components";

// =============================================================================
// MOCK DATA
// =============================================================================

export {
  // Sample data
  salesReps,
  salesApprovers,
  simulatedUsers,
  customers,
  customerShipTos,
  sampleLineItems,
  sampleSalesOrder,
  sampleRevisions,

  // Helpers
  createApprovalChain,
  getNextOrderNumber,
} from "./_lib/mock-data";
