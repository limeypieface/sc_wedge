"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react"
import { generatePOInsights, type POInsights } from "@/app/actions/po-insights"

interface AIAssistantSidebarProps {
  isOpen: boolean
  onClose: () => void
  poData: {
    poNumber: string
    status: string
    supplier: string
    orderDate: string
    totalAmount: number
    lineItems: Array<{
      id: number
      sku: string
      name: string
      quantity: number
      status: string
      quantityOrdered?: number
      quantityReceived?: number
      quantityInQualityHold?: number
      promisedDate?: string
    }>
    urgency: string
    tasks?: Array<{
      id: number
      title: string
      status: string
      reason?: string
      createdBy?: string
      suggestedAction?: string
    }>
  }
}

export function AIAssistantSidebar({ isOpen, onClose, poData }: AIAssistantSidebarProps) {
  const [insights, setInsights] = useState<POInsights | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await generatePOInsights(poData)
      setInsights(result)
    } catch (err) {
      console.error("Error generating insights:", err)
      setError("Unable to generate insights. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && !insights && !isLoading) {
      fetchInsights()
    }
  }, [isOpen])

  const handleRefresh = () => {
    setInsights(null)
    fetchInsights()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-amber-100 text-amber-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">AI Assistant</SheetTitle>
                <SheetDescription className="text-xs">
                  Insights for {poData.poNumber}
                </SheetDescription>
              </div>
            </div>
            {insights && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="py-4 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing purchase order...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          ) : insights ? (
            <>
              {/* Executive Summary */}
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Summary
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <p className="text-sm leading-relaxed">{insights.summary}</p>
                </div>
              </section>

              {/* Key Metrics */}
              <section>
                <h3 className="text-sm font-semibold mb-3">Key Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">Fulfillment</div>
                    <div className="text-lg font-semibold">{insights.metrics.fulfillmentRate}%</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">Lines Complete</div>
                    <div className="text-lg font-semibold">
                      {insights.metrics.linesReceived}/{insights.metrics.totalLines}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">Quality Holds</div>
                    <div className="text-lg font-semibold">{insights.metrics.qualityHolds}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground">Open Issues</div>
                    <div className="text-lg font-semibold">{insights.metrics.openIssues}</div>
                  </div>
                </div>
              </section>

              {/* Issues */}
              {insights.issues.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Issues Identified ({insights.issues.length})
                  </h3>
                  <div className="space-y-2">
                    {insights.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-3 border ${getSeverityColor(issue.severity)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{issue.title}</p>
                            <p className="text-xs mt-1 opacity-80">{issue.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {issue.affectedItem}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recommended Actions */}
              {insights.recommendedActions.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Recommended Actions
                  </h3>
                  <div className="space-y-2">
                    {insights.recommendedActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg p-3 border bg-background hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{action.action}</p>
                              <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                                {action.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{action.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Next Steps */}
              {insights.nextSteps && (
                <section>
                  <h3 className="text-sm font-semibold mb-3">Next Steps</h3>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm leading-relaxed">{insights.nextSteps}</p>
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
