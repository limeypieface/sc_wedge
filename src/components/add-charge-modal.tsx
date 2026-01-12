"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { lineItems as defaultLineItems, type ChargeType, type ChargeCalculation, type LineItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { X, Truck, Package, Zap, FileText, DollarSign } from "lucide-react"
import { validateCharge } from "@/lib/validation"
import { useFieldErrors, FieldError, FieldWarning } from "@/hooks/use-field-errors"

interface AddChargeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (charge: NewCharge) => void
  lines?: LineItem[]
}

export interface NewCharge {
  type: ChargeType
  name: string
  calculation: ChargeCalculation
  rate: number
  appliesToLines?: number[]
  taxable: boolean
  billable: boolean
  notes?: string
}

const quickCharges = [
  { type: "shipping" as ChargeType, label: "Shipping", icon: Truck },
  { type: "handling" as ChargeType, label: "Handling", icon: Package },
  { type: "expedite" as ChargeType, label: "Expedite", icon: Zap },
  { type: "duty" as ChargeType, label: "Duty", icon: FileText },
  { type: "other" as ChargeType, label: "Other", icon: DollarSign },
]

export function AddChargeModal({ isOpen, onClose, onSave, lines = defaultLineItems }: AddChargeModalProps) {
  const [selectedType, setSelectedType] = useState<ChargeType | null>(null)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [applyTo, setApplyTo] = useState<"order" | "lines">("order")
  const [selectedLines, setSelectedLines] = useState<number[]>([])
  const [taxable, setTaxable] = useState(false)

  // Field validation state
  const fieldErrors = useFieldErrors()

  const handleSave = () => {
    // Validate the charge
    const result = validateCharge({
      type: selectedType || "",
      amount,
      description: selectedType === "other" ? description : undefined,
    })

    fieldErrors.applyValidationResult(result)

    if (!result.isValid) return

    const charge: NewCharge = {
      type: selectedType!,
      name: description || quickCharges.find(c => c.type === selectedType)?.label || "Charge",
      calculation: "fixed",
      rate: parseFloat(amount) || 0,
      appliesToLines: applyTo === "lines" && selectedLines.length > 0 ? selectedLines : undefined,
      taxable,
      billable: true,
    }
    onSave?.(charge)
    handleClose()
  }

  const handleClose = () => {
    setSelectedType(null)
    setAmount("")
    setDescription("")
    setApplyTo("order")
    setSelectedLines([])
    setTaxable(false)
    fieldErrors.clearAll()
    onClose()
  }

  const toggleLine = (lineNumber: number) => {
    setSelectedLines(prev =>
      prev.includes(lineNumber)
        ? prev.filter(l => l !== lineNumber)
        : [...prev, lineNumber]
    )
  }

  if (!isOpen) return null

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
          <h2 className="text-base font-semibold">Add Fee</h2>
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
              {quickCharges.map((charge) => {
                const Icon = charge.icon
                return (
                  <button
                    key={charge.type}
                    onClick={() => {
                      setSelectedType(charge.type)
                      fieldErrors.clearFieldError("Charge Type")
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all",
                      selectedType === charge.type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                      fieldErrors.hasError("Charge Type") && "border-destructive"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{charge.label}</span>
                  </button>
                )
              })}
            </div>
            <FieldError error={fieldErrors.getError("Charge Type")} />
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
                onChange={(e) => {
                  setAmount(e.target.value)
                  fieldErrors.clearFieldError("Amount")
                  fieldErrors.clearFieldWarning("Charge amount")
                }}
                aria-invalid={fieldErrors.hasError("Amount")}
                className={cn(
                  "pl-7 text-lg h-11 tabular-nums",
                  fieldErrors.hasError("Amount") && "border-destructive"
                )}
                autoFocus
              />
            </div>
            <FieldError error={fieldErrors.getError("Amount")} />
            <FieldWarning warning={fieldErrors.getWarning("Charge amount")} />
          </div>

          {/* Description (required for "other" type) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description {selectedType !== "other" && <span className="font-normal">(optional)</span>}
            </label>
            <Input
              placeholder={selectedType ? `${quickCharges.find(c => c.type === selectedType)?.label} fee...` : "Add a note..."}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                fieldErrors.clearFieldError("Description")
              }}
              aria-invalid={fieldErrors.hasError("Description")}
              className={cn("h-9", fieldErrors.hasError("Description") && "border-destructive")}
            />
            <FieldError error={fieldErrors.getError("Description")} />
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30">
          <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedType || !amount}
          >
            Add Fee
          </Button>
        </div>
      </div>
    </div>
  )
}
