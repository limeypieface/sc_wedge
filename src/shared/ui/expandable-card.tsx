"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ExpandableCardProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  headerActions?: React.ReactNode
  variant?: "default" | "bordered" | "muted"
  className?: string
  contentClassName?: string
}

const variantStyles = {
  default: {
    container: "bg-muted/50 rounded-lg",
    header: "hover:bg-muted/70",
    content: "",
  },
  bordered: {
    container: "border border-border rounded-lg",
    header: "hover:bg-muted/30",
    content: "",
  },
  muted: {
    container: "bg-muted/30 rounded-lg",
    header: "hover:bg-muted/50",
    content: "",
  },
}

export function ExpandableCard({
  title,
  subtitle,
  badge,
  icon,
  children,
  defaultOpen = false,
  headerActions,
  variant = "default",
  className,
  contentClassName,
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen)
  const styles = variantStyles[variant]

  return (
    <div className={cn(styles.container, className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors rounded-lg",
          styles.header
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">{title}</span>
              {badge}
            </div>
            {subtitle && (
              <div className="text-sm text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerActions && (
            <div onClick={(e) => e.stopPropagation()}>{headerActions}</div>
          )}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className={cn("px-4 pb-4", contentClassName)}>{children}</div>
      )}
    </div>
  )
}

export interface ExpandableCardGroupProps {
  children: React.ReactNode
  className?: string
}

export function ExpandableCardGroup({
  children,
  className,
}: ExpandableCardGroupProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>
}
