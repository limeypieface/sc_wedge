"use client"

import { useState, useMemo, useEffect } from "react"
import { getTaxRate } from "@/lib/tax-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Trash2, ChevronDown, AlertTriangle } from "lucide-react"
import type { LineItem, POCharge, ChargeType } from "@/lib/mock-data"
import {
  requiresFinancialApproval,
  getApprovalLevelLabel,
} from "@/types/edit-types"
import { validateLineItem } from "@/lib/validation"
import { useFieldErrors, FieldError, FieldWarning } from "@/hooks/use-field-errors"

interface EditLineModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (changes: LineEditData) => void
  line: LineItem | null
  lineCharges: POCharge[]
}

export interface LineChargeEdit {
  id: string
  action: "add" | "edit" | "delete"
  name: string
  amount: number
  originalAmount?: number
  type: ChargeType
}

export interface LineEditData {
  lineId: number
  lineNumber: number
  sku: string
  changes: {
    field: string
    oldValue: string | number | null
    newValue: string | number | null
    label: string
  }[]
  quantity?: number
  unitPrice?: number
  promisedDate?: string
  discountPercent?: number
  taxRate?: number
  chargeChanges: LineChargeEdit[]
}

const CHARGE_TYPES: { value: ChargeType; label: string }[] = [
  { value: "freight", label: "Freight" },
  { value: "shipping", label: "Shipping" },
  { value: "handling", label: "Handling" },
  { value: "expedite", label: "Expedite" },
  { value: "duties", label: "Duties" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
]

export function EditLineModal({ isOpen, onClose, onSave, line, lineCharges }: EditLineModalProps) {
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [promisedDate, setPromisedDate] = useState("")
  const [discountPercent, setDiscountPercent] = useState("")
  const [taxRate, setTaxRate] = useState("")

  const [localCharges, setLocalCharges] = useState<POCharge[]>([])
  const [deletedChargeIds, setDeletedChargeIds] = useState<Set<string>>(new Set())
  const [showAddCharge, setShowAddCharge] = useState(false)
  const [newChargeType, setNewChargeType] = useState<ChargeType>("other")
  const [newChargeName, setNewChargeName] = useState("")
  const [newChargeAmount, setNewChargeAmount] = useState("")

  // Field validation state
  const fieldErrors = useFieldErrors()

  useEffect(() => {
    if (line && isOpen) {
      setQuantity(line.quantityOrdered?.toString() || "0")
      setUnitPrice(line.unitPrice?.toString() || "0")
      setPromisedDate(line.promisedDate || "")
      setDiscountPercent(line.discountPercent?.toString() || "0")
      // Convert tax code to rate, or use existing rate from centralized config
      const rate = getTaxRate(line.taxCode) * 100 // Convert decimal to percentage for display
      setTaxRate(rate.toString())
      setLocalCharges(lineCharges.map(c => ({ ...c })))
      setDeletedChargeIds(new Set())
      setShowAddCharge(false)
      setNewChargeType("other")
      setNewChargeName("")
      setNewChargeAmount("")
      fieldErrors.clearAll()
    }
  }, [line, lineCharges, isOpen])

  const taxRateDecimal = (parseFloat(taxRate) || 0) / 100

  const calculations = useMemo(() => {
    if (!line) return null

    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice) || 0
    const discount = parseFloat(discountPercent) || 0

    const subtotal = qty * price
    const discountAmount = subtotal * (discount / 100)
    const netAmount = subtotal - discountAmount
    const taxAmount = netAmount * taxRateDecimal

    const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))
    const chargesTotal = activeCharges.reduce((sum, c) => sum + c.amount, 0)
    const lineTotal = netAmount + taxAmount + chargesTotal

    const originalRate = getTaxRate(line.taxCode)
    const originalChargesTotal = lineCharges.reduce((sum, c) => sum + c.amount, 0)
    const originalTotal = line.lineTotal + originalChargesTotal
    const approvalCheck = requiresFinancialApproval(originalTotal, lineTotal)

    return {
      subtotal,
      discountAmount,
      netAmount,
      taxAmount,
      chargesTotal,
      lineTotal,
      originalTotal,
      delta: lineTotal - originalTotal,
      approvalRequired: approvalCheck.requiresApproval,
      approvalLevel: approvalCheck.approvalLevel,
      changePercent: approvalCheck.changePercent,
    }
  }, [line, quantity, unitPrice, discountPercent, taxRateDecimal, localCharges, deletedChargeIds, lineCharges])

  const fieldChanges = useMemo(() => {
    if (!line) return []
    const result: LineEditData["changes"] = []

    const newQty = parseFloat(quantity) || 0
    if (newQty !== line.quantityOrdered) {
      result.push({ field: "quantity", oldValue: line.quantityOrdered, newValue: newQty, label: "Quantity" })
    }

    const newPrice = parseFloat(unitPrice) || 0
    if (newPrice !== line.unitPrice) {
      result.push({ field: "unitPrice", oldValue: line.unitPrice, newValue: newPrice, label: "Unit Price" })
    }

    if (promisedDate !== line.promisedDate) {
      result.push({ field: "promisedDate", oldValue: line.promisedDate, newValue: promisedDate, label: "Promise Date" })
    }

    const newDiscount = parseFloat(discountPercent) || 0
    const originalDiscount = line.discountPercent ?? 0
    if (newDiscount !== originalDiscount) {
      result.push({ field: "discountPercent", oldValue: originalDiscount, newValue: newDiscount, label: "Discount %" })
    }

    const originalRate = getTaxRate(line.taxCode) * 100 // Convert to percentage
    const newRate = parseFloat(taxRate) || 0
    if (newRate !== originalRate) {
      result.push({ field: "taxRate", oldValue: originalRate, newValue: newRate, label: "Tax Rate" })
    }

    return result
  }, [line, quantity, unitPrice, promisedDate, discountPercent, taxRate])

  const chargeChanges = useMemo((): LineChargeEdit[] => {
    const changes: LineChargeEdit[] = []

    deletedChargeIds.forEach(id => {
      const original = lineCharges.find(c => c.id === id)
      if (original) {
        changes.push({ id, action: "delete", name: original.description, amount: original.amount, type: original.type })
      }
    })

    localCharges.forEach(charge => {
      if (deletedChargeIds.has(charge.id)) return
      const original = lineCharges.find(c => c.id === charge.id)
      if (original) {
        if (charge.amount !== original.amount || charge.description !== original.description || charge.type !== original.type) {
          changes.push({ id: charge.id, action: "edit", name: charge.description, amount: charge.amount, originalAmount: original.amount, type: charge.type })
        }
      } else {
        changes.push({ id: charge.id, action: "add", name: charge.description, amount: charge.amount, type: charge.type })
      }
    })

    return changes
  }, [localCharges, deletedChargeIds, lineCharges])

  const hasChanges = fieldChanges.length > 0 || chargeChanges.length > 0

  const handleAddCharge = () => {
    if (!newChargeAmount) return

    const typeDef = CHARGE_TYPES.find(t => t.value === newChargeType)
    const newCharge: POCharge = {
      id: `new-${Date.now()}`,
      type: newChargeType,
      description: newChargeName.trim() || typeDef?.label || "Charge",
      calculation: "fixed",
      rate: parseFloat(newChargeAmount) || 0,
      amount: parseFloat(newChargeAmount) || 0,
      appliesToLines: line ? [line.lineNumber] : [],
      taxable: false,
      billable: true,
    }

    setLocalCharges(prev => [...prev, newCharge])
    setNewChargeType("other")
    setNewChargeName("")
    setNewChargeAmount("")
    setShowAddCharge(false)
  }

  const handleDeleteCharge = (chargeId: string) => {
    if (chargeId.startsWith("new-")) {
      setLocalCharges(prev => prev.filter(c => c.id !== chargeId))
    } else {
      setDeletedChargeIds(prev => new Set([...prev, chargeId]))
    }
  }

  const handleUpdateCharge = (chargeId: string, field: "amount" | "description" | "type", value: string) => {
    setLocalCharges(prev => prev.map(c => {
      if (c.id !== chargeId) return c
      if (field === "amount") return { ...c, amount: parseFloat(value) || 0 }
      if (field === "description") return { ...c, description: value }
      if (field === "type") return { ...c, type: value as ChargeType }
      return c
    }))
  }

  const handleSave = () => {
    if (!line || !hasChanges) return

    // Validate the line item
    const result = validateLineItem({
      sku: line.sku,
      quantity,
      unitPrice,
      discountPercent,
      taxRate,
      unitOfMeasure: line.unitOfMeasure,
    })

    fieldErrors.applyValidationResult(result)

    if (!result.isValid) return

    const editData: LineEditData = {
      lineId: line.id,
      lineNumber: line.lineNumber,
      sku: line.sku,
      changes: fieldChanges,
      quantity: parseFloat(quantity) || line.quantityOrdered,
      unitPrice: parseFloat(unitPrice) || line.unitPrice,
      promisedDate: promisedDate || line.promisedDate,
      discountPercent: parseFloat(discountPercent) || 0,
      taxRate: parseFloat(taxRate) || 0,
      chargeChanges,
    }

    onSave(editData)
    onClose()
  }

  if (!line) return null

  const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-sm font-medium">
            Line {line.lineNumber} &middot; {line.sku}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Qty ({line.unitOfMeasure})</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value)
                  fieldErrors.clearFieldError("Quantity")
                }}
                aria-invalid={fieldErrors.hasError("Quantity")}
                className={cn(
                  "h-8 text-sm",
                  parseFloat(quantity) !== line.quantityOrdered && !fieldErrors.hasError("Quantity") && "ring-1 ring-primary",
                  fieldErrors.hasError("Quantity") && "border-destructive"
                )}
              />
              <FieldError error={fieldErrors.getError("Quantity")} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Unit Price</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => {
                    setUnitPrice(e.target.value)
                    fieldErrors.clearFieldError("Unit Price")
                    fieldErrors.clearFieldWarning("unitPrice")
                  }}
                  aria-invalid={fieldErrors.hasError("Unit Price")}
                  className={cn(
                    "h-8 text-sm pl-5",
                    parseFloat(unitPrice) !== line.unitPrice && !fieldErrors.hasError("Unit Price") && "ring-1 ring-primary",
                    fieldErrors.hasError("Unit Price") && "border-destructive"
                  )}
                />
              </div>
              <FieldError error={fieldErrors.getError("Unit Price")} />
              <FieldWarning warning={fieldErrors.getWarning("unitPrice")} />
            </div>
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Discount %</Label>
              <Input
                type="number"
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(e.target.value)
                  fieldErrors.clearFieldError("Discount")
                  fieldErrors.clearFieldWarning("discount")
                }}
                aria-invalid={fieldErrors.hasError("Discount")}
                className={cn(
                  "h-8 text-sm",
                  parseFloat(discountPercent) !== (line.discountPercent ?? 0) && !fieldErrors.hasError("Discount") && "ring-1 ring-primary",
                  fieldErrors.hasError("Discount") && "border-destructive"
                )}
              />
              <FieldError error={fieldErrors.getError("Discount")} />
              <FieldWarning warning={fieldErrors.getWarning("discount")} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Tax %</Label>
              <Input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => {
                  setTaxRate(e.target.value)
                  fieldErrors.clearFieldError("Tax Rate")
                }}
                aria-invalid={fieldErrors.hasError("Tax Rate")}
                className={cn(
                  "h-8 text-sm",
                  fieldErrors.hasError("Tax Rate") && "border-destructive"
                )}
              />
              <FieldError error={fieldErrors.getError("Tax Rate")} />
            </div>
          </div>

          {/* Promise Date */}
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Promise Date</Label>
            <Input
              type="date"
              value={promisedDate}
              onChange={(e) => setPromisedDate(e.target.value)}
              className={cn("h-8 text-sm w-36", promisedDate !== line.promisedDate && "ring-1 ring-primary")}
            />
          </div>

          {/* Charges */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[11px] text-muted-foreground">Charges</Label>
              {!showAddCharge && (
                <button onClick={() => setShowAddCharge(true)} className="text-[11px] text-primary hover:underline">
                  + Add
                </button>
              )}
            </div>

            {showAddCharge && (
              <div className="mb-3 p-2 bg-muted/30 rounded space-y-2">
                <div className="flex gap-2">
                  <select
                    value={newChargeType}
                    onChange={(e) => setNewChargeType(e.target.value as ChargeType)}
                    className="h-7 px-2 text-xs rounded border border-input bg-background flex-1"
                  >
                    {CHARGE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <div className="relative w-20">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newChargeAmount}
                      onChange={(e) => setNewChargeAmount(e.target.value)}
                      className="h-7 pl-5 text-xs"
                      autoFocus
                    />
                  </div>
                </div>
                <Input
                  placeholder="Description (optional)"
                  value={newChargeName}
                  onChange={(e) => setNewChargeName(e.target.value)}
                  className="h-7 text-xs"
                />
                <div className="flex gap-1">
                  <Button size="sm" className="h-6 text-[11px] px-2" onClick={handleAddCharge} disabled={!newChargeAmount}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={() => { setShowAddCharge(false); setNewChargeName(""); setNewChargeAmount("") }}>Cancel</Button>
                </div>
              </div>
            )}

            {activeCharges.length > 0 ? (
              <div className="space-y-1">
                {activeCharges.map(charge => (
                  <div key={charge.id} className="flex items-center gap-1.5 text-sm">
                    <select
                      value={charge.type}
                      onChange={(e) => handleUpdateCharge(charge.id, "type", e.target.value)}
                      className="h-6 px-1 text-[11px] rounded border border-input bg-background w-[70px]"
                    >
                      {CHARGE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <Input
                      value={charge.description}
                      onChange={(e) => handleUpdateCharge(charge.id, "description", e.target.value)}
                      className="h-6 flex-1 text-xs px-1.5"
                    />
                    <div className="relative w-16">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={charge.amount}
                        onChange={(e) => handleUpdateCharge(charge.id, "amount", e.target.value)}
                        className="h-6 pl-4 text-xs text-right tabular-nums"
                      />
                    </div>
                    <button onClick={() => handleDeleteCharge(charge.id)} className="p-0.5 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : !showAddCharge && (
              <p className="text-[11px] text-muted-foreground">No charges</p>
            )}
          </div>

          {/* Summary */}
          {calculations && (
            <div className="pt-2 border-t text-xs space-y-0.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">${calculations.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums">-${calculations.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {calculations.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span className="tabular-nums">${calculations.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {calculations.chargesTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Charges</span>
                  <span className="tabular-nums">${calculations.chargesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-1 border-t text-sm">
                <span>Total</span>
                <span className="tabular-nums">${calculations.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              {calculations.delta !== 0 && (
                <div className={cn("flex justify-between text-[11px]", calculations.delta > 0 ? "text-amber-600" : "text-emerald-600")}>
                  <span>Change</span>
                  <span className="tabular-nums">{calculations.delta > 0 ? '+' : ''}${calculations.delta.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )}

        </div>

        <DialogFooter className="px-4 py-2 border-t">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
