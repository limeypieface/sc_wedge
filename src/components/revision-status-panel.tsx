"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRevision } from "@/context/RevisionContext"
import { useEmailContext } from "@/context/EmailContext"
import { RevisionStatus } from "@/types/revision-status"
import {
  Check,
  Clock,
  X,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  MessageCircle,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RevisionStatusPanelProps {
  poNumber?: string
  onSendToSupplier?: () => void
}

export function RevisionStatusPanel({
  poNumber,
  onSendToSupplier,
}: RevisionStatusPanelProps) {
  const {
    currentUser,
    pendingDraftRevision,
    canSubmit,
    canSendToSupplier,
    canSkipApproval,
    requiresApproval,
    skipApprovalAndSend,
    submitForApproval,
    discardDraft,
    costDeltaInfo,
    sendToSupplier,
  } = useRevision()
  const { openEmailModal } = useEmailContext()

  const [showAllChanges, setShowAllChanges] = useState(false)
  const [showFullTimeline, setShowFullTimeline] = useState(false)
  const [submissionNotes, setSubmissionNotes] = useState("")

  if (!pendingDraftRevision) return null

  // Handle send to supplier - open email modal with change order details
  // Only marks as sent when the email is actually sent (via onSend callback)
  const handleSendToSupplier = () => {
    const poNum = poNumber || pendingDraftRevision.poNumber || "PO-2026-00142"

    openEmailModal({
      contextType: "change_order",
      poNumber: poNum,
      revisionVersion: pendingDraftRevision.version,
      changes: pendingDraftRevision.changes,
      costDelta: costDeltaInfo ? {
        formatted: costDeltaInfo.delta >= 0
          ? `+$${costDeltaInfo.delta.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : `-$${Math.abs(costDeltaInfo.delta).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        percent: costDeltaInfo.deltaPercent,
      } : undefined,
      attachments: [
        {
          id: `co-${pendingDraftRevision.id}`,
          name: `${poNum}_ChangeOrder_v${pendingDraftRevision.version}.pdf`,
          size: "124 KB",
          type: "pdf",
        },
      ],
      // Only mark as sent when user actually sends the email
      onSend: () => {
        sendToSupplier()
        onSendToSupplier?.()
      },
    })
  }

  // Handle skip approval and send - also opens email modal
  // Only marks as sent when the email is actually sent (via onSend callback)
  const handleSkipApprovalAndSend = () => {
    const poNum = poNumber || pendingDraftRevision.poNumber || "PO-2026-00142"

    openEmailModal({
      contextType: "change_order",
      poNumber: poNum,
      revisionVersion: pendingDraftRevision.version,
      changes: pendingDraftRevision.changes,
      costDelta: costDeltaInfo ? {
        formatted: costDeltaInfo.delta >= 0
          ? `+$${costDeltaInfo.delta.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : `-$${Math.abs(costDeltaInfo.delta).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        percent: costDeltaInfo.deltaPercent,
      } : undefined,
      attachments: [
        {
          id: `co-${pendingDraftRevision.id}`,
          name: `${poNum}_ChangeOrder_v${pendingDraftRevision.version}.pdf`,
          size: "124 KB",
          type: "pdf",
        },
      ],
      // Only mark as sent when user actually sends the email
      onSend: () => {
        skipApprovalAndSend()
      },
    })
  }

  const status = pendingDraftRevision.status
  const changes = pendingDraftRevision.changes
  const approvalChain = pendingDraftRevision.approvalChain
  const isApprover = currentUser.isApprover
  const isDraft = status === RevisionStatus.Draft
  const isRejected = status === RevisionStatus.Rejected
  const isPending = status === RevisionStatus.PendingApproval
  const isApproved = status === RevisionStatus.Approved
  const isSent = status === RevisionStatus.Sent

  // Calculate cost impact
  const costImpact = costDeltaInfo ? {
    delta: costDeltaInfo.delta,
    percent: costDeltaInfo.deltaPercent,
    formatted: costDeltaInfo.delta >= 0
      ? `+$${costDeltaInfo.delta.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : `-$${Math.abs(costDeltaInfo.delta).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  } : null

  // Build timeline from persistent audit log
  const buildTimeline = () => {
    const events: Array<{
      id: string
      type: "created" | "submitted" | "approved" | "rejected" | "changes_requested" | "sent" | "acknowledged" | "resubmitted"
      date: string
      user: string
      notes?: string
      role?: string
    }> = []

    // Draft created (always show this first)
    if (pendingDraftRevision.createdAt) {
      events.push({
        id: "created",
        type: "created",
        date: pendingDraftRevision.createdAt,
        user: pendingDraftRevision.createdBy,
      })
    }

    // Add all events from the persistent audit log
    const auditLog = pendingDraftRevision.auditLog || []
    auditLog.forEach((entry) => {
      events.push({
        id: entry.id,
        type: entry.action as typeof events[0]["type"],
        date: entry.date,
        user: entry.user,
        role: entry.role,
        notes: entry.notes,
      })
    })

    return events
  }

  const timeline = buildTimeline()
  const displayedChanges = showAllChanges ? changes : changes.slice(0, 3)
  const displayedTimeline = showFullTimeline ? timeline : timeline.slice(-3)
  const hasMoreTimeline = timeline.length > 3

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Header - Status and Version */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              v{pendingDraftRevision.version}
            </span>
            <StatusBadge status={status} />
          </div>
          {costImpact && Math.abs(costImpact.percent) > 0.1 && (
            <span className={cn(
              "text-xs font-medium tabular-nums",
              costImpact.delta >= 0 ? "text-amber-600" : "text-emerald-600"
            )}>
              {costImpact.formatted} ({costImpact.percent > 0 ? "+" : ""}{costImpact.percent.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Changes Section */}
      {changes.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Changes
            </span>
            <span className="text-xs text-muted-foreground">{changes.length} item{changes.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-1.5">
            {displayedChanges.map((change) => (
              <div key={change.id} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">-</span>
                <span className="text-foreground">{change.description}</span>
              </div>
            ))}
          </div>
          {changes.length > 3 && (
            <button
              onClick={() => setShowAllChanges(!showAllChanges)}
              className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              {showAllChanges ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show {changes.length - 3} more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Current Status / What's Next */}
      <div className="px-4 py-3 border-b border-border">
        <CurrentStatusMessage
          status={status}
          isApprover={isApprover}
          currentUser={currentUser}
          approvalChain={approvalChain}
          requiresApproval={requiresApproval}
        />
      </div>

      {/* Activity Timeline - Shows all comments and actions */}
      {timeline.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Activity
            </span>
            {hasMoreTimeline && (
              <button
                onClick={() => setShowFullTimeline(!showFullTimeline)}
                className="text-xs text-primary hover:underline"
              >
                {showFullTimeline ? "Show recent" : `Show all (${timeline.length})`}
              </button>
            )}
          </div>
          <div className="space-y-0">
            {displayedTimeline.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isLast={index === displayedTimeline.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inline notes for submission/resubmission */}
      {!isApprover && (isDraft || isRejected) && requiresApproval && changes.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <Textarea
            placeholder={isRejected ? "Add notes addressing the feedback..." : "Add notes for approvers (optional)..."}
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
        {/* Send directly - no approval needed */}
        {canSkipApproval && (
          <Button onClick={handleSkipApprovalAndSend} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send to Supplier
          </Button>
        )}

        {/* Submit for approval - when required */}
        {canSubmit && requiresApproval && (
          <Button
            onClick={() => {
              submitForApproval(submissionNotes.trim() || undefined)
              setSubmissionNotes("")
            }}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isRejected ? "Resubmit for Approval" : "Submit for Approval"}
          </Button>
        )}

        {/* Send after approval */}
        {canSendToSupplier && (
          <Button onClick={handleSendToSupplier} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send to Supplier
          </Button>
        )}

        {/* Discard */}
        {!isApprover && (isDraft || isRejected) && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={discardDraft}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Discard
          </Button>
        )}

        {/* Waiting states */}
        {isPending && !isApprover && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </div>
        )}

        {isSent && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Awaiting supplier acknowledgment</p>
          </div>
        )}

        {/* Message for approvers on draft */}
        {isDraft && isApprover && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Waiting for buyer to submit</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Clean status badge
function StatusBadge({ status }: { status: RevisionStatus }) {
  const config = {
    [RevisionStatus.Draft]: { label: "Draft", className: "bg-muted text-muted-foreground" },
    [RevisionStatus.PendingApproval]: { label: "Pending", className: "bg-blue-50 text-blue-700" },
    [RevisionStatus.Approved]: { label: "Approved", className: "bg-emerald-50 text-emerald-700" },
    [RevisionStatus.Sent]: { label: "Sent", className: "bg-purple-50 text-purple-700" },
    [RevisionStatus.Rejected]: { label: "Returned", className: "bg-amber-50 text-amber-700" },
    [RevisionStatus.Acknowledged]: { label: "Active", className: "bg-primary/10 text-primary" },
  }[status] || { label: status, className: "bg-muted text-muted-foreground" }

  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded", config.className)}>
      {config.label}
    </span>
  )
}

// Current status message - what needs to happen next
function CurrentStatusMessage({
  status,
  isApprover,
  currentUser,
  approvalChain,
  requiresApproval,
}: {
  status: RevisionStatus
  isApprover: boolean
  currentUser: { id: string; name: string }
  approvalChain?: { steps: Array<{ level: number; status: string; approver: { id: string; name: string; role: string } }>; currentLevel: number } | null
  requiresApproval: boolean
}) {
  // Rejected - prompt to address feedback
  if (status === RevisionStatus.Rejected) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-sm text-foreground">Changes requested - see activity below</p>
      </div>
    )
  }

  // Draft
  if (status === RevisionStatus.Draft) {
    if (isApprover) {
      return (
        <p className="text-sm text-muted-foreground">
          Draft in progress. Waiting for buyer to submit.
        </p>
      )
    }
    return (
      <p className="text-sm text-muted-foreground">
        {requiresApproval
          ? "Ready to submit for approval."
          : "Minor changes - can send directly to supplier."}
      </p>
    )
  }

  // Pending approval
  if (status === RevisionStatus.PendingApproval && approvalChain) {
    const currentStep = approvalChain.steps.find(s => s.level === approvalChain.currentLevel && s.status === "pending")
    if (currentStep) {
      const isMyTurn = currentStep.approver.id === currentUser.id
      if (isMyTurn) {
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-sm font-medium text-foreground">Your approval is needed</p>
          </div>
        )
      }
      return (
        <p className="text-sm text-muted-foreground">
          Waiting for <span className="font-medium text-foreground">{currentStep.approver.name}</span>
        </p>
      )
    }
  }

  // Approved
  if (status === RevisionStatus.Approved) {
    return (
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-emerald-500" />
        <p className="text-sm text-foreground">Approved - ready to send</p>
      </div>
    )
  }

  // Sent
  if (status === RevisionStatus.Sent) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-500" />
        <p className="text-sm text-foreground">Sent to supplier</p>
      </div>
    )
  }

  return null
}

// Timeline event with proper comment display
function TimelineEvent({
  event,
  isLast
}: {
  event: {
    id: string
    type: "created" | "submitted" | "approved" | "rejected" | "changes_requested" | "sent" | "acknowledged" | "resubmitted"
    date: string
    user: string
    notes?: string
    role?: string
  }
  isLast: boolean
}) {
  const icons: Record<string, React.ReactNode> = {
    created: <FileText className="w-3 h-3" />,
    submitted: <Send className="w-3 h-3" />,
    resubmitted: <RefreshCw className="w-3 h-3" />,
    approved: <Check className="w-3 h-3" />,
    rejected: <X className="w-3 h-3" />,
    changes_requested: <MessageCircle className="w-3 h-3" />,
    sent: <Send className="w-3 h-3" />,
    acknowledged: <Check className="w-3 h-3" />,
  }

  const colors: Record<string, string> = {
    created: "text-muted-foreground bg-muted",
    submitted: "text-blue-600 bg-blue-50",
    resubmitted: "text-blue-600 bg-blue-50",
    approved: "text-emerald-600 bg-emerald-50",
    rejected: "text-red-600 bg-red-50",
    changes_requested: "text-amber-600 bg-amber-50",
    sent: "text-purple-600 bg-purple-50",
    acknowledged: "text-primary bg-primary/10",
  }

  const labels: Record<string, string> = {
    created: "Draft created",
    submitted: "Submitted for approval",
    resubmitted: "Resubmitted",
    approved: "Approved",
    rejected: "Rejected",
    changes_requested: "Changes requested",
    sent: "Sent to supplier",
    acknowledged: "Acknowledged",
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", colors[event.type])}>
          {icons[event.type]}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[8px]" />}
      </div>
      <div className={cn("flex-1", !isLast && "pb-3")}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm text-foreground">
            <span className="font-medium">{labels[event.type]}</span>
            <span className="text-muted-foreground"> by {event.user}</span>
          </p>
          <span className="text-xs text-muted-foreground shrink-0">{event.date}</span>
        </div>
        {event.notes && (
          <div className="mt-1 text-sm text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
            "{event.notes}"
          </div>
        )}
      </div>
    </div>
  )
}
