/**
 * Sales Order Adapters - Public API
 *
 * Adapters that connect Sales Order data to domain engines.
 */

// =============================================================================
// FINANCIAL ADAPTER
// =============================================================================

export type {
  SalesOrderTotals,
  DiscountApprovalInfo,
  CreditCheckInfo,
} from "./financial.adapter";

export {
  calculateSalesOrderLine,
  calculatePricingSummary,
  calculateSalesOrderTotals,
  checkDiscountApproval,
  calculateOrderDelta,
  checkCustomerCredit,
} from "./financial.adapter";

// =============================================================================
// REVISION ADAPTER
// =============================================================================

export {
  // Change detection
  detectLineChanges,

  // Revision creation
  createInitialRevision,
  createDraftRevision,

  // Revision updates
  addChangeToDraft,
  updateDraftLines,

  // Status transitions
  submitForApproval,
  approveRevision,
  rejectRevision,
  sendRevision,
  confirmRevision,

  // Summary
  generateChangesSummary,
} from "./revision.adapter";
