"use client"

import { useState } from "react"
import {
  Clock,
  ChevronDown,
  Mail,
  FileText,
  Package,
  DollarSign,
  Truck,
  RotateCcw,
  ExternalLink,
  CircleAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface IssueCardData {
  id: string
  issueNumber: string
  category?: string
  priority: "critical" | "high" | "medium" | "low"
  title: string
  description?: string
  date?: string
  poNumber?: string
  soNumber?: string
  shipmentId?: string
  sku?: string
  quantity?: number
  onEmailClick?: () => void
  onCreateRMA?: () => void
  onTrackClick?: () => void
}

interface IssueCardProps {
  issue: IssueCardData
  expanded?: boolean
  onToggleExpand?: () => void
  isHighlighted?: boolean
}

// Severity colors
const SEVERITY_COLORS = {
  critical: { border: "border-l-red-400", icon: "text-red-400" },
  high: { border: "border-l-red-400", icon: "text-red-400" },
  medium: { border: "border-l-amber-400", icon: "text-amber-400" },
  low: { border: "border-l-gray-300", icon: "text-gray-400" },
}

export function IssueCard({
  issue,
  expanded = false,
  onToggleExpand,
  isHighlighted = false,
}: IssueCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(expanded)
  const isExpanded = onToggleExpand ? expanded : internalExpanded

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand()
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  const colors = SEVERITY_COLORS[issue.priority] || SEVERITY_COLORS.medium

  // Build order reference string
  const orderRef = issue.poNumber
    ? `PO-${issue.poNumber.split("-").pop()}`
    : issue.soNumber
      ? `SO-${issue.soNumber.split("-").pop()}`
      : null

  return (
    <div
      className={cn(
        "rounded-lg bg-amber-50/50 border-l-[3px] overflow-hidden",
        colors.border,
        isHighlighted && "ring-2 ring-primary ring-offset-1"
      )}
    >
      {/* Card Content */}
      <button
        onClick={handleToggle}
        className="w-full flex items-start gap-2.5 p-3 text-left hover:bg-amber-50/80 transition-colors"
      >
        {/* Circle icon */}
        <CircleAlert className={cn("w-4 h-4 mt-0.5 flex-shrink-0", colors.icon)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Issue ID and Order ref */}
          <div className="text-[11px] text-amber-600">
            {issue.issueNumber}
            {orderRef && <span className="ml-2">{orderRef}</span>}
          </div>

          {/* Title */}
          <p className="text-sm text-foreground mt-0.5 leading-snug">
            {issue.title}
          </p>

          {/* Date */}
          {issue.date && (
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{issue.date}</span>
            </div>
          )}
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground/50 transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-6">
          {/* Description */}
          {issue.description && (
            <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-x-4 text-xs mb-2">
            {issue.sku && (
              <span>
                <span className="text-muted-foreground">Item: </span>
                <span className="text-primary">{issue.sku}</span>
              </span>
            )}
            {issue.shipmentId && (
              <span>
                <span className="text-muted-foreground">Shipment: </span>
                <span>{issue.shipmentId}</span>
              </span>
            )}
            {issue.quantity && (
              <span>
                <span className="text-muted-foreground">Qty: </span>
                <span>{issue.quantity}</span>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {issue.onEmailClick && (
              <button
                onClick={(e) => { e.stopPropagation(); issue.onEmailClick?.() }}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
            )}
            {issue.onCreateRMA && (
              <button
                onClick={(e) => { e.stopPropagation(); issue.onCreateRMA?.() }}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Create RMA
              </button>
            )}
            {issue.onTrackClick && (
              <button
                onClick={(e) => { e.stopPropagation(); issue.onTrackClick?.() }}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Track
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Section component
interface IssueSectionProps {
  title: string
  issues: IssueCardData[]
  expandedIssueId?: string | null
  onToggleExpand?: (issueId: string) => void
  highlightedIssueId?: string | null
}

export function IssueSection({
  title,
  issues,
  expandedIssueId,
  onToggleExpand,
  highlightedIssueId,
}: IssueSectionProps) {
  if (issues.length === 0) return null

  return (
    <div>
      <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="space-y-2">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            expanded={expandedIssueId === issue.id}
            onToggleExpand={onToggleExpand ? () => onToggleExpand(issue.id) : undefined}
            isHighlighted={highlightedIssueId === issue.id}
          />
        ))}
      </div>
    </div>
  )
}
