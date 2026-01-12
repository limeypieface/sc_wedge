"use client"

import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AgentSummaryProps {
  summary: string[]
  criticalIssueCount: number
}

export function AgentSummary({ summary, criticalIssueCount }: AgentSummaryProps) {
  return (
    <Card className="border-0 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Current State</h3>
          {criticalIssueCount > 0 && (
            <Badge className="ml-auto bg-destructive/10 text-destructive text-xs">
              {criticalIssueCount} action needed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {summary.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-primary font-semibold">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        {criticalIssueCount > 0 && (
          <Button variant="outline" size="sm" className="mt-4 text-xs w-full bg-transparent">
            Review all actions in Tasks tab
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
