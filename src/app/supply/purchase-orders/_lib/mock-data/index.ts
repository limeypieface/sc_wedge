/**
 * Mock Data Module - Self-contained within sindri-prototype
 *
 * Provides mock data for the Purchase Order prototype.
 * In production, this would be replaced with GraphQL queries.
 *
 * Design: Uses the financial-engine for all calculations to ensure
 * the extended totals properly update when qty/price change.
 */

import { LineItemStatus } from "../../../../types/enums";
import type {
  POHeader,
  LineItem,
  POCharge,
  PODiscount,
  POTotals,
  VendorContact,
  PurchaseOrder,
} from "../types";

// ============================================================================
// VENDOR CONTACT
// ============================================================================

export const vendorContact: VendorContact = {
  name: "Daniel Thomas",
  title: "Sales Manager",
  phone: "+1-278-437-1129",
  email: "daniel.thomas@flightechcontrollers.com",
  company: "FlightTech Controllers Inc.",
};

// ============================================================================
// PO HEADER
// ============================================================================

export const poHeader: POHeader = {
  poNumber: "PO-0861",
  status: "partially_received",
  urgency: "high",
  supplier: {
    id: "VEND-001",
    name: "FlightTech Controllers Inc.",
    code: "FTC",
  },
  buyer: {
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
  },
  dates: {
    created: "2026-01-03",
    issued: "2026-01-05",
    acknowledged: "2026-01-06",
    expectedCompletion: "2026-02-10",
  },
  shipping: {
    method: "Ground",
    terms: "FOB Destination",
    destination: "Main Warehouse",
    address: "123 Industrial Park Dr, Building A, Dock 4, Austin, TX 78701",
  },
  payment: {
    terms: "Net 30",
    currency: "USD",
  },
  notes: "Rush order - expedite if possible",
};

// ============================================================================
// LINE ITEMS
// ============================================================================

/**
 * Calculate line total from quantity and unit price
 */
function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

/**
 * Line items with calculated totals
 * The lineTotal is computed from quantity * unitPrice
 */
