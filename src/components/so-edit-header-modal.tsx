"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import type { POHeader, POCharge, ChargeType } from "@/lib/mock-data"

interface SOEditHeaderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (changes: SOHeaderEditData) => void
  header: POHeader
  headerCharges: POCharge[]
}

export interface SOHeaderChargeEdit {
  id: string
  action: "add" | "edit" | "delete"
  name: string
  amount: number
  originalAmount?: number
  type: ChargeType
}

export interface SOHeaderEditData {
  changes: {
    field: string
    oldValue: string | null
    newValue: string | null
    label: string
  }[]
  shippingMethod?: string
  shippingTerms?: string
  paymentTerms?: string
  notes?: string
  chargeChanges: SOHeaderChargeEdit[]
}

const SHIPPING_METHODS = ["Ground", "Air", "Express", "Ocean", "Rail", "Will Call"]
const SHIPPING_TERMS = ["FOB Destination", "FOB Origin", "CIF", "DAP", "DDP", "EXW"]
const PAYMENT_TERMS = ["Net 30", "Net 45", "Net 60", "Net 90", "Due on Receipt", "2/10 Net 30", "COD"]

export function SOEditHeaderModal({ isOpen, onClose, onSave, header, headerCharges }: SOEditHeaderModalProps) {
  const [shippingMethod, setShippingMethod] = useState("")
  const [shippingTerms, setShippingTerms] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notes, setNotes] = useState("")

  const [localCharges, setLocalCharges] = useState<POCharge[]>([])
  const [deletedChargeIds, setDeletedChargeIds] = useState<Set<string>>(new Set())
  const [showAddCharge, setShowAddCharge] = useState(false)
  const [newChargeName, setNewChargeName] = useState("")
  const [newChargeAmount, setNewChargeAmount] = useState("")

  useEffect(() => {
    if (header) {
      setShippingMethod(header.shipping.method)
      setShippingTerms(header.shipping.terms)
      setPaymentTerms(header.payment.terms)
      setNotes(header.notes || "")
      setLocalCharges(headerCharges.map(c => ({ ...c })))
      setDeletedChargeIds(new Set())
      setShowAddCharge(false)
      setNewChargeName("")
      setNewChargeAmount("")
    }
  }, [header, headerCharges])

  const calculations = useMemo(() => {
    const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))
    const chargesTotal = activeCharges.reduce((sum, c) => sum + c.amount, 0)
    const originalChargesTotal = headerCharges.reduce((sum, c) => sum + c.amount, 0)

    return {
      chargesTotal,
      originalChargesTotal,
      delta: chargesTotal - originalChargesTotal
    }
  }, [localCharges, deletedChargeIds, headerCharges])

  const fieldChanges = useMemo(() => {
    if (!header) return []

    const result: SOHeaderEditData["changes"] = []

    if (shippingMethod !== header.shipping.method) {
      result.push({
        field: "shippingMethod",
        oldValue: header.shipping.method,
        newValue: shippingMethod,
        label: "Shipping Method"
      })
    }

    if (shippingTerms !== header.shipping.terms) {
      result.push({
        field: "shippingTerms",
        oldValue: header.shipping.terms,
        newValue: shippingTerms,
        label: "Shipping Terms"
      })
    }

    if (paymentTerms !== header.payment.terms) {
      result.push({
        field: "paymentTerms",
        oldValue: header.payment.terms,
        newValue: paymentTerms,
        label: "Payment Terms"
      })
    }

    if (notes !== (header.notes || "")) {
      result.push({
        field: "notes",
        oldValue: header.notes || "(none)",
        newValue: notes || "(none)",
        label: "Notes"
      })
    }

    return result
  }, [header, shippingMethod, shippingTerms, paymentTerms, notes])

  const chargeChanges = useMemo((): SOHeaderChargeEdit[] => {
    const changes: SOHeaderChargeEdit[] = []

    deletedChargeIds.forEach(id => {
      const original = headerCharges.find(c => c.id === id)
      if (original) {
        changes.push({
          id,
          action: "delete",
          name: original.name,
          amount: original.amount,
          type: original.type
        })
      }
    })

    localCharges.forEach(charge => {
      if (deletedChargeIds.has(charge.id)) return

      const original = headerCharges.find(c => c.id === charge.id)
      if (original) {
        if (charge.amount !== original.amount || charge.name !== original.name) {
          changes.push({
            id: charge.id,
            action: "edit",
            name: charge.name,
            amount: charge.amount,
            originalAmount: original.amount,
            type: charge.type
          })
        }
      } else {
        changes.push({
          id: charge.id,
          action: "add",
          name: charge.name,
          amount: charge.amount,
          type: charge.type
        })
      }
    })

    return changes
  }, [localCharges, deletedChargeIds, headerCharges])

  const hasChanges = fieldChanges.length > 0 || chargeChanges.length > 0

  const handleAddCharge = () => {
    if (!newChargeName.trim() || !newChargeAmount) return

    const newCharge: POCharge = {
      id: `new-${Date.now()}`,
      type: "other",
      name: newChargeName.trim(),
      calculation: "fixed",
      rate: parseFloat(newChargeAmount) || 0,
      amount: parseFloat(newChargeAmount) || 0,
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
    if (!hasChanges) return

    const editData: SOHeaderEditData = {
      changes: fieldChanges,
      shippingMethod,
      shippingTerms,
      paymentTerms,
      notes,
      chargeChanges,
    }

    onSave(editData)
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Sales Order Details</DialogTitle>
          <DialogDescription>
            {header.poNumber} - {header.supplier.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {/* Shipping Method */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Shipping Method</Label>
            <div className="flex flex-wrap gap-1.5">
              {SHIPPING_METHODS.map(method => (
                <button
                  key={method}
                  onClick={() => setShippingMethod(method)}
                  className={cn(
                    "py-1.5 px-3 text-xs rounded border transition-colors",
                    shippingMethod === method
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
            {shippingMethod !== header.shipping.method && (
              <p className="text-xs text-muted-foreground">Was: {header.shipping.method}</p>
            )}
          </div>

          {/* Shipping Terms */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Shipping Terms</Label>
            <div className="flex flex-wrap gap-1.5">
              {SHIPPING_TERMS.map(terms => (
                <button
                  key={terms}
                  onClick={() => setShippingTerms(terms)}
                  className={cn(
                    "py-1.5 px-3 text-xs rounded border transition-colors",
                    shippingTerms === terms
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {terms}
                </button>
              ))}
            </div>
            {shippingTerms !== header.shipping.terms && (
              <p className="text-xs text-muted-foreground">Was: {header.shipping.terms}</p>
            )}
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Payment Terms</Label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_TERMS.map(terms => (
                <button
                  key={terms}
                  onClick={() => setPaymentTerms(terms)}
                  className={cn(
                    "py-1.5 px-3 text-xs rounded border transition-colors",
                    paymentTerms === terms
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {terms}
                </button>
              ))}
            </div>
            {paymentTerms !== header.payment.terms && (
              <p className="text-xs text-muted-foreground">Was: {header.payment.terms}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for the customer..."
              className={cn(
                "min-h-[80px] resize-none",
                notes !== (header.notes || "") && "border-primary"
              )}
            />
            {notes !== (header.notes || "") && (
              <p className="text-xs text-muted-foreground">Was: {header.notes || "(none)"}</p>
            )}
          </div>

          <Separator />

          {/* Order Charges Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Order Charges</Label>
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
                  const original = headerCharges.find(c => c.id === charge.id)
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
                      <span className="flex-1 text-sm truncate">{charge.name}</span>
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
              <p className="text-xs text-muted-foreground italic py-2">No order-level charges</p>
            )}

            {activeCharges.length > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Charges Total</span>
                <span className="font-medium tabular-nums">${calculations.chargesTotal.toFixed(2)}</span>
              </div>
            )}
            {calculations.delta !== 0 && (
              <div className={cn(
                "flex justify-between text-xs",
                calculations.delta > 0 ? "text-amber-600" : "text-emerald-600"
              )}>
                <span>Change from original</span>
                <span className="tabular-nums">{calculations.delta > 0 ? '+' : ''}${calculations.delta.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Changes Summary */}
          {hasChanges && (
            <>
              <Separator />
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
            </>
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
