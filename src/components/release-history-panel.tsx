"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  FileOutput,
  Search,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Filter,
  Calendar,
} from "lucide-react"
import type { ReleaseSummary } from "@/app/supply/purchase-orders/_lib/types/blanket-po.types"

interface ReleaseHistoryPanelProps {
  releases: ReleaseSummary[]
  onReleaseClick?: (releaseNumber: string) => void
  className?: string
}

const STATUS_CONFIG: Record<
  ReleaseSummary["status"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  draft: {
    label: "Draft",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-muted text-muted-foreground",
  },
  open: {
    label: "Open",
    icon: <Package className="w-3.5 h-3.5" />,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  partially_received: {
    label: "Partial",
    icon: <Truck className="w-3.5 h-3.5" />,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  received: {
    label: "Received",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  closed: {
    label: "Closed",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "bg-destructive/10 text-destructive",
  },
}

type StatusFilter = ReleaseSummary["status"] | "all"

export function ReleaseHistoryPanel({
  releases,
  onReleaseClick,
  className,
}: ReleaseHistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const filteredReleases = useMemo(() => {
    let filtered = releases

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.releaseNumber.toLowerCase().includes(query) ||
          r.releaseDate.toLowerCase().includes(query)
      )
    }

    // Sort by sequence number descending (most recent first)
    return [...filtered].sort((a, b) => b.sequenceNumber - a.sequenceNumber)
  }, [releases, statusFilter, searchQuery])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  // Calculate totals
  const totalAmount = releases.reduce((sum, r) => sum + r.amount, 0)
  const activeReleases = releases.filter(
    (r) => r.status !== "closed" && r.status !== "cancelled"
  ).length

  return (
    <div className={cn("border rounded-lg bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <FileOutput className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Release History</h3>
            <p className="text-sm text-muted-foreground">
              {releases.length} releases · {formatCurrency(totalAmount)} total
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="font-semibold tabular-nums">{activeReleases}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="font-semibold tabular-nums">{releases.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search releases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-8 px-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="partially_received">Partial</option>
            <option value="received">Received</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Release list */}
      <div className="divide-y max-h-[400px] overflow-y-auto">
        {filteredReleases.length > 0 ? (
          filteredReleases.map((release) => {
            const statusConfig = STATUS_CONFIG[release.status]

            return (
              <button
                key={release.releaseNumber}
                onClick={() => onReleaseClick?.(release.releaseNumber)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                {/* Sequence badge */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                  #{release.sequenceNumber}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {release.releaseNumber}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        statusConfig.className
                      )}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {release.releaseDate}
                    </span>
                    <span>{release.lineCount} lines</span>
                    {release.requestedDelivery && (
                      <span>Delivery: {release.requestedDelivery}</span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(release.amount)}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            )
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <FileOutput className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No releases found</p>
            {searchQuery || statusFilter !== "all" ? (
              <p className="text-sm mt-1">Try adjusting your filters</p>
            ) : (
              <p className="text-sm mt-1">Create a release to get started</p>
            )}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {filteredReleases.length > 0 && (
        <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30 text-sm">
          <span className="text-muted-foreground">
            Showing {filteredReleases.length} of {releases.length} releases
          </span>
          <span className="font-medium tabular-nums">
            Total: {formatCurrency(filteredReleases.reduce((sum, r) => sum + r.amount, 0))}
          </span>
        </div>
      )}
    </div>
  )
}
