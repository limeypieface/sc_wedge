"use client"

import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getStatusIcon, type StatusStage } from "@/lib/ui/status-icons"
import { getInitials, getAvatarColor, formatPastRelativeDate, formatFutureDate } from "@/lib/ui/formatters"
import { type SalesOrderStatus, SALES_ORDER_STATUS_META } from "@/app/sales/sales-orders/_lib/types"

/**
 * Avatar badge colors for customers
 */
const customerColors: Record<string, string> = {
  "MapMasters LLC": "bg-purple-600",
  "Patriotic Builder": "bg-pink-500",
  "Defense Solution": "bg-orange-500",
  "Border Patrol Division": "bg-rose-500",
  "Wildfire Response": "bg-amber-500",
  "Infrastructure Inc": "bg-violet-500",
  "Acme Corp": "bg-blue-500",
  "TechStart Inc": "bg-green-500",
}

/**
 * Urgency level type
 */
type UrgencyLevel = "none" | "low" | "high"

/**
 * Map SO statuses to universal status stages
 */
const SO_STATUS_STAGE_MAP: Record<SalesOrderStatus, StatusStage> = {
  draft: "draft",
  pending_approval: "open",
  approved: "started",
  sent: "started",
  confirmed: "partial",
  processing: "partial",
  shipped: "mostlyComplete",
  delivered: "nearComplete",
  completed: "complete",
  cancelled: "cancelled",
  on_hold: "onHold",
}

/**
 * Status indicator component using universal icons
 */
function StatusIndicator({ status }: { status: SalesOrderStatus }) {
  const meta = SALES_ORDER_STATUS_META[status]
  const stage = SO_STATUS_STAGE_MAP[status] || "open"
  const icon = getStatusIcon(stage)
  const isMuted = status === "draft" || status === "pending_approval"

  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`text-sm ${isMuted ? "text-muted-foreground" : ""}`}>
        {meta?.label || status}
      </span>
    </div>
  )
}

/**
 * Urgency indicator component
 */
function UrgencyIndicator({ level }: { level: UrgencyLevel }) {
  switch (level) {
    case "high":
      return <span className="text-red-500 font-bold">!!</span>
    case "low":
      return <span className="text-yellow-500 font-bold">!</span>
    case "none":
    default:
      return <span className="text-muted-foreground">—</span>
  }
}

/**
 * Sales order list item type
 */
interface SalesOrderListItem {
  id: string
  customer: string
  urgency: UrgencyLevel
  status: SalesOrderStatus
  totalPrice: number
  firstShipDate: string
  createdAt: string
  updatedAt: string
}

/**
 * Mock sales orders data
 */
const salesOrders: SalesOrderListItem[] = [
  {
    id: "SO-1444",
    customer: "MapMasters LLC",
    urgency: "none",
    status: "confirmed",
    totalPrice: 23341.70,
    firstShipDate: "2026-02-01",
    createdAt: "2026-01-12T07:00:00Z",
    updatedAt: "2026-01-12T07:00:00Z",
  },
  {
    id: "SO-1433",
    customer: "Patriotic Builder",
    urgency: "high",
    status: "processing",
    totalPrice: 0.00,
    firstShipDate: "2026-01-23",
    createdAt: "2026-01-09T10:00:00Z",
    updatedAt: "2026-01-09T10:00:00Z",
  },
  {
    id: "SO-1432",
    customer: "Patriotic Builder",
    urgency: "low",
    status: "shipped",
    totalPrice: 75.00,
    firstShipDate: "2026-01-13",
    createdAt: "2026-01-09T10:00:00Z",
    updatedAt: "2026-01-09T10:00:00Z",
  },
  {
    id: "SO-1431",
    customer: "MapMasters LLC",
    urgency: "none",
    status: "draft",
    totalPrice: 81967.17,
    firstShipDate: "2026-05-05",
    createdAt: "2026-01-08T14:00:00Z",
    updatedAt: "2026-01-08T14:00:00Z",
  },
  {
    id: "SO-1428",
    customer: "MapMasters LLC",
    urgency: "none",
    status: "approved",
    totalPrice: 23341.70,
    firstShipDate: "2026-02-01",
    createdAt: "2026-01-08T10:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
  },
  {
    id: "SO-1427",
    customer: "Defense Solution",
    urgency: "low",
    status: "pending_approval",
    totalPrice: 28173.24,
    firstShipDate: "2026-04-02",
    createdAt: "2026-01-08T10:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
  },
  {
    id: "SO-1426",
    customer: "Border Patrol Division",
    urgency: "none",
    status: "sent",
    totalPrice: 81506.46,
    firstShipDate: "2026-02-13",
    createdAt: "2026-01-08T10:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
  },
  {
    id: "SO-1425",
    customer: "Wildfire Response",
    urgency: "high",
    status: "delivered",
    totalPrice: 66296.82,
    firstShipDate: "2026-03-09",
    createdAt: "2026-01-08T10:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
  },
  {
    id: "SO-1424",
    customer: "Infrastructure Inc",
    urgency: "high",
    status: "completed",
    totalPrice: 22660.30,
    firstShipDate: "2026-02-13",
    createdAt: "2026-01-08T10:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
  },
]

/**
 * SalesOrdersList - Displays a table of sales orders
 *
 * This is a shared UI component extracted from the sales orders page
 * to keep pages thin and components reusable.
 */
export function SalesOrdersList() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sales Orders</h1>
          <p className="text-sm text-muted-foreground">Orders of products sold to customers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-8">
            New
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">No.</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Urgency</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground">Total Price</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">First Ship Date</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Created</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Updated</th>
            </tr>
          </thead>
          <tbody>
            {salesOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-muted/30">
                <td className="py-3 px-3">
                  <Link href={`/so/${order.id}`} className="text-amber-700 hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${getAvatarColor(order.customer, customerColors)} flex items-center justify-center text-white text-xs font-medium`}>
                      {getInitials(order.customer)}
                    </div>
                    <span className="truncate max-w-[120px]">{order.customer}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <UrgencyIndicator level={order.urgency} />
                </td>
                <td className="py-3 px-3">
                  <StatusIndicator status={order.status} />
                </td>
                <td className="py-3 px-3 text-right">
                  ${order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {formatFutureDate(order.firstShipDate)}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {formatPastRelativeDate(order.createdAt)}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {formatPastRelativeDate(order.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
