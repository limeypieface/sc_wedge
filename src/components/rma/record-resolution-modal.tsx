"use client"

/**
 * RecordResolutionModal
 *
 * Modal for recording RMA resolution details.
 * - For replacements: Link to incoming shipment
 * - For credits: Record credit memo number/amount
 * - For disposals: Record disposition notes
 */

import { useState, useEffect } from "react"
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
import {
  CheckCircle2,
  Loader2,
  Package,
  DollarSign,
  Trash2,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"
import type { RMA, RMAVariant, RecordResolutionInput } from "@/types/rma-types"
import { RMA_TERMINOLOGY, RMA_TYPE_LABELS } from "@/types/rma-types"

interface RecordResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  rma: RMA | null
  variant?: RMAVariant
  onResolved?: (rmaId: string, resolution: RecordResolutionInput) => void
}

export function RecordResolutionModal({
  isOpen,
  onClose,
  rma,
  variant = "po",
  onResolved,
}: RecordResolutionModalProps) {
  const terms = RMA_TERMINOLOGY[variant]

  const [replacementShipmentId, setReplacementShipmentId] = useState("")
  const [creditMemoNumber, setCreditMemoNumber] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [dispositionNotes, setDispositionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReplacementShipmentId("")
      setCreditMemoNumber("")
      setCreditAmount("")
      setDispositionNotes("")
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!rma) return

    // Validate based on RMA type
    if (rma.type === "return_replace" && !replacementShipmentId.trim()) {
      toast.error("Please enter the replacement shipment ID")
      return
    }

    if (rma.type === "return_credit" && !creditMemoNumber.trim()) {
      toast.error("Please enter the credit memo number")
      return
    }

    if (rma.type === "dispose" && !dispositionNotes.trim()) {
      toast.error("Please enter disposition notes")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600))

    const resolution: RecordResolutionInput = {}

    if (replacementShipmentId.trim()) {
      resolution.replacementShipmentId = replacementShipmentId.trim()
    }

    if (creditMemoNumber.trim()) {
      resolution.creditMemoNumber = creditMemoNumber.trim()
      if (creditAmount.trim()) {
        resolution.creditAmount = parseFloat(creditAmount)
      }
    }

    if (dispositionNotes.trim()) {
      resolution.dispositionNotes = dispositionNotes.trim()
    }

    onResolved?.(rma.id, resolution)

    setIsSubmitting(false)
    toast.success("RMA resolved successfully")
    onClose()
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!rma) return null

  // Determine what fields to show based on RMA type
  const showReplacement = rma.type === "return_replace" || rma.type === "repair"
  const showCredit = rma.type === "return_credit"
  const showDispose = rma.type === "dispose"

  const getTypeIcon = () => {
    switch (rma.type) {
      case "return_replace":
        return <Package className="w-5 h-5" />
      case "return_credit":
        return <DollarSign className="w-5 h-5" />
      case "repair":
        return <Wrench className="w-5 h-5" />
      case "dispose":
        return <Trash2 className="w-5 h-5" />
      default:
        return <CheckCircle2 className="w-5 h-5" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Record Resolution
          </DialogTitle>
          <DialogDescription>
            Enter the resolution details to close this RMA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* RMA Summary */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">RMA: </span>
                <span className="font-medium">{rma.rmaNumber || rma.id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {getTypeIcon()}
                <span className="font-medium">{RMA_TYPE_LABELS[rma.type]}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Item: </span>
                <span>{rma.sku} - Qty: {rma.qtyAffected}</span>
              </div>
            </div>
          </div>

          {/* Replacement Fields */}
          {showReplacement && (
            <div className="space-y-2">
              <Label htmlFor="replacementShipment">
                {rma.type === "repair" ? "Return Shipment ID" : "Replacement Shipment ID"} *
              </Label>
              <Input
                id="replacementShipment"
                value={replacementShipmentId}
                onChange={(e) => setReplacementShipmentId(e.target.value)}
                placeholder={rma.type === "repair" ? "Enter return shipment ID..." : "Enter replacement shipment ID..."}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {rma.type === "repair"
                  ? "Enter the shipment ID for the repaired items being returned"
                  : "Enter the shipment ID for the replacement items"}
              </p>
            </div>
          )}

          {/* Credit Fields */}
          {showCredit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creditMemo">Credit Memo Number *</Label>
                <Input
                  id="creditMemo"
                  value={creditMemoNumber}
                  onChange={(e) => setCreditMemoNumber(e.target.value)}
                  placeholder="Enter credit memo number..."
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditAmount">Credit Amount (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="creditAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
              </div>
            </>
          )}

          {/* Dispose Fields */}
          {showDispose && (
            <div className="space-y-2">
              <Label htmlFor="disposition">Disposition Notes *</Label>
              <Textarea
                id="disposition"
                value={dispositionNotes}
                onChange={(e) => setDispositionNotes(e.target.value)}
                placeholder="Describe how items were disposed..."
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Document how the items were disposed per {terms.externalParty.toLowerCase()} instructions.
              </p>
            </div>
          )}

          {/* Additional Notes (for all types) */}
          {!showDispose && (
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={dispositionNotes}
                onChange={(e) => setDispositionNotes(e.target.value)}
                placeholder="Any additional notes about the resolution..."
                className="min-h-[60px] resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Resolve RMA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
