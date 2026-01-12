// Central mock data file - all components should import from here
// This ensures consistency across the application

import { TAX_RATES, formatTaxRateFromDecimal } from "@/lib/tax-config"
import {
  LineType,
  ServiceBillingType,
  ServiceLineStatus,
  POType,
} from "@/types/enums"
import type {
  ServiceProgress,
  MilestoneItem,
  ServiceLineDetails,
  MilestoneStatus,
} from "@/app/supply/purchase-orders/_lib/types/purchase-order.types"

export interface LineItemNeed {
  id: string
  moNumber: string
  woNumber: string
  qtyNeeded: number
  dateNeeded: string
  customer?: string
  salesOrder?: string
}

export interface LineItem {
  id: number
  lineNumber: number
  sku: string
  name: string
  quantity: number
  unitOfMeasure: string
  unitPrice: number
  lineTotal: number
  status: string
  description: string
  lineStatus: string
  shipToLocationId: string
  warehouseId: string
  promisedDate: string
  acknowledgedStatus: string
  acknowledgedDate: string | null
  originalDueDate: string
  projectCode: string
  itemRevision: string
  leadTimeDays: string
  quantityOrdered: number
  quantityShipped: number
  quantityReceived: number
  quantityAccepted: number
  quantityPaid: number
  quantityInQualityHold: number
  needs: LineItemNeed[]
  requisitionNumber?: string
  expedite?: boolean
  // Financial properties
  subtotal: number
  discountAmount: number
  discountPercent?: number
  taxCode?: "STANDARD" | "EXEMPT" | "REDUCED"
  taxAmount: number
  lineTotalWithTax: number
  expediteFee?: number
  // Service line properties (optional - only for service/NRE lines)
  lineType?: LineType
  serviceDetails?: ServiceLineDetails
  serviceStatus?: ServiceLineStatus
}

export interface ShipmentLine {
  lineNumber: number
  sku: string
  name: string
  qtyShipped: number
  qtyReceived?: number
  qtyAccepted?: number
  qtyOnHold?: number
  qtyRejected?: number
}

export interface NCR {
  id: string
  lineNumber: number
  type: string
  severity: "high" | "medium" | "low"
  status: "open" | "closed"
  description: string
  qtyAffected: number
}

export interface PayableIssue {
  type: "variance" | "pending" | "matched"
  description: string
  amount?: number
}

export type ShipmentStatus = "expected" | "in_transit" | "delivered" | "received" | "on_hold"

export interface Shipment {
  id: string
  status: ShipmentStatus
  carrier?: string
  tracking?: string
  shipDate?: string
  expectedDate: string
  receivedDate?: string
  receivedBy?: string
  location?: string
  lines: ShipmentLine[]
  ncrs?: NCR[]
  payable?: PayableIssue
  holdReason?: string
}

// ============================================
// LINE ITEMS - The source of truth for all quantities
// ============================================
export const lineItems: LineItem[] = [
  {
    id: 1,
    lineNumber: 1,
    sku: "CTL004",
    name: "RC Receiver 2.4GHz Encrypted",
    quantity: 12,
    unitOfMeasure: "EA",
    unitPrice: 107.82,
    lineTotal: 1293.84,
    status: "partially received",
    description: "High-frequency receiver for drone control",
    lineStatus: "Open",
    shipToLocationId: "LOC-001",
    warehouseId: "WH-01",
    promisedDate: "Jan 21, 2026",
    acknowledgedStatus: "Acknowledged",
    acknowledgedDate: "Jan 5, 2026",
    originalDueDate: "Jan 20, 2026",
    projectCode: "PROJ-2025",
    itemRevision: "v2.1",
    leadTimeDays: "10",
    quantityOrdered: 12,
    quantityShipped: 12,
    quantityReceived: 6,
    quantityAccepted: 6,
    quantityPaid: 0,
    quantityInQualityHold: 0,
    needs: [
      { id: "N-001", moNumber: "MO-2026-0142", woNumber: "WO-2026-0142", qtyNeeded: 6, dateNeeded: "Jan 25, 2026", customer: "Acme Corp", salesOrder: "SO-2026-0001" },
      { id: "N-002", moNumber: "MO-2026-0156", woNumber: "WO-2026-0156", qtyNeeded: 6, dateNeeded: "Feb 1, 2026", customer: "TechStart Inc", salesOrder: "SO-2026-0002" },
    ],
    requisitionNumber: "REQ-2026-0089",
    subtotal: 1293.84,
    discountAmount: 0,
    taxAmount: 103.51,
    lineTotalWithTax: 1397.35,
    expediteFee: 50.00,
  },
  {
    id: 2,
    lineNumber: 2,
    sku: "PSW-102",
    name: "Power Supply Unit 500W",
    quantity: 6,
    unitOfMeasure: "EA",
    unitPrice: 245.5,
    lineTotal: 1473.0,
    status: "partially received",
    description: "Industrial power supply for server",
    lineStatus: "Partial",
    shipToLocationId: "LOC-001",
    warehouseId: "WH-01",
    promisedDate: "Jan 28, 2026",
    acknowledgedStatus: "Acknowledged",
    acknowledgedDate: "Jan 6, 2026",
    originalDueDate: "Jan 25, 2026",
    projectCode: "PROJ-2025",
    itemRevision: "v1.0",
    leadTimeDays: "14",
    quantityOrdered: 6,
    quantityShipped: 6,
    quantityReceived: 4,
    quantityAccepted: 3,
    quantityPaid: 0,
    quantityInQualityHold: 1,
    needs: [
      { id: "N-003", moNumber: "MO-2026-0160", woNumber: "WO-2026-0160", qtyNeeded: 6, dateNeeded: "Feb 5, 2026", customer: "Acme Corp", salesOrder: "SO-2026-0001" },
    ],
    requisitionNumber: "REQ-2026-0090",
    subtotal: 1473.0,
    discountAmount: 73.65,
    taxAmount: 117.84,
    lineTotalWithTax: 1517.19,
  },
  {
    id: 3,
    lineNumber: 3,
    sku: "CAB-050",
    name: "Network Cable Cat6 500ft",
    quantity: 2,
    unitOfMeasure: "ROLL",
    unitPrice: 150.0,
    lineTotal: 300.0,
    status: "received",
    description: "High-speed network cabling",
    lineStatus: "Closed",
    shipToLocationId: "LOC-001",
    warehouseId: "WH-02",
    promisedDate: "Feb 5, 2026",
    acknowledgedStatus: "Acknowledged",
    acknowledgedDate: "Jan 10, 2026",
    originalDueDate: "Feb 3, 2026",
    projectCode: "PROJ-2025",
    itemRevision: "v1.0",
    leadTimeDays: "21",
    quantityOrdered: 2,
    quantityShipped: 2,
    quantityReceived: 2,
    quantityAccepted: 2,
    quantityPaid: 0,
    quantityInQualityHold: 0,
    needs: [],
    requisitionNumber: "REQ-2026-0091",
    subtotal: 300.0,
    discountAmount: 0,
    taxAmount: 24.0,
    lineTotalWithTax: 324.0,
  },
  {
    id: 4,
    lineNumber: 4,
    sku: "MON-275",
    name: "Monitor 27in 4K LED",
    quantity: 4,
    unitOfMeasure: "EA",
    unitPrice: 580.0,
    lineTotal: 2320.0,
    status: "open",
    description: "Professional grade display monitor",
    lineStatus: "Open",
    shipToLocationId: "LOC-002",
    warehouseId: "WH-01",
    promisedDate: "Feb 10, 2026",
    acknowledgedStatus: "Acknowledged",
    acknowledgedDate: "Jan 8, 2026",
    originalDueDate: "Feb 8, 2026",
    projectCode: "PROJ-2026",
    itemRevision: "v2.0",
    leadTimeDays: "25",
    quantityOrdered: 4,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityAccepted: 0,
    quantityPaid: 0,
    quantityInQualityHold: 0,
    needs: [
      { id: "N-004", moNumber: "MO-2026-0178", woNumber: "WO-2026-0178", qtyNeeded: 4, dateNeeded: "Feb 15, 2026", customer: "TechStart Inc", salesOrder: "SO-2026-0002" },
    ],
    requisitionNumber: "REQ-2026-0092",
    subtotal: 2320.0,
    discountAmount: 0,
    taxAmount: 185.6,
    lineTotalWithTax: 2505.6,
    expediteFee: 75.00,
  },
  // ============================================
  // SERVICE LINES - Non-physical items with progress tracking
  // ============================================
  {
    id: 5,
    lineNumber: 5,
    sku: "SVC-NRE-001",
    name: "PCB Design Services",
    quantity: 1,
    unitOfMeasure: "LOT",
    unitPrice: 15000.0,
    lineTotal: 15000.0,
    status: "in_progress",
    description: "Custom PCB design for drone controller, including schematic review and layout",
    lineStatus: "In Progress",
    shipToLocationId: "",
    warehouseId: "",
    promisedDate: "Mar 15, 2026",
    acknowledgedStatus: "Acknowledged",
    acknowledgedDate: "Jan 10, 2026",
    originalDueDate: "Mar 15, 2026",
    projectCode: "PROJ-2025",
    itemRevision: "v1.0",
    leadTimeDays: "60",
    quantityOrdered: 1,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityAccepted: 0,
    quantityPaid: 0,
    quantityInQualityHold: 0,
    needs: [],
    subtotal: 15000.0,
    discountAmount: 0,
    taxAmount: 0,
    taxCode: "EXEMPT",
    lineTotalWithTax: 15000.0,
    // Service-specific fields
    lineType: LineType.NRE,
    serviceStatus: ServiceLineStatus.InProgress,
    serviceDetails: {
      billingType: ServiceBillingType.Milestone,
      category: "NRE",
      progress: {
        percentComplete: 40,
        estimatedUnits: 120,
        consumedUnits: 48,
        unitType: "hours",
        lastUpdated: "Jan 20, 2026",
        notes: "Schematic review complete, layout in progress",
      },
      milestones: [
        {
          id: "MS-001",
          name: "Design Review",
          description: "Initial schematic and requirements review",
          amount: 5000,
          dueDate: "Jan 15, 2026",
          status: "completed",
          completedDate: "Jan 14, 2026",
          sequence: 1,
        },
        {
          id: "MS-002",
          name: "Prototype Delivery",
          description: "First prototype board delivery for testing",
          amount: 5000,
          dueDate: "Feb 15, 2026",
          status: "in_progress",
          sequence: 2,
        },
        {
          id: "MS-003",
          name: "Final Approval",
          description: "Final design files and documentation",
          amount: 5000,
          dueDate: "Mar 15, 2026",
          status: "pending",
          sequence: 3,
        },
      ],
      sowReference: "SOW-2026-0042",
      serviceStartDate: "Jan 6, 2026",
      serviceEndDate: "Mar 15, 2026",
    },
  },
  {
    id: 6,
    lineNumber: 6,
    sku: "SVC-CONSULT-001",
    name: "Engineering Consultation",
    quantity: 40,
    unitOfMeasure: "HR",
    unitPrice: 175.0,
    lineTotal: 7000.0,
    status: "in_progress",
    description: "On-site engineering support for system integration",
    lineStatus: "In Progress",
    shipToLocationId: "",
    warehouseId: "",
    promisedDate: "Feb 28, 2026",
    acknowledgedStatus: "Acknowledged",
    acknowledgedDate: "Jan 8, 2026",
    originalDueDate: "Feb 28, 2026",
    projectCode: "PROJ-2025",
    itemRevision: "v1.0",
    leadTimeDays: "45",
    quantityOrdered: 40,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityAccepted: 0,
    quantityPaid: 0,
    quantityInQualityHold: 0,
    needs: [],
    subtotal: 7000.0,
    discountAmount: 0,
    taxAmount: 0,
    taxCode: "EXEMPT",
    lineTotalWithTax: 7000.0,
    // Service-specific fields
    lineType: LineType.Service,
    serviceStatus: ServiceLineStatus.InProgress,
    serviceDetails: {
      billingType: ServiceBillingType.TimeAndMaterials,
      category: "Consulting",
      progress: {
        percentComplete: 25,
        estimatedUnits: 40,
        consumedUnits: 10,
        unitType: "hours",
        lastUpdated: "Jan 18, 2026",
        notes: "Initial assessment and planning complete",
      },
      rate: 175,
      rateUnit: "hour",
      nteAmount: 10000,
      sowReference: "SOW-2026-0043",
      serviceStartDate: "Jan 10, 2026",
      serviceEndDate: "Feb 28, 2026",
    },
  },
  {
    id: 7,
    lineNumber: 7,
    sku: "SVC-INSTALL-001",
    name: "Equipment Installation",
    quantity: 1,
    unitOfMeasure: "LOT",
    unitPrice: 2500.0,
    lineTotal: 2500.0,
    status: "not_started",
    description: "On-site installation and commissioning of control equipment",
    lineStatus: "Not Started",
    shipToLocationId: "",
    warehouseId: "",
    promisedDate: "Mar 1, 2026",
    acknowledgedStatus: "Acknowledged",
    acknowledgedDate: "Jan 9, 2026",
    originalDueDate: "Mar 1, 2026",
    projectCode: "PROJ-2025",
    itemRevision: "v1.0",
    leadTimeDays: "50",
    quantityOrdered: 1,
    quantityShipped: 0,
    quantityReceived: 0,
    quantityAccepted: 0,
    quantityPaid: 0,
    quantityInQualityHold: 0,
    needs: [],
    subtotal: 2500.0,
    discountAmount: 0,
    taxAmount: 0,
    taxCode: "EXEMPT",
    lineTotalWithTax: 2500.0,
    // Service-specific fields
    lineType: LineType.Service,
    serviceStatus: ServiceLineStatus.NotStarted,
    serviceDetails: {
      billingType: ServiceBillingType.FixedPrice,
      category: "Installation",
      progress: {
        percentComplete: 0,
        estimatedUnits: 16,
        consumedUnits: 0,
        unitType: "hours",
      },
      serviceStartDate: "Feb 25, 2026",
      serviceEndDate: "Mar 1, 2026",
    },
  },
]

