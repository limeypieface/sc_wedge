/**
 * Sales Order Mock Data
 *
 * Sample data for development and testing of Sales Order functionality.
 * Mirrors the structure of Purchase Order mock data for consistency.
 */

import type { EntityId, PrincipalId } from "@/domain/shared";
import type {
  Customer,
  CustomerShipTo,
  SalesOrder,
  SalesOrderLine,
  SalesRep,
  SORevision,
} from "../types";
import { PAYMENT_TERMS, createCustomerCredit } from "../types";
import type { Approver, CurrentUser, ApprovalChain } from "@/types/approval-types";

// =============================================================================
// SALES REPS
// =============================================================================

export const salesReps: SalesRep[] = [
  {
    id: "sr-001" as EntityId,
    name: "Alex Rivera",
    email: "alex.rivera@company.com",
    phone: "555-0101",
    territory: "West Coast",
    commissionRate: 0.05,
  },
  {
    id: "sr-002" as EntityId,
    name: "Jordan Kim",
    email: "jordan.kim@company.com",
    phone: "555-0102",
    territory: "East Coast",
    commissionRate: 0.05,
  },
];

// =============================================================================
// APPROVERS
// =============================================================================

export const salesApprovers: Approver[] = [
  {
    id: "approver-sm-001",
    name: "Morgan Taylor",
    role: "Sales Manager",
    email: "morgan.taylor@company.com",
    level: 1,
  },
  {
    id: "approver-sd-001",
    name: "Casey Chen",
    role: "Sales Director",
    email: "casey.chen@company.com",
    level: 2,
  },
];

// =============================================================================
// SIMULATED USERS
// =============================================================================

export const simulatedUsers: CurrentUser[] = [
  {
    id: "sr-001",
    name: "Alex Rivera",
    role: "Sales Rep",
    email: "alex.rivera@company.com",
    isApprover: false,
  },
  {
    id: "approver-sm-001",
    name: "Morgan Taylor",
    role: "Sales Manager",
    email: "morgan.taylor@company.com",
    isApprover: true,
    approverLevel: 1,
  },
  {
    id: "approver-sd-001",
    name: "Casey Chen",
    role: "Sales Director",
    email: "casey.chen@company.com",
    isApprover: true,
    approverLevel: 2,
  },
];

// =============================================================================
// CUSTOMERS
// =============================================================================

export const customers: Customer[] = [
  {
    id: "cust-001" as EntityId,
    name: "Acme Manufacturing Inc.",
    code: "ACME",
    email: "orders@acme-mfg.com",
    phone: "555-1234",
    address: {
      line1: "123 Industrial Parkway",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "USA",
    },
    contacts: [
      {
        id: "contact-001" as EntityId,
        name: "Bob Wilson",
        role: "Purchasing Manager",
        email: "bob.wilson@acme-mfg.com",
        phone: "555-1234 x101",
        isPrimary: true,
      },
    ],
    accountNumber: "ACME-2024-001",
    customerType: "wholesale",
    credit: createCustomerCredit(50000, {
      currentBalance: 12500,
      availableCredit: 37500,
      pendingOrders: 5000,
      termsDays: 30,
      rating: "good",
    }),
    paymentTerms: PAYMENT_TERMS.NET30,
    taxExempt: false,
    pricingTier: "preferred",
    assignedSalesRep: "sr-001" as EntityId,
    status: "active",
  },
  {
    id: "cust-002" as EntityId,
    name: "TechStart Solutions",
    code: "TECH",
    email: "procurement@techstart.io",
    phone: "555-5678",
    address: {
      line1: "456 Innovation Drive",
      line2: "Suite 200",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "USA",
    },
    contacts: [
      {
        id: "contact-002" as EntityId,
        name: "Sarah Chen",
        role: "Operations Director",
        email: "sarah.chen@techstart.io",
        phone: "555-5678 x200",
        isPrimary: true,
      },
    ],
    accountNumber: "TECH-2024-002",
    customerType: "retail",
    credit: createCustomerCredit(25000, {
      currentBalance: 3200,
      availableCredit: 21800,
      termsDays: 30,
      rating: "excellent",
    }),
    paymentTerms: PAYMENT_TERMS.TWO_TEN_NET30,
    taxExempt: false,
    pricingTier: "standard",
    assignedSalesRep: "sr-002" as EntityId,
    status: "active",
  },
];

// =============================================================================
// SHIP-TO ADDRESSES
// =============================================================================

export const customerShipTos: CustomerShipTo[] = [
  {
    id: "shipto-001" as EntityId,
    customerId: "cust-001" as EntityId,
    name: "Acme Manufacturing - Main Warehouse",
    address: {
      line1: "123 Industrial Parkway",
      line2: "Dock B",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "USA",
    },
    contact: {
      id: "contact-shipto-001" as EntityId,
      name: "Warehouse Receiving",
      email: "receiving@acme-mfg.com",
      phone: "555-1234 x300",
      isPrimary: true,
    },
    isDefault: true,
    shippingInstructions: "Deliver to Dock B. Call 30 min before arrival.",
  },
];

