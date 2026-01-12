"use client"

import { useState } from "react"
import { Send, FileEdit, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRevision } from "@/context/RevisionContext"
import { approvers } from "@/lib/mock-data"

interface SubmitForApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (notes?: string) => void
}

export function SubmitForApprovalModal({
  isOpen,
  onClose,
  onConfirm,
}: SubmitForApprovalModalProps) {
  const { pendingDraftRevision } = useRevision()
  const [submissionNotes, setSubmissionNotes] = useState("")

  if (!pendingDraftRevision) return null

  const handleConfirm = () => {
    onConfirm(submissionNotes.trim() || undefined)
    setSubmissionNotes("")
  }

  const handleClose = () => {
    setSubmissionNotes("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Submit for Approval</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-4 pt-2">
            <p>
              You are submitting revision v{pendingDraftRevision.version} for approval.
              It will go through the following approval chain.
            </p>

            {/* Changes Summary */}
            {pendingDraftRevision.changes.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm text-foreground">Changes in this revision:</p>
                <ul className="text-sm space-y-1 bg-muted/50 rounded-lg p-3">
                  {pendingDraftRevision.changes.map((change) => (
                    <li key={change.id} className="flex items-start gap-2">
                      <FileEdit className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
                      <span>{change.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submission Notes */}
            <div className="space-y-2">
              <Label htmlFor="submission-notes" className="font-medium text-sm text-foreground">
                Reason for changes (optional)
              </Label>
              <Textarea
                id="submission-notes"
                placeholder="Explain why these changes are needed, any context for approvers..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This note will be visible to all approvers in the chain.
              </p>
            </div>

            <Separator />

            {/* Approval Chain Preview */}
            <div className="space-y-2">
              <p className="font-medium text-sm text-foreground">Approval chain:</p>
              <div className="space-y-2">
                {approvers.map((approver, index) => (
                  <div key={approver.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
                      {approver.level}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{approver.name}</p>
                      <p className="text-xs text-muted-foreground">{approver.role}</p>
                    </div>
                    {index < approvers.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                You&apos;ll be notified when each approver takes action. You can track
                the approval status in the revision panel.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