// ============================================
// SHIPMENTS - Must match line item quantities
// ============================================
// Summary:
// - SHP-001: Received - Line 1 (CTL004 × 6), Line 3 (CAB-050 × 2) = 8 units
// - SHP-002: Received - Line 2 (PSW-102 × 4), 3 accepted + 1 hold = 4 units
// - SHP-003: In Transit - Line 2 (PSW-102 × 2), Line 1 (CTL004 × 6) = 8 units
// - SHP-004: Expected - Line 4 (MON-275 × 4) = 4 units
//
// Total shipped: 8 + 4 + 8 + 4 = 24 units
// Total received: 8 + 4 = 12 units
// Total accepted: 8 + 3 = 11 units
// Total on hold: 1 unit
// ============================================
export const shipments: Shipment[] = [
  {
    id: "SHP-001",
    status: "received",
    carrier: "FedEx",
    tracking: "FDX-0029384756",
    shipDate: "Jan 15, 2026",
    expectedDate: "Jan 17, 2026",
    receivedDate: "Jan 17, 2026",
    receivedBy: "Mike Wilson",
    location: "Main Office",
    lines: [
      { lineNumber: 1, sku: "CTL004", name: "RC Receiver 2.4GHz Encrypted", qtyShipped: 6, qtyReceived: 6, qtyAccepted: 6, qtyOnHold: 0, qtyRejected: 0 },
      { lineNumber: 3, sku: "CAB-050", name: "Network Cable Cat6 500ft", qtyShipped: 2, qtyReceived: 2, qtyAccepted: 2, qtyOnHold: 0, qtyRejected: 0 },
    ],
    payable: { type: "matched", description: "Invoice matched", amount: 947.92 },
  },
  {
    id: "SHP-002",
    status: "received",
    carrier: "FedEx",
    tracking: "FDX-0029384801",
    shipDate: "Jan 19, 2026",
    expectedDate: "Jan 21, 2026",
    receivedDate: "Jan 21, 2026",
    receivedBy: "Mike Wilson",
    location: "Main Office",
    lines: [
      { lineNumber: 2, sku: "PSW-102", name: "Power Supply Unit 500W", qtyShipped: 4, qtyReceived: 4, qtyAccepted: 3, qtyOnHold: 1, qtyRejected: 0 },
    ],
    ncrs: [
      { id: "NCR-2026-0142", lineNumber: 2, type: "Inspection Failure", severity: "high", status: "open", description: "Unit failed continuity test", qtyAffected: 1 },
    ],
    payable: { type: "variance", description: "Invoice qty (4) vs accepted qty (3)", amount: 245.50 },
  },
  {
    id: "SHP-003",
    status: "in_transit",
    carrier: "FedEx",
    tracking: "FDX-0029385102",
    shipDate: "Jan 25, 2026",
    expectedDate: "Jan 28, 2026",
    lines: [
      { lineNumber: 2, sku: "PSW-102", name: "Power Supply Unit 500W", qtyShipped: 2 },
      { lineNumber: 1, sku: "CTL004", name: "RC Receiver 2.4GHz Encrypted", qtyShipped: 6 },
    ],
  },
  {
    id: "SHP-004",
    status: "expected",
    expectedDate: "Feb 10, 2026",
    lines: [
      { lineNumber: 4, sku: "MON-275", name: "Monitor 27in 4K LED", qtyShipped: 4 },
    ],
  },
]

// ============================================
// COMPUTED STATS - Derived from shipment data
// ============================================
export function computeReceivingStats() {
  const totalOrdered = lineItems.reduce((sum, item) => sum + item.quantityOrdered, 0)

  const totalShipped = shipments.reduce((sum, s) =>
    sum + s.lines.reduce((lineSum, line) => lineSum + line.qtyShipped, 0), 0)

  const totalReceived = shipments.reduce((sum, s) =>
    sum + s.lines.reduce((lineSum, line) => lineSum + (line.qtyReceived || 0), 0), 0)

  const totalAccepted = shipments.reduce((sum, s) =>
    sum + s.lines.reduce((lineSum, line) => lineSum + (line.qtyAccepted || 0), 0), 0)

  const totalOnHold = shipments.reduce((sum, s) =>
    sum + s.lines.reduce((lineSum, line) => lineSum + (line.qtyOnHold || 0), 0), 0)

  return {
    totalOrdered,
    totalShipped,
    totalReceived,
    totalAccepted,
    totalOnHold,
  }
}

// Helper to get line number by SKU
export function getLineNumberBySku(sku: string): number {
  const item = lineItems.find(i => i.sku === sku)
  return item?.lineNumber ?? 0
}

// ============================================
// VENDOR CONTACT
// ============================================
export interface VendorContact {
  id: string
  name: string
  email: string
  phone: string
  role: string
  company: string
}

export const vendorContact: VendorContact = {
  id: "VC-001",
  name: "Sarah Chen",
  email: "sarah.chen@techsuppliers.com",
  phone: "+1 (555) 234-5678",
  role: "Account Manager",
  company: "Tech Suppliers Inc.",
}

// ============================================
// CHARGE TYPES
// ============================================
export type ChargeType = "freight" | "handling" | "insurance" | "tax" | "discount" | "other" | "shipping" | "expedite" | "duties"
export type ChargeCalculation = "fixed" | "percentage" | "per_unit"

export interface POCharge {
  id: string
  type: ChargeType
  description: string
  calculation: ChargeCalculation
  amount: number
  lineId?: number
  rate?: number
  appliesToLines?: number[]
  taxable?: boolean
  billable?: boolean
}

// ============================================
// PO HEADER
// ============================================
export interface POHeader {
  poNumber: string
  vendorName: string
  vendorId: string
  status: string
  createdDate: string
  promisedDate: string
  buyer: string
  paymentTerms: string
  shippingMethod: string
  currency: string
  totalAmount: number
  revision?: number
  supplier: {
    name: string
    id: string
    contact: VendorContact
  }
  dates: {
    created: string
    promised: string
    requested: string
    acknowledged?: string
  }
  urgency: "low" | "medium" | "high" | "critical"
  shipping: {
    method: string
    carrier?: string
    account?: string
    instructions?: string
  }
  payment: {
    terms: string
    method?: string
    discount?: string
  }
}

export const poHeader: POHeader = {
  poNumber: "PO-2026-00142",
  vendorName: "Tech Suppliers Inc.",
  vendorId: "V-1001",
  status: "Open",
  createdDate: "Jan 5, 2026",
  promisedDate: "Feb 15, 2026",
  buyer: "John Smith",
  paymentTerms: "Net 30",
  shippingMethod: "Ground",
  currency: "USD",
  totalAmount: 5386.84,
  revision: 0,
  supplier: {
    name: "Tech Suppliers Inc.",
    id: "V-1001",
    contact: {
      id: "VC-001",
      name: "Sarah Chen",
      email: "sarah.chen@techsuppliers.com",
      phone: "+1 (555) 234-5678",
      role: "Account Manager",
      company: "Tech Suppliers Inc.",
    },
  },
  dates: {
    created: "Jan 5, 2026",
    promised: "Feb 15, 2026",
    requested: "Feb 10, 2026",
    acknowledged: "Jan 6, 2026",
  },
  urgency: "medium",
  shipping: {
    method: "Ground",
    carrier: "FedEx",
    account: "FEDEX-12345",
    instructions: "Deliver to loading dock B",
  },
  payment: {
    terms: "Net 30",
    method: "ACH",
    discount: "2% 10 Net 30",
  },
}

// ============================================
// APPROVERS
// ============================================
export interface Approver {
  id: string
  name: string
  role: string
  email: string
  approvalLimit: number
}

