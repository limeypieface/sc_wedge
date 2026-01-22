/**
 * Purchase Order Domain Mock Data
 *
 * Re-exports PO-specific data from the central mock-data file
 * This serves as the single import point for PO data
 */

// Re-export from central mock-data (for backward compatibility)
export {
  // Types
  type LineItem,
  type LineItemNeed,
  type ShipmentLine,
  type NCR,
  type PayableIssue,
  type Shipment,
  type ShipmentStatus,
  type VendorContact,
  type ChargeType,
  type ChargeCalculation,
  type POCharge,
  type POHeader,
  type Approver,
  type InvoiceLine,
  type Invoice,
  type PeggedNeed,
  type POIssue,
  type IssueCategory,
  type PORevisionData,
  type ToleranceStatus,
  type POData,
  type ComplianceClause,
  type DocumentCategory,
  type PODocument,
  type CatalogItem,
  type Requisition,
  type OpenRequisitionLine,

  // Data
  lineItems,
  shipments,
  vendorContact,
  poHeader,
  approvers,
  invoices,
  peggedNeeds,
  initialRevisions,
  poCharges,
  purchaseOrdersData,
  complianceClauses,
  openRequisitionLines,
  sampleRMAs,

  // Blanket PO
  blanketPOTerms,
  blanketPOUtilization,
  blanketPOLines,
  blanketPOReleases,

  // Functions
  computeReceivingStats,
  getLineNumberBySku,
  getPOData,
  getChargesByLine,
  computeLineFinancials,
  detectPOIssuesForPO,
  detectPOIssuesWithRevision,
  createRevisionNotificationIssue,
  isNeedAtRisk,
  getNeedsForLine,
  computeNeedsStats,
  computePOTotals,
  computePayablesSummary,
  getActionRequiredIssues,
  getLineNeedStatus,
  detectPOIssues,
  checkLineReqAuthorization,
  computeComplianceStats,
  getDocuments,
  computeDocumentStats,
  getCatalogItemBySku,
  getCatalogItemsForVendor,
  getSourceRequisitions,
  getReqAuthorizationSummary,
  getOpenRequisitionsForVendor,
  getRequisitionRemainingQty,
  getRelatedIssues,
  getIssuesForEntity,

  // RMA Functions
  createRMA,
  getRMAs,
  getRMAById,
  getRMAsForOrder,
  getRMAForIssue,
  hasActiveRMA,
  updateRMAStatus,
  recordRMAAuthorization,
  recordRMAReturnShipped,
  recordRMAResolution,
} from "@/lib/mock-data"

// Re-export shared users for PO context
export { poApprovers, createApprovalChain } from "../shared/users"

// Re-export status options
export { PO_STATUS_OPTIONS, LINE_STATUSES, STATUS_COLORS, getStatusColor } from "../config/status-options"

// Re-export view options
export { PO_VIEW_OPTIONS, LINE_DISPLAY_OPTIONS } from "../config/view-options"
