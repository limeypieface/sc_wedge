/**
 * Validation Utilities
 *
 * Centralized validation functions for form inputs across the application.
 * Provides both individual field validators and composite form validators.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  severity: "error" | "warning"
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// Create a successful validation result
export function validResult(): ValidationResult {
  return { isValid: true, errors: [], warnings: [] }
}

// Create a failed validation result
export function invalidResult(errors: ValidationError[], warnings: ValidationError[] = []): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Merge multiple validation results
export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap(r => r.errors)
  const warnings = results.flatMap(r => r.warnings)
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// INDIVIDUAL FIELD VALIDATORS
// ============================================================================

export const validators = {
  /**
   * Check if a value is present (not null, undefined, or empty string)
   */
  required: (value: unknown, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === "") {
      return { field: fieldName, message: `${fieldName} is required`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a number is positive (> 0)
   */
  positiveNumber: (value: number | string, fieldName: string): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num) || num <= 0) {
      return { field: fieldName, message: `${fieldName} must be greater than 0`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a number is non-negative (>= 0)
   */
  nonNegativeNumber: (value: number | string, fieldName: string): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num) || num < 0) {
      return { field: fieldName, message: `${fieldName} cannot be negative`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a number is a valid percentage (0-100)
   */
  percentage: (value: number | string, fieldName: string): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num) || num < 0 || num > 100) {
      return { field: fieldName, message: `${fieldName} must be between 0 and 100`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a number is an integer
   */
  integer: (value: number | string, fieldName: string): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num) || !Number.isInteger(num)) {
      return { field: fieldName, message: `${fieldName} must be a whole number`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a value is less than or equal to a maximum
   */
  maxValue: (value: number | string, max: number, fieldName: string): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num) || num > max) {
      return { field: fieldName, message: `${fieldName} cannot exceed ${max}`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a value is greater than or equal to a minimum
   */
  minValue: (value: number | string, min: number, fieldName: string): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num) || num < min) {
      return { field: fieldName, message: `${fieldName} must be at least ${min}`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a string matches email format
   */
  email: (value: string, fieldName: string = "Email"): ValidationError | null => {
    if (!value) return null // Use required validator for presence
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: `${fieldName} must be a valid email address`, severity: "error" }
    }
    return null
  },

  /**
   * Check string maximum length
   */
  maxLength: (value: string, max: number, fieldName: string): ValidationError | null => {
    if (!value) return null
    if (value.length > max) {
      return { field: fieldName, message: `${fieldName} must be ${max} characters or less`, severity: "error" }
    }
    return null
  },

  /**
   * Check string minimum length
   */
  minLength: (value: string, min: number, fieldName: string): ValidationError | null => {
    if (!value) return null
    if (value.length < min) {
      return { field: fieldName, message: `${fieldName} must be at least ${min} characters`, severity: "error" }
    }
    return null
  },

  /**
   * Check if a date is not in the past
   */
  dateNotInPast: (value: string | Date, fieldName: string): ValidationError | null => {
    if (!value) return null
    const date = typeof value === "string" ? new Date(value) : value
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) {
      return { field: fieldName, message: `${fieldName} cannot be in the past`, severity: "warning" }
    }
    return null
  },

  /**
   * Check if date A is before or equal to date B
   */
  dateBeforeOrEqual: (
    dateA: string | Date,
    dateB: string | Date,
    fieldNameA: string,
    fieldNameB: string
  ): ValidationError | null => {
    if (!dateA || !dateB) return null
    const a = typeof dateA === "string" ? new Date(dateA) : dateA
    const b = typeof dateB === "string" ? new Date(dateB) : dateB
    if (a > b) {
      return { field: fieldNameA, message: `${fieldNameA} must be on or before ${fieldNameB}`, severity: "error" }
    }
    return null
  },

  /**
   * Check alphanumeric format (letters, numbers, hyphens, underscores)
   */
  alphanumeric: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null
    const regex = /^[a-zA-Z0-9\-_]+$/
    if (!regex.test(value)) {
      return { field: fieldName, message: `${fieldName} can only contain letters, numbers, hyphens, and underscores`, severity: "error" }
    }
    return null
  },
}

// ============================================================================
// WARNING VALIDATORS (for soft constraints)
// ============================================================================

