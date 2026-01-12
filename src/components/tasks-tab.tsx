"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  CheckCircle2,
  Circle,
  Zap,
  MoreHorizontal,
  Mail,
  Phone,
  User,
  Calendar,
  FileWarning,
  Package,
  DollarSign,
  ClipboardX,
  ExternalLink,
  Link2,
} from "lucide-react"
import {
  detectPOIssues,
  getRelatedIssues,
  type POIssue,
  type IssueCategory,
  type IssueActionType,
} from "@/lib/mock-data"
import { useEmailContext } from "@/context/EmailContext"

interface CompletedTask {
  id: string
  title: string
  completedDate: string
}

export function TasksTab() {
  const { openEmailModal } = useEmailContext()

  // Get data-driven issues
  const issues = useMemo(() => detectPOIssues(), [])

  // Track completed tasks (would be persisted in real app)
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([
    { id: "completed-1", title: "Invoice matching for CTL004 (SHP-001)", completedDate: "Jan 22, 2026" },
  ])

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  const openIssues = issues.filter((i) => !completedTaskIds.has(i.id))
  const criticalIssues = openIssues.filter((i) => i.priority === "critical" || i.priority === "high")
  const mediumIssues = openIssues.filter((i) => i.priority === "medium")

  const toggleComplete = (issue: POIssue) => {
    if (completedTaskIds.has(issue.id)) {
      setCompletedTaskIds((prev) => {
        const next = new Set(prev)
        next.delete(issue.id)
        return next
      })
      setCompletedTasks((prev) => prev.filter((t) => t.id !== issue.id))
    } else {
      setCompletedTaskIds((prev) => new Set([...prev, issue.id]))
      setCompletedTasks((prev) => [
        ...prev,
        { id: issue.id, title: issue.title, completedDate: "Jan 27, 2026" },
      ])
    }
  }

  const deleteCompletedTask = (id: string) => {
    setCompletedTasks((prev) => prev.filter((t) => t.id !== id))
    setCompletedTaskIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const getCategoryIcon = (category?: IssueCategory) => {
    switch (category) {
      case "ncr":
        return <ClipboardX className="w-4 h-4 text-destructive" />
      case "invoice":
        return <FileWarning className="w-4 h-4 text-destructive" />
      case "quality_hold":
        return <ClipboardX className="w-4 h-4 text-amber-500" />
      case "shipment":
        return <Package className="w-4 h-4 text-primary" />
      case "payable":
        return <DollarSign className="w-4 h-4 text-amber-500" />
      default:
        return <FileWarning className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getPriorityBorder = (priority: POIssue["priority"]) => {
    switch (priority) {
      case "critical":
        return "border-l-destructive"
      case "high":
        return "border-l-destructive/60"
      case "medium":
        return "border-l-amber-400"
      case "low":
        return "border-l-primary/40"
    }
  }

  const getActionButton = (issue: POIssue) => {
    const handleAction = () => {
      if (issue.suggestedAction === "email_vendor") {
        if (issue.category === "ncr" && issue.ncrId) {
          openEmailModal({
            contextType: "ncr",
            ncrId: issue.ncrId,
            ncrType: issue.title.split(": ")[1] || "Quality Issue",
            sku: issue.sku,
            itemName: issue.sku,
            qtyAffected: issue.qtyAffected,
            issueDescription: issue.description,
            poNumber: "PO-0861",
          })
        } else if (issue.category === "invoice") {
          openEmailModal({
            contextType: "general",
            subject: `Re: PO-0861 - ${issue.title}`,
            body: `Dear Daniel Thomas,\n\nI am writing regarding ${issue.title}.\n\n${issue.description}\n\nPlease advise on the resolution.\n\nBest regards`,
            poNumber: "PO-0861",
          })
        } else {
          openEmailModal({
            contextType: "shipment",
            shipmentId: issue.shipmentId,
            poNumber: "PO-0861",
          })
        }
      }
    }

    const actionConfig: Record<IssueActionType, { label: string; icon: React.ReactNode }> = {
      email_vendor: { label: "Email Vendor", icon: <Mail className="w-3.5 h-3.5" /> },
      contact_qa: { label: "Contact QA", icon: <Phone className="w-3.5 h-3.5" /> },
      review_invoice: { label: "Review Invoice", icon: <DollarSign className="w-3.5 h-3.5" /> },
      track_shipment: { label: "Track", icon: <ExternalLink className="w-3.5 h-3.5" /> },
    }

    const config = actionConfig[issue.suggestedAction]

    return (
      <Button
        size="sm"
        variant={issue.priority === "critical" ? "default" : "outline"}
        className="h-8 gap-1.5 text-xs"
        onClick={handleAction}
      >
        {config.icon}
        {config.label}
      </Button>
    )
  }

  const dueSoonCount = openIssues.filter((i) => {
    const dueDate = new Date(i.dueDate.replace(/(\w+) (\d+), (\d+)/, "$1 $2, $3"))
    const today = new Date("2026-01-27")
    const diff = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 3
  }).length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
            <p className="text-2xl font-semibold tabular-nums">{openIssues.length}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </div>
          <div
            className={`rounded-lg px-4 py-3 border ${
              criticalIssues.length > 0
                ? "bg-destructive/5 border-destructive/20"
                : "bg-muted/30 border-border"
            }`}
          >
            <p
              className={`text-2xl font-semibold tabular-nums ${
                criticalIssues.length > 0 ? "text-destructive" : ""
              }`}
            >
              {criticalIssues.length}
            </p>
            <p
              className={`text-xs ${criticalIssues.length > 0 ? "text-destructive/70" : "text-muted-foreground"}`}
            >
              Action Required
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
            <p className="text-2xl font-semibold tabular-nums">{dueSoonCount}</p>
            <p className="text-xs text-muted-foreground">Due Soon</p>
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
            <p className="text-2xl font-semibold tabular-nums text-primary">{completedTasks.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Progress Bar */}
        {issues.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(completedTasks.length / (issues.length + completedTasks.length)) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {completedTasks.length}/{issues.length + completedTasks.length}
            </span>
          </div>
        )}
      </div>

      {/* Action Required Section */}
      {criticalIssues.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Action Required</h3>
          </div>
          <div className="space-y-2">
            {criticalIssues.map((issue) => {
              const isExpanded = expandedTaskId === issue.id
              const relatedIssues = getRelatedIssues(issue.id)

              return (
                <div
                  key={issue.id}
                  className={`border border-border rounded-lg overflow-hidden border-l-2 bg-background ${getPriorityBorder(
                    issue.priority
                  )}`}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedTaskId(isExpanded ? null : issue.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <Checkbox
                      checked={completedTaskIds.has(issue.id)}
                      onCheckedChange={() => toggleComplete(issue)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    />

                    <div className="flex-shrink-0">{getCategoryIcon(issue.category)}</div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {issue.dueDate}
                        </span>
                        {issue.priority === "critical" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5 border-destructive/30 text-destructive bg-destructive/5"
                          >
                            Critical
                          </Badge>
                        )}
                        {relatedIssues.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {relatedIssues.length} linked
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
                      {/* Issue Description */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Issue</p>
                        <p className="text-sm text-foreground leading-relaxed">{issue.description}</p>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {issue.sku && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Item</p>
                            <p className="font-medium text-primary">{issue.sku}</p>
                          </div>
                        )}
                        {issue.shipmentId && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Shipment</p>
                            <p className="font-medium">{issue.shipmentId}</p>
                          </div>
                        )}
                        {issue.amount && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                            <p className="font-medium">${issue.amount.toFixed(2)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Source</p>
                          <p className="font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3 text-primary" />
                            Flow Agent
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Due</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {issue.dueDate}
                          </p>
                        </div>
                      </div>

                      {/* Related Issues */}
                      {relatedIssues.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Linked Issues</p>
                          <div className="space-y-1">
                            {relatedIssues.map((related) => (
                              <div
                                key={related.id}
                                className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded"
                              >
                                {getCategoryIcon(related.category)}
                                <span className="font-medium">{related.title}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">{related.description.slice(0, 40)}...</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {getActionButton(issue)}
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Medium Priority Section */}
      {mediumIssues.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Tracking ({mediumIssues.length})
          </h3>
          <div className="space-y-2">
            {mediumIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={completedTaskIds.has(issue.id)}
                  onCheckedChange={() => toggleComplete(issue)}
                  className="flex-shrink-0"
                />
                <div className="flex-shrink-0">{getCategoryIcon(issue.category)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{issue.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {issue.dueDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {openIssues.length === 0 && (
        <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
          <CheckCircle2 className="w-8 h-8 text-primary/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">All caught up</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">No open actions at this time</p>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
              >
                <Checkbox checked={true} className="flex-shrink-0" disabled />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground line-through">{task.title}</p>
                </div>
                <span className="text-xs text-muted-foreground">{task.completedDate}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteCompletedTask(task.id)}
                  className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
