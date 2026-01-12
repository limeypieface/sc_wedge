"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileWarning,
  ChevronDown,
  Mail,
  Send,
  CheckCheck,
  Package,
  ClipboardCheck,
  ExternalLink,
  Calendar,
  User,
  Hash,
} from "lucide-react"
import { shipments, lineItems, vendorContact } from "@/lib/mock-data"

// Extended NCR type with vendor notification tracking
interface NCRDetail {
  id: string
  shipmentId: string
  lineNumber: number
  sku: string
  itemName: string
  type: string
  severity: "high" | "medium" | "low"
  status: "open" | "closed" | "pending_vendor"
  description: string
  qtyAffected: number
  inspectionDate: string
  inspector: string
  vendorNotified: boolean
  vendorNotifiedDate?: string
  vendorResponse?: string
  rootCause?: string
  disposition?: string
}

// Inspection record for each shipment
interface InspectionRecord {
  shipmentId: string
  inspectionDate: string
  inspector: string
  totalUnits: number
  passedUnits: number
  failedUnits: number
  holdUnits: number
  status: "passed" | "failed" | "partial" | "pending"
  lines: {
    lineNumber: number
    sku: string
    name: string
    qtyInspected: number
    qtyPassed: number
    qtyFailed: number
    qtyHold: number
  }[]
}

