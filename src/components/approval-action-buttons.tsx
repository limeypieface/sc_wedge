"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRevision } from "@/context/RevisionContext"
import { Check, X, CornerDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function ApprovalActionButtons() {
  const { canApprove, approveRevision, rejectRevision, requestChanges, pendingDraftRevision } =
    useRevision()

  const [dialogType, setDialogType] = useState<"approve" | "reject" | "changes" | null>(null)
  const [notes, setNotes] = useState("")

  if (!canApprove || !pendingDraftRevision) return null

  const handleApprove = () => {
    approveRevision(notes || undefined)
    setDialogType(null)
    setNotes("")
  }

  const handleReject = () => {
    if (!notes.trim()) return
    rejectRevision(notes)
    setDialogType(null)
    setNotes("")
  }

  const handleRequestChanges = () => {
    if (!notes.trim()) return
    requestChanges(notes)
    setDialogType(null)
    setNotes("")
  }

  const changes = pendingDraftRevision.changes

  return (
    <>
      {/* Inline approval bar - minimal design */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        {/* Changes summary for approver */}
        {changes.length > 0 && (
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
              Changes to Review
            </span>
            <div className="space-y-1">
              {changes.slice(0, 4).map((change) => (
                <div key={change.id} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">-</span>
                  <span className="text-foreground">{change.description}</span>
                </div>
              ))}
              {changes.length > 4 && (
                <p className="text-xs text-muted-foreground">+{changes.length - 4} more</p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDialogType("changes")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Request changes
            </button>
            <span className="text-muted-foreground">-</span>
            <button
              onClick={() => setDialogType("reject")}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Reject
            </button>
          </div>
          <Button size="sm" onClick={() => setDialogType("approve")}>
            <Check className="h-4 w-4 mr-1.5" />
            Approve
          </Button>
        </div>
      </div>

      {/* Unified dialog */}
      <Dialog open={dialogType !== null} onOpenChange={(open) => !open && setDialogType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "approve" && "Approve Revision"}
              {dialogType === "reject" && "Reject Revision"}
              {dialogType === "changes" && "Request Changes"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "approve" && "This will advance the revision in the approval workflow."}
              {dialogType === "reject" && "This will stop the approval process. The buyer must address issues and resubmit."}
              {dialogType === "changes" && "This returns the revision to draft for the buyer to update."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder={
                dialogType === "approve"
                  ? "Add a note (optional)"
                  : dialogType === "reject"
                  ? "Explain why this is being rejected..."
                  : "Describe what changes are needed..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            {(dialogType === "reject" || dialogType === "changes") && !notes.trim() && (
              <p className="text-xs text-muted-foreground mt-1.5">A note is required</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setDialogType(null)
                setNotes("")
              }}
            >
              Cancel
            </Button>
            {dialogType === "approve" && (
              <Button onClick={handleApprove}>
                <Check className="h-4 w-4 mr-1.5" />
                Approve
              </Button>
            )}
            {dialogType === "reject" && (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!notes.trim()}
              >
                <X className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
            )}
            {dialogType === "changes" && (
              <Button
                onClick={handleRequestChanges}
                disabled={!notes.trim()}
              >
                <CornerDownLeft className="h-4 w-4 mr-1.5" />
                Return for Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