export const approvers: Approver[] = [
  { id: "A-001", name: "Mike Johnson", role: "Purchasing Manager", email: "mike.johnson@company.com", approvalLimit: 10000 },
  { id: "A-002", name: "Sarah Williams", role: "Finance Director", email: "sarah.williams@company.com", approvalLimit: 50000 },
  { id: "A-003", name: "David Lee", role: "VP Operations", email: "david.lee@company.com", approvalLimit: 100000 },
]

// ============================================
// INVOICES
// ============================================
export interface InvoiceLine {
  lineNumber: number
  sku: string
  qtyInvoiced: number
  unitPrice: number
  lineTotal: number
}

export interface Invoice {
  id: string
  number: string
  date: string
  dueDate?: string
  amount: number
  totalAmount: number
  status: "pending" | "matched" | "variance" | "paid" | "approved" | "disputed"
  shipmentId?: string
  lines: InvoiceLine[]
}

export const invoices: Invoice[] = [
  {
    id: "INV-001",
    number: "INV-2026-0891",
    date: "Jan 18, 2026",
    dueDate: "Feb 17, 2026",
    amount: 946.92,
    totalAmount: 946.92,
    status: "matched",
    shipmentId: "SHP-001",
    lines: [
      { lineNumber: 1, sku: "CTL004", qtyInvoiced: 6, unitPrice: 107.82, lineTotal: 646.92 },
      { lineNumber: 3, sku: "CAB-050", qtyInvoiced: 2, unitPrice: 150.00, lineTotal: 300.00 },
    ]
  },
  {
    id: "INV-002",
    number: "INV-2026-0094",
    date: "Jan 22, 2026",
    dueDate: "Feb 21, 2026",
    amount: 982.00,
    totalAmount: 982.00,
    status: "disputed",
    shipmentId: "SHP-002",
    lines: [
      { lineNumber: 2, sku: "PSW-102", qtyInvoiced: 4, unitPrice: 245.50, lineTotal: 982.00 },
    ]
  },
]

// ============================================
// PEGGED NEEDS (MRP)
// ============================================
export interface PeggedNeed {
  id: string
  lineNumber: number
  type: "MO" | "SO"
  referenceNumber: string
  projectName: string
  customer?: string
  qtyNeeded: number
  qtyAllocated: number
  needDate: string
  priority: "critical" | "high" | "medium" | "low"
  parentSO?: {
    number: string
    customer: string
    dueDate: string
  }
  notes?: string
}

