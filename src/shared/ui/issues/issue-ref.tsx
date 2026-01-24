"use client"

import { useIssuePanel } from "@/context/IssuePanelContext"
import { cn } from "@/lib/utils"

interface IssueRefProps {
  issueId: string
  issueNumber: string
  severity?: "critical" | "high" | "medium" | "low"
  className?: string
}

export function IssueRef({ issueId, issueNumber, severity, className }: IssueRefProps) {
  const { openToIssue } = useIssuePanel()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        openToIssue(issueId)
      }}
      className={cn(
        "text-[11px] text-muted-foreground hover:text-foreground",
        "transition-colors cursor-pointer whitespace-nowrap",
        className
      )}
      title={`View ${issueNumber}`}
    >
      {issueNumber}
    </button>
  )
}
