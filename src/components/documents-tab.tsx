"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Download,
  Upload,
  FileText,
  ChevronDown,
  ChevronRight,
  FileCheck,
  FileX,
  AlertTriangle,
  Clock,
  Building2,
  User,
  ExternalLink,
  GitBranch,
  Check,
  Edit,
  FileEdit,
} from "lucide-react"
import {
  getDocuments,
  type PODocument,
  type DocumentCategory,
} from "@/lib/mock-data"
import { useRevision } from "@/context/RevisionContext"
import { RevisionStatus, RevisionStatusMeta } from "@/types/revision-status"
import { cn } from "@/lib/utils"

export function DocumentsTab() {
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    active: true,
    drafts: true,
    associated: true,
  })

  const { revisionHistory, activeRevision } = useRevision()
  const documents = useMemo(() => getDocuments(), [])

  // Separate active revision, drafts, and associated documents
  const draftRevisions = revisionHistory.filter(r => r.isDraft)
  const archivedRevisions = revisionHistory.filter(r => !r.isActive && !r.isDraft)

  // Associated documents (not PO versions)
  const associatedDocs = documents.filter(d => d.category !== "purchase_order")
  const actionRequiredDocs = associatedDocs.filter(d => d.requiresAction)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const categoryConfig: Record<DocumentCategory, { label: string; shortLabel: string }> = {
    purchase_order: { label: "Purchase Order", shortLabel: "PO" },
    acknowledgment: { label: "Acknowledgment", shortLabel: "ACK" },
    packing_slip: { label: "Packing Slip", shortLabel: "PS" },
    invoice: { label: "Invoice", shortLabel: "INV" },
    ncr: { label: "NCR", shortLabel: "NCR" },
    other: { label: "Other", shortLabel: "Other" },
  }

  const statusConfig: Record<PODocument["status"], { label: string; className: string; icon: typeof FileCheck }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800", icon: Clock },
    received: { label: "Received", className: "bg-blue-100 text-blue-800", icon: FileText },
    approved: { label: "Approved", className: "bg-green-100 text-green-800", icon: FileCheck },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800", icon: FileX },
  }

  const actionLabels: Record<string, string> = {
    review: "Review Required",
    acknowledge: "Acknowledgment Needed",
    correct: "Correction Needed",
    approve: "Approval Required",
    sign: "Signature Required",
  }

  const renderDocument = (doc: PODocument) => {
    const isExpanded = expandedDocId === doc.id
    const StatusIcon = statusConfig[doc.status].icon

    return (
      <div
        key={doc.id}
        className={cn(
          "border rounded-lg overflow-hidden transition-all",
          doc.requiresAction
            ? "border-amber-300 bg-amber-50/50"
            : "border-border bg-background"
        )}
      >
        <button
          onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
          className="w-full text-left p-2.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {categoryConfig[doc.category].shortLabel}
            </span>
            <span className="text-[10px] text-muted-foreground">
              v{doc.version}
            </span>
            {!doc.isCurrent && (
              <span className="text-[10px] text-amber-600 font-medium">
                (superseded)
              </span>
            )}
            <div className="flex-1" />
            <Badge className={cn("text-[9px] h-4 px-1.5", statusConfig[doc.status].className)}>
              {statusConfig[doc.status].label}
            </Badge>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>

          <p className="text-sm font-medium leading-snug mb-1">{doc.name}</p>

          <div className="text-[11px] text-muted-foreground mb-1">
            {doc.appliesToWholePO ? (
              <span>Applies to entire PO</span>
            ) : doc.lineNumbers && doc.lineNumbers.length > 0 ? (
              <span>Lines: {doc.lineNumbers.join(", ")}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className={cn(
              "flex items-center gap-1",
              doc.origin === "vendor" ? "text-primary" : "text-muted-foreground"
            )}>
              {doc.origin === "vendor" ? (
                <Building2 className="w-3 h-3" />
              ) : (
                <User className="w-3 h-3" />
              )}
              {doc.originContact}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {doc.receivedDate || doc.sentDate || doc.createdDate}
            </span>
          </div>

          {doc.requiresAction && doc.actionType && (
            <div className="flex items-center gap-1.5 mt-2 p-1.5 rounded bg-amber-100 text-amber-800">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span className="text-[11px] font-medium flex-1">
                {actionLabels[doc.actionType]}
              </span>
            </div>
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-border bg-muted/10 px-3 py-2.5 space-y-2">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <div>
                <span className="text-muted-foreground">Created: </span>
                <span className="font-medium">{doc.createdDate}</span>
              </div>
              {doc.sentDate && (
                <div>
                  <span className="text-muted-foreground">Sent: </span>
                  <span className="font-medium">{doc.sentDate}</span>
                </div>
              )}
              {doc.receivedDate && (
                <div>
                  <span className="text-muted-foreground">Received: </span>
                  <span className="font-medium">{doc.receivedDate}</span>
                </div>
              )}
            </div>

            {doc.notes && (
              <p className="text-[11px] text-muted-foreground italic">
                {doc.notes}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">
                {doc.fileName} • {doc.fileSize}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active Release Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("active")}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100/80 transition-colors text-left"
        >
          {expandedSections.active ? (
            <ChevronDown className="w-4 h-4 text-emerald-700" />
          ) : (
            <ChevronRight className="w-4 h-4 text-emerald-700" />
          )}
          <GitBranch className="w-4 h-4 text-emerald-700" />
          <span className="font-medium text-sm text-emerald-900">Active Release</span>
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] ml-auto">
            <Check className="w-3 h-3 mr-1" />
            Acknowledged
          </Badge>
        </button>

        {expandedSections.active && activeRevision && (
          <div className="p-3 space-y-3 bg-background">
            {/* Active PO Version */}
            <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/30">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span className="font-medium text-sm">PO v{activeRevision.version}</span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                  Current
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created {activeRevision.createdAt} by {activeRevision.createdBy}</p>
                {activeRevision.acknowledgedAt && (
                  <p>Acknowledged {activeRevision.acknowledgedAt} by {activeRevision.acknowledgedBy}</p>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Download className="w-3 h-3" />
                  Download
                </Button>
              </div>
            </div>

            {/* Archived versions under active */}
            {archivedRevisions.length > 0 && (
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Previous Versions</p>
                {archivedRevisions.map(rev => (
                  <div key={rev.id} className="border border-border rounded p-2 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">v{rev.version}</span>
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        Archived
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {rev.createdAt} • {rev.changesSummary || "Initial version"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drafts Section (children of active) */}
      {draftRevisions.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("drafts")}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100/80 transition-colors text-left"
          >
            {expandedSections.drafts ? (
              <ChevronDown className="w-4 h-4 text-amber-700" />
            ) : (
              <ChevronRight className="w-4 h-4 text-amber-700" />
            )}
            <Edit className="w-4 h-4 text-amber-700" />
            <span className="font-medium text-sm text-amber-900">Pending Drafts</span>
            <Badge className="bg-amber-100 text-amber-800 text-[10px] ml-auto">
              {draftRevisions.length}
            </Badge>
          </button>

          {expandedSections.drafts && (
            <div className="p-3 space-y-3 bg-background">
              {draftRevisions.map(draft => {
                const statusMeta = RevisionStatusMeta.meta[draft.status]
                return (
                  <div key={draft.id} className="border border-amber-200 rounded-lg p-3 bg-amber-50/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FileEdit className="w-4 h-4 text-amber-700" />
                      <span className="font-medium text-sm">Draft v{draft.version}</span>
                      <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Created {draft.createdAt} by {draft.createdBy}</p>
                      {draft.submittedAt && (
                        <p>Submitted {draft.submittedAt}</p>
                      )}
                    </div>

                    {/* Change History */}
                    {draft.changes.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-amber-200">
                        <p className="text-xs font-medium text-amber-800 mb-2">
                          Changes ({draft.changes.length})
                        </p>
                        <div className="space-y-1.5">
                          {draft.changes.map(change => (
                            <div
                              key={change.id}
                              className="flex items-start gap-2 text-xs bg-white/50 rounded p-1.5"
                            >
                              <FileEdit className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium">{change.description}</p>
                                <p className="text-muted-foreground text-[10px]">
                                  {change.changedAt} by {change.changedBy}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <ExternalLink className="w-3 h-3" />
                        View Draft
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Associated Documents Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("associated")}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        >
          {expandedSections.associated ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Associated Documents</span>
          <span className="text-xs text-muted-foreground ml-auto">{associatedDocs.length}</span>
          {actionRequiredDocs.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 text-[10px] ml-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {actionRequiredDocs.length} action
            </Badge>
          )}
        </button>

        {expandedSections.associated && (
          <div className="p-3 space-y-2 bg-background">
            {associatedDocs.length > 0 ? (
              associatedDocs.map(renderDocument)
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No associated documents</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <Button size="sm" variant="outline" className="w-full h-8 gap-1.5 text-xs bg-transparent">
        <Upload className="w-3.5 h-3.5" />
        Upload Document
      </Button>
    </div>
  )
}
