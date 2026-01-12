"use client"

import { useState } from "react"
import { MoreVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExpandableToolbarProps {
  children: React.ReactNode
  className?: string
  maxWidth?: string
}

export function ExpandableToolbar({
  children,
  className,
  maxWidth = "500px"
}: ExpandableToolbarProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* Expanded content - animates to the left */}
      <div
        className={cn(
          "flex items-center gap-1 overflow-hidden transition-all duration-200 ease-out",
          expanded ? "opacity-100 mr-1" : "max-w-0 opacity-0"
        )}
        style={{ maxWidth: expanded ? maxWidth : 0 }}
      >
        {children}
      </div>

      {/* Toggle button - always visible */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "Collapse" : "More actions"}
      >
        {expanded ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
      </Button>
    </div>
  )
}
