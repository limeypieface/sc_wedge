"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Trash2, Truck, Package, Zap, FileText, DollarSign, ShieldCheck, Shield } from "lucide-react"
import type { POHeader, POCharge, ChargeType } from "@/lib/mock-data"
import {
  requiresFinancialApproval,
  getApprovalLevelLabel,
} from "@/types/edit-types"
import { AlertTriangle, ShieldAlert } from "lucide-react"

interface EditHeaderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (changes: HeaderEditData) => void
  header: POHeader
  headerCharges: POCharge[]
}

export interface HeaderChargeEdit {
  id: string
  action: "add" | "edit" | "delete"
  name: string
  amount: number
  originalAmount?: number
  type: ChargeType
}

export interface HeaderEditData {
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
  chargeChanges: HeaderChargeEdit[]
}

const SHIPPING_METHODS = [
  { value: "Ground", label: "Ground" },
  { value: "Air", label: "Air" },
  { value: "Express", label: "Express" },
  { value: "Ocean", label: "Ocean" },
  { value: "Local Pickup", label: "Pickup" },
]

const SHIPPING_TERMS = [
  { value: "FOB Destination", label: "FOB Dest" },
  { value: "FOB Origin", label: "FOB Origin" },
  { value: "CIF", label: "CIF" },
  { value: "DAP", label: "DAP" },
  { value: "DDP", label: "DDP" },
  { value: "EXW", label: "EXW" },
]

const PAYMENT_TERMS = [
  { value: "Net 30", label: "Net 30" },
  { value: "Net 45", label: "Net 45" },
  { value: "Net 60", label: "Net 60" },
  { value: "Due on Receipt", label: "Due on Receipt" },
  { value: "2/10 Net 30", label: "2/10 Net 30" },
]

const CHARGE_TYPES: { value: ChargeType; label: string; icon: React.ElementType }[] = [
  { value: "freight", label: "Freight", icon: Truck },
  { value: "shipping", label: "Shipping", icon: Truck },
  { value: "handling", label: "Handling", icon: Package },
  { value: "insurance", label: "Insurance", icon: Shield },
  { value: "duties", label: "Duties", icon: FileText },
  { value: "tax", label: "Tax", icon: FileText },
  { value: "other", label: "Other", icon: DollarSign },
]

