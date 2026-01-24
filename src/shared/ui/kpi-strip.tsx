"use client"

import { AlertCircle } from "lucide-react"

export function KPIStrip() {
  const kpis = {
    received: { value: 58, status: "On Track", color: "text-green-600" },
    invoiced: { value: 61, status: "On Track", color: "text-green-600" },
    paid: { value: 24, status: "In Progress", color: "text-blue-600" },
    overdue: { count: 1, status: "Action Needed", color: "text-red-600" },
  }

  return (
    <div className="flex items-center justify-between gap-6 px-6 py-4 border-b bg-white">
      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-600">% Received</div>
          <div className="text-2xl font-bold text-gray-900">{kpis.received.value}%</div>
          <div className="text-xs text-gray-500">{kpis.received.status}</div>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-600">% Invoiced</div>
          <div className="text-2xl font-bold text-gray-900">{kpis.invoiced.value}%</div>
          <div className="text-xs text-gray-500">{kpis.invoiced.status}</div>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-600">% Paid</div>
          <div className="text-2xl font-bold text-gray-900">{kpis.paid.value}%</div>
          <div className="text-xs text-gray-500">{kpis.paid.status}</div>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="text-sm font-medium text-gray-600">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{kpis.overdue.count}</div>
          <div className="text-xs text-red-500">{kpis.overdue.status}</div>
        </div>
      </div>
    </div>
  )
}
