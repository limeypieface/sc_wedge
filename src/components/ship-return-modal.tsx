"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Truck,
  Loader2,
  Package,
  FileText,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import { useEmailContext } from "@/context/EmailContext"
import { recordRMAReturnShipped, poHeader } from "@/lib/mock-data"
import type { RMA } from "@/types/rma-types"
import { RMA_TYPE_LABELS } from "@/types/rma-types"

interface ShipReturnModalProps {
  isOpen: boolean
  onClose: () => void
  rma: RMA
  onShipped?: () => void
}

const CARRIERS = [
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "dhl", label: "DHL" },
  { value: "freight", label: "Freight Carrier" },
  { value: "other", label: "Other" },
]

export function ShipReturnModal({
  isOpen,
  onClose,
  rma,
  onShipped,
}: ShipReturnModalProps) {
  const { openEmailModal } = useEmailContext()
  const [carrier, setCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)

  const handleSubmit = async () => {
    if (!carrier) {
      toast.error("Please select a carrier")
      return
    }
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Update RMA status
    const carrierLabel = CARRIERS.find(c => c.value === carrier)?.label || carrier
    recordRMAReturnShipped(rma.id, carrierLabel, trackingNumber.trim())

    setIsSubmitting(false)
    toast.success("Return shipment recorded")

    onShipped?.()

    // Open email modal if requested
    if (sendEmail) {
      onClose()
      openEmailModal({
        contextType: "rma_shipped",
        poNumber: poHeader.poNumber,
        rmaId: rma.id,
        rmaNumber: rma.rmaNumber,
        sku: rma.sku,
        itemName: rma.itemName,
        qtyAffected: rma.qtyAffected,
        rmaType: rma.type,
        carrier: carrierLabel,
        returnTrackingNumber: trackingNumber.trim(),
      })
    } else {
      onClose()
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setCarrier("")
      setTrackingNumber("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Ship Return
          </DialogTitle>
          <DialogDescription>
            Enter the return shipment details for RMA {rma.rmaNumber || rma.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* RMA Summary */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">RMA: </span>
                <span className="font-medium">{rma.rmaNumber || rma.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type: </span>
                <span className="font-medium">{RMA_TYPE_LABELS[rma.type]}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Item: </span>
                <span>{rma.sku} - {rma.itemName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Qty: </span>
                <span>{rma.qtyAffected}</span>
              </div>
            </div>

            {/* Return Address */}
            {rma.returnAddress && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Ship to:</p>
                <p className="text-sm">
                  {rma.returnAddress.attention && <span className="font-medium">Attn: {rma.returnAddress.attention}<br /></span>}
                  {rma.returnAddress.line1}<br />
                  {rma.returnAddress.line2 && <>{rma.returnAddress.line2}<br /></>}
                  {rma.returnAddress.city}, {rma.returnAddress.state} {rma.returnAddress.zip}
                </p>
              </div>
            )}

            {/* Return Instructions */}
            {rma.returnInstructions && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Instructions:</p>
                <p className="text-sm text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
                  {rma.returnInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier *</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier..." />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Number */}
          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking Number *</Label>
            <Input
              id="tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number..."
            />
          </div>

          {/* Documents Included */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Documents to Include in Package
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-5">
              <li className="flex items-center gap-1.5">
                <Package className="w-3 h-3" />
                RMA Form (printed copy of {rma.rmaNumber || rma.id})
              </li>
              <li className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Copy of original packing slip
              </li>
            </ul>
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
              <span className="text-sm font-medium">Notify supplier of return shipment</span>
              <p className="text-xs text-muted-foreground">
                Send email with tracking info and RMA paperwork
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
                Recording...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Record Shipment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
