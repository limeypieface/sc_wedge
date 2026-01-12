"use client"

import { Button } from "@/components/ui/button"
import { Printer, Send, Package, CheckCircle, FileCheck, Eye } from "lucide-react"

export function QuickActionsToolbar() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <Printer className="w-4 h-4" />
        Print
      </Button>
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <Send className="w-4 h-4" />
        Send to Vendor
      </Button>
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <Package className="w-4 h-4" />
        Receive Goods
      </Button>
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <CheckCircle className="w-4 h-4" />
        Match Invoice
      </Button>
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <FileCheck className="w-4 h-4" />
        Generate Payment
      </Button>
      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
        <Eye className="w-4 h-4" />
        View History
      </Button>
    </div>
  )
}