export const peggedNeeds: PeggedNeed[] = [
  // Line 1: Titanium Alloy Ti-6Al-4V Bar - High demand from aerospace MOs
  {
    id: "PN-001",
    lineNumber: 1,
    type: "MO",
    referenceNumber: "MO-2026-0142",
    projectName: "F-35 Landing Gear Assembly",
    customer: "Lockheed Martin",
    qtyNeeded: 6,
    qtyAllocated: 4,
    needDate: "Jan 25, 2026",
    priority: "critical",
    parentSO: {
      number: "SO-2025-1847",
      customer: "Lockheed Martin",
      dueDate: "Feb 10, 2026"
    },
    notes: "Critical path item - line stop if delayed"
  },
  {
    id: "PN-002",
    lineNumber: 1,
    type: "MO",
    referenceNumber: "MO-2026-0156",
    projectName: "Boeing 787 Bracket Kit",
    customer: "Boeing",
    qtyNeeded: 6,
    qtyAllocated: 4,
    needDate: "Feb 1, 2026",
    priority: "high",
    parentSO: {
      number: "SO-2025-1892",
      customer: "Boeing",
      dueDate: "Feb 20, 2026"
    }
  },
  {
    id: "PN-003",
    lineNumber: 1,
    type: "SO",
    referenceNumber: "SO-2025-1920",
    projectName: "Stock Replenishment",
    customer: "SpaceX",
    qtyNeeded: 4,
    qtyAllocated: 0,
    needDate: "Feb 15, 2026",
    priority: "medium"
  },
  // Line 2: Precision Stainless Washers
  {
    id: "PN-004",
    lineNumber: 2,
    type: "MO",
    referenceNumber: "MO-2026-0178",
    projectName: "Engine Mount Assembly",
    customer: "Pratt & Whitney",
    qtyNeeded: 150,
    qtyAllocated: 100,
    needDate: "Jan 30, 2026",
    priority: "high",
    parentSO: {
      number: "SO-2025-1856",
      customer: "Pratt & Whitney",
      dueDate: "Feb 15, 2026"
    }
  },
  {
    id: "PN-005",
    lineNumber: 2,
    type: "MO",
    referenceNumber: "MO-2026-0192",
    projectName: "Gearbox Rebuild Kit",
    qtyNeeded: 100,
    qtyAllocated: 100,
    needDate: "Feb 10, 2026",
    priority: "medium"
  },
  // Line 4: Aerospace Grade Fasteners
  {
    id: "PN-006",
    lineNumber: 4,
    type: "MO",
    referenceNumber: "MO-2026-0201",
    projectName: "Wing Spar Assembly",
    customer: "Airbus",
    qtyNeeded: 500,
    qtyAllocated: 200,
    needDate: "Feb 5, 2026",
    priority: "critical",
    parentSO: {
      number: "SO-2025-1901",
      customer: "Airbus",
      dueDate: "Feb 28, 2026"
    },
    notes: "Long lead item - expedite if possible"
  },
  {
    id: "PN-007",
    lineNumber: 4,
    type: "SO",
    referenceNumber: "SO-2025-1945",
    projectName: "Direct Ship Order",
    customer: "Northrop Grumman",
    qtyNeeded: 300,
    qtyAllocated: 0,
    needDate: "Feb 20, 2026",
    priority: "medium"
  }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a need is at risk of not being fulfilled
 */
export function isNeedAtRisk(need: PeggedNeed): { atRisk: boolean; reason: string } {
  const item = lineItems.find(i => i.lineNumber === need.lineNumber)
  if (!item) {
    return { atRisk: true, reason: "Line item not found" }
  }

  const available = item.quantityAccepted || 0
  const shortfall = need.qtyNeeded - need.qtyAllocated

  if (shortfall <= 0) {
    return { atRisk: false, reason: "" }
  }

  // Check if there's enough accepted quantity to cover the shortfall
  const totalAllocatedToLine = peggedNeeds
    .filter(n => n.lineNumber === need.lineNumber)
    .reduce((sum, n) => sum + n.qtyAllocated, 0)

  const unallocatedAvailable = available - totalAllocatedToLine

  if (unallocatedAvailable < shortfall) {
    if (item.quantityReceived < item.quantityOrdered) {
      return { atRisk: true, reason: "Awaiting receipt" }
    }
    if (item.quantityInQualityHold > 0) {
      return { atRisk: true, reason: "Quality hold" }
    }
    return { atRisk: true, reason: `${shortfall} units short` }
  }

  return { atRisk: false, reason: "" }
}

/**
 * Get all needs for a specific line
 */
export function getNeedsForLine(lineNumber: number): PeggedNeed[] {
  return peggedNeeds
    .filter(n => n.lineNumber === lineNumber)
    .sort((a, b) => {
      // Sort by priority first (critical > high > medium > low)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      // Then by need date
      return new Date(a.needDate).getTime() - new Date(b.needDate).getTime()
    })
}

/**
 * Compute summary statistics for all needs
 */
export function computeNeedsStats() {
  const allNeeds = peggedNeeds
  const atRiskNeeds = allNeeds.filter(n => isNeedAtRisk(n).atRisk)
  const criticalNeeds = allNeeds.filter(n => n.priority === "critical")
  const fulfilledNeeds = allNeeds.filter(n => n.qtyAllocated >= n.qtyNeeded)

  return {
    totalNeeds: allNeeds.length,
    atRisk: atRiskNeeds.length,
    critical: criticalNeeds.filter(n => isNeedAtRisk(n).atRisk).length,
    fulfilled: fulfilledNeeds.length,
    totalQtyNeeded: allNeeds.reduce((sum, n) => sum + n.qtyNeeded, 0),
    totalQtyAllocated: allNeeds.reduce((sum, n) => sum + n.qtyAllocated, 0),
  }
}

export function getPOData(orderNumber?: string) {
  // Return data for both PO and SO order types
  // For SO orders, we return the same mock data with adjusted header
  if (orderNumber?.startsWith("SO-")) {
    return {
      header: { ...poHeader, poNumber: orderNumber },
      lineItems: lineItems,
      lines: lineItems,
      vendorContact: poHeader.supplier?.contact,
      shipments,
      invoices,
      charges: poCharges,
    }
  }

  return {
    header: poHeader,
    lineItems: lineItems,
    lines: lineItems,
    vendorContact: poHeader.supplier?.contact,
    shipments,
    invoices,
    charges: poCharges,
  }
}

export function getChargesByLine(lineId: number): POCharge[] {
  // Return charges for a specific line
  return []
}

export function computeLineFinancials(lineId?: number) {
  // If no lineId provided, return financials for all lines
  if (lineId === undefined) {
    return lineItems.map(line => ({
      lineNumber: line.lineNumber,
      ordered: line.quantityOrdered * line.unitPrice,
      received: line.quantityReceived * line.unitPrice,
      accepted: line.quantityAccepted * line.unitPrice,
      variance: 0,
      matchStatus: "matched" as const,
    }))
  }

  const line = lineItems.find(l => l.id === lineId)
  if (!line) return null
  return {
    lineNumber: line.lineNumber,
    ordered: line.quantityOrdered * line.unitPrice,
    received: line.quantityReceived * line.unitPrice,
    accepted: line.quantityAccepted * line.unitPrice,
    variance: 0,
    matchStatus: "matched" as const,
  }
}

export type IssueCategory = "quality_hold" | "ncr" | "shipment" | "invoice" | "delivery" | "payable" | "revision"

export interface POIssue {
  id: string
  issueNumber?: string
  type: "receiving" | "quality" | "invoice" | "delivery" | "revision"
  category?: IssueCategory
  title?: string
  severity: "high" | "medium" | "low"
  priority?: "critical" | "high" | "medium" | "low"
  description: string
  suggestedAction?: string
  lineId?: number
  lineNumber?: number
  shipmentId?: string
  invoiceId?: string
  // NCR-related
  ncrId?: string
  sku?: string
  qtyAffected?: number
  dueDate?: string
  amount?: number
  // Revision-related
  revisionId?: string
  revisionVersion?: string
}

// Helper to extract order type and suffix for issue numbering
// e.g., "PO-2026-00142" -> { type: "PO", suffix: "00142" }
// e.g., "SO-2026-0001" -> { type: "SO", suffix: "0001" }
function getOrderInfo(orderNumber?: string): { type: "PO" | "SO"; suffix: string } {
  const num = orderNumber || poHeader.poNumber
  const parts = num.split("-")
  const type = parts[0] === "SO" ? "SO" : "PO"
  const suffix = parts[parts.length - 1] || "0000"
  return { type, suffix }
}

// Legacy function for backwards compatibility
function getPOSuffix(poNumber?: string): string {
  return getOrderInfo(poNumber).suffix
}

// Helper to generate issue number in format ISS-{TYPE}-{SUFFIX}-{SEQ}
// e.g., ISS-PO-0861-001 or ISS-SO-0001-001
function generateIssueNumber(orderNumber: string | undefined, sequence: number): string {
  const { type, suffix } = getOrderInfo(orderNumber)
  return `ISS-${type}-${suffix}-${sequence.toString().padStart(3, "0")}`
}

export function detectPOIssuesForPO(orderNumber?: string): POIssue[] {
  const poNum = orderNumber || poHeader.poNumber
  const { type, suffix } = getOrderInfo(poNum)

  // Return a comprehensive set of mock issues
  const issues: POIssue[] = [
    // Critical: NCR - Inspection Failure
    {
      id: `ISS-${type}-${suffix}-001`,
      issueNumber: `ISS-${type}-${suffix}-001`,
      type: "quality",
      category: "ncr",
      ncrId: "NCR-2026-0142",
      title: "NCR NCR-2026-0142: Inspection Failure",
      severity: "critical",
      priority: "critical",
      description: "1 unit failed inspection. Unit failed continuity test during incoming QC.",
      suggestedAction: "contact_vendor",
      dueDate: "Jan 28, 2026",
      sku: "PSW-102",
      lineId: 2,
      lineNumber: 2,
      shipmentId: "SHP-002",
      qtyAffected: 1,
    },
    // High: Invoice Disputed
    {
      id: `ISS-${type}-${suffix}-002`,
      issueNumber: `ISS-${type}-${suffix}-002`,
      type: "invoice",
      category: "invoice",
      title: "Invoice INV-2026-0094 disputed",
      severity: "high",
      priority: "high",
      description: "Price variance detected. Invoice shows $245.50/unit vs PO price $242.00/unit. Total variance: $14.00",
      suggestedAction: "contact_vendor",
      dueDate: "Feb 21, 2026",
      invoiceId: "INV-2026-0094",
      shipmentId: "SHP-002",
      amount: 14.00,
    },
    // Medium: Shipment in transit
    {
      id: `ISS-${type}-${suffix}-003`,
      issueNumber: `ISS-${type}-${suffix}-003`,
      type: "shipment",
      category: "shipment",
      title: "SHP-003 in transit",
      severity: "medium",
      priority: "medium",
      description: "Shipment departed origin facility. Tracking shows on-time delivery expected.",
      suggestedAction: "track_shipment",
      dueDate: "Jan 28, 2026",
      shipmentId: "SHP-003",
    },
    // Medium: Shipment awaiting pickup
    {
      id: `ISS-${type}-${suffix}-004`,
      issueNumber: `ISS-${type}-${suffix}-004`,
      type: "shipment",
      category: "shipment",
      title: "SHP-004 awaiting shipment",
      severity: "medium",
      priority: "medium",
      description: "Shipment ready for carrier pickup. Pickup scheduled for tomorrow.",
      suggestedAction: "track_shipment",
      dueDate: "Feb 10, 2026",
      shipmentId: "SHP-004",
    },
  ]

  return issues
}

// Generate a revision notification issue when a draft is created
export interface RevisionIssueParams {
  poNumber: string
  revisionId: string
  revisionVersion: string
  createdBy: string
  createdAt: string
}

export function createRevisionNotificationIssue(params: RevisionIssueParams): POIssue {
  const { type, suffix } = getOrderInfo(params.poNumber)
  const issueNumber = `ISS-${type}-${suffix}-REV`

  return {
    id: issueNumber,
    issueNumber,
    type: "revision",
    category: "revision",
    title: `Change v${params.revisionVersion}: Notify vendor of pending changes`,
    severity: "medium",
    priority: "medium",
    description: `A draft revision (v${params.revisionVersion}) is in progress. Consider giving the vendor a heads up about upcoming changes before sending the formal change order.`,
    suggestedAction: "notify_vendor",
    dueDate: params.createdAt,
    revisionId: params.revisionId,
    revisionVersion: params.revisionVersion,
  }
}

// Get issues including any active revision notifications
export function detectPOIssuesWithRevision(
  orderNumber?: string,
  activeRevision?: { id: string; version: string; createdAt: string; createdBy: string } | null
): POIssue[] {
  const baseIssues = detectPOIssuesForPO(orderNumber)

  // If there's an active draft revision, add a notification issue
  if (activeRevision) {
    const poNum = orderNumber || poHeader.poNumber
    const revisionIssue = createRevisionNotificationIssue({
      poNumber: poNum,
      revisionId: activeRevision.id,
      revisionVersion: activeRevision.version,
      createdBy: activeRevision.createdBy,
      createdAt: activeRevision.createdAt,
    })
    return [revisionIssue, ...baseIssues]
  }

  return baseIssues
}

// ============================================
// SALES ORDER ISSUES
// ============================================
export type SOIssueCategory =
  | "customer_complaint"
  | "backorder"
  | "shipment_delay"
  | "billing_dispute"
  | "return_request"
  | "delivery"

export interface SOIssue {
  id: string
  issueNumber: string
  category: SOIssueCategory
  priority: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  createdDate: string
  customerNotified: boolean
  lineNumber?: number
  affectedQuantity?: number
  estimatedResolution?: string
  suggestedAction: string
}

// Helper to extract order suffix for issue numbering
function getOrderSuffix(orderNumber: string): string {
  const parts = orderNumber.split("-")
  return parts[parts.length - 1] || "00000"
}

// Helper to generate SO issue number in format ISS-SO-{SUFFIX}-{SEQ}
function generateSOIssueNumber(soNumber: string, sequence: number): string {
  const { type, suffix } = getOrderInfo(soNumber)
  return `ISS-${type}-${suffix}-${sequence.toString().padStart(3, "0")}`
}

export function detectSOIssuesForSO(soNumber: string): SOIssue[] {
  const { type, suffix } = getOrderInfo(soNumber)

  // Return a comprehensive set of mock SO issues
  const issues: SOIssue[] = [
    // Critical: Customer RMA Request
    {
      id: `ISS-${type}-${suffix}-001`,
      issueNumber: `ISS-${type}-${suffix}-001`,
      category: "return_request",
      priority: "critical",
      title: "RMA-2026-0089: Customer Return Request",
      description: "Customer reported 3 units with cosmetic defects. RMA approved, awaiting return shipment.",
      createdDate: "Jan 6, 2026",
      customerNotified: true,
      affectedQuantity: 3,
      suggestedAction: "process_return",
    },
    // High: Late Delivery
    {
      id: `ISS-${type}-${suffix}-002`,
      issueNumber: `ISS-${type}-${suffix}-002`,
      category: "delivery",
      priority: "high",
      title: "Late delivery: Order past promised date",
      description: "Original delivery date was Jan 20, 2026. Customer escalated. Expedite requested.",
      createdDate: "Jan 22, 2026",
      customerNotified: true,
      estimatedResolution: "Jan 25, 2026",
      suggestedAction: "call_customer",
    },
    // High: Backorder
    {
      id: `ISS-${type}-${suffix}-003`,
      issueNumber: `ISS-${type}-${suffix}-003`,
      category: "backorder",
      priority: "high",
      title: "Partial Backorder on Line 2",
      description: "8 of 12 units backordered due to inventory shortage. Supplier ETA: Feb 15, 2026.",
      createdDate: "Jan 8, 2026",
      customerNotified: false,
      lineNumber: 2,
      affectedQuantity: 8,
      estimatedResolution: "Feb 15, 2026",
      suggestedAction: "email_customer",
    },
    // Medium: Billing Dispute
    {
      id: `ISS-${type}-${suffix}-004`,
      issueNumber: `ISS-${type}-${suffix}-004`,
      category: "billing_dispute",
      priority: "medium",
      title: "Invoice pricing discrepancy",
      description: "Customer disputes unit price on line 1. Contract shows $142.50, invoice shows $145.00.",
      createdDate: "Jan 9, 2026",
      customerNotified: true,
      lineNumber: 1,
      suggestedAction: "review_invoice",
    },
    // Medium: Shipment Delay
    {
      id: `ISS-${type}-${suffix}-005`,
      issueNumber: `ISS-${type}-${suffix}-005`,
      category: "shipment_delay",
      priority: "medium",
      title: "Carrier delay - weather related",
      description: "Carrier reported weather-related delay. New ETA is 2 days later than promised.",
      createdDate: "Jan 10, 2026",
      customerNotified: true,
      estimatedResolution: "Jan 14, 2026",
      suggestedAction: "call_customer",
    },
    // Low: Address Change
    {
      id: `ISS-${type}-${suffix}-006`,
      issueNumber: `ISS-${type}-${suffix}-006`,
      category: "delivery",
      priority: "low",
      title: "Delivery address update requested",
      description: "Customer requested shipping address change for remaining items. Pending confirmation.",
      createdDate: "Jan 11, 2026",
      customerNotified: true,
      suggestedAction: "email_customer",
    },
  ]

  return issues
}

export function detectSOIssues(): SOIssue[] {
  // Detect issues across all SOs
  return Object.keys(purchaseOrdersData)
    .filter(key => key.startsWith("SO-"))
    .flatMap(soNumber => detectSOIssuesForSO(soNumber))
}

// ============================================
// SIMULATED USERS (for demo/testing)
// ============================================
export interface SimulatedUser {
  id: string
  name: string
  role: string
  email: string
  avatar?: string
  isApprover: boolean
  approverLevel?: number
  approvalLimit: number
}

export const simulatedUsers: SimulatedUser[] = [
  { id: "U-001", name: "John Smith", role: "Buyer", email: "john.smith@company.com", isApprover: false, approvalLimit: 0 },
  { id: "U-002", name: "Mike Johnson", role: "Purchasing Manager", email: "mike.johnson@company.com", isApprover: true, approverLevel: 1, approvalLimit: 10000 },
  { id: "U-003", name: "Sarah Williams", role: "Finance Director", email: "sarah.williams@company.com", isApprover: true, approverLevel: 2, approvalLimit: 100000 },
]

// ============================================
// REVISIONS
// ============================================
export interface PORevisionData {
  id: string
  version: number
  status: "draft" | "pending_approval" | "approved" | "rejected" | "superseded"
  createdBy: string
  createdAt: string
  changes: Array<{
    field: string
    oldValue: string
    newValue: string
  }>
}

export const initialRevisions: PORevisionData[] = [
  {
    id: "REV-001",
    version: 0,
    status: "approved",
    createdBy: "John Smith",
    createdAt: "Jan 5, 2026",
    changes: [],
  },
]

export function createApprovalChain(amount: number): Approver[] {
  return approvers.filter(a => a.approvalLimit >= amount).slice(0, 2)
}

export function getNextVersionNumber(): number {
  return initialRevisions.length
}

// ============================================
// PO CHARGES
// ============================================
export const poCharges: POCharge[] = [
  { id: "CHG-001", type: "freight", description: "Ground Shipping", calculation: "fixed", amount: 125.00 },
  { id: "CHG-002", type: "tax", description: `Sales Tax (${formatTaxRateFromDecimal(TAX_RATES.STANDARD)})`, calculation: "percentage", amount: 430.95, taxable: false },
]

// ============================================
// TOLERANCE STATUS
// ============================================
export type ToleranceStatus = "within" | "warning" | "exceeded"

// ============================================
// PO DATA TYPE
// ============================================
export interface POData {
  header: POHeader
  lines: LineItem[]
  shipments: Shipment[]
  invoices: Invoice[]
  charges: POCharge[]
}

// ============================================
// PURCHASE ORDERS DATA (multiple POs)
// ============================================
export const purchaseOrdersData: Record<string, POData> = {
  "PO-2026-00142": {
    header: poHeader,
    lines: lineItems,
    shipments,
    invoices,
    charges: poCharges,
  },
}

// ============================================
// ADDITIONAL HELPER FUNCTIONS
// ============================================
export function computePOTotals(lines: LineItem[] = lineItems, charges: POCharge[] = poCharges) {
  // Sum line-level values directly from each line item
  // lineTotal = qty * unitPrice - discounts (before tax)
  const linesSubtotal = lines.reduce((sum, l) => sum + (l.lineTotal || 0), 0)

  // Sum actual line-level taxes (not hardcoded rate)
  const linesTax = lines.reduce((sum, l) => sum + (l.taxAmount || 0), 0)

  // Sum actual line-level discounts
  const lineDiscounts = lines.reduce((sum, l) => sum + (l.discountAmount || 0), 0)

  // Process charges by type
  const discountCharges = charges.filter(c => c.type === "discount")
  const headerDiscountAmount = discountCharges.reduce((sum, c) => sum + c.amount, 0)
  const taxCharges = charges.filter(c => c.type === "tax")
  const headerTaxAmount = taxCharges.reduce((sum, c) => sum + c.amount, 0)
  const freightCharges = charges.filter(c => c.type === "freight" || c.type === "shipping")
  const freightAmount = freightCharges.reduce((sum, c) => sum + c.amount, 0)
  const handlingCharges = charges.filter(c => c.type === "handling")
  const handlingAmount = handlingCharges.reduce((sum, c) => sum + c.amount, 0)
  const insuranceCharges = charges.filter(c => c.type === "insurance")
  const insuranceAmount = insuranceCharges.reduce((sum, c) => sum + c.amount, 0)
  const otherCharges = charges.filter(c => c.type === "other")
  const otherAmount = otherCharges.reduce((sum, c) => sum + c.amount, 0)
  const expediteCharges = charges.filter(c => c.type === "expedite")
  const expediteAmount = expediteCharges.reduce((sum, c) => sum + c.amount, 0)
  const dutiesCharges = charges.filter(c => c.type === "duties")
  const dutiesAmount = dutiesCharges.reduce((sum, c) => sum + c.amount, 0)

  // Sum all non-tax, non-discount charges
  const chargesTotal = freightAmount + handlingAmount + insuranceAmount + otherAmount + expediteAmount + dutiesAmount
  const chargesSubtotal = charges.reduce((sum, c) => sum + c.amount, 0)

  // Calculate tax on taxable charges only (use centralized standard rate)
  const taxableChargesTotal = charges
    .filter(c => c.taxable && c.type !== "tax" && c.type !== "discount")
    .reduce((sum, c) => sum + c.amount, 0)
  const defaultTaxRate = TAX_RATES.STANDARD // Use centralized tax rate
  const chargesTax = Math.round(taxableChargesTotal * defaultTaxRate * 100) / 100

  // Total tax = line taxes + charge taxes + explicit tax charges
  const totalTax = linesTax + chargesTax + headerTaxAmount

  // Total discounts = line discounts + header discount charges
  const totalDiscounts = lineDiscounts + headerDiscountAmount

  // Calculate effective tax rate based on actual taxes vs taxable base
  // This reflects the ACTUAL tax rate being applied across all lines
  const taxableBase = linesSubtotal + taxableChargesTotal
  const effectiveTaxRate = taxableBase > 0 ? totalTax / taxableBase : defaultTaxRate

  return {
    linesSubtotal,
    chargesSubtotal,
    subtotal: linesSubtotal,
    chargesTotal,
    total: linesSubtotal + chargesSubtotal,
    discounts: {
      applied: totalDiscounts,
      lineDiscounts,
      headerDiscounts: headerDiscountAmount,
      available: 0,
      total: totalDiscounts,
      potential: linesSubtotal * 0.02, // 2% early payment discount
    },
    taxes: {
      amount: totalTax,
      rate: effectiveTaxRate,
    },
    taxRate: effectiveTaxRate,
    linesTax,
    chargesTax,
    totalTax,
    lineCount: lines.length,
    charges: {
      shipping: freightAmount,
      handling: handlingAmount,
      insurance: insuranceAmount,
      expedite: expediteAmount,
      duties: dutiesAmount,
      other: otherAmount,
      total: chargesTotal,
    },
    freight: freightAmount,
    grandTotal: linesSubtotal + chargesTotal + totalTax,
  }
}

export function computePayablesSummary() {
  const poTotals = computePOTotals(lineItems, poCharges)
  const paid = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.totalAmount, 0)
  const disputed = invoices.filter(inv => inv.status === "disputed").reduce((sum, inv) => sum + inv.totalAmount, 0)
  const approved = invoices.filter(inv => inv.status === "approved").reduce((sum, inv) => sum + inv.totalAmount, 0)
  const pending = invoices.filter(inv => inv.status === "pending").reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const deliveredValue = lineItems.reduce((sum, item) => sum + (item.quantityAccepted * item.unitPrice), 0)
  const awaitingInvoice = Math.max(0, deliveredValue - totalInvoiced)

  return {
    poTotal: poTotals.grandTotal,
    paid,
    disputed,
    approved,
    pending,
    totalInvoiced,
    awaitingInvoice,
    balance: poTotals.grandTotal - paid,
  }
}

