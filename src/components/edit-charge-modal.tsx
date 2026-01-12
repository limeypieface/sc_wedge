"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { lineItems as defaultLineItems, type ChargeType, type POCharge, type LineItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { X, Truck, Package, Zap, FileText, DollarSign } from "lucide-react"

interface EditChargeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (chargeId: string, updates: ChargeUpdates) => void
  onDelete: (chargeId: string) => void
  charge: POCharge | null
  lines?: LineItem[]
}

export interface ChargeUpdates {
  type: ChargeType
  name: string
  amount: number
  appliesToLines?: number[]
  taxable: boolean
  notes?: string
}

const quickCharges = [
  { type: "shipping" as ChargeType, label: "Shipping", icon: Truck },
  { type: "handling" as ChargeType, label: "Handling", icon: Package },
  { type: "expedite" as ChargeType, label: "Expedite", icon: Zap },
  { type: "duty" as ChargeType, label: "Duty", icon: FileText },
  { type: "other" as ChargeType, label: "Other", icon: DollarSign },
]

export function EditChargeModal({ isOpen, onClose, onSave, onDelete, charge, lines = defaultLineItems }: EditChargeModalProps) {
  const [selectedType, setSelectedType] = useState<ChargeType | null>(null)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [applyTo, setApplyTo] = useState<"order" | "lines">("order")
  const [selectedLines, setSelectedLines] = useState<number[]>([])
  const [taxable, setTaxable] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Initialize form when charge changes
  useEffect(() => {
    if (charge) {
      setSelectedType(charge.type)
      setAmount(charge.amount.toString())
      setDescription(charge.name)
      setApplyTo(charge.appliesToLines && charge.appliesToLines.length > 0 ? "lines" : "order")
      setSelectedLines(charge.appliesToLines || [])
      setTaxable(charge.taxable)
      setShowDeleteConfirm(false)
    }
  }, [charge])

  const handleSave = () => {
    if (!selectedType || !amount || !description.trim() || !charge) return

    const updates: ChargeUpdates = {
      type: selectedType,
      name: description.trim(),
      amount: parseFloat(amount) || 0,
      appliesToLines: applyTo === "lines" && selectedLines.length > 0 ? selectedLines : undefined,
      taxable,
    }
    onSave(charge.id, updates)
    handleClose()
  }

  const handleDelete = () => {
    if (!charge) return
    onDelete(charge.id)
    handleClose()
  }

  const handleClose = () => {
    setSelectedType(null)
    setAmount("")
    setDescription("")
    setApplyTo("order")
    setSelectedLines([])
    setTaxable(false)
    setShowDeleteConfirm(false)
    onClose()
  }

  const toggleLine = (lineNumber: number) => {
    setSelectedLines(prev =>
      prev.includes(lineNumber)
        ? prev.filter(l => l !== lineNumber)
        : [...prev, lineNumber]
    )
  }

  // Check if anything changed
  const hasChanges = charge && (
    selectedType !== charge.type ||
    parseFloat(amount) !== charge.amount ||
    description.trim() !== charge.name ||
    taxable !== charge.taxable ||
    JSON.stringify(selectedLines.sort()) !== JSON.stringify((charge.appliesToLines || []).sort())
  )

  if (!isOpen || !charge) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Edit Fee</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Quick Select Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
            <div className="grid grid-cols-5 gap-2">
              {quickCharges.map((chargeType) => {
                const Icon = chargeType.icon
                return (
                  <button
                    key={chargeType.type}
                    onClick={() => setSelectedType(chargeType.type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all",
                      selectedType === chargeType.type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{chargeType.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-lg h-11 tabular-nums"
              />
            </div>
            {charge && parseFloat(amount) !== charge.amount && (
              <p className="text-xs text-muted-foreground">
                Was: ${charge.amount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Input
              placeholder="Add a note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Apply To */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Apply To</label>
            <div className="flex gap-2">
              <button
                onClick={() => setApplyTo("order")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                  applyTo === "order"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                )}
              >
                Entire Order
              </button>
              <button
                onClick={() => setApplyTo("lines")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                  applyTo === "lines"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                )}
              >
                Specific Lines
              </button>
            </div>

            {/* Line Selection */}
            {applyTo === "lines" && (
              <div className="grid grid-cols-4 gap-2 pt-2">
                {lines.map((item) => (
                  <button
                    key={item.lineNumber}
                    onClick={() => toggleLine(item.lineNumber)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-2 rounded border text-xs transition-all",
                      selectedLines.includes(item.lineNumber)
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[10px] font-medium">
                      {item.lineNumber}
                    </span>
                    <span className="truncate">{item.sku}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Taxable Toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Taxable</span>
            <button
              onClick={() => setTaxable(!taxable)}
              className={cn(
                "w-10 h-6 rounded-full transition-colors relative",
                taxable ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  taxable ? "translate-x-5" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Remove this fee?</p>
              <p className="text-xs text-red-700 mt-1">This will remove ${charge.amount.toFixed(2)} from the order total.</p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={handleDelete}
                >
                  Yes, Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={showDeleteConfirm}
          >
            Remove Fee
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedType || !amount || !description.trim() || !hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
