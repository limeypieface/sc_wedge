"use client"

import { Badge } from "@/components/ui/badge"

// Sample customers data
const customers = [
  { id: "CUS-001", name: "Acme Corp", status: "Active", orders: 32, revenue: 245000, location: "New York, NY" },
  { id: "CUS-002", name: "TechStart Inc", status: "Active", orders: 15, revenue: 87500, location: "San Francisco, CA" },
  { id: "CUS-003", name: "Global Manufacturing", status: "Active", orders: 48, revenue: 521000, location: "Houston, TX" },
  { id: "CUS-004", name: "BuildRight LLC", status: "Inactive", orders: 5, revenue: 23000, location: "Phoenix, AZ" },
]

export default function CustomersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground">Manage your customer relationships</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium">ID</th>
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Orders</th>
              <th className="text-right py-3 px-4 font-medium">Revenue</th>
              <th className="text-right py-3 px-4 font-medium">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="py-3 px-4 font-mono text-sm">{customer.id}</td>
                <td className="py-3 px-4 font-medium">{customer.name}</td>
                <td className="py-3 px-4 text-center">
                  <Badge variant={customer.status === "Active" ? "default" : "secondary"}>
                    {customer.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-center">{customer.orders}</td>
                <td className="py-3 px-4 text-right font-medium">
                  ${customer.revenue.toLocaleString("en-US")}
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">{customer.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