// =============================================================================
// LINE ITEMS
// =============================================================================

export const sampleLineItems: SalesOrderLine[] = [
  {
    id: "line-001" as EntityId,
    lineNumber: 1,
    itemCode: "WDG-100",
    description: "Premium Widget Assembly",
    quantity: 100,
    unit: "EA",
    listPrice: 45.00,
    discountPercent: 10,
    discountAmount: 450.00,
    netPrice: 40.50,
    unitPrice: 40.50,
    lineTotal: 4050.00,
    taxRate: 0.0825,
    taxAmount: 334.13,
    lineStatus: "open",
  },
  {
    id: "line-002" as EntityId,
    lineNumber: 2,
    itemCode: "WDG-200",
    description: "Standard Widget Kit",
    quantity: 50,
    unit: "KIT",
    listPrice: 28.00,
    discountPercent: 5,
    discountAmount: 70.00,
    netPrice: 26.60,
    unitPrice: 26.60,
    lineTotal: 1330.00,
    taxRate: 0.0825,
    taxAmount: 109.73,
    lineStatus: "open",
  },
  {
    id: "line-003" as EntityId,
    lineNumber: 3,
    itemCode: "ACC-050",
    description: "Widget Mounting Hardware",
    quantity: 200,
    unit: "EA",
    listPrice: 3.50,
    discountPercent: 0,
    discountAmount: 0,
    netPrice: 3.50,
    unitPrice: 3.50,
    lineTotal: 700.00,
    taxRate: 0.0825,
    taxAmount: 57.75,
    lineStatus: "open",
  },
];

// =============================================================================
// SAMPLE SALES ORDER
// =============================================================================

export const sampleSalesOrder: SalesOrder = {
  id: "so-001" as EntityId,
  orderNumber: "SO-2024-00142",
  direction: "outbound",
  status: "confirmed",

  externalParty: customers[0],
  internalOwner: "sr-001" as PrincipalId,

  lineItems: sampleLineItems,

  subtotal: 6080.00,
  taxTotal: 501.61,
  chargesTotal: 0,
  discountsTotal: 520.00,
  grandTotal: 6581.61,
  currency: "USD",

  orderDate: "2024-01-15T10:30:00Z",
  requiredDate: "2024-02-01T00:00:00Z",

  customerPO: "ACME-PO-2024-089",
  salesRep: salesReps[0],
  shipTo: customerShipTos[0],
  paymentTerms: PAYMENT_TERMS.NET30,

  shipping: {
    method: "Ground",
    carrier: "FedEx",
    freightTerms: "prepaid",
    estimatedCost: 125.00,
    instructions: "Deliver to Dock B. Call 30 min before arrival.",
  },

  pricing: {
    listTotal: 6600.00,
    discountTotal: 520.00,
    discountPercent: 7.88,
    netTotal: 6080.00,
  },

  priority: "normal",

  createdAt: "2024-01-15T10:30:00Z",
  createdBy: "sr-001" as PrincipalId,
};

// =============================================================================
// SAMPLE REVISIONS
// =============================================================================

export const sampleRevisions: SORevision[] = [
  {
    id: "rev-001",
    orderNumber: "SO-2024-00142",
    version: "1.0",
    status: "confirmed",
    lineItems: sampleLineItems,
    createdAt: "2024-01-15T10:30:00Z",
    createdBy: "sr-001" as PrincipalId,
    submittedAt: "2024-01-15T10:35:00Z",
    submittedBy: "sr-001" as PrincipalId,
    approvedAt: "2024-01-15T11:00:00Z",
    sentAt: "2024-01-15T11:05:00Z",
    sentBy: "sr-001" as PrincipalId,
    confirmedAt: "2024-01-15T14:30:00Z",
    confirmedBy: "Bob Wilson (Acme Manufacturing)",
    changes: [],
    changesSummary: "Initial order",
    isActive: true,
    isDraft: false,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create an approval chain for a Sales Order revision.
 */
export function createApprovalChain(revisionId: string): ApprovalChain {
  return {
    id: `chain-${Date.now()}`,
    revisionId,
    steps: salesApprovers.map(approver => ({
      id: `step-${approver.id}`,
      level: approver.level,
      approver,
      status: "pending" as const,
    })),
    currentLevel: 1,
    isComplete: false,
    startedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

/**
 * Get the next SO number.
 */
export function getNextOrderNumber(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 10000);
  return `SO-${year}-${String(sequence).padStart(5, "0")}`;
}