export function getActionRequiredIssues(): POIssue[] {
  return detectPOIssuesForPO().filter(i => i.priority === "critical" || i.priority === "high")
}

export function getLineNeedStatus(lineId: number): { status: "ok" | "at_risk" | "critical"; needs: PeggedNeed[] } {
  const needs = peggedNeeds.filter(n => n.lineId === lineId)
  const atRisk = needs.filter(n => isNeedAtRisk(n))

  if (atRisk.length === needs.length && needs.length > 0) {
    return { status: "critical", needs }
  } else if (atRisk.length > 0) {
    return { status: "at_risk", needs }
  }
  return { status: "ok", needs }
}

export function detectPOIssues(): POIssue[] {
  return detectPOIssuesForPO()
}

export function checkLineReqAuthorization(item: LineItem): {
  status: ToleranceStatus
  message: string
  authorizedTotal: number
  actualTotal: number
  totalVariancePercent: number
} {
  const authorizedTotal = (item?.quantityOrdered || 0) * (item?.unitPrice || 0)
  const actualTotal = item?.lineTotal || 0
  const variance = actualTotal - authorizedTotal
  const variancePercent = authorizedTotal > 0 ? (variance / authorizedTotal) * 100 : 0

  let status: ToleranceStatus = "within"
  if (Math.abs(variancePercent) > 10) {
    status = "exceeded"
  } else if (Math.abs(variancePercent) > 5) {
    status = "warning"
  }

  return {
    status,
    message: status === "within" ? "Within tolerance" : `${variancePercent > 0 ? "Over" : "Under"} by ${Math.abs(variancePercent).toFixed(1)}%`,
    authorizedTotal,
    actualTotal,
    totalVariancePercent: variancePercent,
  }
}

// ============================================
// COMPLIANCE
// ============================================
export interface ComplianceClause {
  id: string
  code: string
  title: string
  description: string
  status: "required" | "applicable" | "optional"
  category: "quality" | "export" | "security" | "environmental" | "procurement" | "reporting"
  source: "regulatory" | "project" | "commodity" | "company" | "customer"
  isAcknowledged: boolean
  acknowledgedBy?: string
  acknowledgedDate?: string
  appliestoLines?: number[]
  requiresDocumentation: boolean
  documentationType?: string
  requiresFlowDown: boolean
  sourceReference?: {
    type: "project" | "customer" | "commodity" | "regulation"
    name: string
    id?: string
  }
  notes?: string
}

