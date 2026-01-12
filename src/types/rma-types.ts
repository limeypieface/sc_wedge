// RMA (Return Material Authorization) Types
// Used for tracking returns and replacements when receiving discrepancies occur
// Designed to work across both PO (supplier returns) and SO (customer returns) contexts

// ============================================================================
// VARIANT - PO vs SO context
// ============================================================================

export type RMAVariant = "po" | "so"

// ============================================================================
// STATUS
// ============================================================================

export type RMAStatus =
  | "requested"           // Initial request created
  | "pending_auth"        // Awaiting external party response
  | "authorized"          // RMA number received, ready to ship
  | "return_shipped"      // Goods shipped back
  | "in_transit"          // Return shipment in transit
  | "received_by_party"   // External party received return
  | "replacement_pending" // Awaiting replacement shipment
  | "credit_pending"      // Awaiting credit memo
  | "resolved"            // Closed out

// ============================================================================
// RMA TYPE
// ============================================================================

export type RMAType =
  | "return_replace"      // Return goods, receive replacement
  | "return_credit"       // Return goods, receive credit
  | "repair"              // Return for repair
  | "dispose"             // Dispose per supplier instruction (no physical return)

export interface RMAReturnAddress {
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
  attention?: string
}

export interface RMA {
  id: string
  rmaNumber?: string              // External party's RMA number (once authorized)

  // Order context
  variant: RMAVariant             // "po" or "so"
  orderNumber: string             // PO or SO number

  // Links to source issue
  issueId: string                 // Links to POIssue/SOIssue that triggered RMA
  ncrId?: string                  // Links to NCR if quality-related
  shipmentId: string              // Original shipment
  lineNumber: number
  sku: string
  itemName: string

  // RMA details
  type: RMAType
  reason: string                  // Description of why return needed
  qtyAffected: number
  status: RMAStatus

  // Return tracking
  returnCarrier?: string
  returnTrackingNumber?: string
  returnShippedDate?: string

  // Resolution tracking
  replacementShipmentId?: string  // Links to new shipment when replacement ships
  creditMemoNumber?: string       // Credit memo reference
  creditAmount?: number

  // External party instructions
  returnAddress?: RMAReturnAddress
  returnInstructions?: string     // From external party (e.g., "Include copy of RMA form")
  dispositionNotes?: string       // For dispose type

  // Dates
  requestedDate: string
  authorizedDate?: string
  resolvedDate?: string

  // Audit
  requestedBy: string
  notes?: string

  // Timeline of status changes
  timeline?: RMATimelineEvent[]
}

// Helper type for RMA creation form
export interface CreateRMAInput {
  variant: RMAVariant
  orderNumber: string
  issueId: string
  ncrId?: string
  shipmentId: string
  lineNumber: number
  sku: string
  itemName: string
  type: RMAType
  reason: string
  qtyAffected: number
  notes?: string
}

// Helper type for recording authorization
export interface RecordAuthorizationInput {
  rmaNumber: string
  returnAddress?: RMAReturnAddress
  returnInstructions?: string
}

// Helper type for recording resolution
export interface RecordResolutionInput {
  replacementShipmentId?: string
  creditMemoNumber?: string
  creditAmount?: number
  dispositionNotes?: string
}

// RMA status display helpers
export const RMA_STATUS_LABELS: Record<RMAStatus, string> = {
  requested: "Requested",
  pending_auth: "Pending Authorization",
  authorized: "Authorized",
  return_shipped: "Return Shipped",
  in_transit: "In Transit",
  received_by_party: "Received",
  replacement_pending: "Replacement Pending",
  credit_pending: "Credit Pending",
  resolved: "Resolved",
}

export const RMA_TYPE_LABELS: Record<RMAType, string> = {
  return_replace: "Return & Replace",
  return_credit: "Return for Credit",
  repair: "Return for Repair",
  dispose: "Dispose (No Return)",
}

// Check if RMA is in a state where return can be shipped
export function canShipReturn(rma: RMA): boolean {
  return rma.status === "authorized" && rma.type !== "dispose"
}

// Check if RMA is actionable by buyer
export function isRMAActionable(rma: RMA): boolean {
  return ["requested", "authorized", "replacement_pending", "credit_pending"].includes(rma.status)
}

// Check if RMA is waiting on supplier
export function isAwaitingSupplier(rma: RMA): boolean {
  return ["pending_auth", "return_shipped", "in_transit", "received_by_party"].includes(rma.status)
}

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

