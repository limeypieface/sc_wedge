"use client"

/**
 * RMADetailsSummary
 *
 * Displays the item details and reason for the RMA.
 */

import { Package, Tag, Hash, FileText } from "lucide-react"
import { SlidePanelSection } from "@/components/ui/slide-panel"
import type { RMA } from "@/types/rma-types"
import { RMA_TYPE_LABELS } from "@/types/rma-types"

interface RMADetailsSummaryProps {
  rma: RMA
}

export function RMADetailsSummary({ rma }: RMADetailsSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Item Info */}
      <SlidePanelSection title="ITEM DETAILS">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">{rma.sku}</p>
              <p className="text-sm text-muted-foreground truncate">{rma.itemName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-4 text-sm">
              <span>
                <span className="text-muted-foreground">Qty: </span>
                <span className="font-medium">{rma.qtyAffected}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Line: </span>
                <span>{rma.lineNumber}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">{RMA_TYPE_LABELS[rma.type]}</span>
          </div>

          {rma.ncrId && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">
                <span className="text-muted-foreground">NCR: </span>
                <span className="font-mono text-xs">{rma.ncrId}</span>
              </span>
            </div>
          )}
        </div>
      </SlidePanelSection>

      {/* Reason */}
      <SlidePanelSection title="REASON">
        <p className="text-sm text-foreground leading-relaxed">{rma.reason}</p>
        {rma.notes && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            Note: {rma.notes}
          </p>
        )}
      </SlidePanelSection>
    </div>
  )
}