export const warnings = {
  /**
   * Warn if discount is unusually high
   */
  highDiscount: (value: number | string, threshold: number = 20): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (!isNaN(num) && num > threshold) {
      return { field: "discount", message: `Discount of ${num}% is unusually high`, severity: "warning" }
    }
    return null
  },

  /**
   * Warn if price differs significantly from expected
   */
  priceDifference: (
    actualPrice: number,
    expectedPrice: number,
    tolerancePercent: number = 10
  ): ValidationError | null => {
    if (expectedPrice <= 0) return null
    const diff = Math.abs(actualPrice - expectedPrice)
    const pct = (diff / expectedPrice) * 100
    if (pct > tolerancePercent) {
      return {
        field: "unitPrice",
        message: `Price differs from catalog by ${pct.toFixed(1)}%`,
        severity: "warning"
      }
    }
    return null
  },

  /**
   * Warn if amount is unusually high
   */
  highAmount: (value: number | string, threshold: number, fieldName: string): ValidationError | null => {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (!isNaN(num) && num > threshold) {
      return { field: fieldName, message: `${fieldName} of $${num.toLocaleString()} is unusually high`, severity: "warning" }
    }
    return null
  },
}

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

export interface LineItemInput {
  sku?: string
  quantity: string | number
  unitPrice: string | number
  discountPercent?: string | number
  taxRate?: string | number
  unitOfMeasure?: string
  catalogPrice?: number
}

export function validateLineItem(data: LineItemInput): ValidationResult {
  const errors: ValidationError[] = []
  const warningsList: ValidationError[] = []

  // Required fields
  const skuError = validators.required(data.sku, "Item")
  if (skuError) errors.push(skuError)

  // Quantity validation
  const qtyRequired = validators.required(data.quantity, "Quantity")
  if (qtyRequired) {
    errors.push(qtyRequired)
  } else {
    const qtyPositive = validators.positiveNumber(data.quantity, "Quantity")
    if (qtyPositive) errors.push(qtyPositive)

    // Integer check for EA unit of measure
    if (data.unitOfMeasure === "EA") {
      const qtyInteger = validators.integer(data.quantity, "Quantity")
      if (qtyInteger) errors.push(qtyInteger)
    }
  }

  // Unit price validation
  const priceRequired = validators.required(data.unitPrice, "Unit Price")
  if (priceRequired) {
    errors.push(priceRequired)
  } else {
    const priceNonNeg = validators.nonNegativeNumber(data.unitPrice, "Unit Price")
    if (priceNonNeg) errors.push(priceNonNeg)

    // Price difference warning
    if (data.catalogPrice && data.catalogPrice > 0) {
      const price = typeof data.unitPrice === "string" ? parseFloat(data.unitPrice) : data.unitPrice
      const priceWarn = warnings.priceDifference(price, data.catalogPrice)
      if (priceWarn) warningsList.push(priceWarn)
    }
  }

  // Discount validation
  if (data.discountPercent !== undefined && data.discountPercent !== "") {
    const discountPct = validators.percentage(data.discountPercent, "Discount")
    if (discountPct) errors.push(discountPct)

    const discountNum = typeof data.discountPercent === "string" ? parseFloat(data.discountPercent) : data.discountPercent
    const discountWarn = warnings.highDiscount(discountNum)
    if (discountWarn) warningsList.push(discountWarn)
  }

  // Tax rate validation
  if (data.taxRate !== undefined && data.taxRate !== "") {
    const taxPct = validators.percentage(data.taxRate, "Tax Rate")
    if (taxPct) errors.push(taxPct)
  }

  return { isValid: errors.length === 0, errors, warnings: warningsList }
}

export interface ChargeInput {
  type: string
  amount: string | number
  description?: string
}

export function validateCharge(data: ChargeInput): ValidationResult {
  const errors: ValidationError[] = []
  const warningsList: ValidationError[] = []

  // Type required
  const typeError = validators.required(data.type, "Charge Type")
  if (typeError) errors.push(typeError)

  // Amount validation
  const amtRequired = validators.required(data.amount, "Amount")
  if (amtRequired) {
    errors.push(amtRequired)
  } else {
    const amtPositive = validators.positiveNumber(data.amount, "Amount")
    if (amtPositive) errors.push(amtPositive)

    const amt = typeof data.amount === "string" ? parseFloat(data.amount) : data.amount
    const amtWarn = warnings.highAmount(amt, 1000, "Charge amount")
    if (amtWarn) warningsList.push(amtWarn)
  }

  // Description required for "other" type
  if (data.type === "other") {
    const descError = validators.required(data.description, "Description")
    if (descError) errors.push(descError)
  }

  return { isValid: errors.length === 0, errors, warnings: warningsList }
}

