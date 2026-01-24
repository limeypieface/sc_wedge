/**
 * LineItemModal Configuration
 *
 * Defines the configuration options for rendering a line item detail modal
 * differently for Purchase Orders vs Sales Orders.
 */

export type LineItemModalVariant = "po" | "so"

export interface QuantityFlowStep {
  label: string
  getValue: (item: any) => number
}

export interface LineItemModalConfig {
  /** Modal variant identifier */
  variant: LineItemModalVariant

  /** Section title labels */
  labels: {
    /** "Receiving Status" vs "Fulfillment Status" */
    quantityFlowTitle: string
    /** "Invoices & Payables" vs "Invoices & Receivables" */
    invoicesTitle: string
    /** Paid label: "Paid $" vs "Received $" */
    paidAmountLabel: string
  }

  /** Steps to show in the quantity flow */
  quantityFlow: QuantityFlowStep[]

  /** Whether to show the Needs tab (MO/WO pegging) */
  showNeedsTab: boolean

  /** Quality requirement labels */
  qualityLabels: {
    inspectionLabel: string // "Incoming Inspection" vs "Outgoing Inspection"
    sourceInspectionLabel: string // "Source Inspection" vs "Customer Inspection"
  }
}

/**
 * PO Line Item Modal Configuration
 * - Shows Needs tab for MO/WO pegging
 * - Uses receiving/payables terminology
 */
export const PO_LINE_ITEM_CONFIG: LineItemModalConfig = {
  variant: "po",
  labels: {
    quantityFlowTitle: "Receiving Status",
    invoicesTitle: "Invoices & Payables",
    paidAmountLabel: "Paid $",
  },
  quantityFlow: [
    { label: "Ordered", getValue: (item) => item.quantityOrdered || item.quantity || 0 },
    { label: "Shipped", getValue: (item) => item.quantityShipped || 0 },
    { label: "Received", getValue: (item) => item.quantityReceived || 0 },
    { label: "Accepted", getValue: (item) => item.quantityAccepted || 0 },
    { label: "Vouchered", getValue: (item) => item.quantityVouchered || item.quantityAccepted || 0 },
    { label: "Paid", getValue: (item) => item.quantityPaid || 0 },
  ],
  showNeedsTab: true,
  qualityLabels: {
    inspectionLabel: "Incoming Inspection",
    sourceInspectionLabel: "Source Inspection",
  },
}

/**
 * SO Line Item Modal Configuration
 * - No Needs tab
 * - Uses fulfillment/receivables terminology
 */
export const SO_LINE_ITEM_CONFIG: LineItemModalConfig = {
  variant: "so",
  labels: {
    quantityFlowTitle: "Fulfillment Status",
    invoicesTitle: "Invoices & Receivables",
    paidAmountLabel: "Received $",
  },
  quantityFlow: [
    { label: "Ordered", getValue: (item) => item.quantityOrdered || item.quantity || 0 },
    { label: "Issued", getValue: (item) => item.quantityReleased || item.quantityShipped || 0 },
    { label: "Shipped", getValue: (item) => item.quantityShipped || 0 },
    { label: "Delivered", getValue: (item) => item.quantityReceived || 0 },
    { label: "Accepted", getValue: (item) => item.quantityAccepted || 0 },
    { label: "Paid", getValue: (item) => item.quantityPaid || 0 },
  ],
  showNeedsTab: false,
  qualityLabels: {
    inspectionLabel: "Outgoing Inspection",
    sourceInspectionLabel: "Customer Inspection",
  },
}

/**
 * Get configuration by variant
 */
export function getLineItemModalConfig(variant: LineItemModalVariant): LineItemModalConfig {
  return variant === "so" ? SO_LINE_ITEM_CONFIG : PO_LINE_ITEM_CONFIG
}
