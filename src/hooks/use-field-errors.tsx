import { useState, useCallback } from "react"
import type { ValidationResult, ValidationError } from "@/lib/validation"

export interface FieldErrorState {
  /** Current errors by field name */
  errors: Record<string, string>
  /** Current warnings by field name */
  warnings: Record<string, string>
  /** Set an error for a specific field */
  setFieldError: (field: string, message: string) => void
  /** Set a warning for a specific field */
  setFieldWarning: (field: string, message: string) => void
  /** Clear error for a specific field */
  clearFieldError: (field: string) => void
  /** Clear warning for a specific field */
  clearFieldWarning: (field: string) => void
  /** Clear all errors and warnings */
  clearAll: () => void
  /** Check if a field has an error */
  hasError: (field: string) => boolean
  /** Check if a field has a warning */
  hasWarning: (field: string) => boolean
  /** Get error message for a field */
  getError: (field: string) => string | undefined
  /** Get warning message for a field */
  getWarning: (field: string) => string | undefined
  /** Apply validation result to field errors */
  applyValidationResult: (result: ValidationResult) => void
  /** Check if there are any errors */
  hasAnyErrors: boolean
  /** Check if there are any warnings */
  hasAnyWarnings: boolean
}

/**
 * Hook for managing field-level validation errors and warnings in forms.
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { errors, hasError, getError, applyValidationResult } = useFieldErrors()
 *
 *   const handleSubmit = () => {
 *     const result = validateMyData(formData)
 *     applyValidationResult(result)
 *     if (result.isValid) {
 *       // Submit form
 *     }
 *   }
 *
 *   return (
 *     <Input
 *       aria-invalid={hasError("email")}
 *       ...
 *     />
 *     {hasError("email") && (
 *       <span className="text-destructive text-sm">{getError("email")}</span>
 *     )}
 *   )
 * }
 * ```
 */
export function useFieldErrors(): FieldErrorState {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Record<string, string>>({})

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  const setFieldWarning = useCallback((field: string, message: string) => {
    setWarnings(prev => ({ ...prev, [field]: message }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const clearFieldWarning = useCallback((field: string) => {
    setWarnings(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setErrors({})
    setWarnings({})
  }, [])

  const hasError = useCallback((field: string) => {
    return !!errors[field]
  }, [errors])

  const hasWarning = useCallback((field: string) => {
    return !!warnings[field]
  }, [warnings])

  const getError = useCallback((field: string) => {
    return errors[field]
  }, [errors])

  const getWarning = useCallback((field: string) => {
    return warnings[field]
  }, [warnings])

  const applyValidationResult = useCallback((result: ValidationResult) => {
    // Clear existing errors/warnings and apply new ones
    const newErrors: Record<string, string> = {}
    const newWarnings: Record<string, string> = {}

    for (const error of result.errors) {
      newErrors[error.field] = error.message
    }

    for (const warning of result.warnings) {
      newWarnings[warning.field] = warning.message
    }

    setErrors(newErrors)
    setWarnings(newWarnings)
  }, [])

  const hasAnyErrors = Object.keys(errors).length > 0
  const hasAnyWarnings = Object.keys(warnings).length > 0

  return {
    errors,
    warnings,
    setFieldError,
    setFieldWarning,
    clearFieldError,
    clearFieldWarning,
    clearAll,
    hasError,
    hasWarning,
    getError,
    getWarning,
    applyValidationResult,
    hasAnyErrors,
    hasAnyWarnings,
  }
}

/**
 * Helper component for displaying field error messages
 */
export function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <span className="text-destructive text-sm mt-1">{error}</span>
}

/**
 * Helper component for displaying field warning messages
 */
export function FieldWarning({ warning }: { warning?: string }) {
  if (!warning) return null
  return <span className="text-amber-600 text-sm mt-1">{warning}</span>
}
