// Centralized tax configuration
// All tax rates should be sourced from here

export const TAX_RATES = {
  STANDARD: 0.0825,  // 8.25%
  REDUCED: 0.05,     // 5%
  EXEMPT: 0,         // 0%
  ZERO: 0,           // 0%
} as const

export type TaxCode = keyof typeof TAX_RATES

// Default tax rate for charges if not specified
export const DEFAULT_CHARGE_TAX_RATE = TAX_RATES.STANDARD

// Get tax rate for a given tax code
export function getTaxRate(taxCode: TaxCode | string | undefined): number {
  if (!taxCode) return TAX_RATES.STANDARD
  return TAX_RATES[taxCode as TaxCode] ?? TAX_RATES.STANDARD
}

// Get tax code display percentage
export function getTaxRatePercent(taxCode: TaxCode | string | undefined): number {
  return getTaxRate(taxCode) * 100
}

// Format tax rate as display string (e.g., "8.25%")
export function formatTaxRate(taxCode: TaxCode | string | undefined): string {
  const percent = getTaxRatePercent(taxCode)
  return `${percent}%`
}

// Format tax rate from decimal (e.g., 0.0825 -> "8.25%")
export function formatTaxRateFromDecimal(rate: number): string {
  const percent = Math.round(rate * 10000) / 100
  return `${percent}%`
}

// Get tax label with rate (e.g., "Tax (8.25%)" or "Tax (Exempt)")
export function getTaxLabel(taxCode: TaxCode | string | undefined): string {
  if (taxCode === "EXEMPT" || taxCode === "ZERO") {
    return "Tax (Exempt)"
  }
  return `Tax (${formatTaxRate(taxCode)})`
}

// Get tax label from decimal rate
export function getTaxLabelFromRate(rate: number): string {
  if (rate === 0) {
    return "Tax (Exempt)"
  }
  return `Tax (${formatTaxRateFromDecimal(rate)})`
}

// Tax code options for dropdowns
export const TAX_CODE_OPTIONS = [
  { value: "STANDARD", label: `Standard (${formatTaxRate("STANDARD")})`, rate: TAX_RATES.STANDARD },
  { value: "REDUCED", label: `Reduced (${formatTaxRate("REDUCED")})`, rate: TAX_RATES.REDUCED },
  { value: "EXEMPT", label: "Exempt (0%)", rate: TAX_RATES.EXEMPT },
] as const

// Calculate tax amount
export function calculateTax(amount: number, taxCode: TaxCode | string | undefined): number {
  const rate = getTaxRate(taxCode)
  return Math.round(amount * rate * 100) / 100
}

// Calculate line financials from base values
export interface LineFinancialInput {
  quantity: number
  unitPrice: number
  discountPercent?: number
  taxCode?: TaxCode | string
  // Custom tax rate as percentage (e.g., 20 for 20%) - overrides taxCode if provided
  customTaxRate?: number
}

export interface LineFinancialOutput {
  subtotal: number
  discountAmount: number
  netAmount: number
  taxRate: number
  taxAmount: number
  lineTotal: number
  lineTotalWithTax: number
}

export function calculateLineFinancials(input: LineFinancialInput): LineFinancialOutput {
  const { quantity, unitPrice, discountPercent = 0, taxCode = "STANDARD", customTaxRate } = input

  const subtotal = Math.round(quantity * unitPrice * 100) / 100
  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100
  const netAmount = Math.round((subtotal - discountAmount) * 100) / 100

  // Use custom tax rate if provided, otherwise look up from taxCode
  const taxRate = customTaxRate !== undefined ? customTaxRate / 100 : getTaxRate(taxCode)
  const taxAmount = Math.round(netAmount * taxRate * 100) / 100
  const lineTotal = netAmount
  const lineTotalWithTax = Math.round((netAmount + taxAmount) * 100) / 100

  return {
    subtotal,
    discountAmount,
    netAmount,
    taxRate,
    taxAmount,
    lineTotal,
    lineTotalWithTax,
  }
}
