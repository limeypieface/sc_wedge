/**
 * Sales Order Domain Mock Data
 *
 * Re-exports SO-specific data from mock-data files
 * This serves as the single import point for SO data
 */

// Re-export SO issues from central mock-data
export {
  type SOIssue,
  type SOIssueCategory,
  detectSOIssuesForSO,
  detectSOIssues,
} from "@/lib/mock-data"

// Re-export shared data that SO uses
export {
  type LineItem,
  type Shipment,
  type Invoice,
  type POCharge,
  getPOData,
  computePOTotals,
} from "@/lib/mock-data"

// Re-export shared users for SO context
export { soApprovers, createApprovalChain } from "../shared/users"

// Re-export status options
export { SO_STATUS_OPTIONS, LINE_STATUSES, STATUS_COLORS, getStatusColor } from "../config/status-options"

// Re-export view options
export { SO_VIEW_OPTIONS, LINE_DISPLAY_OPTIONS } from "../config/view-options"

/**
 * SO-specific customer data
 */
export interface Customer {
  id: string
  name: string
  code: string
  creditLimit: number
  paymentTerms: string
  pricingTier: "standard" | "preferred" | "strategic"
  primaryContact: {
    name: string
    email: string
    phone: string
  }
}

export interface CustomerShipTo {
  id: string
  customerId: string
  name: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country: string
  }
  isDefault: boolean
}

/**
 * Sample customers
 */
export const customers: Customer[] = [
  {
    id: "CUST-001",
    name: "Acme Manufacturing Inc.",
    code: "ACME",
    creditLimit: 500000,
    paymentTerms: "Net 30",
    pricingTier: "preferred",
    primaryContact: {
      name: "Robert Chen",
      email: "robert.chen@acmemfg.com",
      phone: "+1 (555) 123-4567",
    },
  },
  {
    id: "CUST-002",
    name: "TechStart Solutions",
    code: "TECH",
    creditLimit: 100000,
    paymentTerms: "Net 15",
    pricingTier: "standard",
    primaryContact: {
      name: "Emily Watson",
      email: "emily.watson@techstart.io",
      phone: "+1 (555) 987-6543",
    },
  },
  {
    id: "CUST-003",
    name: "Global Aerospace Corp",
    code: "GAC",
    creditLimit: 2000000,
    paymentTerms: "Net 45",
    pricingTier: "strategic",
    primaryContact: {
      name: "James Morrison",
      email: "j.morrison@globalaero.com",
      phone: "+1 (555) 456-7890",
    },
  },
]

/**
 * Sample ship-to addresses
 */
export const customerShipTos: CustomerShipTo[] = [
  {
    id: "SHIP-001",
    customerId: "CUST-001",
    name: "Acme Main Facility",
    address: {
      line1: "1234 Industrial Blvd",
      city: "Detroit",
      state: "MI",
      zip: "48201",
      country: "USA",
    },
    isDefault: true,
  },
  {
    id: "SHIP-002",
    customerId: "CUST-001",
    name: "Acme West Coast",
    address: {
      line1: "5678 Pacific Way",
      line2: "Suite 100",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country: "USA",
    },
    isDefault: false,
  },
  {
    id: "SHIP-003",
    customerId: "CUST-002",
    name: "TechStart HQ",
    address: {
      line1: "789 Innovation Drive",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "USA",
    },
    isDefault: true,
  },
]

/**
 * Get customer by ID
 */
export function getCustomerById(customerId: string): Customer | undefined {
  return customers.find(c => c.id === customerId)
}

/**
 * Get ship-to addresses for a customer
 */
export function getShipTosForCustomer(customerId: string): CustomerShipTo[] {
  return customerShipTos.filter(s => s.customerId === customerId)
}
