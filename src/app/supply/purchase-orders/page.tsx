"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Sample purchase orders data
const purchaseOrders = [
  { id: "PO-2026-0001", vendor: "Steel Supply Co", status: "Open", total: 24500.00, lines: 4, date: "Jan 6, 2026" },
  { id: "PO-2026-0002", vendor: "Precision Components", status: "Partial", total: 12300.00, lines: 6, date: "Jan 9, 2026" },
  { id: "PO-2026-0003", vendor: "FastenerWorld Inc", status: "Received", total: 8750.00, lines: 3, date: "Jan 3, 2026" },
  { id: "PO-2026-0004", vendor: "Allied Materials", status: "Pending Approval", total: 45200.00, lines: 8, date: "Jan 11, 2026" },
]

export default function PurchaseOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <p className="text-muted-foreground">Manage and track your purchase orders</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Order #</th>
              <th className="text-left py-3 px-4 font-medium">Vendor</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Lines</th>
              <th className="text-right py-3 px-4 font-medium">Total</th>
              <th className="text-right py-3 px-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {purchaseOrders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="py-3 px-4">
                  <Link href={`/po/${order.id}`} className="text-primary font-medium hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td className="py-3 px-4">{order.vendor}</td>
                <td className="py-3 px-4 text-center">
                  <Badge variant={order.status === "Received" ? "default" : order.status === "Partial" ? "secondary" : "outline"}>
                    {order.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-center">{order.lines}</td>
                <td className="py-3 px-4 text-right font-medium">
                  ${order.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