export interface RMAWorkflowStep {
  id: string
  status: RMAStatus | RMAStatus[]
  label: string
  description: string
}

export const RMA_WORKFLOW_STEPS: RMAWorkflowStep[] = [
  {
    id: "requested",
    status: "requested",
    label: "Requested",
    description: "RMA request created"
  },
  {
    id: "authorized",
    status: ["pending_auth", "authorized"],
    label: "Authorized",
    description: "Awaiting or received authorization"
  },
  {
    id: "shipped",
    status: ["return_shipped", "in_transit"],
    label: "Shipped",
    description: "Return shipped to external party"
  },
  {
    id: "resolution",
    status: ["received_by_party", "replacement_pending", "credit_pending"],
    label: "Resolution",
    description: "Awaiting resolution"
  },
  {
    id: "complete",
    status: "resolved",
    label: "Complete",
    description: "RMA resolved and closed"
  },
]

// Get the current step index for workflow progress
export function getRMAStepIndex(status: RMAStatus): number {
  return RMA_WORKFLOW_STEPS.findIndex(step => {
    if (Array.isArray(step.status)) {
      return step.status.includes(status)
    }
    return step.status === status
  })
}

// ============================================================================
// TERMINOLOGY
// ============================================================================

export interface RMATerminology {
  externalParty: string
  externalPartyShort: string
  orderType: string
  orderPrefix: string
  emailAction: string
  returnDirection: string
  createAction: string
  viewAction: string
}

export const RMA_TERMINOLOGY: Record<RMAVariant, RMATerminology> = {
  po: {
    externalParty: "Supplier",
    externalPartyShort: "Supplier",
    orderType: "Purchase Order",
    orderPrefix: "PO",
    emailAction: "Email Supplier",
    returnDirection: "Return to Supplier",
    createAction: "Create RMA",
    viewAction: "View RMA",
  },
  so: {
    externalParty: "Customer",
    externalPartyShort: "Customer",
    orderType: "Sales Order",
    orderPrefix: "SO",
    emailAction: "Email Customer",
    returnDirection: "Return from Customer",
    createAction: "Process Return",
    viewAction: "View Return",
  }
}

// ============================================================================
// STATUS DISPLAY CONFIG
// ============================================================================

export interface RMAStatusConfig {
  label: string
  color: "default" | "info" | "warning" | "success" | "destructive"
  description: string
  actionLabel?: string
}

export const RMA_STATUS_CONFIG: Record<RMAStatus, RMAStatusConfig> = {
  requested: {
    label: "Requested",
    color: "info",
    description: "Awaiting authorization from external party",
    actionLabel: "Email Request",
  },
  pending_auth: {
    label: "Pending Authorization",
    color: "warning",
    description: "Waiting for RMA number",
    actionLabel: "Follow Up",
  },
  authorized: {
    label: "Authorized",
    color: "success",
    description: "Ready to ship return",
    actionLabel: "Ship Return",
  },
  return_shipped: {
    label: "Return Shipped",
    color: "info",
    description: "Return shipment in transit",
  },
  in_transit: {
    label: "In Transit",
    color: "info",
    description: "Return shipment in transit to destination",
  },
  received_by_party: {
    label: "Received",
    color: "info",
    description: "External party received return",
  },
  replacement_pending: {
    label: "Replacement Pending",
    color: "warning",
    description: "Waiting for replacement shipment",
  },
  credit_pending: {
    label: "Credit Pending",
    color: "warning",
    description: "Waiting for credit memo",
  },
  resolved: {
    label: "Resolved",
    color: "success",
    description: "RMA completed and closed",
  },
}

// Get border class for status (used in panels)
export function getRMAStatusBorderClass(status: RMAStatus): string {
  const config = RMA_STATUS_CONFIG[status]
  switch (config.color) {
    case "success":
      return "border-l-emerald-500"
    case "warning":
      return "border-l-amber-500"
    case "destructive":
      return "border-l-red-500"
    case "info":
      return "border-l-blue-500"
    default:
      return "border-l-gray-300"
  }
}

// ============================================================================
// TIMELINE EVENT
// ============================================================================

export interface RMATimelineEvent {
  id: string
  timestamp: string
  status: RMAStatus
  description: string
  actor?: string
  metadata?: Record<string, string>
}
