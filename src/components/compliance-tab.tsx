"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  Globe,
  Building2,
  Package,
  Leaf,
  Link2,
  AlertCircle,
  Check,
} from "lucide-react"
import {
  complianceClauses,
  computeComplianceStats,
  lineItems,
  type ComplianceClause,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function ComplianceTab() {
  const [selectedClause, setSelectedClause] = useState<string | null>(null)

  const stats = computeComplianceStats()

  const categoryIcons: Record<string, React.ReactNode> = {
    quality: <CheckCircle2 className="w-3.5 h-3.5" />,
    export: <Globe className="w-3.5 h-3.5" />,
    security: <Shield className="w-3.5 h-3.5" />,
    environmental: <Leaf className="w-3.5 h-3.5" />,
    procurement: <Package className="w-3.5 h-3.5" />,
    reporting: <FileText className="w-3.5 h-3.5" />,
  }

  // Check if a clause applies to a specific line
  const appliesToLine = (clause: ComplianceClause, lineNumber: number): boolean => {
    // If no specific lines defined, applies to all
    if (!clause.appliestoLines || clause.appliestoLines.length === 0) return true
    return clause.appliestoLines.includes(lineNumber)
  }

  const selectedClauseData = complianceClauses.find(c => c.id === selectedClause)

  // Get lines that a clause applies to
  const getApplicableLines = (clause: ComplianceClause) => {
    if (!clause.appliestoLines) return lineItems
    return lineItems.filter(l => clause.appliestoLines?.includes(l.lineNumber))
  }

  return (
    <div className="flex gap-0">
      {/* Main Content */}
      <div className={cn(
        "space-y-6 transition-all duration-200 ease-out",
        selectedClause ? "flex-1 min-w-0 pr-6" : "flex-1"
      )}>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Clauses</p>
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
            <p className="text-2xl font-semibold">{stats.required}</p>
            <p className="text-xs text-muted-foreground">Required</p>
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
            <p className="text-2xl font-semibold">{stats.acknowledged}</p>
            <p className="text-xs text-muted-foreground">Acknowledged</p>
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
            <p className={cn("text-2xl font-semibold", stats.pending > 0 && "text-amber-500")}>
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
            <p className="text-2xl font-semibold">{stats.requiresDocs}</p>
            <p className="text-xs text-muted-foreground">Require Docs</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-primary"
            style={{ width: `${(stats.acknowledged / stats.total) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400"
            style={{ width: `${(stats.pending / stats.total) * 100}%` }}
          />
        </div>

        {/* Pending Compliance Needs */}
        {stats.pending > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Action Required ({stats.pending})
            </h3>
            <div className="space-y-2">
              {complianceClauses
                .filter(c => !c.isAcknowledged && c.status === "required")
                .map(clause => (
                  <button
                    key={clause.id}
                    onClick={() => setSelectedClause(clause.id)}
                    className={cn(
                      "w-full text-left border border-border rounded-lg overflow-hidden border-l-2 border-l-amber-400 bg-background hover:bg-muted/30 transition-colors",
                      selectedClause === clause.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center gap-4 p-3">
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium">{clause.code}</span>
                          <span className="text-sm text-muted-foreground truncate">{clause.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting vendor acknowledgment</p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Compliance Matrix */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Requirements Matrix
          </h3>
          <div className="rounded-lg border border-border overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/20 min-w-[300px]">
                    Requirement
                  </th>
                  {lineItems.map(line => (
                    <th key={line.lineNumber} className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide w-14">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-xs font-medium mb-0.5">
                          {line.lineNumber}
                        </span>
                        <span className="text-[10px] truncate max-w-[50px]">{line.sku}</span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-14">
                    Docs
                  </th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-14">
                    Flow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complianceClauses.map(clause => {
                  const isSelected = selectedClause === clause.id

                  return (
                    <tr
                      key={clause.id}
                      onClick={() => setSelectedClause(isSelected ? null : clause.id)}
                      className={cn(
                        "hover:bg-muted/30 cursor-pointer transition-colors",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      {/* Requirement Name */}
                      <td className="py-3 px-4 sticky left-0 bg-inherit">
                        <div className="flex items-center gap-3">
                          {clause.isAcknowledged ? (
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : clause.status === "required" ? (
                            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{clause.code}</span>
                              <span className="font-medium">{clause.title}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Line applicability */}
                      {lineItems.map(line => (
                        <td key={line.lineNumber} className="py-3 px-2 text-center">
                          {appliesToLine(clause, line.lineNumber) ? (
                            <Check className="w-4 h-4 text-primary mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/20">—</span>
                          )}
                        </td>
                      ))}

                      {/* Requires Documentation */}
                      <td className="py-3 px-3 text-center">
                        {clause.requiresDocumentation ? (
                          <FileText className="w-4 h-4 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/20">—</span>
                        )}
                      </td>

                      {/* Flow-down */}
                      <td className="py-3 px-3 text-center">
                        {clause.requiresFlowDown ? (
                          <Link2 className="w-4 h-4 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/20">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div
        className={cn(
          "border-l border-border bg-muted/10 transition-all duration-200 ease-out overflow-hidden flex flex-col",
          selectedClause ? "w-[400px] opacity-100" : "w-0 opacity-0 border-l-0"
        )}
      >
        {selectedClauseData && (
          <div className="w-[400px] h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between h-12 px-4 border-b border-border flex-shrink-0 bg-background">
              <div className="flex items-center gap-2">
                {selectedClauseData.isAcknowledged ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-sm font-medium font-mono">{selectedClauseData.code}</span>
              </div>
              <button
                onClick={() => setSelectedClause(null)}
                className="p-1.5 rounded hover:bg-muted transition-colors text-xs text-muted-foreground"
              >
                Close
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title & Status */}
              <div>
                <h3 className="text-base font-semibold mb-2">{selectedClauseData.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {selectedClauseData.status === "required" ? "Required" : "Applicable"}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedClauseData.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedClauseData.source}
                  </Badge>
                  {selectedClauseData.requiresFlowDown && (
                    <Badge variant="outline" className="text-xs">
                      Flow-down
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</h4>
                <p className="text-sm text-foreground">{selectedClauseData.description}</p>
              </div>

              {/* Source / Traceability */}
              {selectedClauseData.sourceReference && (
                <div className="p-3 rounded-lg border border-border bg-background">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Why This Applies</h4>
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">
                      {selectedClauseData.sourceReference.type === "project" && <Building2 className="w-4 h-4" />}
                      {selectedClauseData.sourceReference.type === "customer" && <Building2 className="w-4 h-4" />}
                      {selectedClauseData.sourceReference.type === "commodity" && <Package className="w-4 h-4" />}
                      {selectedClauseData.sourceReference.type === "regulation" && <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedClauseData.sourceReference.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{selectedClauseData.sourceReference.type}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Applicable Lines */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Applies To {!selectedClauseData.appliestoLines && "(All Lines)"}
                </h4>
                <div className="space-y-1">
                  {getApplicableLines(selectedClauseData).map(line => (
                    <div key={line.lineNumber} className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-xs font-medium">
                        {line.lineNumber}
                      </span>
                      <span className="text-sm font-medium text-primary">{line.sku}</span>
                      <span className="text-xs text-muted-foreground truncate">{line.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documentation */}
              {selectedClauseData.requiresDocumentation && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Documentation Required</h4>
                  <div className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedClauseData.documentationType}</span>
                  </div>
                </div>
              )}

              {/* Acknowledgment Status */}
              <div className="pt-3 border-t border-border">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Acknowledgment</h4>
                {selectedClauseData.isAcknowledged ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border border-l-2 border-l-primary bg-background">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Acknowledged</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedClauseData.acknowledgedBy} · {selectedClauseData.acknowledgedDate}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border border-l-2 border-l-amber-400 bg-background">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Pending</p>
                      <p className="text-xs text-muted-foreground">Awaiting vendor acknowledgment</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedClauseData.notes && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedClauseData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
