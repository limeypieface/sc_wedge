"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  FileOutput,
  AlertCircle,
  Check,
  Calendar,
  Package,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type {
  BlanketLineItem,
  BlanketPOTerms,
  BlanketUtilization,
  ReleaseLineSelection,
} from "@/app/supply/purchase-orders/_lib/types/blanket-po.types"
import { isReleaseWithinLimits } from "@/app/supply/purchase-orders/_lib/types/blanket-po.types"

interface CreateReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  blanketPONumber: string
  terms: BlanketPOTerms
  utilization: BlanketUtilization
  lines: BlanketLineItem[]
  onCreateRelease?: (selection: ReleaseLineSelection[], deliveryDate: string, notes?: string) => void
}

interface LineSelection {
  lineId: number
  sku: string
  name: string
  unitPrice: number
  maxQty: number
  selectedQty: string
  selected: boolean
}

export function CreateReleaseModal({
  isOpen,
  onClose,
  blanketPONumber,
  terms,
  utilization,
  lines,
  onCreateRelease,
}: CreateReleaseModalProps) {
  const [lineSelections, setLineSelections] = useState<LineSelection[]>(() =>
    lines.map((line) => ({
      lineId: line.id,
      sku: line.sku,
      name: line.name,
      unitPrice: line.unitPrice,
      maxQty: line.availableQuantity,
      selectedQty: "",
      selected: false,
    }))
  )
  const [deliveryDate, setDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset when modal opens
  const handleOpen = () => {
    setLineSelections(
      lines.map((line) => ({
        lineId: line.id,
        sku: line.sku,
        name: line.name,
        unitPrice: line.unitPrice,
        maxQty: line.availableQuantity,
        selectedQty: "",
        selected: false,
      }))
    )
    setDeliveryDate("")
    setNotes("")
  }

  // Calculate release total
  const releaseTotal = useMemo(() => {
    return lineSelections.reduce((sum, line) => {
      if (!line.selected || !line.selectedQty) return sum
      return sum + parseFloat(line.selectedQty) * line.unitPrice
    }, 0)
  }, [lineSelections])

  // Validate release
  const validation = useMemo(() => {
    if (releaseTotal === 0) {
      return { valid: false, reason: "Select at least one line with quantity" }
    }
    return isReleaseWithinLimits(releaseTotal, terms, utilization)
  }, [releaseTotal, terms, utilization])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  const toggleLine = (lineId: number) => {
    setLineSelections((prev) =>
      prev.map((line) =>
        line.lineId === lineId
          ? { ...line, selected: !line.selected, selectedQty: line.selected ? "" : "1" }
          : line
      )
    )
  }

  const updateQuantity = (lineId: number, qty: string) => {
    setLineSelections((prev) =>
      prev.map((line) =>
        line.lineId === lineId ? { ...line, selectedQty: qty } : line
      )
    )
  }

  const handleSubmit = async () => {
    if (!validation.valid) {
      toast.error(validation.reason)
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    const selections: ReleaseLineSelection[] = lineSelections
      .filter((line) => line.selected && parseFloat(line.selectedQty) > 0)
      .map((line) => ({
        blanketLineId: line.lineId,
        releaseQuantity: parseFloat(line.selectedQty),
        requestedDelivery: deliveryDate || undefined,
      }))

    onCreateRelease?.(selections, deliveryDate, notes || undefined)

    setIsSubmitting(false)
    toast.success(`Release created from ${blanketPONumber}`)
    onClose()
  }

  const selectedLineCount = lineSelections.filter((l) => l.selected).length

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) handleOpen()
        else onClose()
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileOutput className="w-5 h-5" />
            Create Release from {blanketPONumber}
          </DialogTitle>
          <DialogDescription>
            Select items and quantities to release against this blanket PO.
            Available balance: {formatCurrency(utilization.available)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Line selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Select Lines ({selectedLineCount} selected)
            </Label>
            <div className="border rounded-lg divide-y max-h-[250px] overflow-y-auto">
              {lineSelections.map((line) => (
                <div
                  key={line.lineId}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors",
                    line.selected && "bg-primary/5",
                    line.maxQty === 0 && "opacity-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={line.selected}
                    onChange={() => toggleLine(line.lineId)}
                    disabled={line.maxQty === 0}
                    className="w-4 h-4 rounded border-muted-foreground/30"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-primary">{line.sku}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{line.name}</p>
                  </div>

                  <div className="text-right text-sm shrink-0 w-20">
                    <p className="font-medium">{formatCurrency(line.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.maxQty} available
                    </p>
                  </div>

                  {line.selected && (
                    <div className="shrink-0 w-24">
                      <Input
                        type="number"
                        min="1"
                        max={line.maxQty}
                        value={line.selectedQty}
                        onChange={(e) => updateQuantity(line.lineId, e.target.value)}
                        className="h-8 text-center tabular-nums"
                        placeholder="Qty"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delivery date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Requested Delivery Date
            </Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="h-9 w-48"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Notes (optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this release..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Release summary */}
          <div
            className={cn(
              "p-4 rounded-lg border",
              validation.valid
                ? "bg-muted/30 border-border"
                : "bg-destructive/5 border-destructive/20"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Release Total</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(releaseTotal)}
                </p>
              </div>

              {!validation.valid && validation.reason && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validation.reason}
                </div>
              )}

              {validation.valid && releaseTotal > 0 && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <Check className="w-4 h-4" />
                  Within limits
                </div>
              )}
            </div>

            {/* Limit info */}
            {terms.perReleaseLimit && (
              <p className="text-xs text-muted-foreground mt-2">
                Per-release limit: {formatCurrency(terms.perReleaseLimit)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!validation.valid || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileOutput className="w-4 h-4" />
                Create Release
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
