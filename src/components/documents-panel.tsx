"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  ExternalLink,
  Upload,
  FileText,
  Circle,
  Clock,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRevisionSafe } from "@/context/RevisionContext"
import { getDocuments, type PODocument, type DocumentCategory } from "@/lib/mock-data"
import type { PORevision } from "@/types/po-revision"

interface DocumentsPanelProps {
  orderNumber: string
  orderType: "po" | "so"
  onClose?: () => void
}

export function DocumentsPanel({ orderNumber, orderType }: DocumentsPanelProps) {
  const [showPreviousVersions, setShowPreviousVersions] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<PORevision | null>(null)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)

  // RevisionContext is only available for PO - SO doesn't use revision workflow
  const revisionContext = useRevisionSafe()
  const revisionHistory = revisionContext?.revisionHistory ?? []
  const activeRevision = revisionContext?.activeRevision ?? null
  const pendingDraftRevision = revisionContext?.pendingDraftRevision ?? null

  const documents = useMemo(() => getDocuments(), [])

  // Get archived versions (not active, not draft)
  const archivedVersions = revisionHistory.filter(r => !r.isActive && !r.isDraft)

  // Associated documents (not PO versions)
  const associatedDocs = documents.filter(d => d.category !== "purchase_order")

  const categoryLabels: Record<DocumentCategory, string> = {
    purchase_order: "PO",
    acknowledgment: "ACK",
    packing_slip: "PS",
    invoice: "INV",
    ncr: "NCR",
    other: "DOC",
  }

  const orderTypeLabel = orderType === "po" ? "PO" : "SO"

  // Render version detail view
  if (selectedVersion) {
    return (
      <div className="h-full flex flex-col">
        {/* Back header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <button
            onClick={() => setSelectedVersion(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-sm font-medium">
            {orderTypeLabel} v{selectedVersion.version}
          </span>
        </div>

        {/* Version detail content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            <p className="text-sm mt-1">
              {selectedVersion.isActive ? (
                <span className="text-emerald-600 font-medium">Active</span>
              ) : (
                <span className="text-muted-foreground">Superseded</span>
              )}
            </p>
          </div>

          {/* Timeline */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Timeline
            </span>
            <div className="mt-2 space-y-2">
              <TimelineItem
                label="Created"
                date={selectedVersion.createdAt}
                by={selectedVersion.createdBy}
              />
              {selectedVersion.submittedAt && (
                <TimelineItem
                  label="Submitted"
                  date={selectedVersion.submittedAt}
                  by={selectedVersion.submittedBy}
                />
              )}
              {selectedVersion.approvedAt && (
                <TimelineItem
                  label="Approved"
                  date={selectedVersion.approvedAt}
                />
              )}
              {selectedVersion.sentAt && (
                <TimelineItem
                  label="Sent"
                  date={selectedVersion.sentAt}
                  by={selectedVersion.sentBy}
                />
              )}
              {selectedVersion.acknowledgedAt && (
                <TimelineItem
                  label="Acknowledged"
                  date={selectedVersion.acknowledgedAt}
                  by={selectedVersion.acknowledgedBy}
                />
              )}
              {!selectedVersion.isActive && selectedVersion.previousVersion && (
                <TimelineItem
                  label="Superseded"
                  date=""
                  by={`by v${selectedVersion.previousVersion}`}
                />
              )}
            </div>
          </div>

          {/* Changes */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Changes
            </span>
            <div className="mt-2">
              {selectedVersion.changes.length > 0 ? (
                <div className="space-y-2">
                  {selectedVersion.changes.map(change => (
                    <div
                      key={change.id}
                      className="text-sm p-2 rounded bg-muted/30"
                    >
                      <p className="font-medium">{change.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {change.changedAt} by {change.changedBy}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Initial version - no changes
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              View PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main panel view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Documents</h3>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
          <Upload className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Version */}
        {activeRevision && (
          <div className="rounded-lg border border-border bg-card">
            <div className="p-3">
              {/* Header row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">
                    {orderTypeLabel} v{activeRevision.version}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50"
                >
                  Active
                </Badge>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                {activeRevision.acknowledgedAt ? (
                  <>
                    <p>Acknowledged {activeRevision.acknowledgedAt}</p>
                    <p>by {activeRevision.acknowledgedBy}</p>
                  </>
                ) : (
                  <p>Created {activeRevision.createdAt}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Previous versions toggle */}
            {archivedVersions.length > 0 && (
              <div className="border-t border-border">
                <button
                  onClick={() => setShowPreviousVersions(!showPreviousVersions)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                  {showPreviousVersions ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span>Previous versions ({archivedVersions.length})</span>
                </button>

                {showPreviousVersions && (
                  <div className="px-3 pb-3">
                    <div className="ml-2 pl-3 border-l-2 border-muted space-y-2">
                      {archivedVersions.map(version => (
                        <button
                          key={version.id}
                          onClick={() => setSelectedVersion(version)}
                          className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Circle className="w-2 h-2 text-muted-foreground/50" />
                              <span className="text-xs font-medium text-muted-foreground">
                                v{version.version}
                              </span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[11px] text-muted-foreground/70 ml-4 mt-0.5">
                            {version.createdAt}
                            {version.changesSummary && ` • ${version.changesSummary}`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Draft Section */}
        {pendingDraftRevision && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/30">
            <div className="p-3">
              {/* Header row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-amber-900">
                    {orderTypeLabel} v{pendingDraftRevision.version} Draft
                  </span>
                </div>
                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                  {pendingDraftRevision.status === "pending_approval" ? "Pending Approval" : "Draft"}
                </Badge>
              </div>

              {/* Metadata */}
              <div className="text-xs text-amber-700/70 mb-3">
                <p>
                  {pendingDraftRevision.changes.length} change{pendingDraftRevision.changes.length !== 1 ? "s" : ""}
                  {" • "}Created {pendingDraftRevision.createdAt}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Draft
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Related Documents Divider */}
        {associatedDocs.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Related Documents
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Document List */}
            <div className="space-y-1">
              {associatedDocs.map(doc => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  categoryLabel={categoryLabels[doc.category]}
                  isExpanded={expandedDocId === doc.id}
                  onToggle={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!activeRevision && !pendingDraftRevision && associatedDocs.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Timeline item component
function TimelineItem({
  label,
  date,
  by,
}: {
  label: string
  date: string
  by?: string
}) {
  return (
    <div className="flex items-baseline gap-4 text-sm">
      <span className="w-20 text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium">{date}</span>
      {by && <span className="text-muted-foreground">{by}</span>}
    </div>
  )
}

// Document row component
function DocumentRow({
  doc,
  categoryLabel,
  isExpanded,
  onToggle,
}: {
  doc: PODocument
  categoryLabel: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const statusIcons = {
    pending: Clock,
    received: Check,
    approved: Check,
    rejected: X,
  }
  const StatusIcon = statusIcons[doc.status]

  return (
    <div className={cn(
      "rounded-lg transition-colors",
      isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
    )}>
      <button
        onClick={onToggle}
        className="w-full p-2 flex items-center gap-3 text-left"
      >
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-5 shrink-0"
        >
          {categoryLabel}
        </Badge>
        <span className="text-sm flex-1 truncate">{doc.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {doc.receivedDate || doc.createdDate}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-2 pb-2">
          <div className="p-2 rounded bg-background border border-border text-xs space-y-2">
            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusIcon className={cn(
                "w-3 h-3",
                doc.status === "approved" ? "text-emerald-600" :
                doc.status === "rejected" ? "text-destructive" :
                doc.status === "pending" ? "text-amber-600" :
                "text-blue-600"
              )} />
              <span className="capitalize">{doc.status}</span>
              {doc.requiresAction && (
                <Badge className="text-[9px] bg-amber-100 text-amber-700 ml-auto">
                  Action Required
                </Badge>
              )}
            </div>

            {/* Metadata */}
            <div className="text-muted-foreground space-y-0.5">
              <p>From: {doc.originContact}</p>
              {doc.notes && <p className="italic">{doc.notes}</p>}
              <p className="text-[10px]">{doc.fileName} • {doc.fileSize}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1">
                <ExternalLink className="w-3 h-3" />
                View
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1">
                <Download className="w-3 h-3" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