export function QualityTab() {
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null)
  const [selectedNCR, setSelectedNCR] = useState<NCRDetail | null>(null)

  // Build inspection records from shipments data
  const inspectionRecords: InspectionRecord[] = shipments
    .filter((s) => s.status === "received")
    .map((shipment) => {
      const totalUnits = shipment.lines.reduce((sum, l) => sum + (l.qtyReceived || 0), 0)
      const passedUnits = shipment.lines.reduce((sum, l) => sum + (l.qtyAccepted || 0), 0)
      const holdUnits = shipment.lines.reduce((sum, l) => sum + (l.qtyOnHold || 0), 0)
      const failedUnits = shipment.lines.reduce((sum, l) => sum + (l.qtyRejected || 0), 0)

      let status: InspectionRecord["status"] = "pending"
      if (totalUnits > 0) {
        if (failedUnits > 0 || holdUnits > 0) {
          status = passedUnits > 0 ? "partial" : "failed"
        } else if (passedUnits === totalUnits) {
          status = "passed"
        }
      }

      return {
        shipmentId: shipment.id,
        inspectionDate: shipment.receivedDate || "",
        inspector: shipment.receivedBy || "QA Team",
        totalUnits,
        passedUnits,
        failedUnits,
        holdUnits,
        status,
        lines: shipment.lines.map((line) => ({
          lineNumber: line.lineNumber,
          sku: line.sku,
          name: line.name,
          qtyInspected: line.qtyReceived || 0,
          qtyPassed: line.qtyAccepted || 0,
          qtyFailed: line.qtyRejected || 0,
          qtyHold: line.qtyOnHold || 0,
        })),
      }
    })

  // Build NCR details from shipments
  const ncrDetails: NCRDetail[] = shipments.flatMap((shipment) =>
    (shipment.ncrs || []).map((ncr) => {
      const lineItem = lineItems.find((l) => l.lineNumber === ncr.lineNumber)
      return {
        id: ncr.id,
        shipmentId: shipment.id,
        lineNumber: ncr.lineNumber,
        sku: lineItem?.sku || "",
        itemName: lineItem?.name || "",
        type: ncr.type,
        severity: ncr.severity,
        status: ncr.status,
        description: ncr.description,
        qtyAffected: ncr.qtyAffected,
        inspectionDate: shipment.receivedDate || "",
        inspector: shipment.receivedBy || "QA Team",
        vendorNotified: ncr.status === "open" ? false : true, // Mock: closed NCRs have vendor notified
        vendorNotifiedDate: ncr.status === "open" ? undefined : "Jan 22, 2026",
        rootCause: ncr.status === "open" ? undefined : "Manufacturing defect",
        disposition: ncr.status === "open" ? undefined : "Return for credit",
      }
    })
  )

  // Stats
  const totalInspected = inspectionRecords.reduce((sum, r) => sum + r.totalUnits, 0)
  const totalPassed = inspectionRecords.reduce((sum, r) => sum + r.passedUnits, 0)
  const totalFailed = inspectionRecords.reduce((sum, r) => sum + r.failedUnits, 0)
  const totalHold = inspectionRecords.reduce((sum, r) => sum + r.holdUnits, 0)
  const openNCRs = ncrDetails.filter((n) => n.status === "open").length
  const passRate = totalInspected > 0 ? Math.round((totalPassed / totalInspected) * 100) : 0

  const getStatusIcon = (status: InspectionRecord["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-5 h-5 text-primary" />
      case "failed":
        return <XCircle className="w-5 h-5 text-destructive" />
      case "partial":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusBorder = (status: InspectionRecord["status"]) => {
    switch (status) {
      case "passed":
        return "border-l-primary"
      case "failed":
        return "border-l-destructive"
      case "partial":
        return "border-l-amber-400"
      default:
        return "border-l-border"
    }
  }

  const getStatusLabel = (status: InspectionRecord["status"]) => {
    switch (status) {
      case "passed":
        return "Passed"
      case "failed":
        return "Failed"
      case "partial":
        return "Issues Found"
      default:
        return "Pending"
    }
  }

  const handleEmailVendor = (ncr: NCRDetail) => {
    // In a real app, this would open an email composer or send via API
    const subject = encodeURIComponent(`NCR ${ncr.id} - ${ncr.type} - ${ncr.sku}`)
    const body = encodeURIComponent(
      `Dear ${vendorContact.name},\n\n` +
        `We are writing to inform you of a quality issue identified during incoming inspection.\n\n` +
        `NCR Number: ${ncr.id}\n` +
        `Item: ${ncr.sku} - ${ncr.itemName}\n` +
        `Quantity Affected: ${ncr.qtyAffected}\n` +
        `Issue Type: ${ncr.type}\n` +
        `Description: ${ncr.description}\n\n` +
        `Please advise on the appropriate corrective action.\n\n` +
        `Best regards`
    )
    window.open(`mailto:${vendorContact.email}?subject=${subject}&body=${body}`)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
            <p className="text-2xl font-semibold tabular-nums">{totalInspected}</p>
            <p className="text-xs text-muted-foreground">Inspected</p>
          </div>
          <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border text-center">
            <p className="text-2xl font-semibold tabular-nums text-primary">{totalPassed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </div>
          <div
            className={`rounded-lg px-4 py-3 border text-center ${
              totalFailed > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border"
            }`}
          >
            <p className={`text-2xl font-semibold tabular-nums ${totalFailed > 0 ? "text-destructive" : ""}`}>
              {totalFailed}
            </p>
            <p className={`text-xs ${totalFailed > 0 ? "text-destructive/70" : "text-muted-foreground"}`}>
              Rejected
            </p>
          </div>
          <div
            className={`rounded-lg px-4 py-3 border text-center ${
              totalHold > 0 ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border"
            }`}
          >
            <p className={`text-2xl font-semibold tabular-nums ${totalHold > 0 ? "text-amber-600" : ""}`}>
              {totalHold}
            </p>
            <p className={`text-xs ${totalHold > 0 ? "text-amber-600" : "text-muted-foreground"}`}>On Hold</p>
          </div>
          <div
            className={`rounded-lg px-4 py-3 border text-center ${
              openNCRs > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border"
            }`}
          >
            <p className={`text-2xl font-semibold tabular-nums ${openNCRs > 0 ? "text-destructive" : ""}`}>
              {openNCRs}
            </p>
            <p className={`text-xs ${openNCRs > 0 ? "text-destructive/70" : "text-muted-foreground"}`}>
              Open NCRs
            </p>
          </div>
        </div>

        {/* Pass Rate Bar */}
        {totalInspected > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1 flex">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(totalPassed / totalInspected) * 100}%` }}
              />
              <div
                className="h-full bg-amber-400"
                style={{ width: `${(totalHold / totalInspected) * 100}%` }}
              />
              <div
                className="h-full bg-destructive"
                style={{ width: `${(totalFailed / totalInspected) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{passRate}% pass rate</span>
          </div>
        )}
      </div>

      {/* Inspections Section */}
      {inspectionRecords.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Incoming Inspections ({inspectionRecords.length})
          </h3>
          <div className="space-y-2">
            {inspectionRecords.map((record) => {
              const isExpanded = expandedInspection === record.shipmentId
              return (
                <div
                  key={record.shipmentId}
                  className={`border border-border rounded-lg overflow-hidden border-l-2 bg-background ${getStatusBorder(
                    record.status
                  )}`}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedInspection(isExpanded ? null : record.shipmentId)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">{getStatusIcon(record.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className="text-sm font-medium">{record.shipmentId}</span>
                        <span className="text-xs text-muted-foreground">
                          {record.lines.length} {record.lines.length === 1 ? "line" : "lines"} ·{" "}
                          {record.totalUnits} units
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel(record.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Inspected {record.inspectionDate} by {record.inspector}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 text-xs tabular-nums flex-shrink-0">
                      <span className="text-primary">{record.passedUnits} passed</span>
                      {record.holdUnits > 0 && <span className="text-amber-600">{record.holdUnits} hold</span>}
                      {record.failedUnits > 0 && (
                        <span className="text-destructive">{record.failedUnits} failed</span>
                      )}
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border">
                            <th className="text-center font-medium pb-2 w-12">#</th>
                            <th className="text-left font-medium pb-2 pl-2">Item</th>
                            <th className="text-right font-medium pb-2">Inspected</th>
                            <th className="text-right font-medium pb-2">Passed</th>
                            <th className="text-right font-medium pb-2">Hold</th>
                            <th className="text-right font-medium pb-2 pr-2">Rejected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.lines.map((line) => (
                            <tr key={line.sku} className="border-b border-border/50 last:border-0">
                              <td className="py-2.5 text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                                  {line.lineNumber}
                                </span>
                              </td>
                              <td className="py-2.5 pl-2">
                                <span className="font-medium text-primary">{line.sku}</span>
                                <span className="text-muted-foreground ml-2">{line.name}</span>
                              </td>
                              <td className="py-2.5 text-right tabular-nums">{line.qtyInspected}</td>
                              <td className="py-2.5 text-right tabular-nums text-primary">
                                {line.qtyPassed}
                              </td>
                              <td className="py-2.5 text-right tabular-nums">
                                {line.qtyHold > 0 ? (
                                  <span className="text-amber-600">{line.qtyHold}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-2.5 pr-2 text-right tabular-nums">
                                {line.qtyFailed > 0 ? (
                                  <span className="text-destructive">{line.qtyFailed}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* NCRs Section */}
      {ncrDetails.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Non-Conformance Reports ({ncrDetails.length})
          </h3>
          <div className="space-y-2">
            {ncrDetails.map((ncr) => (
              <button
                key={ncr.id}
                onClick={() => setSelectedNCR(ncr)}
                className={`w-full text-left border border-border rounded-lg overflow-hidden border-l-2 bg-background hover:bg-muted/30 transition-colors ${
                  ncr.status === "open" ? "border-l-destructive" : "border-l-primary"
                }`}
              >
                <div className="flex items-center gap-4 p-3">
                  <FileWarning
                    className={`w-5 h-5 flex-shrink-0 ${
                      ncr.status === "open" ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{ncr.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {ncr.status}
                      </Badge>
                      {ncr.severity === "high" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 border-destructive/30 text-destructive bg-destructive/5"
                        >
                          High
                        </Badge>
                      )}
                      {ncr.vendorNotified && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <CheckCheck className="w-3 h-3" />
                          Vendor notified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ncr.sku} · {ncr.type} · {ncr.qtyAffected} unit affected
                    </p>
                  </div>

                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {inspectionRecords.length === 0 && ncrDetails.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No inspections yet</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Quality records will appear here once items are received
          </p>
        </div>
      )}

      {/* NCR Detail Modal */}
      <Dialog open={!!selectedNCR} onOpenChange={(open) => !open && setSelectedNCR(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedNCR && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <FileWarning
                    className={`w-5 h-5 ${
                      selectedNCR.status === "open" ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <DialogTitle>{selectedNCR.id}</DialogTitle>
                    <DialogDescription>{selectedNCR.type}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status & Severity */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      selectedNCR.status === "open"
                        ? "border-destructive/30 text-destructive bg-destructive/5"
                        : "border-primary/30 text-primary bg-primary/5"
                    }
                  >
                    {selectedNCR.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      selectedNCR.severity === "high"
                        ? "border-destructive/30 text-destructive"
                        : selectedNCR.severity === "medium"
                        ? "border-amber-400/50 text-amber-600"
                        : ""
                    }
                  >
                    {selectedNCR.severity} severity
                  </Badge>
                </div>

                {/* Issue Description */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Issue Description</p>
                  <p className="text-sm">{selectedNCR.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Item</p>
                      <p className="text-sm font-medium text-primary">{selectedNCR.sku}</p>
                      <p className="text-xs text-muted-foreground">{selectedNCR.itemName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity Affected</p>
                      <p className="text-sm font-medium">{selectedNCR.qtyAffected} unit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Inspection Date</p>
                      <p className="text-sm font-medium">{selectedNCR.inspectionDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Inspector</p>
                      <p className="text-sm font-medium">{selectedNCR.inspector}</p>
                    </div>
                  </div>
                </div>

                {/* Vendor Notification Status */}
                <div
                  className={`p-3 rounded-lg border ${
                    selectedNCR.vendorNotified
                      ? "bg-primary/5 border-primary/20"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {selectedNCR.vendorNotified ? (
                      <CheckCheck className="w-4 h-4 text-primary" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <p
                      className={`text-xs font-medium ${
                        selectedNCR.vendorNotified ? "text-primary" : "text-amber-700"
                      }`}
                    >
                      {selectedNCR.vendorNotified ? "Vendor Notified" : "Vendor Not Yet Notified"}
                    </p>
                  </div>
                  {selectedNCR.vendorNotified ? (
                    <p className="text-xs text-muted-foreground">
                      Notified {vendorContact.name} ({vendorContact.company}) on{" "}
                      {selectedNCR.vendorNotifiedDate}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700/80">
                      The vendor has not been informed about this quality issue
                    </p>
                  )}
                </div>

                {/* Root Cause & Disposition (if available) */}
                {(selectedNCR.rootCause || selectedNCR.disposition) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedNCR.rootCause && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Root Cause</p>
                        <p className="text-sm">{selectedNCR.rootCause}</p>
                      </div>
                    )}
                    {selectedNCR.disposition && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Disposition</p>
                        <p className="text-sm">{selectedNCR.disposition}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                {!selectedNCR.vendorNotified && (
                  <Button onClick={() => handleEmailVendor(selectedNCR)} className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email Vendor
                  </Button>
                )}
                {selectedNCR.vendorNotified && (
                  <Button variant="outline" onClick={() => handleEmailVendor(selectedNCR)} className="gap-2">
                    <Send className="w-4 h-4" />
                    Send Follow-up
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
