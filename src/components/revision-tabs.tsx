"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRevision } from "@/context/RevisionContext"
import { RevisionStatus, RevisionStatusMeta } from "@/types/revision-status"
import { GitBranch, Check } from "lucide-react"

export function RevisionTabs() {
  const {
    activeRevision,
    pendingDraftRevision,
    selectedRevision,
    selectRevision,
  } = useRevision()

  if (!activeRevision) return null

  const isViewingActive = selectedRevision?.id === activeRevision.id
  const isViewingDraft = selectedRevision?.isDraft

  // Helper to get status badge for draft
  const getDraftStatusBadge = () => {
    if (!pendingDraftRevision) return null

    const status = pendingDraftRevision.status
    const meta = RevisionStatusMeta.meta[status]

    let badgeClass = ""
    switch (status) {
      case RevisionStatus.Draft:
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200"
        break
      case RevisionStatus.PendingApproval:
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200"
        break
      case RevisionStatus.Approved:
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200"
        break
      case RevisionStatus.Sent:
        badgeClass = "bg-purple-100 text-purple-700 border-purple-200"
        break
      case RevisionStatus.Rejected:
        badgeClass = "bg-red-100 text-red-700 border-red-200"
        break
      default:
        badgeClass = "bg-gray-100 text-gray-700 border-gray-200"
    }

    return (
      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 ml-1.5", badgeClass)}>
        {meta.label}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-4">
      {/* Current/Active Revision Tab */}
      <button
        onClick={() => selectRevision(activeRevision.id)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative",
          isViewingActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Check className="h-3.5 w-3.5 text-green-600" />
        <span>Current (v{activeRevision.version})</span>
        {isViewingActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        )}
      </button>

      {/* Draft Revision Tab (if exists) */}
      {pendingDraftRevision && (
        <button
          onClick={() => selectRevision(pendingDraftRevision.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors relative",
            isViewingDraft
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GitBranch className="h-3.5 w-3.5 text-amber-600" />
          <span>Draft (v{pendingDraftRevision.version})</span>
          {getDraftStatusBadge()}
          {isViewingDraft && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      )}
    </div>
  )
}
