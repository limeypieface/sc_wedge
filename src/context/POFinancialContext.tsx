"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import {
  computePOTotals,
  type LineItem,
  type POCharge,
} from "@/lib/mock-data"

// Type for the computed totals from computePOTotals
export type POTotals = ReturnType<typeof computePOTotals>

// Context state interface
interface POFinancialState {
  lines: LineItem[]
  charges: POCharge[]
  totals: POTotals
  isDirty: boolean
}

// Context actions interface
interface POFinancialActions {
  // Line operations
  updateLine: (lineId: number, updates: Partial<LineItem>) => void
  addLine: (line: LineItem) => void
  removeLine: (lineId: number) => void
  setLines: (lines: LineItem[]) => void

  // Charge operations
  updateCharge: (chargeId: string, updates: Partial<POCharge>) => void
  addCharge: (charge: POCharge) => void
  removeCharge: (chargeId: string) => void
  setCharges: (charges: POCharge[]) => void

  // Reset
  resetToInitial: () => void
}

// Combined context type
interface POFinancialContextType extends POFinancialState, POFinancialActions {}

// Create context with null default
const POFinancialContext = createContext<POFinancialContextType | null>(null)

// Provider props
interface POFinancialProviderProps {
  children: ReactNode
  initialLines: LineItem[]
  initialCharges: POCharge[]
}

// Provider component
export function POFinancialProvider({
  children,
  initialLines,
  initialCharges,
}: POFinancialProviderProps) {
  const [lines, setLinesState] = useState<LineItem[]>(initialLines)
  const [charges, setChargesState] = useState<POCharge[]>(initialCharges)

  // Compute totals whenever lines or charges change
  const totals = useMemo(() => {
    return computePOTotals(lines, charges)
  }, [lines, charges])

  // Track if data has changed from initial
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(lines) !== JSON.stringify(initialLines) ||
      JSON.stringify(charges) !== JSON.stringify(initialCharges)
    )
  }, [lines, charges, initialLines, initialCharges])

  // Line operations
  const updateLine = useCallback((lineId: number, updates: Partial<LineItem>) => {
    setLinesState(prev =>
      prev.map(line => {
        if (line.id !== lineId) return line
        const updated = { ...line, ...updates }
        // Recalculate line total if price or quantity changed
        if (updates.unitPrice !== undefined || updates.quantityOrdered !== undefined) {
          const qty = updates.quantityOrdered ?? line.quantityOrdered
          const price = updates.unitPrice ?? line.unitPrice
          updated.lineTotal = Math.round(qty * price * 100) / 100
          updated.subtotal = updated.lineTotal
        }
        return updated
      })
    )
  }, [])

  const addLine = useCallback((line: LineItem) => {
    setLinesState(prev => [...prev, line])
  }, [])

  const removeLine = useCallback((lineId: number) => {
    setLinesState(prev => prev.filter(line => line.id !== lineId))
  }, [])

  const setLines = useCallback((newLines: LineItem[]) => {
    setLinesState(newLines)
  }, [])

  // Charge operations
  const updateCharge = useCallback((chargeId: string, updates: Partial<POCharge>) => {
    setChargesState(prev =>
      prev.map(charge =>
        charge.id === chargeId ? { ...charge, ...updates } : charge
      )
    )
  }, [])

  const addCharge = useCallback((charge: POCharge) => {
    setChargesState(prev => [...prev, charge])
  }, [])

  const removeCharge = useCallback((chargeId: string) => {
    setChargesState(prev => prev.filter(charge => charge.id !== chargeId))
  }, [])

  const setCharges = useCallback((newCharges: POCharge[]) => {
    setChargesState(newCharges)
  }, [])

  // Reset to initial state
  const resetToInitial = useCallback(() => {
    setLinesState(initialLines)
    setChargesState(initialCharges)
  }, [initialLines, initialCharges])

  const value: POFinancialContextType = {
    // State
    lines,
    charges,
    totals,
    isDirty,
    // Line actions
    updateLine,
    addLine,
    removeLine,
    setLines,
    // Charge actions
    updateCharge,
    addCharge,
    removeCharge,
    setCharges,
    // Reset
    resetToInitial,
  }

  return (
    <POFinancialContext.Provider value={value}>
      {children}
    </POFinancialContext.Provider>
  )
}

// Hook to use the context
export function usePOFinancial() {
  const context = useContext(POFinancialContext)
  if (!context) {
    throw new Error("usePOFinancial must be used within a POFinancialProvider")
  }
  return context
}

// Optional hook that returns null if not in provider (for optional consumption)
export function usePOFinancialOptional() {
  return useContext(POFinancialContext)
}
