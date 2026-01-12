"use client"

import Link from "next/link"
import { Search, SlidersHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStatusIcon } from "@/lib/ui/status-icons"

// Avatar badge colors for suppliers
const supplierColors: Record<string, string> = {
  "CompositeFrames": "bg-yellow-500",
  "Lego Builders": "bg-pink-500",
  "Brick LLC": "bg-cyan-500",
  "Tech Suppliers Inc.": "bg-purple-500",
  "Precision Parts Co": "bg-green-500",
}

// Get initials from supplier name
function getInitials(name: string): string {
  const words = name.split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Get avatar color
function getAvatarColor(supplier: string): string {
  return supplierColors[supplier] || "bg-gray-500"
}

// Format relative date
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return "just now"
  if (diffHours < 24) return `about ${diffHours} hours ago`
  if (diffDays === 1) return "1 day ago"
  return `${diffDays} days ago`
}

// Format fulfillment date
function formatFulfillmentDate(dateString: string | null): string {
  if (!dateString) return "—"
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return date.toISOString().split('T')[0]
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "in 1 day"
  if (diffDays <= 7) return `in ${diffDays} days`
  return date.toISOString().split('T')[0]
}

// Purchase order status type
type POStatus = "Received" | "Draft" | "Approved" | "Pending" | "Shipped"

// Map PO statuses to universal status stages
const STATUS_STAGE_MAP: Record<POStatus, Parameters<typeof getStatusIcon>[0]> = {
  Draft: "draft",
  Pending: "open",
  Approved: "started",
  Shipped: "mostlyComplete",
  Received: "complete",
}

// Status indicator component using universal icons
function StatusIndicator({ status }: { status: POStatus }) {
  const stage = STATUS_STAGE_MAP[status] || "open"
  const icon = getStatusIcon(stage)
  const isMuted = status === "Draft" || status === "Pending"

  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`text-sm ${isMuted ? "text-muted-foreground" : ""}`}>
        {status}
      </span>
    </div>
  )
}

// Purchase orders data matching the screenshot
const purchaseOrders = [
  {
    id: "PO-1446",
    supplier: "CompositeFrames",
    urgency: null,
    status: "Received" as POStatus,
    totalPrice: 1450.50,
    fulfillmentDate: "2026-04-08",
    createdAt: "2026-01-12T07:00:00Z",
    updatedAt: "2026-01-12T07:00:00Z",
  },
  {
    id: "PO-1445",
    supplier: "Lego Builders",
    urgency: null,
    status: "Draft" as POStatus,
    totalPrice: 4.05,
    fulfillmentDate: "2026-01-13",
    createdAt: "2026-01-12T07:00:00Z",
    updatedAt: "2026-01-12T07:00:00Z",
  },
  {
    id: "PO-1439",
    supplier: "Lego Builders",
    urgency: null,
    status: "Received" as POStatus,
    totalPrice: 10.56,
    fulfillmentDate: "2026-01-23",
    createdAt: "2026-01-09T10:00:00Z",
    updatedAt: "2026-01-09T10:00:00Z",
  },
  {
    id: "PO-1438",
    supplier: "Brick LLC",
    urgency: null,
    status: "Approved" as POStatus,
    totalPrice: 19.40,
    fulfillmentDate: "2026-01-23",
    createdAt: "2026-01-09T10:00:00Z",
    updatedAt: "2026-01-09T10:00:00Z",
  },
  {
    id: "PO-1437",
    supplier: "Brick LLC",
    urgency: null,
    status: "Approved" as POStatus,
    totalPrice: 11.04,
    fulfillmentDate: "2026-01-23",
    createdAt: "2026-01-09T10:00:00Z",
    updatedAt: "2026-01-09T10:00:00Z",
  },
  {
    id: "PO-1436",
    supplier: "Lego Builders",
    urgency: null,
    status: "Approved" as POStatus,
    totalPrice: 5.40,
    fulfillmentDate: "2026-01-23",
    createdAt: "2026-01-09T10:00:00Z",
    updatedAt: "2026-01-09T10:00:00Z",
  },
  {
    id: "PO-1435",
    supplier: "Tech Suppliers Inc.",
    urgency: null,
    status: "Received" as POStatus,
    totalPrice: 2450.00,
    fulfillmentDate: "2026-01-20",
    createdAt: "2026-01-08T14:00:00Z",
    updatedAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "PO-1434",
    supplier: "Precision Parts Co",
    urgency: null,
    status: "Approved" as POStatus,
    totalPrice: 875.25,
    fulfillmentDate: "2026-01-25",
    createdAt: "2026-01-07T11:00:00Z",
    updatedAt: "2026-01-09T16:00:00Z",
  },
]

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4">
        <h1 className="text-xl font-semibold">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">Orders of products to be purchased from suppliers.</p>
      </div>

      {/* Table */}
      <div className="flex-1 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">No.</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Supplier</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Urgency</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground">Total Price</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Fulfillment Date</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Created</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Updated</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-muted/30">
                <td className="py-3 px-3">
                  <Link href={`/po/${order.id}`} className="text-amber-700 hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${getAvatarColor(order.supplier)} flex items-center justify-center text-white text-xs font-medium`}>
                      {getInitials(order.supplier)}
                    </div>
                    <span className="truncate max-w-[120px]">{order.supplier}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {order.urgency || "—"}
                </td>
                <td className="py-3 px-3">
                  <StatusIndicator status={order.status} />
                </td>
                <td className="py-3 px-3 text-right">
                  ${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {formatFulfillmentDate(order.fulfillmentDate)}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {formatRelativeDate(order.createdAt)}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {formatRelativeDate(order.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
