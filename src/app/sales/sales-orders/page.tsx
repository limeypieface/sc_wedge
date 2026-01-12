"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample sales orders data
const salesOrders = [
  { id: "SO-2026-0001", customer: "Acme Corp", status: "Open", total: 15420.00, lines: 5, date: "Jan 8, 2026" },
  { id: "SO-2026-0002", customer: "TechStart Inc", status: "Partial", total: 8750.00, lines: 3, date: "Jan 10, 2026" },
  { id: "SO-2026-0003", customer: "Global Manufacturing", status: "Shipped", total: 32100.00, lines: 8, date: "Jan 5, 2026" },
]

export default function SalesOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sales Orders</h1>
        <p className="text-muted-foreground">Manage and track your sales orders</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Order #</th>
              <th className="text-left py-3 px-4 font-medium">Customer</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Lines</th>
              <th className="text-right py-3 px-4 font-medium">Total</th>
              <th className="text-right py-3 px-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {salesOrders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="py-3 px-4">
                  <Link href={`/so/${order.id}`} className="text-primary font-medium hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td className="py-3 px-4">{order.customer}</td>
                <td className="py-3 px-4 text-center">
                  <Badge variant={order.status === "Shipped" ? "default" : order.status === "Partial" ? "secondary" : "outline"}>
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
