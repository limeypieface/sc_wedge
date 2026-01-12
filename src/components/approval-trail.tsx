"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Check, X, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ApprovalCycle } from "@/types/approval-types"

interface ApprovalTrailProps {
  cycles: ApprovalCycle[]
  className?: string
}

export function ApprovalTrail({ cycles, className }: ApprovalTrailProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!cycles || cycles.length === 0) return null

  const completedCycles = cycles.filter(c => c.outcome !== "pending")
  if (completedCycles.length === 0) return null

  const hasMultipleCycles = completedCycles.length > 1

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="font-medium">Approval History</span>
        {hasMultipleCycles && (
          <span className="opacity-60">({completedCycles.length} cycles)</span>
        )}
      </button>

      {isExpanded ? (
        <div className="space-y-3 pl-5 border-l-2 border-muted ml-1">
          {cycles.map((cycle, idx) => (
            <CycleEntry
              key={cycle.id}
              cycle={cycle}
              isLast={idx === cycles.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="pl-5">
          <CycleSummary cycles={completedCycles} />
        </div>
      )}
    </div>
  )
}

function CycleEntry({ cycle, isLast }: { cycle: ApprovalCycle; isLast: boolean }) {
  const config = getOutcomeConfig(cycle.outcome)

  return (
    <div className="relative space-y-2">
      {/* Timeline dot */}
      <div className={cn(
        "absolute -left-[calc(0.5rem+5px)] top-1.5 w-2 h-2 rounded-full",
        config.dotColor
      )} />

      {/* Cycle header */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Submission {cycle.cycleNumber}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{cycle.submittedAt}</span>
        {isLast && cycle.outcome === "pending" && (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Current</span>
        )}
      </div>

      {/* Submission notes */}
      {cycle.submissionNotes && (
        <p className="text-sm text-muted-foreground">
          "{cycle.submissionNotes}"
        </p>
      )}

      {/* Outcome */}
      {cycle.outcome !== "pending" && (
        <div className={cn("p-3 rounded-md", config.bgColor)}>
          <div className="flex items-center gap-2 text-sm">
            <config.Icon className={cn("h-4 w-4", config.iconColor)} />
            <span className={cn("font-medium", config.textColor)}>{config.label}</span>
            {cycle.reviewedBy && (
              <>
                <span className="text-muted-foreground">by</span>
                <span className="font-medium">{cycle.reviewedBy}</span>
              </>
            )}
            {cycle.reviewedAt && (
              <span className="text-muted-foreground ml-auto text-xs">{cycle.reviewedAt}</span>
            )}
          </div>

          {/* Feedback */}
          {cycle.feedback && (
            <p className="mt-2 text-sm text-foreground">
              {cycle.feedback}
            </p>
          )}

          {/* Resolution - what was done to address */}
          {cycle.resolution && (
            <p className="mt-2 text-sm text-primary">
              → Addressed: {cycle.resolution}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function CycleSummary({ cycles }: { cycles: ApprovalCycle[] }) {
  if (cycles.length === 0) return null

  const lastCycle = cycles[cycles.length - 1]
  const config = getOutcomeConfig(lastCycle.outcome)

  if (cycles.length === 1) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <config.Icon className={cn("h-3 w-3", config.iconColor)} />
        {config.label}
        {lastCycle.reviewedBy && ` by ${lastCycle.reviewedBy}`}
      </span>
    )
  }

  // Multiple cycles - show summary
  const changesRequested = cycles.filter(c => c.outcome === "changes_requested").length
  const approved = cycles.some(c => c.outcome === "approved")

  return (
    <span className="text-xs text-muted-foreground">
      {changesRequested > 0 && (
        <span className="text-amber-600">{changesRequested} revision{changesRequested > 1 ? "s" : ""}</span>
      )}
      {changesRequested > 0 && approved && " → "}
      {approved && (
        <span className="text-primary">Approved by {lastCycle.reviewedBy}</span>
      )}
    </span>
  )
}

function getOutcomeConfig(outcome: ApprovalCycle["outcome"]) {
  switch (outcome) {
    case "approved":
      return {
        Icon: Check,
        label: "Approved",
        dotColor: "bg-primary",
        bgColor: "bg-primary/5 border border-primary/10",
        iconColor: "text-primary",
        textColor: "text-primary",
      }
    case "rejected":
      return {
        Icon: X,
        label: "Rejected",
        dotColor: "bg-destructive",
        bgColor: "bg-destructive/5 border border-destructive/10",
        iconColor: "text-destructive",
        textColor: "text-destructive",
      }
    case "changes_requested":
      return {
        Icon: MessageSquare,
        label: "Changes Requested",
        dotColor: "bg-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800",
        iconColor: "text-amber-600 dark:text-amber-500",
        textColor: "text-amber-700 dark:text-amber-400",
      }
    default:
      return {
        Icon: ChevronRight,
        label: "Pending",
        dotColor: "bg-muted-foreground/40",
        bgColor: "bg-muted/50",
        iconColor: "text-muted-foreground",
        textColor: "text-muted-foreground",
      }
  }
}
