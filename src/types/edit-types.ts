// Types of changes that can be made to a PO

export type EditCategory = "minor" | "major"

export interface EditType {
  id: string
  label: string
  description: string
  category: EditCategory
  fields: string[] // Which fields/sections this enables
}

// Minor changes: v+0.1, no approval required
export const MINOR_EDIT_TYPES: EditType[] = [
  {
    id: "fees",
    label: "Fees & Charges",
    description: "Add or modify shipping, handling, or other fees",
    category: "minor",
    fields: ["charges"],
  },
  {
    id: "discounts",
    label: "Discounts",
    description: "Apply or adjust line-level discounts",
    category: "minor",
    fields: ["discounts"],
  },
  {
    id: "expedite",
    label: "Expedite",
    description: "Mark lines for expedited delivery",
    category: "minor",
    fields: ["expedite"],
  },
  {
    id: "tax",
    label: "Tax Adjustments",
    description: "Change tax codes or exemptions",
    category: "minor",
    fields: ["tax"],
  },
]

// Major changes: v+1.0, approval required
export const MAJOR_EDIT_TYPES: EditType[] = [
  {
    id: "quantities",
    label: "Quantities",
    description: "Change ordered quantities on lines",
    category: "major",
    fields: ["quantity"],
  },
  {
    id: "prices",
    label: "Prices",
    description: "Modify unit prices",
    category: "major",
    fields: ["unitPrice"],
  },
  {
    id: "lines",
    label: "Add/Remove Lines",
    description: "Add new items or remove existing lines",
    category: "major",
    fields: ["lines"],
  },
]

export const ALL_EDIT_TYPES = [...MINOR_EDIT_TYPES, ...MAJOR_EDIT_TYPES]

// Helper to determine if any major changes are selected
export function hasMajorChanges(selectedTypes: string[]): boolean {
  return selectedTypes.some(id =>
    MAJOR_EDIT_TYPES.some(type => type.id === id)
  )
}

// Helper to get version increment
export function getVersionIncrement(selectedTypes: string[]): number {
  return hasMajorChanges(selectedTypes) ? 1.0 : 0.1
}

// Helper to get all enabled fields from selected types
export function getEnabledFields(selectedTypes: string[]): string[] {
  const fields = new Set<string>()
  ALL_EDIT_TYPES
    .filter(type => selectedTypes.includes(type.id))
    .forEach(type => type.fields.forEach(f => fields.add(f)))
  return Array.from(fields)
}

// Financial change thresholds for approval workflow
export const FINANCIAL_THRESHOLDS = {
  // Percentage thresholds that trigger approval
  minorChangePercent: 2,    // Below 2%: no approval needed
  moderateChangePercent: 5, // 2-5%: manager approval
  majorChangePercent: 10,   // 5-10%: director approval
  criticalChangePercent: 15 // Above 15%: executive approval
}

export type ApprovalLevel = "none" | "manager" | "director" | "executive"

// Calculate financial change percentage
export function calculateFinancialChangePercent(originalTotal: number, newTotal: number): number {
  if (originalTotal === 0) return newTotal > 0 ? 100 : 0
  return Math.abs((newTotal - originalTotal) / originalTotal) * 100
}

// Determine approval level based on financial change percentage
export function getApprovalLevelByChange(changePercent: number): ApprovalLevel {
  if (changePercent < FINANCIAL_THRESHOLDS.minorChangePercent) return "none"
  if (changePercent < FINANCIAL_THRESHOLDS.moderateChangePercent) return "manager"
  if (changePercent < FINANCIAL_THRESHOLDS.majorChangePercent) return "director"
  return "executive"
}

// Check if financial change requires approval
export function requiresFinancialApproval(originalTotal: number, newTotal: number): {
  requiresApproval: boolean
  changePercent: number
  approvalLevel: ApprovalLevel
  changeAmount: number
} {
  const changeAmount = newTotal - originalTotal
  const changePercent = calculateFinancialChangePercent(originalTotal, newTotal)
  const approvalLevel = getApprovalLevelByChange(changePercent)

  return {
    requiresApproval: approvalLevel !== "none",
    changePercent,
    approvalLevel,
    changeAmount
  }
}

// Get approval level label
export function getApprovalLevelLabel(level: ApprovalLevel): string {
  switch (level) {
    case "manager": return "Manager Approval Required"
    case "director": return "Director Approval Required"
    case "executive": return "Executive Approval Required"
    default: return "No Approval Required"
  }
}