export const lineItems: LineItem[] = [
  {
    id: 1,
    sku: "FCU-7500-A",
    name: "Flight Control Unit - Primary",
    quantity: 12,
    quantityReceived: 8,
    quantityInQualityHold: 2,
    uom: "EA",
    unitPrice: 2450.0,
    get lineTotal() { return calculateLineTotal(this.quantity, this.unitPrice); },
    status: LineItemStatus.PartiallyReceived,
    promisedDate: "2026-01-20",
    projectCode: "PROJ-2024-001",
    need: {
      needDate: "2026-01-25",
      demandSource: "Work Order WO-4521",
      priority: "high",
    },
    compliance: {
      inspectionRequired: true,
      cocRequired: true,
      faiRequired: false,
      mtrRequired: false,
      sourceInspection: false,
    },
  },
  {
    id: 2,
    sku: "SRV-200-HYD",
    name: "Hydraulic Servo Actuator",
    quantity: 24,
    quantityReceived: 24,
    quantityInQualityHold: 0,
    uom: "EA",
    unitPrice: 875.5,
    get lineTotal() { return calculateLineTotal(this.quantity, this.unitPrice); },
    status: LineItemStatus.Received,
    promisedDate: "2026-01-15",
    projectCode: "PROJ-2024-001",
    need: {
      needDate: "2026-01-20",
      demandSource: "Work Order WO-4522",
      priority: "medium",
    },
    compliance: {
      inspectionRequired: true,
      cocRequired: true,
      faiRequired: false,
      mtrRequired: true,
      sourceInspection: false,
    },
  },
  {
    id: 3,
    sku: "SENS-P350",
    name: "Pressure Sensor Assembly",
    quantity: 48,
    quantityReceived: 0,
    quantityInQualityHold: 0,
    uom: "EA",
    unitPrice: 324.75,
    get lineTotal() { return calculateLineTotal(this.quantity, this.unitPrice); },
    status: LineItemStatus.Pending,
    promisedDate: "2026-02-01",
    projectCode: "PROJ-2024-002",
    need: {
      needDate: "2026-02-05",
      demandSource: "Production Schedule",
      priority: "medium",
    },
    compliance: {
      inspectionRequired: false,
      cocRequired: true,
      faiRequired: false,
      mtrRequired: false,
      sourceInspection: false,
    },
  },
  {
    id: 4,
    sku: "WIRE-MIL-22",
    name: "MIL-SPEC Wire Harness",
    quantity: 100,
    quantityReceived: 50,
    quantityInQualityHold: 0,
    uom: "FT",
    unitPrice: 18.25,
    get lineTotal() { return calculateLineTotal(this.quantity, this.unitPrice); },
    status: LineItemStatus.PartiallyReceived,
    promisedDate: "2026-01-18",
    projectCode: "PROJ-2024-001",
    need: {
      needDate: "2026-01-22",
      demandSource: "Work Order WO-4523",
      priority: "low",
    },
    compliance: {
      inspectionRequired: false,
      cocRequired: false,
      faiRequired: false,
      mtrRequired: false,
      sourceInspection: false,
    },
  },
  {
    id: 5,
    sku: "CONN-D38999",
    name: "D38999 Circular Connector",
    quantity: 36,
    quantityReceived: 0,
    quantityInQualityHold: 0,
    uom: "EA",
    unitPrice: 156.0,
    get lineTotal() { return calculateLineTotal(this.quantity, this.unitPrice); },
    status: LineItemStatus.Backordered,
    promisedDate: "2026-02-15",
    projectCode: "PROJ-2024-002",
    need: {
      needDate: "2026-02-10",
      demandSource: "Production Schedule",
      priority: "critical",
    },
    compliance: {
      inspectionRequired: true,
      cocRequired: true,
      faiRequired: true,
      mtrRequired: false,
      sourceInspection: true,
    },
  },
];

// ============================================================================
// CHARGES
// ============================================================================

export const poCharges: POCharge[] = [
  {
    id: "chg-001",
    type: "shipping",
    name: "Ground Shipping",
    calculation: "fixed",
    rate: 450,
    amount: 450,
    taxable: false,
    billable: true,
  },
  {
    id: "chg-002",
    type: "expedite",
    name: "Expedite Fee - Line 1",
    calculation: "percentage",
    rate: 5,
    baseAmount: 29400, // Line 1 total
    amount: 1470,
    appliesToLines: [1],
    taxable: true,
    billable: true,
  },
  {
    id: "chg-003",
    type: "handling",
    name: "Special Handling",
    calculation: "fixed",
    rate: 125,
    amount: 125,
    taxable: true,
    billable: true,
  },
  {
    id: "chg-004",
    type: "duty",
    name: "Import Duty",
    calculation: "percentage",
    rate: 2.5,
    amount: 1250.89,
    taxable: false,
    billable: true,
  },
];

// ============================================================================
// DISCOUNTS
// ============================================================================

export const poDiscounts: PODiscount[] = [
  {
    id: "disc-001",
    type: "volume",
    name: "Volume Discount",
    calculation: "percentage",
    rate: 3,
    amount: 1500.82,
    isApplied: true,
  },
  {
    id: "disc-002",
    type: "early_payment",
    name: "Early Payment Discount",
    calculation: "percentage",
    rate: 2,
    amount: 1000.55,
    isApplied: false,
    paymentTerms: {
      discountPercent: 2,
      discountDays: 10,
      netDays: 30,
      deadline: "2026-02-05",
    },
  },
];

// ============================================================================
// TAX RATE
// ============================================================================

export const TAX_RATE = 0.0825; // 8.25%

// ============================================================================
// TOTALS CALCULATION
// ============================================================================

/**
 * Compute PO totals from line items, charges, and discounts
 * Uses proper financial calculation to ensure accuracy
 */
