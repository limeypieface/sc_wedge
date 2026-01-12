"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Layers,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  FileText,
} from "lucide-react"
import type { BlanketUtilization, BlanketPOTerms } from "@/app/supply/purchase-orders/_lib/types/blanket-po.types"
import { isBlanketExpired, isBlanketExpiringSoon, getUtilizationPercentage } from "@/app/supply/purchase-orders/_lib/types/blanket-po.types"

interface BlanketUtilizationCardProps {
  terms: BlanketPOTerms
  utilization: BlanketUtilization
  onCreateRelease?: () => void
  className?: string
  compact?: boolean
}

export function BlanketUtilizationCard({
  terms,
  utilization,
  onCreateRelease,
  className,
  compact = false,
}: BlanketUtilizationCardProps) {
  const utilizationPercent = getUtilizationPercentage(utilization, terms.authorizedTotal)
  const isExpired = isBlanketExpired(terms)
  const isExpiringSoon = isBlanketExpiringSoon(terms, 30)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  // Calculate segment widths for stacked bar
  const segments = useMemo(() => {
    const total = terms.authorizedTotal
    if (total <= 0) return { consumed: 0, released: 0, committed: 0, available: 100 }

    const consumed = (utilization.consumed / total) * 100
    const releasedNotConsumed = ((utilization.released - utilization.consumed) / total) * 100
    const committed = (utilization.committed / total) * 100
    const available = (utilization.available / total) * 100

    return {
      consumed: Math.max(0, consumed),
      released: Math.max(0, releasedNotConsumed),
      committed: Math.max(0, committed),
      available: Math.max(0, available),
    }
  }, [utilization, terms.authorizedTotal])

  if (compact) {
    return (
      <div className={cn("p-3 border rounded-lg bg-background", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium">Blanket Utilization</span>
          </div>
          <span className="text-sm font-semibold tabular-nums">{utilizationPercent}%</span>
        </div>

        {/* Compact progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${segments.consumed}%` }}
          />
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${segments.released}%` }}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${segments.committed}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>{formatCurrency(utilization.released)} released</span>
          <span>{formatCurrency(utilization.available)} available</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold">Blanket Utilization</h3>
            <p className="text-sm text-muted-foreground">
              {utilization.releaseCount} releases · Expires {terms.expirationDate}
            </p>
          </div>
        </div>

        {/* Expiration warning */}
        {(isExpired || isExpiringSoon) && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              isExpired
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {isExpired ? "Expired" : "Expiring Soon"}
          </div>
        )}
      </div>

      {/* Utilization visualization */}
      <div className="p-4 space-y-4">
        {/* Main metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Authorized</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(terms.authorizedTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Released</p>
            <p className="text-lg font-semibold tabular-nums text-blue-600 dark:text-blue-400">
              {formatCurrency(utilization.released)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Consumed</p>
            <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(utilization.consumed)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(utilization.available)}
            </p>
          </div>
        </div>

        {/* Stacked progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilization</span>
            <span className="font-medium tabular-nums">{utilizationPercent}%</span>
          </div>

          <div className="h-4 bg-muted rounded-full overflow-hidden flex">
            {/* Consumed - paid/invoiced */}
            <div
              className="bg-emerald-500 transition-all relative group"
              style={{ width: `${segments.consumed}%` }}
            >
              {segments.consumed > 10 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                  Paid
                </span>
              )}
            </div>

            {/* Released but not consumed */}
            <div
              className="bg-blue-500 transition-all relative"
              style={{ width: `${segments.released}%` }}
            >
              {segments.released > 10 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                  Released
                </span>
              )}
            </div>

            {/* Committed but not released */}
            <div
              className="bg-amber-500 transition-all relative"
              style={{ width: `${segments.committed}%` }}
            >
              {segments.committed > 10 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                  Committed
                </span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Consumed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-muted-foreground">Released</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-muted-foreground">Committed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-muted-foreground">Available</span>
            </div>
          </div>
        </div>

        {/* Limits info */}
        {(terms.perReleaseLimit || terms.maxReleases) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
            {terms.perReleaseLimit && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Max per release: {formatCurrency(terms.perReleaseLimit)}</span>
              </div>
            )}
            {terms.maxReleases && (
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>
                  Releases: {utilization.releaseCount} / {terms.maxReleases}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action footer */}
      {onCreateRelease && !isExpired && (
        <div className="px-4 pb-4">
          <Button
            onClick={onCreateRelease}
            className="w-full gap-2"
            disabled={utilization.available <= 0 || (terms.maxReleases ? utilization.releaseCount >= terms.maxReleases : false)}
          >
            <Plus className="w-4 h-4" />
            Create Release
          </Button>
        </div>
      )}
    </div>
  )
}
