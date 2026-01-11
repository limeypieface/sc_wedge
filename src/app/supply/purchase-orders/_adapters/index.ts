/**
 * Data Adapters Index
 *
 * Central export for all data access functions.
 * These adapters abstract the data source (mock vs GraphQL).
 *
 * In Sindri migration:
 * - Replace these adapters with generated GraphQL hooks
 * - Keep the same export names for minimal code changes
 */

// Purchase Order Adapter
export {
  fetchPurchaseOrder,
  fetchPurchaseOrderHeader,
  fetchLineItems,
  fetchCharges,
  fetchVendorContact,
  getLineCharges,
  getHeaderCharges,
  calculateLineTotals,
  type QueryResult,
  type PurchaseOrderQueryResult,
  type PurchaseOrderListQueryResult,
} from "./purchase-order.adapter";

// Revision Adapter
export {
  fetchRevisions,
  fetchActiveRevision,
  fetchDraftRevision,
  fetchApprovers,
  fetchUsers,
  createDraftRevision,
  addChangeToDraft,
  submitForApproval,
  approveRevision,
  rejectRevision,
  sendToVendor,
  recordAcknowledgment,
  discardDraft,
  resetRevisionState,
} from "./revision.adapter";
