"use client"

import { AlertCircle, CircleAlert } from "lucide-react"
import { useIssuePanel } from "@/context/IssuePanelContext"
import { cn } from "@/lib/utils"

interface IssueCountBadgeProps {
  /** Total number of issues */
  count: number
  /** Number of critical/high priority issues */
  criticalCount?: number
  /** Specific issue ID to highlight when clicked */
  issueId?: string
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Show even when count is 0 */
  showZero?: boolean
  /** Additional class names */
  className?: string
  /** Label to show next to the count */
  label?: string
  /** Compact mode - just show the dot/count without full badge styling */
  compact?: boolean
}

/**
 * A clickable badge showing issue count that opens the issues panel.
 * Shows critical issues in red, otherwise uses muted styling.
 */
export function IssueCountBadge({
  count,
  criticalCount = 0,
  issueId,
  size = "sm",
  showZero = false,
  className,
  label,
  compact = false,
}: IssueCountBadgeProps) {
  const { openPanel, openToIssue } = useIssuePanel()

  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (issueId) {
      openToIssue(issueId)
    } else {
      openPanel()
    }
  }

  const hasCritical = criticalCount > 0
  const sizeClasses = {
    sm: "text-[10px] h-4 px-1.5 gap-0.5",
    md: "text-xs h-5 px-2 gap-1",
    lg: "text-sm h-6 px-2.5 gap-1.5",
  }

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  }

  // Compact mode - just a small indicator dot or count
  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-colors",
          hasCritical
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-amber-100 text-amber-700 hover:bg-amber-200",
          size === "sm" && "min-w-[16px] h-4 text-[10px] px-1",
          size === "md" && "min-w-[18px] h-[18px] text-[11px] px-1",
          size === "lg" && "min-w-[20px] h-5 text-xs px-1.5",
          className
        )}
        title={`${count} issue${count !== 1 ? "s" : ""}${criticalCount > 0 ? ` (${criticalCount} critical)` : ""}`}
      >
        {count}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        hasCritical
          ? "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
          : "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200",
        sizeClasses[size],
        className
      )}
      title={`${count} issue${count !== 1 ? "s" : ""}${criticalCount > 0 ? ` (${criticalCount} critical)` : ""}`}
    >
      <CircleAlert className={iconSizes[size]} />
      <span>{count}</span>
      {label && <span>{label}</span>}
    </button>
  )
}

/**
 * A small inline issue indicator for use in tables and lists.
 * Shows as a small warning icon that links to a specific issue.
 */
interface IssueIndicatorProps {
  issueId: string
  issueNumber?: string
  severity?: "critical" | "high" | "medium" | "low"
  className?: string
}

export function IssueIndicator({
  issueId,
  issueNumber,
  severity = "medium",
  className,
}: IssueIndicatorProps) {
  const { openToIssue } = useIssuePanel()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    openToIssue(issueId)
  }

  const severityColors = {
    critical: "text-red-500 hover:text-red-600",
    high: "text-red-500 hover:text-red-600",
    medium: "text-amber-500 hover:text-amber-600",
    low: "text-muted-foreground hover:text-foreground",
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors",
        severityColors[severity],
        className
      )}
      title={issueNumber ? `View ${issueNumber}` : "View issue"}
    >
      <AlertCircle className="w-3.5 h-3.5" />
      {issueNumber && (
        <span className="text-[10px] font-medium">{issueNumber}</span>
      )}
    </button>
  )
}

/**
 * A badge showing multiple issues for a line item or entity.
 * Shows count and severity breakdown.
 */
interface LineIssuesBadgeProps {
  issues: Array<{
    id: string
    issueNumber?: string
    priority?: "critical" | "high" | "medium" | "low"
  }>
  className?: string
}

export function LineIssuesBadge({ issues, className }: LineIssuesBadgeProps) {
  const { openPanel, openToIssue } = useIssuePanel()

  if (issues.length === 0) {
    return null
  }

  const criticalCount = issues.filter(
    (i) => i.priority === "critical" || i.priority === "high"
  ).length

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (issues.length === 1 && issues[0].id) {
      openToIssue(issues[0].id)
    } else {
      openPanel()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors",
        criticalCount > 0
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200",
        className
      )}
      title={`${issues.length} issue${issues.length !== 1 ? "s" : ""}`}
    >
      <CircleAlert className="w-3 h-3" />
      {issues.length}
    </button>
  )
}
