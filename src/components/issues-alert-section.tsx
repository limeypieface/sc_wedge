"use client"

import { AlertCircle, Mail, Edit, CheckCircle, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export function IssuesAlertSection() {
  const [isExpanded, setIsExpanded] = useState(true)

  const issues = [
    {
      id: 1,
      severity: "high",
      item: "PSW-102",
      issue: "Item should have shipped by yesterday. Expected 6 units, only 4 shipped.",
      recommendation: "Email vendor to confirm shipment status and get tracking information.",
      action: "Contact Vendor",
      actionType: "email",
    },
    {
      id: 2,
      severity: "high",
      item: "MOD-087",
      issue: "Invoice price mismatch: PO $330/unit, Invoice $337.50/unit. Variance of $30.00 on 4 units.",
      recommendation:
        "Review with vendor to confirm pricing. Options: Email to clarify or update PO if price is correct.",
      action: "Contact Vendor",
      actionType: "email",
    },
    {
      id: 3,
      severity: "medium",
      item: "CAB-050",
      issue: "No receipt recorded yet. Item was due on Jan 28, 2026.",
      recommendation: "Follow up with vendor on delivery status.",
      action: "Inquire",
      actionType: "email",
    },
    {
      id: 4,
      severity: "medium",
      item: "PSW-102",
      issue: "1 unit in quality hold. Needs inspection to release or reject.",
      recommendation: "Contact QA team to expedite inspection, or email vendor for replacement if rejected.",
      action: "QA Follow-up",
      actionType: "internal",
    },
  ]

  const visibleIssues = isExpanded ? issues : issues.filter((i) => i.severity === "high")

  const getSeverityColor = (severity: string) => {
    return severity === "high"
      ? "bg-destructive/10 text-destructive"
      : severity === "medium"
        ? "bg-accent text-accent-foreground"
        : "bg-primary/10 text-primary"
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer hover:bg-destructive/10 transition-colors pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <ChevronDown className={`w-4 h-4 text-destructive transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">Issues Requiring Attention</h3>
            <p className="text-xs text-muted-foreground">{issues.length} items need action</p>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-6">
          <div className="space-y-3">
            {visibleIssues.map((issue) => (
              <div key={issue.id} className="bg-muted/30 rounded border border-border p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(issue.severity)}>{issue.severity.toUpperCase()}</Badge>
                      <span className="text-sm font-mono font-medium text-foreground">{issue.item}</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{issue.issue}</p>
                    <p className="text-sm text-muted-foreground mt-1">{issue.recommendation}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-transparent"
                    onClick={() => console.log(`Action: ${issue.actionType} for ${issue.item}`)}
                  >
                    {issue.actionType === "email" ? (
                      <>
                        <Mail className="w-3 h-3 mr-1" />
                        {issue.action}
                      </>
                    ) : issue.actionType === "edit" ? (
                      <>
                        <Edit className="w-3 h-3 mr-1" />
                        {issue.action}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {issue.action}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
