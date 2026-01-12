/**
 * Manufacturing Order Types
 *
 * Types for manufacturing orders (MOs) that support sales order fulfillment.
 * Tracks production status, component availability, and delivery risk.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ManufacturingOrderStatus =
  | "planned"      // Created but not released
  | "released"     // Released to production
  | "in_progress"  // Production started
  | "on_hold"      // Blocked (shortage, quality, etc.)
  | "complete"     // Production complete
  | "closed";      // Fully closed

export type ComponentStatus =
  | "available"    // On hand, ready to issue
  | "allocated"    // Reserved for this MO
  | "issued"       // Issued to production
  | "short"        // Not enough on hand
  | "on_order";    // PO exists, awaiting receipt

export type DeliveryRisk =
  | "on_track"     // Will meet delivery date
  | "at_risk"      // May miss delivery date
  | "late";        // Will miss delivery date

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/** A component required for production */
export interface MOComponent {
  id: string;
  lineNumber: number;
  sku: string;
  name: string;
  description?: string;

  // Quantities
  quantityRequired: number;
  quantityOnHand: number;
  quantityAllocated: number;
  quantityIssued: number;
  quantityShort: number;

  // Supply
  quantityOnOrder: number;        // On open POs
  expectedReceiptDate?: string;   // When PO qty expected
  purchaseOrders?: {
    poNumber: string;
    quantity: number;
    expectedDate: string;
    status: "open" | "partial" | "received";
  }[];

  // Status
  status: ComponentStatus;
  unitOfMeasure: string;

  // Cost
  unitCost: number;
  extendedCost: number;
}

/** A production operation/step */
export interface MOOperation {
  id: string;
  operationNumber: number;
  name: string;
  workCenter: string;

  // Time
  setupHours: number;
  runHoursPerUnit: number;
  totalHours: number;
  hoursComplete: number;

  // Quantities
  quantityComplete: number;
  quantityInProcess: number;
  quantityScrapped: number;

  // Status
  status: "pending" | "in_progress" | "complete";
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
}

// ============================================================================
// MANUFACTURING ORDER INTERFACE
// ============================================================================

export interface ManufacturingOrder {
  id: string;
  moNumber: string;

  // What we're building
  itemSku: string;
  itemName: string;
  itemDescription?: string;

  // Quantities
  quantityOrdered: number;
  quantityComplete: number;
  quantityInProcess: number;
  quantityScrapped: number;

  // Status
  status: ManufacturingOrderStatus;
  percentComplete: number;

  // Dates
  releaseDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  requiredDate: string;        // When SO line needs it
  projectedCompletion?: string; // Based on current progress
  actualStart?: string;
  actualEnd?: string;

  // Risk
  deliveryRisk: DeliveryRisk;
  riskReasons?: string[];

  // Relations
  salesOrderNumber: string;
  salesOrderLine: number;
  parentMO?: string;           // For sub-assemblies

  // Components and operations
  components: MOComponent[];
  operations: MOOperation[];

  // Shortages
  hasShortages: boolean;
  shortageCount: number;
  criticalShortages: number;   // Shortages blocking production

  // Summary
  totalMaterialCost: number;
  totalLaborHours: number;
  laborHoursComplete: number;
}

// ============================================================================
// SO STATUS SUMMARY
// ============================================================================

/** Summary of fulfillment status for an SO line */
export interface SOLineFulfillmentStatus {
  lineNumber: number;
  sku: string;
  itemName: string;

  // Quantities
  quantityOrdered: number;
  quantityAvailable: number;    // On hand, ready to ship
  quantityInProduction: number; // Being built
  quantityOnOrder: number;      // Components on PO
  quantityShipped: number;
  quantityOpen: number;         // Still to fulfill

  // Status
  fulfillmentMethod: "stock" | "make" | "buy";  // How we're fulfilling
  deliveryRisk: DeliveryRisk;

  // Manufacturing orders for this line
  manufacturingOrders: ManufacturingOrder[];

  // Dates
  promisedDate: string;
  projectedShipDate?: string;
  daysVariance: number;         // Positive = early, negative = late
}

/** Overall SO fulfillment summary */
export interface SOFulfillmentSummary {
  soNumber: string;
  customerName: string;

  // Overall status
  overallRisk: DeliveryRisk;
  riskSummary: string;

  // Lines
  totalLines: number;
  linesOnTrack: number;
  linesAtRisk: number;
  linesLate: number;

  // Manufacturing orders
  totalMOs: number;
  mosComplete: number;
  mosInProgress: number;
  mosOnHold: number;

  // Shortages
  hasShortages: boolean;
  totalShortages: number;
  criticalShortages: number;    // Blocking production

  // Purchasing
  openPurchaseOrders: number;
  purchaseOrdersAtRisk: number; // Late or quality issues

  // Dates
  promisedDeliveryDate: string;
  projectedDeliveryDate?: string;

  // Line details
  lines: SOLineFulfillmentStatus[];
}
