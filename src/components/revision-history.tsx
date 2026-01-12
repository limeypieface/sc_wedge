"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRevision } from "@/context/RevisionContext"
import { RevisionStatus, RevisionStatusMeta } from "@/types/revision-status"
import {
  Check,
  Clock,
  FileEdit,
  History,
  ChevronRight,
  Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function RevisionHistory() {
  const { revisionHistory, selectedRevision, selectRevision, activeRevision } = useRevision()

  if (revisionHistory.length === 0) return null

  const getStatusBadge = (status: RevisionStatus, isActive: boolean, isDraft: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
          <Check className="h-3 w-3" />
          Active
        </Badge>
      )
    }

    if (isDraft) {
      const statusMeta = RevisionStatusMeta.meta[status]
      const badgeStyles: Record<RevisionStatus, string> = {
        [RevisionStatus.Draft]: "bg-amber-100 text-amber-800 border-amber-200",
        [RevisionStatus.PendingApproval]: "bg-blue-100 text-blue-800 border-blue-200",
        [RevisionStatus.Approved]: "bg-emerald-100 text-emerald-800 border-emerald-200",
        [RevisionStatus.Sent]: "bg-purple-100 text-purple-800 border-purple-200",
        [RevisionStatus.Acknowledged]: "bg-green-100 text-green-800 border-green-200",
        [RevisionStatus.Rejected]: "bg-red-100 text-red-800 border-red-200",
      }
      return (
        <Badge className={cn("gap-1", badgeStyles[status] || "bg-gray-100 text-gray-800")}>
          {statusMeta.icon}
          {statusMeta.label}
        </Badge>
      )
    }

    // Historical/deprecated version
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
        <Archive className="h-3 w-3" />
        Archived
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Revision History</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {revisionHistory.map((revision, index) => {
          const isSelected = selectedRevision?.id === revision.id
          const isCurrentActive = revision.isActive
          const isPreviouslyActive = !revision.isActive && !revision.isDraft && revision.status === RevisionStatus.Acknowledged

          return (
            <button
              key={revision.id}
              onClick={() => selectRevision(revision.id)}
              className={cn(
                "w-full p-3 rounded-lg border text-left transition-all",
                isSelected
                  ? "bg-primary/5 border-primary"
                  : "bg-background border-border hover:bg-muted/50",
                isCurrentActive && !isSelected && "border-emerald-200"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">v{revision.version}</span>
                  {getStatusBadge(revision.status, revision.isActive, revision.isDraft)}
                </div>
                {isSelected && (
                  <Badge variant="outline" className="text-[10px]">Viewing</Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                {/* Creation info */}
                <p>Created {revision.createdAt} by {revision.createdBy}</p>

                {/* Status-specific info */}
                {revision.submittedAt && (
                  <p>Submitted {revision.submittedAt} by {revision.submittedBy}</p>
                )}
                {revision.approvedAt && (
                  <p>Approved {revision.approvedAt}</p>
                )}
                {revision.sentAt && (
                  <p>Sent to supplier {revision.sentAt}</p>
                )}
                {revision.acknowledgedAt && (
                  <p>Acknowledged {revision.acknowledgedAt} by {revision.acknowledgedBy}</p>
                )}

                {/* Changes summary */}
                {revision.changes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-muted-foreground font-medium">
                      {revision.changes.length} change{revision.changes.length !== 1 ? 's' : ''}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {revision.changes.slice(0, 2).map((change) => (
                        <li key={change.id} className="flex items-start gap-1.5">
                          <FileEdit className="h-3 w-3 mt-0.5 text-amber-600 shrink-0" />
                          <span className="truncate">{change.description}</span>
                        </li>
                      ))}
                      {revision.changes.length > 2 && (
                        <li className="text-muted-foreground">
                          +{revision.changes.length - 2} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </button>
          )
        })}

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Legend</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Draft</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">In Review</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-muted-foreground">Archived</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
