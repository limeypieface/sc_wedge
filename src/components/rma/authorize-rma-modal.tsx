"use client"

/**
 * AuthorizeRMAModal
 *
 * Modal for recording RMA authorization details from the external party.
 * - RMA number
 * - Return address
 * - Return instructions
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
  ClipboardCheck,
  Loader2,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import type { RMA, RMAVariant, RMAReturnAddress } from "@/types/rma-types"
import { RMA_TERMINOLOGY, RMA_TYPE_LABELS } from "@/types/rma-types"
import { useEmailContext } from "@/context/EmailContext"

interface AuthorizeRMAModalProps {
  isOpen: boolean
  onClose: () => void
  rma: RMA | null
  variant?: RMAVariant
  onAuthorized?: (
    rmaId: string,
    rmaNumber: string,
    returnAddress?: RMAReturnAddress,
    returnInstructions?: string
  ) => void
}

export function AuthorizeRMAModal({
  isOpen,
  onClose,
  rma,
  variant = "po",
  onAuthorized,
}: AuthorizeRMAModalProps) {
  const { openEmailModal } = useEmailContext()
  const terms = RMA_TERMINOLOGY[variant]

  const [rmaNumber, setRmaNumber] = useState("")
  const [returnAddress, setReturnAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    attention: "",
  })
  const [returnInstructions, setReturnInstructions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendFollowUp, setSendFollowUp] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRmaNumber("")
      setReturnAddress({
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
        attention: "",
      })
      setReturnInstructions("")
      setSendFollowUp(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!rma) return

    if (!rmaNumber.trim()) {
      toast.error("Please enter the RMA number")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Build return address if any fields are filled
    const hasAddress = returnAddress.line1.trim() || returnAddress.city.trim()
    const address: RMAReturnAddress | undefined = hasAddress
      ? {
          line1: returnAddress.line1.trim(),
          line2: returnAddress.line2.trim() || undefined,
          city: returnAddress.city.trim(),
          state: returnAddress.state.trim(),
          zip: returnAddress.zip.trim(),
          country: returnAddress.country.trim(),
          attention: returnAddress.attention.trim() || undefined,
        }
      : undefined

    onAuthorized?.(
      rma.id,
      rmaNumber.trim(),
      address,
      returnInstructions.trim() || undefined
    )

    setIsSubmitting(false)
    toast.success(`RMA ${rmaNumber.trim()} authorized`)

    if (sendFollowUp) {
      onClose()
      openEmailModal({
        contextType: "rma_request" as any,
        poNumber: rma.orderNumber,
        rmaId: rma.id,
        subject: `${rma.orderNumber} – RMA ${rmaNumber.trim()} Ready to Ship`,
        body: `Hi,

Confirming receipt of RMA authorization.

  RMA Number: ${rmaNumber.trim()}
  Item: ${rma.sku} - ${rma.itemName}
  Qty: ${rma.qtyAffected}

We will ship the return shortly and provide tracking information.

Thanks`,
      } as any)
    } else {
      onClose()
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!rma) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Record Authorization
          </DialogTitle>
          <DialogDescription>
            Enter the RMA details provided by the {terms.externalParty.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* RMA Summary */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">RMA: </span>
                <span className="font-medium">{rma.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type: </span>
                <span className="font-medium">{RMA_TYPE_LABELS[rma.type]}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Item: </span>
                <span>{rma.sku} - {rma.itemName}</span>
              </div>
            </div>
          </div>

          {/* RMA Number */}
          <div className="space-y-2">
            <Label htmlFor="rmaNumber">{terms.externalParty} RMA Number *</Label>
            <Input
              id="rmaNumber"
              value={rmaNumber}
              onChange={(e) => setRmaNumber(e.target.value)}
              placeholder="Enter RMA number from supplier..."
              className="font-mono"
            />
          </div>

          {/* Return Address */}
          <div className="space-y-3">
            <Label>Return Address (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  value={returnAddress.attention}
                  onChange={(e) =>
                    setReturnAddress((prev) => ({ ...prev, attention: e.target.value }))
                  }
                  placeholder="Attention (e.g., RMA Dept)"
                />
              </div>
              <div className="col-span-2">
                <Input
                  value={returnAddress.line1}
                  onChange={(e) =>
                    setReturnAddress((prev) => ({ ...prev, line1: e.target.value }))
                  }
                  placeholder="Address line 1"
                />
              </div>
              <div className="col-span-2">
                <Input
                  value={returnAddress.line2}
                  onChange={(e) =>
                    setReturnAddress((prev) => ({ ...prev, line2: e.target.value }))
                  }
                  placeholder="Address line 2 (optional)"
                />
              </div>
              <Input
                value={returnAddress.city}
                onChange={(e) =>
                  setReturnAddress((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="City"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={returnAddress.state}
                  onChange={(e) =>
                    setReturnAddress((prev) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="State"
                />
                <Input
                  value={returnAddress.zip}
                  onChange={(e) =>
                    setReturnAddress((prev) => ({ ...prev, zip: e.target.value }))
                  }
                  placeholder="ZIP"
                />
              </div>
            </div>
          </div>

          {/* Return Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Return Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              value={returnInstructions}
              onChange={(e) => setReturnInstructions(e.target.value)}
              placeholder="Any special instructions from the supplier..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Email Option */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={sendFollowUp}
              onChange={(e) => setSendFollowUp(e.target.checked)}
              className="w-4 h-4 rounded border-muted-foreground/30"
            />
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium">Send confirmation email</span>
              <p className="text-xs text-muted-foreground">
                Confirm receipt of authorization
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
                Saving...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                Record Authorization
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
