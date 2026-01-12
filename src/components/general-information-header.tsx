"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { POStatusSelect } from "@/components/po-status-select"
import { PurchaseOrderStatus } from "@/types/purchase-order-status"

export function GeneralInformationHeader({
  poData,
  isExpanded,
  onExpandChange,
}: {
  poData: any
  isExpanded: boolean
  onExpandChange: (expanded: boolean) => void
}) {
  const [status, setStatus] = useState<PurchaseOrderStatus>(PurchaseOrderStatus.Approved)

  return (
    <Card className="border-0 bg-muted/30 rounded-lg">
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-8 flex-1">
          <div>
            <div className="text-xs text-muted-foreground">Supplier</div>
            <div className="text-sm font-semibold text-foreground">FlightTech</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Owner</div>
            <div className="text-sm font-semibold text-foreground">Sarah Johnson</div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <POStatusSelect
              value={status}
              onChange={setStatus}
              label="Status"
              showLabel={true}
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Ordered</div>
            <div className="text-sm font-semibold text-foreground">Dec 22, 2025</div>
          </div>
        </div>
        <button
          onClick={() => onExpandChange(!isExpanded)}
          className="p-1 hover:bg-muted rounded-md transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-border px-6 py-4 bg-muted/10">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <div className="text-xs text-muted-foreground">PO Type</div>
              <div className="text-sm text-foreground">Standard</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Payment Terms</div>
              <div className="text-sm text-foreground">Net 30</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Currency</div>
              <div className="text-sm text-foreground">USD</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Earliest Expected</div>
              <div className="text-sm text-foreground">Jan 21, 2026</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">FOB Terms</div>
              <div className="text-sm text-foreground">FOB Destination</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Vendor Order #</div>
              <div className="text-sm text-foreground">VO-2025-0342</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="text-sm text-foreground">16 days ago</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Updated</div>
              <div className="text-sm text-foreground">16 days ago</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
