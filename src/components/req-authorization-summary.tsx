"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, FileText, AlertCircle } from "lucide-react"
import {
  getSourceRequisitions,
  getReqAuthorizationSummary,
  type LineItem,
  type ToleranceStatus,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ReqAuthorizationSummaryProps {
  lines: LineItem[]
  compact?: boolean
}

const STATUS_CONFIG: Record<ToleranceStatus, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  within: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    label: "Within Tolerance",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    label: "Near Tolerance",
  },
  exceeded: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10 border-destructive/30",
    label: "Over Tolerance",
  },
}

export function ReqAuthorizationSummary({ lines, compact = false }: ReqAuthorizationSummaryProps) {
  const sourceReqs = getSourceRequisitions(lines)
  const summary = getReqAuthorizationSummary(lines)
  const statusConfig = STATUS_CONFIG[summary.overallStatus]
  const StatusIcon = statusConfig.icon

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  const formatPercent = (percent: number) =>
    `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`

  if (compact) {
    // Compact view for the header row
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">From:</span>
          <span className="text-sm font-medium">
            {sourceReqs.map(r => r.reqNumber).join(", ")}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs gap-1",
            summary.overallStatus === "exceeded" && "border-destructive/50 text-destructive bg-destructive/5",
            summary.overallStatus === "warning" && "border-amber-500/50 text-amber-700 bg-amber-50",
            summary.overallStatus === "within" && "border-green-500/50 text-green-700 bg-green-50"
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {summary.overallStatus === "within"
            ? "Authorized"
            : formatPercent(summary.totalVariancePercent) + " variance"}
        </Badge>
      </div>
    )
  }

  // Full view for expanded section
  return (
    <div className="bg-background border border-border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Requisition Authorization
      </h3>

      <div className="space-y-4">
        {/* Source Requisitions */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Source Requisitions</div>
          <div className="flex flex-wrap gap-2">
            {sourceReqs.map((req) => (
              <Badge key={req.reqNumber} variant="outline" className="text-xs">
                {req.reqNumber}
                <span className="ml-1.5 text-muted-foreground">
                  ({req.lineCount} {req.lineCount === 1 ? "line" : "lines"})
                </span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Authorization Status */}
        <div className={cn("rounded-lg p-3 border", statusConfig.bgColor)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
              <span className={cn("text-sm font-medium", statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
            <span className={cn("text-sm font-mono", statusConfig.color)}>
              {formatPercent(summary.totalVariancePercent)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Authorized</div>
              <div className="font-medium">{formatCurrency(summary.totalAuthorized)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Actual</div>
              <div className="font-medium">{formatCurrency(summary.totalActual)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Variance</div>
              <div className={cn("font-medium", summary.totalVariance > 0 ? statusConfig.color : "text-green-600")}>
                {summary.totalVariance >= 0 ? "+" : ""}{formatCurrency(summary.totalVariance)}
              </div>
            </div>
          </div>
        </div>

        {/* Line Summary */}
        {(summary.linesWarning > 0 || summary.linesExceeded > 0) && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{summary.linesWithin}</span> lines within tolerance
            {summary.linesWarning > 0 && (
              <>
                {" • "}
                <span className="text-amber-600 font-medium">{summary.linesWarning}</span> near limit
              </>
            )}
            {summary.linesExceeded > 0 && (
              <>
                {" • "}
                <span className="text-destructive font-medium">{summary.linesExceeded}</span> over limit
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