export function computePOTotals(
  lines: LineItem[] = lineItems,
  charges: POCharge[] = poCharges,
  discounts: PODiscount[] = poDiscounts
): POTotals {
  // Calculate lines subtotal
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  // Calculate total charges
  const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);

  // Calculate applied discounts only
  const totalDiscounts = discounts
    .filter(d => d.isApplied)
    .reduce((sum, discount) => sum + discount.amount, 0);

  // Calculate taxable amount (subtotal + taxable charges - discounts)
  const taxableCharges = charges
    .filter(c => c.taxable)
    .reduce((sum, c) => sum + c.amount, 0);

  const taxableAmount = subtotal + taxableCharges - totalDiscounts;
  const taxAmount = Math.round(taxableAmount * TAX_RATE * 100) / 100;

  // Grand total
  const grandTotal = subtotal + totalCharges - totalDiscounts + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    taxAmount,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

// ============================================================================
// LINE ITEM OPERATIONS
// ============================================================================

/**
 * Update a line item's quantity and recalculate its total
 */
export function updateLineQuantity(
  lines: LineItem[],
  lineId: number,
  newQuantity: number
): LineItem[] {
  return lines.map(line => {
    if (line.id !== lineId) return line;
    return {
      ...line,
      quantity: newQuantity,
      lineTotal: calculateLineTotal(newQuantity, line.unitPrice),
    };
  });
}

/**
 * Update a line item's unit price and recalculate its total
 */
export function updateLinePrice(
  lines: LineItem[],
  lineId: number,
  newPrice: number
): LineItem[] {
  return lines.map(line => {
    if (line.id !== lineId) return line;
    return {
      ...line,
      unitPrice: newPrice,
      lineTotal: calculateLineTotal(line.quantity, newPrice),
    };
  });
}

/**
 * Update a line item's quantity and price together
 */
export function updateLine(
  lines: LineItem[],
  lineId: number,
  updates: { quantity?: number; unitPrice?: number }
): LineItem[] {
  return lines.map(line => {
    if (line.id !== lineId) return line;
    const newQty = updates.quantity ?? line.quantity;
    const newPrice = updates.unitPrice ?? line.unitPrice;
    return {
      ...line,
      quantity: newQty,
      unitPrice: newPrice,
      lineTotal: calculateLineTotal(newQty, newPrice),
    };
  });
}

// ============================================================================
// COMPLETE PO
// ============================================================================

/**
 * Get complete PO data with computed totals
 */
export function getPurchaseOrder(
  lines: LineItem[] = lineItems,
  charges: POCharge[] = poCharges,
  discounts: PODiscount[] = poDiscounts
): PurchaseOrder {
  return {
    header: poHeader,
    lineItems: lines,
    charges,
    discounts,
    totals: computePOTotals(lines, charges, discounts),
    vendorContact,
  };
}

// ============================================================================
// CHARGE OPERATIONS
// ============================================================================

/**
 * Add a new charge
 */
export function addCharge(
  charges: POCharge[],
  charge: Omit<POCharge, "id">
): POCharge[] {
  return [
    ...charges,
    {
      ...charge,
      id: `chg-${Date.now()}`,
    },
  ];
}

/**
 * Update a charge amount
 */
export function updateChargeAmount(
  charges: POCharge[],
  chargeId: string,
  newAmount: number
): POCharge[] {
  return charges.map(charge =>
    charge.id === chargeId ? { ...charge, amount: newAmount } : charge
  );
}

/**
 * Remove a charge
 */
export function removeCharge(charges: POCharge[], chargeId: string): POCharge[] {
  return charges.filter(charge => charge.id !== chargeId);
}

// ============================================================================
// DISCOUNT OPERATIONS
// ============================================================================

/**
 * Toggle a discount's applied status
 */
export function toggleDiscount(
  discounts: PODiscount[],
  discountId: string
): PODiscount[] {
  return discounts.map(discount =>
    discount.id === discountId
      ? { ...discount, isApplied: !discount.isApplied }
      : discount
  );
}
