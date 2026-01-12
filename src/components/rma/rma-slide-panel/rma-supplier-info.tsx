"use client"

/**
 * RMASupplierInfo
 *
 * Displays return address and instructions from the external party.
 */

import { MapPin, AlertTriangle, FileText } from "lucide-react"
import { SlidePanelSection } from "@/components/ui/slide-panel"
import type { RMA, RMAVariant } from "@/types/rma-types"
import { RMA_TERMINOLOGY } from "@/types/rma-types"

interface RMASupplierInfoProps {
  rma: RMA
  variant?: RMAVariant
}

export function RMASupplierInfo({ rma, variant = "po" }: RMASupplierInfoProps) {
  const terms = RMA_TERMINOLOGY[variant]

  return (
    <SlidePanelSection title={`RETURN INSTRUCTIONS FROM ${terms.externalPartyShort.toUpperCase()}`}>
      <div className="space-y-4">
        {/* Return Address */}
        {rma.returnAddress && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-muted-foreground text-xs mb-1">Ship to:</p>
              {rma.returnAddress.attention && (
                <p className="font-medium">Attn: {rma.returnAddress.attention}</p>
              )}
              <p>{rma.returnAddress.line1}</p>
              {rma.returnAddress.line2 && <p>{rma.returnAddress.line2}</p>}
              <p>
                {rma.returnAddress.city}, {rma.returnAddress.state} {rma.returnAddress.zip}
              </p>
              {rma.returnAddress.country && rma.returnAddress.country !== "USA" && (
                <p>{rma.returnAddress.country}</p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {rma.returnInstructions && (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Important:</p>
              <p className="text-sm bg-amber-50 text-amber-800 rounded-md p-2 border border-amber-200">
                {rma.returnInstructions}
              </p>
            </div>
          </div>
        )}

        {/* Documents to Include */}
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Include in package:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Copy of RMA form ({rma.rmaNumber || rma.id})
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Original packing slip
              </li>
            </ul>
          </div>
        </div>
      </div>
    </SlidePanelSection>
  )
}