export interface ShipmentInput {
  carrier: string
  trackingNumber?: string
  shipDate: string
  expectedDelivery?: string
  weight?: string | number
  selectedLines: { lineNumber: number; quantity: number; maxQuantity: number }[]
}

export function validateShipment(data: ShipmentInput): ValidationResult {
  const errors: ValidationError[] = []
  const warningsList: ValidationError[] = []

  // At least one line selected
  if (!data.selectedLines || data.selectedLines.length === 0) {
    errors.push({ field: "lines", message: "At least one item must be selected", severity: "error" })
  } else {
    // Validate each line quantity
    for (const line of data.selectedLines) {
      if (line.quantity <= 0) {
        errors.push({ field: `line_${line.lineNumber}`, message: `Quantity for line ${line.lineNumber} must be greater than 0`, severity: "error" })
      }
      if (line.quantity > line.maxQuantity) {
        errors.push({ field: `line_${line.lineNumber}`, message: `Quantity for line ${line.lineNumber} cannot exceed ${line.maxQuantity}`, severity: "error" })
      }
    }
  }

  // Carrier required (unless Will Call)
  if (data.carrier !== "will_call") {
    const carrierError = validators.required(data.carrier, "Carrier")
    if (carrierError) errors.push(carrierError)

    // Tracking number required for shipped items
    if (data.carrier && data.carrier !== "will_call") {
      const trackingError = validators.required(data.trackingNumber, "Tracking Number")
      if (trackingError) errors.push(trackingError)
    }
  }

  // Ship date validation
  const shipDateError = validators.required(data.shipDate, "Ship Date")
  if (shipDateError) errors.push(shipDateError)

  // Expected delivery must be >= ship date
  if (data.shipDate && data.expectedDelivery) {
    const dateOrder = validators.dateBeforeOrEqual(data.shipDate, data.expectedDelivery, "Ship Date", "Expected Delivery")
    if (dateOrder) errors.push(dateOrder)
  }

  // Weight validation (if provided)
  if (data.weight !== undefined && data.weight !== "") {
    const weightPositive = validators.positiveNumber(data.weight, "Weight")
    if (weightPositive) errors.push(weightPositive)
  }

  return { isValid: errors.length === 0, errors, warnings: warningsList }
}

export interface RMAInput {
  type: string
  reason: string
  qtyAffected: string | number
  maxQty: number
}

export function validateRMA(data: RMAInput): ValidationResult {
  const errors: ValidationError[] = []

  // Type required
  const typeError = validators.required(data.type, "RMA Type")
  if (typeError) errors.push(typeError)

  // Reason required with minimum length
  const reasonRequired = validators.required(data.reason, "Reason")
  if (reasonRequired) {
    errors.push(reasonRequired)
  } else {
    const reasonMin = validators.minLength(data.reason, 10, "Reason")
    if (reasonMin) errors.push(reasonMin)
  }

  // Quantity validation
  const qtyRequired = validators.required(data.qtyAffected, "Quantity Affected")
  if (qtyRequired) {
    errors.push(qtyRequired)
  } else {
    const qtyPositive = validators.positiveNumber(data.qtyAffected, "Quantity Affected")
    if (qtyPositive) errors.push(qtyPositive)

    const qtyMax = validators.maxValue(data.qtyAffected, data.maxQty, "Quantity Affected")
    if (qtyMax) errors.push(qtyMax)
  }

  return { isValid: errors.length === 0, errors, warnings: [] }
}

export interface EmailInput {
  recipient?: { email: string; name: string }
  subject: string
  body: string
  additionalRecipients?: string[]
}

export function validateEmail(data: EmailInput): ValidationResult {
  const errors: ValidationError[] = []

  // Recipient required
  const recipientError = validators.required(data.recipient?.email, "Recipient")
  if (recipientError) errors.push(recipientError)

  // Subject required
  const subjectRequired = validators.required(data.subject, "Subject")
  if (subjectRequired) {
    errors.push(subjectRequired)
  } else {
    const subjectMax = validators.maxLength(data.subject, 200, "Subject")
    if (subjectMax) errors.push(subjectMax)
  }

  // Body required
  const bodyRequired = validators.required(data.body, "Message")
  if (bodyRequired) {
    errors.push(bodyRequired)
  } else {
    const bodyMax = validators.maxLength(data.body, 10000, "Message")
    if (bodyMax) errors.push(bodyMax)
  }

  // Validate additional recipients
  if (data.additionalRecipients) {
    for (const email of data.additionalRecipients) {
      const emailError = validators.email(email, "Additional recipient")
      if (emailError) errors.push(emailError)
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] }
}