export const complianceClauses: ComplianceClause[] = [
  {
    id: "CC-001",
    code: "FAR 52.212-4",
    title: "Contract Terms and Conditions",
    description: "Standard commercial contract terms per FAR 52.212-4. Establishes basic terms for commercial item acquisition.",
    status: "required",
    category: "procurement",
    source: "regulatory",
    isAcknowledged: true,
    acknowledgedBy: "FlightTech Supplier",
    acknowledgedDate: "Jan 5, 2026",
    requiresDocumentation: false,
    requiresFlowDown: true,
    sourceReference: { type: "regulation", name: "Federal Acquisition Regulation", id: "FAR" },
  },
  {
    id: "CC-002",
    code: "DFARS 252.225-7001",
    title: "Buy American and Balance of Payments",
    description: "Requires domestic end products and components unless exceptions apply. Supports Buy American Act compliance.",
    status: "required",
    category: "procurement",
    source: "regulatory",
    isAcknowledged: true,
    acknowledgedBy: "FlightTech Supplier",
    acknowledgedDate: "Jan 5, 2026",
    requiresDocumentation: true,
    documentationType: "Certificate of Conformance",
    requiresFlowDown: true,
    sourceReference: { type: "regulation", name: "Defense FAR Supplement", id: "DFARS" },
  },
  {
    id: "CC-003",
    code: "AS9100D",
    title: "Quality Management System",
    description: "Aerospace quality management requirements. Supplier must maintain AS9100D certification for applicable items.",
    status: "required",
    category: "quality",
    source: "project",
    isAcknowledged: true,
    acknowledgedBy: "FlightTech Supplier",
    acknowledgedDate: "Jan 5, 2026",
    appliestoLines: [1, 2, 4],
    requiresDocumentation: true,
    documentationType: "AS9100D Certificate",
    requiresFlowDown: true,
    sourceReference: { type: "project", name: "PROJ-FALCON", id: "PROJ-2025" },
  },
  {
    id: "CC-004",
    code: "EAR 99",
    title: "Export Administration Regulations",
    description: "Items classified as EAR99. Standard export controls apply, no license required for most destinations.",
    status: "applicable",
    category: "export",
    source: "regulatory",
    isAcknowledged: true,
    acknowledgedBy: "FlightTech Supplier",
    acknowledgedDate: "Jan 6, 2026",
    appliestoLines: [1],
    requiresDocumentation: false,
    requiresFlowDown: false,
    sourceReference: { type: "regulation", name: "Export Administration Regulations" },
  },
  {
    id: "CC-005",
    code: "ITAR 22 CFR 121",
    title: "International Traffic in Arms",
    description: "Defense article subject to ITAR controls. Requires proper export authorization for foreign persons access.",
    status: "required",
    category: "export",
    source: "commodity",
    isAcknowledged: false,
    appliestoLines: [4],
    requiresDocumentation: true,
    documentationType: "ITAR Compliance Statement",
    requiresFlowDown: true,
    sourceReference: { type: "commodity", name: "Drone Control Systems" },
    notes: "Pending vendor acknowledgment - critical for project timeline",
  },
  {
    id: "CC-006",
    code: "RoHS 2011/65/EU",
    title: "Restriction of Hazardous Substances",
    description: "EU RoHS compliance for electronics. Restricts use of specific hazardous materials in electrical equipment.",
    status: "required",
    category: "environmental",
    source: "customer",
    isAcknowledged: true,
    acknowledgedBy: "FlightTech Supplier",
    acknowledgedDate: "Jan 5, 2026",
    appliestoLines: [1, 2],
    requiresDocumentation: true,
    documentationType: "RoHS Declaration",
    requiresFlowDown: true,
    sourceReference: { type: "customer", name: "Acme Corp", id: "CUST-001" },
  },
  {
    id: "CC-007",
    code: "CMMC L2",
    title: "Cybersecurity Maturity Model",
    description: "CMMC Level 2 certification required for handling CUI. Applies to items with controlled technical data.",
    status: "required",
    category: "security",
    source: "project",
    isAcknowledged: false,
    appliestoLines: [1, 4],
    requiresDocumentation: true,
    documentationType: "CMMC Certification",
    requiresFlowDown: true,
    sourceReference: { type: "project", name: "PROJ-FALCON", id: "PROJ-2025" },
    notes: "Vendor certification in progress - expected Feb 2026",
  },
  {
    id: "CC-008",
    code: "ISO 14001",
    title: "Environmental Management",
    description: "Environmental management system certification. Demonstrates commitment to environmental responsibility.",
    status: "applicable",
    category: "environmental",
    source: "company",
    isAcknowledged: true,
    acknowledgedBy: "FlightTech Supplier",
    acknowledgedDate: "Jan 5, 2026",
    requiresDocumentation: false,
    requiresFlowDown: false,
    sourceReference: { type: "regulation", name: "Company Policy CP-ENV-001" },
  },
]

export function computeComplianceStats() {
  const total = complianceClauses.length
  const required = complianceClauses.filter(c => c.status === "required").length
  const acknowledged = complianceClauses.filter(c => c.isAcknowledged).length
  const pending = complianceClauses.filter(c => !c.isAcknowledged && c.status === "required").length
  const requiresDocs = complianceClauses.filter(c => c.requiresDocumentation).length
  return { total, required, acknowledged, pending, requiresDocs }
}

// ============================================
// DOCUMENTS
// ============================================
export type DocumentCategory = "purchase_order" | "acknowledgment" | "packing_slip" | "invoice" | "ncr" | "other"

export interface PODocument {
  id: string
  name: string
  category: DocumentCategory
  version: number
  isCurrent: boolean
  status: "pending" | "received" | "approved" | "rejected"
  requiresAction?: boolean
  actionType?: "review" | "acknowledge" | "correct" | "approve" | "sign"
  actionDueDate?: string
  blocks?: string[]
  appliesToWholePO?: boolean
  lineNumbers?: number[]
  origin: "vendor" | "internal"
  originContact: string
  receivedDate?: string
  sentDate?: string
  createdDate: string
  counterparty?: string
  shipmentId?: string
  invoiceId?: string
  ncrId?: string
  notes?: string
  fileName: string
  fileSize: string
}

export function getDocuments(): PODocument[] {
  return [
    {
      id: "DOC-001",
      name: "Purchase Order PO-2026-00142",
      category: "purchase_order",
      version: 1,
      isCurrent: true,
      status: "approved",
      appliesToWholePO: true,
      origin: "internal",
      originContact: "John Smith",
      createdDate: "Jan 5, 2026",
      sentDate: "Jan 5, 2026",
      counterparty: "Acme Precision Manufacturing",
      fileName: "PO-2026-00142_v1.pdf",
      fileSize: "245 KB",
    },
    {
      id: "DOC-002",
      name: "Vendor Acknowledgment",
      category: "acknowledgment",
      version: 1,
      isCurrent: true,
      status: "received",
      appliesToWholePO: true,
      origin: "vendor",
      originContact: "Acme Precision",
      receivedDate: "Jan 6, 2026",
      createdDate: "Jan 6, 2026",
      counterparty: "John Smith",
      fileName: "ACK-PO-2026-00142.pdf",
      fileSize: "128 KB",
    },
    {
      id: "DOC-003",
      name: "Packing Slip - Shipment SHP-001",
      category: "packing_slip",
      version: 1,
      isCurrent: true,
      status: "received",
      lineNumbers: [1, 2],
      origin: "vendor",
      originContact: "Acme Precision",
      receivedDate: "Jan 15, 2026",
      createdDate: "Jan 14, 2026",
      shipmentId: "SHP-001",
      fileName: "PS-SHP-001.pdf",
      fileSize: "156 KB",
    },
    {
      id: "DOC-004",
      name: "Invoice INV-2026-0089",
      category: "invoice",
      version: 1,
      isCurrent: true,
      status: "pending",
      requiresAction: true,
      actionType: "review",
      actionDueDate: "Jan 30, 2026",
      lineNumbers: [1, 2],
      origin: "vendor",
      originContact: "Acme Precision",
      receivedDate: "Jan 16, 2026",
      createdDate: "Jan 15, 2026",
      invoiceId: "INV-2026-0089",
      shipmentId: "SHP-001",
      fileName: "INV-2026-0089.pdf",
      fileSize: "198 KB",
      notes: "Awaiting 3-way match verification",
    },
  ]
}

export function computeDocumentStats() {
  const docs = getDocuments()
  const byCategory: Record<DocumentCategory, number> = {
    purchase_order: 0,
    acknowledgment: 0,
    packing_slip: 0,
    invoice: 0,
    ncr: 0,
    other: 0,
  }
  docs.forEach(doc => {
    byCategory[doc.category]++
  })
  return { total: docs.length, byCategory }
}

// ============================================
// CATALOG ITEMS
// ============================================
export interface CatalogItem {
  id: string
  sku: string
  name: string
  description: string
  unitPrice: number
  defaultUnitPrice: number
  vendorId: string
  leadTimeDays: number
  revision: string
  unitOfMeasure: string
  category?: string
}

export function getCatalogItemBySku(sku: string): CatalogItem | undefined {
  const items: CatalogItem[] = [
    { id: "CAT-001", sku: "CTL004", name: "RC Receiver 2.4GHz Encrypted", description: "High-frequency receiver", unitPrice: 107.82, defaultUnitPrice: 107.82, vendorId: "V-1001", leadTimeDays: 10, revision: "v2.1", unitOfMeasure: "EA" },
    { id: "CAT-002", sku: "PSW-102", name: "Power Supply Unit 500W", description: "Industrial power supply", unitPrice: 245.50, defaultUnitPrice: 245.50, vendorId: "V-1001", leadTimeDays: 14, revision: "v1.0", unitOfMeasure: "EA" },
  ]
  return items.find(i => i.sku === sku)
}

export function getCatalogItemsForVendor(vendorId: string): CatalogItem[] {
  return [
    { id: "CAT-001", sku: "CTL004", name: "RC Receiver 2.4GHz Encrypted", description: "High-frequency receiver", unitPrice: 107.82, defaultUnitPrice: 107.82, vendorId, leadTimeDays: 10, revision: "v2.1", unitOfMeasure: "EA" },
    { id: "CAT-002", sku: "PSW-102", name: "Power Supply Unit 500W", description: "Industrial power supply", unitPrice: 245.50, defaultUnitPrice: 245.50, vendorId, leadTimeDays: 14, revision: "v1.0", unitOfMeasure: "EA" },
    { id: "CAT-003", sku: "CAB-050", name: "Network Cable Cat6 500ft", description: "High-speed network cabling", unitPrice: 150.00, defaultUnitPrice: 150.00, vendorId, leadTimeDays: 21, revision: "v1.0", unitOfMeasure: "ROLL" },
    { id: "CAT-004", sku: "MON-275", name: "Monitor 27in 4K LED", description: "Professional grade display", unitPrice: 580.00, defaultUnitPrice: 580.00, vendorId, leadTimeDays: 25, revision: "v2.0", unitOfMeasure: "EA" },
  ]
}

// ============================================
// REQUISITIONS
// ============================================
export interface Requisition {
  id: string
  number: string
  requestor: string
  department: string
  dateNeeded: string
  status: "open" | "partial" | "fulfilled"
  lines: Array<{ sku: string; qtyRequested: number; qtyFulfilled: number }>
}

// OpenRequisitionLine - flattened requisition line for selection in Add Line modal and buyer dashboard
export interface OpenRequisitionLine {
  id: string
  requisitionNumber: string
  requisitionLineNumber: number
  sku: string
  name: string
  description?: string
  projectCode: string
  projectName: string
  customerName?: string
  needDate: string
  unitOfMeasure: string
  quantity: number
  quantityAssigned: number
  estimatedUnitPrice: number
  requestedBy: string
  department: string
  priority: "critical" | "high" | "medium" | "low"
  status: "open" | "partial" | "assigned"
  preferredVendorName?: string
}

