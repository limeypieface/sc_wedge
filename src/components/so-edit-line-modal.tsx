"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"
import type { LineItem, POCharge, ChargeType } from "@/lib/mock-data"
import { TAX_CODE_OPTIONS, getTaxRate } from "@/lib/tax-config"

interface SOEditLineModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (changes: SOLineEditData) => void
  line: LineItem | null
  lineCharges: POCharge[]
}

export interface SOLineChargeEdit {
  id: string
  action: "add" | "edit" | "delete"
  name: string
  amount: number
  originalAmount?: number
  type: ChargeType
}

export interface SOLineEditData {
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
  taxCode?: "STANDARD" | "EXEMPT" | "REDUCED"
  chargeChanges: SOLineChargeEdit[]
}

// Use centralized TAX_CODE_OPTIONS from tax-config.ts

export function SOEditLineModal({ isOpen, onClose, onSave, line, lineCharges }: SOEditLineModalProps) {
  const [quantity, setQuantity] = useState<string>("")
  const [unitPrice, setUnitPrice] = useState<string>("")
  const [promisedDate, setPromisedDate] = useState<string>("")
  const [discountPercent, setDiscountPercent] = useState<string>("")
  const [taxCode, setTaxCode] = useState<"STANDARD" | "EXEMPT" | "REDUCED">("STANDARD")

  const [localCharges, setLocalCharges] = useState<POCharge[]>([])
  const [deletedChargeIds, setDeletedChargeIds] = useState<Set<string>>(new Set())
  const [showAddCharge, setShowAddCharge] = useState(false)
  const [newChargeName, setNewChargeName] = useState("")
  const [newChargeAmount, setNewChargeAmount] = useState("")

  useEffect(() => {
    if (line) {
      setQuantity(line.quantityOrdered?.toString() || "0")
      setUnitPrice(line.unitPrice?.toString() || "0")
      setPromisedDate(line.promisedDate || "")
      setDiscountPercent(line.discountPercent?.toString() || "0")
      setTaxCode(line.taxCode || "STANDARD")
      setLocalCharges(lineCharges.map(c => ({ ...c })))
      setDeletedChargeIds(new Set())
      setShowAddCharge(false)
      setNewChargeName("")
      setNewChargeAmount("")
    }
  }, [line, lineCharges])

  const selectedTaxRate = TAX_CODE_OPTIONS.find(t => t.value === taxCode)?.rate || 0

  const calculations = useMemo(() => {
    if (!line) return null

    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice) || 0
    const discount = parseFloat(discountPercent) || 0

    const subtotal = qty * price
    const discountAmount = subtotal * (discount / 100)
    const netAmount = subtotal - discountAmount
    const taxAmount = netAmount * selectedTaxRate

    const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))
    const chargesTotal = activeCharges.reduce((sum, c) => sum + c.amount, 0)

    const lineTotal = netAmount + taxAmount + chargesTotal

    const originalChargesTotal = lineCharges.reduce((sum, c) => sum + c.amount, 0)
    const originalTotal = line.lineTotal + originalChargesTotal

    return {
      subtotal,
      discountAmount,
      netAmount,
      taxAmount,
      chargesTotal,
      lineTotal,
      originalTotal,
      delta: lineTotal - originalTotal,
    }
  }, [line, quantity, unitPrice, discountPercent, selectedTaxRate, localCharges, deletedChargeIds, lineCharges])

  const fieldChanges = useMemo(() => {
    if (!line) return []

    const result: SOLineEditData["changes"] = []

    const newQty = parseFloat(quantity) || 0
    if (newQty !== line.quantityOrdered) {
      result.push({
        field: "quantity",
        oldValue: line.quantityOrdered,
        newValue: newQty,
        label: "Quantity"
      })
    }

    const newPrice = parseFloat(unitPrice) || 0
    if (newPrice !== line.unitPrice) {
      result.push({
        field: "unitPrice",
        oldValue: line.unitPrice,
        newValue: newPrice,
        label: "Unit Price"
      })
    }

    if (promisedDate !== line.promisedDate) {
      result.push({
        field: "promisedDate",
        oldValue: line.promisedDate,
        newValue: promisedDate,
        label: "Promise Date"
      })
    }

    const newDiscount = parseFloat(discountPercent) || 0
    const originalDiscount = line.discountPercent ?? 0
    if (newDiscount !== originalDiscount) {
      result.push({
        field: "discountPercent",
        oldValue: originalDiscount,
        newValue: newDiscount,
        label: "Discount %"
      })
    }

    const originalTaxCode = line.taxCode || "STANDARD"
    if (taxCode !== originalTaxCode) {
      result.push({
        field: "taxCode",
        oldValue: originalTaxCode,
        newValue: taxCode,
        label: "Tax Code"
      })
    }

    return result
  }, [line, quantity, unitPrice, promisedDate, discountPercent, taxCode])

  const chargeChanges = useMemo((): SOLineChargeEdit[] => {
    const changes: SOLineChargeEdit[] = []

    deletedChargeIds.forEach(id => {
      const original = lineCharges.find(c => c.id === id)
      if (original) {
        changes.push({
          id,
          action: "delete",
          name: original.description,
          amount: original.amount,
          type: original.type
        })
      }
    })

    localCharges.forEach(charge => {
      if (deletedChargeIds.has(charge.id)) return

      const original = lineCharges.find(c => c.id === charge.id)
      if (original) {
        if (charge.amount !== original.amount || charge.description !== original.description) {
          changes.push({
            id: charge.id,
            action: "edit",
            name: charge.description,
            amount: charge.amount,
            originalAmount: original.amount,
            type: charge.type
          })
        }
      } else {
        changes.push({
          id: charge.id,
          action: "add",
          name: charge.description,
          amount: charge.amount,
          type: charge.type
        })
      }
    })

    return changes
  }, [localCharges, deletedChargeIds, lineCharges])

  const hasChanges = fieldChanges.length > 0 || chargeChanges.length > 0

  const handleAddCharge = () => {
    if (!newChargeName.trim() || !newChargeAmount) return

    const newCharge: POCharge = {
      id: `new-${Date.now()}`,
      type: "other",
      description: newChargeName.trim(),
      calculation: "fixed",
      rate: parseFloat(newChargeAmount) || 0,
      amount: parseFloat(newChargeAmount) || 0,
      appliesToLines: line ? [line.lineNumber] : [],
      taxable: false,
      billable: true,
    }

    setLocalCharges(prev => [...prev, newCharge])
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

  const handleUpdateChargeAmount = (chargeId: string, amount: string) => {
    setLocalCharges(prev => prev.map(c =>
      c.id === chargeId ? { ...c, amount: parseFloat(amount) || 0 } : c
    ))
  }

  const handleSave = () => {
    if (!line || !hasChanges) return

    const editData: SOLineEditData = {
      lineId: line.id,
      lineNumber: line.lineNumber,
      sku: line.sku,
      changes: fieldChanges,
      quantity: parseFloat(quantity) || line.quantityOrdered,
      unitPrice: parseFloat(unitPrice) || line.unitPrice,
      promisedDate: promisedDate || line.promisedDate,
      discountPercent: parseFloat(discountPercent) || 0,
      taxCode,
      chargeChanges,
    }

    onSave(editData)
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  if (!line) return null

  const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Line {line.lineNumber}</DialogTitle>
          <DialogDescription>
            {line.sku} - {line.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {/* Quantity & Price Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs text-muted-foreground">
                Quantity ({line.unitOfMeasure})
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={cn(
                  "h-9",
                  parseFloat(quantity) !== line.quantityOrdered && "border-primary"
                )}
              />
              {parseFloat(quantity) !== line.quantityOrdered && (
                <p className="text-xs text-muted-foreground">Was: {line.quantityOrdered}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unitPrice" className="text-xs text-muted-foreground">
                Unit Price
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className={cn(
                    "h-9 pl-6",
                    parseFloat(unitPrice) !== line.unitPrice && "border-primary"
                  )}
                />
              </div>
              {parseFloat(unitPrice) !== line.unitPrice && (
                <p className="text-xs text-muted-foreground">Was: ${line.unitPrice.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Promise Date */}
          <div className="space-y-1.5">
            <Label htmlFor="promisedDate" className="text-xs text-muted-foreground">
              Promise Date
            </Label>
            <Input
              id="promisedDate"
              type="date"
              value={promisedDate}
              onChange={(e) => setPromisedDate(e.target.value)}
              className={cn(
                "h-9",
                promisedDate !== line.promisedDate && "border-primary"
              )}
            />
            {promisedDate !== line.promisedDate && (
              <p className="text-xs text-muted-foreground">Was: {line.promisedDate}</p>
            )}
          </div>

          {/* Discount & Tax Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discountPercent" className="text-xs text-muted-foreground">
                Discount
              </Label>
              <div className="relative">
                <Input
                  id="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className={cn(
                    "h-9 pr-8",
                    parseFloat(discountPercent) !== (line.discountPercent ?? 0) && "border-primary"
                  )}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              {parseFloat(discountPercent) !== (line.discountPercent ?? 0) && (
                <p className="text-xs text-muted-foreground">Was: {line.discountPercent ?? 0}%</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tax Code</Label>
              <div className="flex gap-1">
                {TAX_CODE_OPTIONS.map(tax => (
                  <button
                    key={tax.value}
                    onClick={() => setTaxCode(tax.value)}
                    className={cn(
                      "flex-1 py-1.5 px-2 text-xs rounded border transition-colors",
                      taxCode === tax.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {tax.value === "STANDARD" ? "Std" : tax.value === "REDUCED" ? "Red" : "Exm"}
                  </button>
                ))}
              </div>
              {taxCode !== (line.taxCode || "STANDARD") && (
                <p className="text-xs text-muted-foreground">Was: {line.taxCode || "STANDARD"}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Line Charges Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Line Charges</Label>
              {!showAddCharge && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddCharge(true)}
                  className="h-6 text-xs text-primary"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {showAddCharge && (
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Charge name"
                    value={newChargeName}
                    onChange={(e) => setNewChargeName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newChargeAmount}
                      onChange={(e) => setNewChargeAmount(e.target.value)}
                      className="h-8 pl-6 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={handleAddCharge}>
                    Add Charge
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowAddCharge(false)
                      setNewChargeName("")
                      setNewChargeAmount("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeCharges.length > 0 ? (
              <div className="space-y-2">
                {activeCharges.map(charge => {
                  const original = lineCharges.find(c => c.id === charge.id)
                  const isNew = charge.id.startsWith("new-")
                  const isModified = original && charge.amount !== original.amount

                  return (
                    <div
                      key={charge.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded border",
                        isNew ? "border-primary/50 bg-primary/5" : "border-border"
                      )}
                    >
                      <span className="flex-1 text-sm truncate">{charge.description}</span>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={charge.amount}
                          onChange={(e) => handleUpdateChargeAmount(charge.id, e.target.value)}
                          className={cn(
                            "h-7 pl-5 text-sm text-right",
                            isModified && "border-primary"
                          )}
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteCharge(charge.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-2">No charges for this line</p>
            )}
          </div>

          <Separator />

          {/* Calculations Summary */}
          {calculations && (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">${calculations.subtotal.toFixed(2)}</span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="tabular-nums">-${calculations.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {calculations.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({(selectedTaxRate * 100).toFixed(2)}%)</span>
                  <span className="tabular-nums">${calculations.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {calculations.chargesTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line Charges</span>
                  <span className="tabular-nums">${calculations.chargesTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-1.5 border-t">
                <span>Line Total</span>
                <span className="tabular-nums">${calculations.lineTotal.toFixed(2)}</span>
              </div>
              {calculations.delta !== 0 && (
                <div className={cn(
                  "flex justify-between text-xs pt-1",
                  calculations.delta > 0 ? "text-amber-600" : "text-emerald-600"
                )}>
                  <span>Change from original</span>
                  <span className="tabular-nums">{calculations.delta > 0 ? '+' : ''}${calculations.delta.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Changes Summary */}
          {hasChanges && (
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
              <p className="font-medium text-muted-foreground">Changes:</p>
              {fieldChanges.map((change, i) => (
                <p key={i}>
                  {change.label}: {change.oldValue} → {change.newValue}
                </p>
              ))}
              {chargeChanges.map((change, i) => (
                <p key={`charge-${i}`}>
                  {change.action === "add" && `+ Add ${change.name}: $${change.amount.toFixed(2)}`}
                  {change.action === "edit" && `${change.name}: $${change.originalAmount?.toFixed(2)} → $${change.amount.toFixed(2)}`}
                  {change.action === "delete" && `- Remove ${change.name}: $${change.amount.toFixed(2)}`}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