export function EditHeaderModal({ isOpen, onClose, onSave, header, headerCharges }: EditHeaderModalProps) {
  // Form state
  const [shippingMethod, setShippingMethod] = useState("")
  const [shippingTerms, setShippingTerms] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notes, setNotes] = useState("")

  // Charges state
  const [localCharges, setLocalCharges] = useState<POCharge[]>([])
  const [deletedChargeIds, setDeletedChargeIds] = useState<Set<string>>(new Set())
  const [showAddCharge, setShowAddCharge] = useState(false)
  const [newChargeType, setNewChargeType] = useState<ChargeType>("other")
  const [newChargeName, setNewChargeName] = useState("")
  const [newChargeAmount, setNewChargeAmount] = useState("")

  // Reset form when header changes
  useEffect(() => {
    if (header && isOpen) {
      setShippingMethod(header.shipping?.method || "")
      setShippingTerms(header.shipping?.terms || "")
      setPaymentTerms(header.payment?.terms || "")
      setNotes(header.notes || "")
      setLocalCharges(headerCharges.map(c => ({ ...c })))
      setDeletedChargeIds(new Set())
      setShowAddCharge(false)
      setNewChargeType("other")
      setNewChargeName("")
      setNewChargeAmount("")
    }
  }, [header, headerCharges, isOpen])

  // Calculate totals
  const calculations = useMemo(() => {
    const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))
    const chargesTotal = activeCharges.reduce((sum, c) => sum + c.amount, 0)
    const originalChargesTotal = headerCharges.reduce((sum, c) => sum + c.amount, 0)
    const approvalCheck = requiresFinancialApproval(originalChargesTotal, chargesTotal)

    return {
      chargesTotal,
      originalChargesTotal,
      delta: chargesTotal - originalChargesTotal,
      approvalRequired: approvalCheck.requiresApproval,
      approvalLevel: approvalCheck.approvalLevel,
      changePercent: approvalCheck.changePercent,
    }
  }, [localCharges, deletedChargeIds, headerCharges])

  // Track field changes
  const fieldChanges = useMemo(() => {
    if (!header) return []
    const result: HeaderEditData["changes"] = []

    if (shippingMethod !== (header.shipping?.method || "")) {
      result.push({ field: "shippingMethod", oldValue: header.shipping?.method || "", newValue: shippingMethod, label: "Shipping Method" })
    }

    if (shippingTerms !== (header.shipping?.terms || "")) {
      result.push({ field: "shippingTerms", oldValue: header.shipping?.terms || "", newValue: shippingTerms, label: "Shipping Terms" })
    }

    if (paymentTerms !== (header.payment?.terms || "")) {
      result.push({ field: "paymentTerms", oldValue: header.payment?.terms || "", newValue: paymentTerms, label: "Payment Terms" })
    }

    if (notes !== (header.notes || "")) {
      result.push({ field: "notes", oldValue: header.notes || "(none)", newValue: notes || "(none)", label: "Notes" })
    }

    return result
  }, [header, shippingMethod, shippingTerms, paymentTerms, notes])

  // Track charge changes
  const chargeChanges = useMemo((): HeaderChargeEdit[] => {
    const changes: HeaderChargeEdit[] = []

    deletedChargeIds.forEach(id => {
      const original = headerCharges.find(c => c.id === id)
      if (original) {
        changes.push({ id, action: "delete", name: original.description, amount: original.amount, type: original.type })
      }
    })

    localCharges.forEach(charge => {
      if (deletedChargeIds.has(charge.id)) return
      const original = headerCharges.find(c => c.id === charge.id)
      if (original) {
        if (charge.amount !== original.amount || charge.description !== original.description || charge.type !== original.type) {
          changes.push({ id: charge.id, action: "edit", name: charge.description, amount: charge.amount, originalAmount: original.amount, type: charge.type })
        }
      } else {
        changes.push({ id: charge.id, action: "add", name: charge.description, amount: charge.amount, type: charge.type })
      }
    })

    return changes
  }, [localCharges, deletedChargeIds, headerCharges])

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
    if (!hasChanges) return

    const editData: HeaderEditData = {
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

  const activeCharges = localCharges.filter(c => !deletedChargeIds.has(c.id))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="text-base font-semibold">Edit PO Details</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{header.poNumber} &middot; {header.supplier.name}</p>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Shipping Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Shipping</h3>

            {/* Shipping Method */}
            <div className="space-y-1.5">
              <Label className="text-xs">Method</Label>
              <div className="flex flex-wrap gap-1.5">
                {SHIPPING_METHODS.map(method => (
                  <button
                    key={method.value}
                    onClick={() => setShippingMethod(method.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-xs transition-colors",
                      shippingMethod === method.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-input hover:bg-muted/50"
                    )}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shipping Terms */}
            <div className="space-y-1.5">
              <Label className="text-xs">Terms</Label>
              <div className="flex flex-wrap gap-1.5">
                {SHIPPING_TERMS.map(term => (
                  <button
                    key={term.value}
                    onClick={() => setShippingTerms(term.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-xs transition-colors",
                      shippingTerms === term.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-input hover:bg-muted/50"
                    )}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Payment Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment</h3>

            <div className="space-y-1.5">
              <Label className="text-xs">Terms</Label>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_TERMS.map(term => (
                  <button
                    key={term.value}
                    onClick={() => setPaymentTerms(term.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-xs transition-colors",
                      paymentTerms === term.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-input hover:bg-muted/50"
                    )}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Order Charges Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Charges</h3>
              {!showAddCharge && (
                <Button variant="ghost" size="sm" onClick={() => setShowAddCharge(true)} className="h-7 text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Add Charge
                </Button>
              )}
            </div>

            {/* Add Charge Form */}
            {showAddCharge && (
              <div className="p-3 bg-muted/40 rounded-lg space-y-3 border border-dashed">
                {/* Charge Type Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CHARGE_TYPES.map(type => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          onClick={() => setNewChargeType(type.value)}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors",
                            newChargeType === type.value
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-input hover:bg-muted/50"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {type.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Name & Amount */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-3">
                    <Input
                      placeholder="Description (optional)"
                      value={newChargeName}
                      onChange={(e) => setNewChargeName(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newChargeAmount}
                      onChange={(e) => setNewChargeAmount(e.target.value)}
                      className="h-8 pl-6 text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="h-7" onClick={handleAddCharge} disabled={!newChargeAmount}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => { setShowAddCharge(false); setNewChargeName(""); setNewChargeAmount("") }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Charges */}
            {activeCharges.length > 0 ? (
              <div className="space-y-2">
                {activeCharges.map(charge => {
                  const original = headerCharges.find(c => c.id === charge.id)
                  const isNew = charge.id.startsWith("new-")
                  const isModified = original && (charge.amount !== original.amount || charge.description !== original.description || charge.type !== original.type)

                  return (
                    <div
                      key={charge.id}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border",
                        isNew ? "border-primary/40 bg-primary/5" : isModified ? "border-amber-400/50 bg-amber-50/50" : "border-input"
                      )}
                    >
                      {/* Type Selector */}
                      <select
                        value={charge.type}
                        onChange={(e) => handleUpdateCharge(charge.id, "type", e.target.value)}
                        className="h-7 px-2 text-xs rounded border border-input bg-background"
                      >
                        {CHARGE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>

                      {/* Description */}
                      <Input
                        value={charge.description}
                        onChange={(e) => handleUpdateCharge(charge.id, "description", e.target.value)}
                        className="h-7 flex-1 text-sm"
                      />

                      {/* Amount */}
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={charge.amount}
                          onChange={(e) => handleUpdateCharge(charge.id, "amount", e.target.value)}
                          className="h-7 pl-5 text-sm text-right tabular-nums"
                        />
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCharge(charge.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}

                {/* Charges Total */}
                <div className="flex justify-between text-sm pt-2 px-1">
                  <span className="text-muted-foreground">Charges Total</span>
                  <span className="font-medium tabular-nums">${calculations.chargesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {calculations.delta !== 0 && (
                  <div className={cn("flex justify-between text-xs px-1", calculations.delta > 0 ? "text-amber-600" : "text-emerald-600")}>
                    <span>Change</span>
                    <span className="tabular-nums">{calculations.delta > 0 ? '+' : ''}${calculations.delta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            ) : !showAddCharge && (
              <p className="text-xs text-muted-foreground italic py-3 text-center">No order-level charges</p>
            )}

            {/* Approval Warning */}
            {calculations.approvalRequired && (
              <div className={cn(
                "p-3 rounded-lg border flex items-start gap-3 mt-2",
                calculations.approvalLevel === "executive" ? "bg-red-50 border-red-200" :
                calculations.approvalLevel === "director" ? "bg-amber-50 border-amber-200" :
                "bg-yellow-50 border-yellow-200"
              )}>
                {calculations.approvalLevel === "executive" ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                ) : calculations.approvalLevel === "director" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    calculations.approvalLevel === "executive" ? "text-red-800" :
                    calculations.approvalLevel === "director" ? "text-amber-800" : "text-yellow-800"
                  )}>
                    {getApprovalLevelLabel(calculations.approvalLevel)}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    calculations.approvalLevel === "executive" ? "text-red-600" :
                    calculations.approvalLevel === "director" ? "text-amber-600" : "text-yellow-600"
                  )}>
                    This change will require approval.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Notes Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for the vendor..."
              className={cn("min-h-[80px] resize-none text-sm", notes !== (header.notes || "") && "ring-1 ring-primary")}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