// Mock open requisition lines for vendor selection and buyer dashboard
export const openRequisitionLines: OpenRequisitionLine[] = [
  {
    id: "REQ-LINE-001",
    requisitionNumber: "REQ-2026-0089",
    requisitionLineNumber: 1,
    sku: "CTL004",
    name: "Precision Control Module",
    description: "High-precision servo control unit for CNC applications",
    projectCode: "PRJ-MACH-2026",
    projectName: "CNC Machine Retrofit",
    customerName: "Acme Manufacturing",
    needDate: "Feb 1, 2026",
    unitOfMeasure: "EA",
    quantity: 12,
    quantityAssigned: 0,
    estimatedUnitPrice: 245.00,
    requestedBy: "Mike Chen",
    department: "Engineering",
    priority: "high",
    status: "open",
    preferredVendorName: "FlightTech Controllers Inc.",
  },
  {
    id: "REQ-LINE-002",
    requisitionNumber: "REQ-2026-0091",
    requisitionLineNumber: 1,
    sku: "PSW102",
    name: "Power Supply Unit 24V",
    description: "Industrial grade 24V DC power supply, 500W",
    projectCode: "PRJ-ELEC-2026",
    projectName: "Electrical Upgrade Phase 2",
    customerName: "Internal",
    needDate: "Jan 25, 2026",
    unitOfMeasure: "EA",
    quantity: 8,
    quantityAssigned: 0,
    estimatedUnitPrice: 189.50,
    requestedBy: "Sarah Johnson",
    department: "Production",
    priority: "critical",
    status: "open",
    preferredVendorName: "Precision Motors LLC",
  },
  {
    id: "REQ-LINE-003",
    requisitionNumber: "REQ-2026-0092",
    requisitionLineNumber: 1,
    sku: "MOD087",
    name: "I/O Module 16-Channel",
    description: "16-channel digital I/O expansion module",
    projectCode: "PRJ-AUTO-2026",
    projectName: "Automation Line Expansion",
    customerName: "TechCorp Industries",
    needDate: "Feb 10, 2026",
    unitOfMeasure: "EA",
    quantity: 20,
    quantityAssigned: 5,
    estimatedUnitPrice: 156.00,
    requestedBy: "David Park",
    department: "Automation",
    priority: "medium",
    status: "partial",
    preferredVendorName: "Global Components Inc",
  },
  {
    id: "REQ-LINE-004",
    requisitionNumber: "REQ-2026-0093",
    requisitionLineNumber: 1,
    sku: "CAB050",
    name: "Shielded Cable Assembly",
    description: "10m shielded control cable with connectors",
    projectCode: "PRJ-MACH-2026",
    projectName: "CNC Machine Retrofit",
    customerName: "Acme Manufacturing",
    needDate: "Feb 5, 2026",
    unitOfMeasure: "EA",
    quantity: 50,
    quantityAssigned: 0,
    estimatedUnitPrice: 34.75,
    requestedBy: "Mike Chen",
    department: "Engineering",
    priority: "low",
    status: "open",
  },
  {
    id: "REQ-LINE-005",
    requisitionNumber: "REQ-2026-0094",
    requisitionLineNumber: 1,
    sku: "SEN015",
    name: "Proximity Sensor Kit",
    description: "Industrial proximity sensor with mounting hardware",
    projectCode: "PRJ-AUTO-2026",
    projectName: "Automation Line Expansion",
    customerName: "TechCorp Industries",
    needDate: "Jan 28, 2026",
    unitOfMeasure: "KIT",
    quantity: 15,
    quantityAssigned: 0,
    estimatedUnitPrice: 78.25,
    requestedBy: "Lisa Wong",
    department: "Quality",
    priority: "high",
    status: "open",
    preferredVendorName: "TechSupply Partners",
  },
  {
    id: "REQ-LINE-006",
    requisitionNumber: "REQ-2026-0095",
    requisitionLineNumber: 1,
    sku: "MTR200",
    name: "Stepper Motor NEMA 23",
    description: "High-torque stepper motor for precision positioning",
    projectCode: "PRJ-MACH-2026",
    projectName: "CNC Machine Retrofit",
    customerName: "Acme Manufacturing",
    needDate: "Feb 15, 2026",
    unitOfMeasure: "EA",
    quantity: 6,
    quantityAssigned: 0,
    estimatedUnitPrice: 425.00,
    requestedBy: "Tom Richards",
    department: "R&D",
    priority: "medium",
    status: "open",
    preferredVendorName: "Precision Motors LLC",
  },
  {
    id: "REQ-LINE-007",
    requisitionNumber: "REQ-2026-0096",
    requisitionLineNumber: 1,
    sku: "BRG045",
    name: "Linear Bearing Block",
    description: "Precision linear bearing for rail systems",
    projectCode: "PRJ-MACH-2026",
    projectName: "CNC Machine Retrofit",
    customerName: "Acme Manufacturing",
    needDate: "Feb 8, 2026",
    unitOfMeasure: "EA",
    quantity: 24,
    quantityAssigned: 8,
    estimatedUnitPrice: 112.50,
    requestedBy: "Mike Chen",
    department: "Engineering",
    priority: "high",
    status: "partial",
    preferredVendorName: "Advanced Circuits Corp",
  },
  {
    id: "REQ-LINE-008",
    requisitionNumber: "REQ-2026-0097",
    requisitionLineNumber: 1,
    sku: "PLC100",
    name: "PLC Controller Unit",
    description: "Compact PLC with 32 I/O points",
    projectCode: "PRJ-AUTO-2026",
    projectName: "Automation Line Expansion",
    customerName: "TechCorp Industries",
    needDate: "Feb 20, 2026",
    unitOfMeasure: "EA",
    quantity: 4,
    quantityAssigned: 0,
    estimatedUnitPrice: 875.00,
    requestedBy: "David Park",
    department: "Automation",
    priority: "critical",
    status: "open",
    preferredVendorName: "FlightTech Controllers Inc.",
  },
  {
    id: "REQ-LINE-009",
    requisitionNumber: "REQ-2026-0098",
    requisitionLineNumber: 1,
    sku: "HYD025",
    name: "Hydraulic Valve Assembly",
    description: "Proportional hydraulic control valve",
    projectCode: "PRJ-PRESS-2026",
    projectName: "Press Machine Overhaul",
    customerName: "MetalWorks Co",
    needDate: "Jan 30, 2026",
    unitOfMeasure: "EA",
    quantity: 3,
    quantityAssigned: 3,
    estimatedUnitPrice: 1250.00,
    requestedBy: "Robert Kim",
    department: "Maintenance",
    priority: "high",
    status: "assigned",
    preferredVendorName: "Precision Motors LLC",
  },
  {
    id: "REQ-LINE-010",
    requisitionNumber: "REQ-2026-0099",
    requisitionLineNumber: 1,
    sku: "ENC100",
    name: "Rotary Encoder 1024 PPR",
    description: "High-resolution incremental rotary encoder",
    projectCode: "PRJ-MACH-2026",
    projectName: "CNC Machine Retrofit",
    customerName: "Acme Manufacturing",
    needDate: "Feb 12, 2026",
    unitOfMeasure: "EA",
    quantity: 10,
    quantityAssigned: 0,
    estimatedUnitPrice: 185.00,
    requestedBy: "Mike Chen",
    department: "Engineering",
    priority: "medium",
    status: "open",
    preferredVendorName: "FlightTech Controllers Inc.",
  },
]

export function getOpenRequisitionsForVendor(vendorId: string): OpenRequisitionLine[] {
  // Return all open requisition lines (in real app, would filter by vendor capability)
  return openRequisitionLines.filter(req => req.quantityAssigned < req.quantity)
}

export function getRequisitionRemainingQty(req: OpenRequisitionLine): number {
  return req.quantity - req.quantityAssigned
}

export function getSourceRequisitions(lineId: number): Requisition[] {
  return [
    {
      id: "REQ-001",
      number: "REQ-2026-0089",
      requestor: "Engineering",
      department: "R&D",
      dateNeeded: "Feb 1, 2026",
      status: "partial",
      lines: [{ sku: "CTL004", qtyRequested: 12, qtyFulfilled: 6 }],
    },
  ]
}

export function getReqAuthorizationSummary(lineId: number) {
  return {
    authorized: true,
    requisitions: getSourceRequisitions(lineId),
    totalAuthorized: 12,
    totalOnPO: 12,
  }
}

// ============================================
// RELATED ISSUES
// ============================================
// Find issues related to the same entity (line, shipment, or invoice) as the given issue
export function getRelatedIssues(issueId: string): POIssue[] {
  const allIssues = detectPOIssuesForPO()
  const targetIssue = allIssues.find(i => i.id === issueId)
  if (!targetIssue) return []

  return allIssues.filter(i => {
    if (i.id === issueId) return false // Don't include the issue itself
    // Related if same line, shipment, or invoice
    if (targetIssue.lineId && i.lineId === targetIssue.lineId) return true
    if (targetIssue.shipmentId && i.shipmentId === targetIssue.shipmentId) return true
    if (targetIssue.invoiceId && i.invoiceId === targetIssue.invoiceId) return true
    return false
  })
}

// Find issues for a specific entity (line, shipment, or invoice)
export function getIssuesForEntity(entityType: "line" | "shipment" | "invoice", entityId: string | number): POIssue[] {
  return detectPOIssuesForPO().filter(i => {
    if (entityType === "line") return i.lineId === entityId
    if (entityType === "shipment") return i.shipmentId === entityId
    if (entityType === "invoice") return i.invoiceId === entityId
    return false
  })
}

// ============================================
// RMA (RETURN MATERIAL AUTHORIZATION)
// ============================================
import type {
  RMA,
  RMAStatus,
  RMAType,
  RMAVariant,
  CreateRMAInput,
  RMATimelineEvent,
  RMAReturnAddress,
} from "@/types/rma-types"

// In-memory RMA store for mock operations
const rmaStore: RMA[] = []

// Sample RMA data for demo purposes
export const sampleRMAs: RMA[] = [
  {
    id: "RMA-2026-0042",
    rmaNumber: "VND-RMA-78901",
    variant: "po",
    orderNumber: "PO-2026-00142",
    issueId: "ISS-PO-00142-001",
    ncrId: "NCR-2026-0142",
    shipmentId: "SHP-002",
    lineNumber: 2,
    sku: "PSW-102",
    itemName: "Power Supply Unit 500W",
    type: "return_replace",
    reason: "Unit failed continuity test during incoming QC inspection. Capacitor damage visible on PCB.",
    qtyAffected: 1,
    status: "authorized",
    returnAddress: {
      line1: "Tech Suppliers Inc. - RMA Dept",
      line2: "Building C, Dock 5",
      city: "San Jose",
      state: "CA",
      zip: "95134",
      country: "USA",
      attention: "RMA Processing"
    },
    returnInstructions: "Include copy of RMA form and original packing slip. Ship within 14 days of authorization.",
    requestedDate: "2026-01-22T10:30:00Z",
    authorizedDate: "2026-01-23T14:15:00Z",
    requestedBy: "John Smith",
    timeline: [
      {
        id: "evt-001",
        timestamp: "2026-01-22T10:30:00Z",
        status: "requested",
        description: "RMA request created for failed unit",
        actor: "John Smith"
      },
      {
        id: "evt-002",
        timestamp: "2026-01-22T11:00:00Z",
        status: "pending_auth",
        description: "Request sent to supplier",
        actor: "John Smith"
      },
      {
        id: "evt-003",
        timestamp: "2026-01-23T14:15:00Z",
        status: "authorized",
        description: "Supplier authorized return with RMA# VND-RMA-78901",
        actor: "Sarah Chen (Supplier)"
      }
    ]
  }
]

// Initialize the store with sample data
rmaStore.push(...sampleRMAs)

// Generate a unique RMA ID
function generateRMAId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `RMA-${year}-${random}`
}

