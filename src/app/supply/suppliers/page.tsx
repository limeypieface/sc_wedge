"use client"

import { Badge } from "@/components/ui/badge"

// Sample suppliers data
const suppliers = [
  { id: "SUP-001", name: "Steel Supply Co", status: "Active", orders: 24, rating: 4.8, location: "Cleveland, OH" },
  { id: "SUP-002", name: "Precision Components", status: "Active", orders: 18, rating: 4.5, location: "Detroit, MI" },
  { id: "SUP-003", name: "FastenerWorld Inc", status: "Active", orders: 42, rating: 4.9, location: "Chicago, IL" },
  { id: "SUP-004", name: "Allied Materials", status: "Under Review", orders: 8, rating: 3.8, location: "Pittsburgh, PA" },
]

export default function SuppliersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <p className="text-muted-foreground">Manage your supplier relationships</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium">ID</th>
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Orders</th>
              <th className="text-center py-3 px-4 font-medium">Rating</th>
              <th className="text-right py-3 px-4 font-medium">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="py-3 px-4 font-mono text-sm">{supplier.id}</td>
                <td className="py-3 px-4 font-medium">{supplier.name}</td>
                <td className="py-3 px-4 text-center">
                  <Badge variant={supplier.status === "Active" ? "default" : "secondary"}>
                    {supplier.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-center">{supplier.orders}</td>
                <td className="py-3 px-4 text-center">
                  <span className={supplier.rating >= 4.5 ? "text-green-600" : supplier.rating >= 4.0 ? "text-amber-600" : "text-red-600"}>
                    {supplier.rating.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">{supplier.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
