"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Package,
  RotateCcw,
  DollarSign,
  Wrench,
  Trash2,
  Loader2,
  Mail,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useEmailContext } from "@/context/EmailContext"
import {
  createRMA,
  poHeader,
  type POIssue,
  type NCR,
  lineItems,
} from "@/lib/mock-data"
import type { RMAType, RMAVariant } from "@/types/rma-types"
import { RMA_TYPE_LABELS } from "@/types/rma-types"
import { validateRMA } from "@/lib/validation"
import { useFieldErrors, FieldError } from "@/hooks/use-field-errors"

interface CreateRMAModalProps {
  isOpen: boolean
  onClose: () => void
  issue?: POIssue
  ncr?: NCR
  shipmentId?: string
  variant?: RMAVariant
  orderNumber?: string
  onRMACreated?: (rmaId: string) => void
}

const RMA_TYPE_OPTIONS: {
  value: RMAType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: "return_replace",
    label: RMA_TYPE_LABELS.return_replace,
    description: "Return defective goods and receive replacement units",
    icon: <RotateCcw className="w-5 h-5" />,
  },
  {
    value: "return_credit",
    label: RMA_TYPE_LABELS.return_credit,
    description: "Return goods and receive a credit memo",
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    value: "repair",
    label: RMA_TYPE_LABELS.repair,
    description: "Send units back for repair and return",
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    value: "dispose",
    label: RMA_TYPE_LABELS.dispose,
    description: "Dispose of goods per supplier instruction (no physical return)",
    icon: <Trash2 className="w-5 h-5" />,
  },
]

export function CreateRMAModal({
  isOpen,
  onClose,
  issue,
  ncr,
  shipmentId,
  variant = "po",
  orderNumber,
  onRMACreated,
}: CreateRMAModalProps) {
  const { openEmailModal } = useEmailContext()
  const [rmaType, setRmaType] = useState<RMAType>("return_replace")
  const [reason, setReason] = useState("")
  const [notesToSupplier, setNotesToSupplier] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)

  // Field validation state
  const fieldErrors = useFieldErrors()

  // Derive item info from issue or NCR
  const lineNumber = issue?.lineNumber || ncr?.lineNumber
  const lineItem = lineNumber ? lineItems.find(l => l.lineNumber === lineNumber) : undefined
  const sku = issue?.sku || lineItem?.sku || ""
  const itemName = lineItem?.name || ""
  const qtyAffected = issue?.qtyAffected || ncr?.qtyAffected || 1
  const effectiveShipmentId = shipmentId || issue?.shipmentId || ""

  // Pre-populate reason from issue/NCR description
  useEffect(() => {
    if (isOpen) {
      const defaultReason = ncr?.description || issue?.description || ""
      setReason(defaultReason)
      setRmaType("return_replace")
      setNotesToSupplier("")
      setSendEmail(true)
      fieldErrors.clearAll()
    }
  }, [isOpen, ncr, issue])

  const handleSubmit = async () => {
    // Validate the RMA
    const maxQty = lineItem?.quantityReceived || qtyAffected
    const result = validateRMA({
      type: rmaType,
      reason,
      qtyAffected,
      maxQty,
    })

    fieldErrors.applyValidationResult(result)

    if (!result.isValid) {
      return
    }

    if (!effectiveShipmentId || !lineNumber || !sku) {
      toast.error("Missing required information")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    const issueId = issue?.id || (ncr ? `ncr-${ncr.id}` : `manual-${Date.now()}`)
    const effectiveOrderNumber = orderNumber || poHeader.poNumber

    const newRMA = createRMA({
      variant,
      orderNumber: effectiveOrderNumber,
      issueId,
      ncrId: ncr?.id || issue?.ncrId,
      shipmentId: effectiveShipmentId,
      lineNumber,
      sku,
      itemName,
      type: rmaType,
      reason: reason.trim(),
      qtyAffected,
      notes: notesToSupplier.trim() || undefined,
    })

    setIsSubmitting(false)
    toast.success(`RMA ${newRMA.id} created successfully`)

    onRMACreated?.(newRMA.id)

    // Open email modal if requested
    if (sendEmail) {
      onClose()
      openEmailModal({
        contextType: "rma_request",
        poNumber: poHeader.poNumber,
        rmaId: newRMA.id,
        sku,
        itemName,
        qtyAffected,
        rmaType,
        issueDescription: reason,
      })
    } else {
      onClose()
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Create Return Authorization
          </DialogTitle>
          <DialogDescription>
            Request an RMA from the supplier for defective or incorrect goods.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Item Info Summary */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Item: </span>
                <span className="font-medium text-primary">{sku}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Qty: </span>
                <span className="font-medium">{qtyAffected}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Description: </span>
                <span>{itemName}</span>
              </div>
              {issue?.ncrId || ncr?.id ? (
                <div className="col-span-2">
                  <span className="text-muted-foreground">NCR: </span>
                  <span className="font-mono text-xs">{issue?.ncrId || ncr?.id}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Return Type Selection */}
          <div className="space-y-2">
            <Label>Return Type</Label>
            <RadioGroup
              value={rmaType}
              onValueChange={(v) => setRmaType(v as RMAType)}
              className="grid grid-cols-1 gap-2"
            >
              {RMA_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    rmaType === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <RadioGroupItem value={option.value} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-muted-foreground",
                          rmaType === option.value && "text-primary"
                        )}
                      >
                        {option.icon}
                      </span>
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Return *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                fieldErrors.clearFieldError("Reason")
              }}
              placeholder="Describe the issue requiring return..."
              aria-invalid={fieldErrors.hasError("Reason")}
              className={cn(
                "min-h-[80px] resize-none",
                fieldErrors.hasError("Reason") && "border-destructive"
              )}
            />
            <FieldError error={fieldErrors.getError("Reason")} />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes to Supplier</Label>
            <Textarea
              id="notes"
              value={notesToSupplier}
              onChange={(e) => setNotesToSupplier(e.target.value)}
              placeholder="Any additional information for the supplier..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Email Option */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 rounded border-muted-foreground/30"
            />
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium">Email RMA request to supplier</span>
              <p className="text-xs text-muted-foreground">
                Opens email composer after creating RMA
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Create RMA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