// Create a new RMA
export function createRMA(input: CreateRMAInput): RMA {
  const now = new Date().toISOString()
  const newRMA: RMA = {
    id: generateRMAId(),
    variant: input.variant || "po",
    orderNumber: input.orderNumber || poHeader.poNumber,
    issueId: input.issueId,
    ncrId: input.ncrId,
    shipmentId: input.shipmentId,
    lineNumber: input.lineNumber,
    sku: input.sku,
    itemName: input.itemName,
    type: input.type,
    reason: input.reason,
    qtyAffected: input.qtyAffected,
    status: "requested",
    requestedDate: now,
    requestedBy: "Current User",
    notes: input.notes,
    timeline: [
      {
        id: `evt-${Date.now()}`,
        timestamp: now,
        status: "requested",
        description: "RMA request created",
        actor: "Current User"
      }
    ]
  }

  rmaStore.push(newRMA)
  return newRMA
}

// Get all RMAs
export function getRMAs(): RMA[] {
  return [...rmaStore]
}

// Get RMA by ID
export function getRMAById(rmaId: string): RMA | undefined {
  return rmaStore.find(rma => rma.id === rmaId)
}

// Get RMAs for a specific order
export function getRMAsForOrder(orderNumber: string): RMA[] {
  return rmaStore.filter(rma => rma.orderNumber === orderNumber)
}

// Get RMA for a specific issue
export function getRMAForIssue(issueId: string): RMA | undefined {
  return rmaStore.find(rma => rma.issueId === issueId && rma.status !== "resolved")
}

// Check if an issue has an active RMA
export function hasActiveRMA(issueId: string): boolean {
  return rmaStore.some(rma => rma.issueId === issueId && rma.status !== "resolved")
}

// Update RMA status
export function updateRMAStatus(rmaId: string, status: RMAStatus, data?: Partial<RMA>): RMA | undefined {
  const index = rmaStore.findIndex(rma => rma.id === rmaId)
  if (index === -1) return undefined

  const timelineEvent: RMATimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status,
    description: `Status changed to ${status.replace(/_/g, " ")}`,
    actor: "Current User"
  }

  rmaStore[index] = {
    ...rmaStore[index],
    ...data,
    status,
    timeline: [...(rmaStore[index].timeline || []), timelineEvent]
  }

  return rmaStore[index]
}

// Record RMA authorization from supplier
export function recordRMAAuthorization(
  rmaId: string,
  rmaNumber: string,
  returnAddress?: RMAReturnAddress,
  returnInstructions?: string
): RMA | undefined {
  const index = rmaStore.findIndex(rma => rma.id === rmaId)
  if (index === -1) return undefined

  const now = new Date().toISOString()
  const timelineEvent: RMATimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: "authorized",
    description: `Authorized with RMA# ${rmaNumber}`,
    actor: "Current User"
  }

  rmaStore[index] = {
    ...rmaStore[index],
    status: "authorized",
    rmaNumber,
    returnAddress,
    returnInstructions,
    authorizedDate: now,
    timeline: [...(rmaStore[index].timeline || []), timelineEvent]
  }

  return rmaStore[index]
}

// Record return shipment
export function recordRMAReturnShipped(
  rmaId: string,
  carrier: string,
  trackingNumber: string
): RMA | undefined {
  const index = rmaStore.findIndex(rma => rma.id === rmaId)
  if (index === -1) return undefined

  const now = new Date().toISOString()
  const timelineEvent: RMATimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: "return_shipped",
    description: `Return shipped via ${carrier} (${trackingNumber})`,
    actor: "Current User"
  }

  rmaStore[index] = {
    ...rmaStore[index],
    status: "return_shipped",
    returnCarrier: carrier,
    returnTrackingNumber: trackingNumber,
    returnShippedDate: now,
    timeline: [...(rmaStore[index].timeline || []), timelineEvent]
  }

  return rmaStore[index]
}

// Record RMA resolution
export function recordRMAResolution(
  rmaId: string,
  resolution: {
    replacementShipmentId?: string
    creditMemoNumber?: string
    creditAmount?: number
    dispositionNotes?: string
  }
): RMA | undefined {
  const index = rmaStore.findIndex(rma => rma.id === rmaId)
  if (index === -1) return undefined

  const now = new Date().toISOString()
  let description = "RMA resolved"
  if (resolution.replacementShipmentId) {
    description = `Resolved - Replacement shipped (${resolution.replacementShipmentId})`
  } else if (resolution.creditMemoNumber) {
    description = `Resolved - Credit issued (${resolution.creditMemoNumber})`
  } else if (resolution.dispositionNotes) {
    description = `Resolved - Disposed per instructions`
  }

  const timelineEvent: RMATimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: "resolved",
    description,
    actor: "Current User"
  }

  rmaStore[index] = {
    ...rmaStore[index],
    status: "resolved",
    ...resolution,
    resolvedDate: now,
    timeline: [...(rmaStore[index].timeline || []), timelineEvent]
  }

  return rmaStore[index]
}

// ============================================
// BLANKET PO MOCK DATA
// ============================================

import type {
  BlanketPOTerms,
  BlanketUtilization,
  BlanketLineItem,
  ReleaseSummary,
} from "@/app/supply/purchase-orders/_lib/types/blanket-po.types"

export const blanketPOTerms: BlanketPOTerms = {
  effectiveDate: "Jan 1, 2026",
  expirationDate: "Dec 31, 2026",
  authorizedTotal: 500000,
  perReleaseLimit: 50000,
  perReleaseMinimum: 1000,
  maxReleases: 24,
}

export const blanketPOUtilization: BlanketUtilization = {
  committed: 25000,
  released: 175000,
  consumed: 98000,
  available: 300000,
  releaseCount: 5,
  lastCalculated: new Date().toISOString(),
}

export const blanketPOLines: BlanketLineItem[] = [
  {
    id: 1,
    lineNumber: 1,
    sku: "CPU-I7-13700K",
    name: "Intel Core i7-13700K Processor",
    quantity: 100,
    unitOfMeasure: "EA",
    unitPrice: 419.99,
    lineTotal: 41999,
    status: "active",
    description: "13th Gen Intel Core i7 processor",
    lineStatus: "Active",
    shipToLocationId: "LOC-001",
    warehouseId: "WH-01",
    promisedDate: "N/A",
    acknowledgedStatus: "N/A",
    acknowledgedDate: null,
    originalDueDate: "N/A",
    projectCode: "PROJ-2026",
    itemRevision: "v1.0",
    leadTimeDays: "14",
    quantityOrdered: 100,
    quantityShipped: 0,
    quantityReceived: 35,
    quantityAccepted: 35,
    quantityPaid: 35,
    quantityInQualityHold: 0,
    needs: [],
    subtotal: 41999,
    discountAmount: 0,
    taxAmount: 0,
    taxCode: "STANDARD",
    lineTotalWithTax: 41999,
    // Blanket-specific fields
    maxQuantity: 100,
    releasedQuantity: 45,
    availableQuantity: 55,
    priceLocked: true,
  },
  {
    id: 2,
    lineNumber: 2,
    sku: "RAM-DDR5-32GB",
    name: "DDR5 RAM 32GB Kit",
    quantity: 200,
    unitOfMeasure: "EA",
    unitPrice: 189.99,
    lineTotal: 37998,
    status: "active",
    description: "DDR5 Memory Kit 2x16GB",
    lineStatus: "Active",
    shipToLocationId: "LOC-001",
    warehouseId: "WH-01",
    promisedDate: "N/A",
    acknowledgedStatus: "N/A",
    acknowledgedDate: null,
    originalDueDate: "N/A",
    projectCode: "PROJ-2026",
    itemRevision: "v2.1",
    leadTimeDays: "10",
    quantityOrdered: 200,
    quantityShipped: 0,
    quantityReceived: 80,
    quantityAccepted: 80,
    quantityPaid: 60,
    quantityInQualityHold: 0,
    needs: [],
    subtotal: 37998,
    discountAmount: 0,
    taxAmount: 0,
    taxCode: "STANDARD",
    lineTotalWithTax: 37998,
    // Blanket-specific fields
    maxQuantity: 200,
    releasedQuantity: 100,
    availableQuantity: 100,
    priceLocked: true,
  },
  {
    id: 3,
    lineNumber: 3,
    sku: "SSD-NVME-1TB",
    name: "NVMe SSD 1TB Gen4",
    quantity: 150,
    unitOfMeasure: "EA",
    unitPrice: 129.99,
    lineTotal: 19498.50,
    status: "active",
    description: "High-speed NVMe solid state drive",
    lineStatus: "Active",
    shipToLocationId: "LOC-001",
    warehouseId: "WH-01",
    promisedDate: "N/A",
    acknowledgedStatus: "N/A",
    acknowledgedDate: null,
    originalDueDate: "N/A",
    projectCode: "PROJ-2026",
    itemRevision: "v1.0",
    leadTimeDays: "7",
    quantityOrdered: 150,
    quantityShipped: 0,
    quantityReceived: 50,
    quantityAccepted: 50,
    quantityPaid: 50,
    quantityInQualityHold: 0,
    needs: [],
    subtotal: 19498.50,
    discountAmount: 0,
    taxAmount: 0,
    taxCode: "STANDARD",
    lineTotalWithTax: 19498.50,
    // Blanket-specific fields
    maxQuantity: 150,
    releasedQuantity: 70,
    availableQuantity: 80,
    priceLocked: true,
  },
]

export const blanketPOReleases: ReleaseSummary[] = [
  {
    releaseNumber: "REL-2026-0001",
    sequenceNumber: 1,
    releaseDate: "Jan 15, 2026",
    amount: 35000,
    status: "closed",
    lineCount: 3,
    requestedDelivery: "Jan 25, 2026",
    createdBy: "John Smith",
  },
  {
    releaseNumber: "REL-2026-0002",
    sequenceNumber: 2,
    releaseDate: "Feb 1, 2026",
    amount: 42000,
    status: "received",
    lineCount: 2,
    requestedDelivery: "Feb 10, 2026",
    createdBy: "Jane Doe",
  },
  {
    releaseNumber: "REL-2026-0003",
    sequenceNumber: 3,
    releaseDate: "Feb 15, 2026",
    amount: 28000,
    status: "partially_received",
    lineCount: 3,
    requestedDelivery: "Feb 25, 2026",
    createdBy: "John Smith",
  },
  {
    releaseNumber: "REL-2026-0004",
    sequenceNumber: 4,
    releaseDate: "Mar 1, 2026",
    amount: 45000,
    status: "open",
    lineCount: 2,
    requestedDelivery: "Mar 15, 2026",
    createdBy: "Jane Doe",
  },
  {
    releaseNumber: "REL-2026-0005",
    sequenceNumber: 5,
    releaseDate: "Mar 10, 2026",
    amount: 25000,
    status: "draft",
    lineCount: 1,
    requestedDelivery: "Mar 25, 2026",
    createdBy: "John Smith",
  },
]
