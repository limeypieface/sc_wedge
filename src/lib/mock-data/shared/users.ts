/**
 * Shared User and Approver Mock Data
 *
 * Unified user definitions used across PO and SO domains
 */

export interface SimulatedUser {
  id: string
  name: string
  role: string
  email: string
  avatar?: string
  isApprover: boolean
  approverLevel?: number
  approvalLimit: number
  department?: "purchasing" | "sales" | "finance" | "operations"
}

export interface Approver {
  id: string
  name: string
  role: string
  email: string
  approvalLimit: number
}

/**
 * Unified simulated users for the entire application
 */
export const simulatedUsers: SimulatedUser[] = [
  // Purchasing team
  {
    id: "U-001",
    name: "John Smith",
    role: "Buyer",
    email: "john.smith@company.com",
    isApprover: false,
    approvalLimit: 0,
    department: "purchasing",
  },
  {
    id: "U-002",
    name: "Mike Johnson",
    role: "Purchasing Manager",
    email: "mike.johnson@company.com",
    isApprover: true,
    approverLevel: 1,
    approvalLimit: 10000,
    department: "purchasing",
  },
  // Finance team
  {
    id: "U-003",
    name: "Sarah Williams",
    role: "Finance Director",
    email: "sarah.williams@company.com",
    isApprover: true,
    approverLevel: 2,
    approvalLimit: 100000,
    department: "finance",
  },
  // Sales team
  {
    id: "U-004",
    name: "Alex Rivera",
    role: "Sales Rep",
    email: "alex.rivera@company.com",
    isApprover: false,
    approvalLimit: 0,
    department: "sales",
  },
  {
    id: "U-005",
    name: "Jordan Kim",
    role: "Sales Manager",
    email: "jordan.kim@company.com",
    isApprover: true,
    approverLevel: 1,
    approvalLimit: 25000,
    department: "sales",
  },
  // Operations
  {
    id: "U-006",
    name: "David Lee",
    role: "VP Operations",
    email: "david.lee@company.com",
    isApprover: true,
    approverLevel: 3,
    approvalLimit: 500000,
    department: "operations",
  },
]

/**
 * Get approvers for PO domain
 */
export const poApprovers: Approver[] = simulatedUsers
  .filter(u => u.isApprover && (u.department === "purchasing" || u.department === "finance" || u.department === "operations"))
  .map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
    approvalLimit: u.approvalLimit,
  }))

/**
 * Get approvers for SO domain
 */
export const soApprovers: Approver[] = simulatedUsers
  .filter(u => u.isApprover && (u.department === "sales" || u.department === "finance" || u.department === "operations"))
  .map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
    approvalLimit: u.approvalLimit,
  }))

/**
 * Get users by department
 */
export function getUsersByDepartment(department: SimulatedUser["department"]): SimulatedUser[] {
  return simulatedUsers.filter(u => u.department === department)
}

/**
 * Get all approvers
 */
export function getApprovers(): Approver[] {
  return simulatedUsers
    .filter(u => u.isApprover)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      email: u.email,
      approvalLimit: u.approvalLimit,
    }))
}

/**
 * Create an approval chain based on amount
 */
export function createApprovalChain(amount: number, domain: "po" | "so" = "po"): Approver[] {
  const approvers = domain === "po" ? poApprovers : soApprovers
  return approvers.filter(a => a.approvalLimit >= amount).slice(0, 2)
}
