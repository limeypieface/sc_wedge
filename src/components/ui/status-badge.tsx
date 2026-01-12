"use client"

import { cn } from "@/lib/utils"

export type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "muted"
  | "amber"
  | "green"
  | "red"
  | "blue"
  | "purple"
  | "orange"

export interface StatusBadgeProps {
  children: React.ReactNode
  variant?: StatusVariant
  size?: "sm" | "md" | "lg"
  dot?: boolean
  icon?: React.ReactNode
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-muted text-foreground",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  muted: "bg-muted/50 text-muted-foreground",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  orange: "bg-orange-100 text-orange-800",
}

const dotStyles: Record<StatusVariant, string> = {
  default: "bg-foreground",
  success: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  muted: "bg-muted-foreground",
  amber: "bg-amber-500",
  green: "bg-green-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
}

const sizeStyles = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
  lg: "text-sm px-2.5 py-1",
}

export function StatusBadge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotStyles[variant])} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "critical" | "standard"
  className?: string
}

const priorityConfig: Record<
  PriorityBadgeProps["priority"],
  { label: string; variant: StatusVariant }
> = {
  low: { label: "Low", variant: "muted" },
  standard: { label: "Standard", variant: "default" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "orange" },
  critical: { label: "Critical", variant: "error" },
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <StatusBadge variant={config.variant} dot className={className}>
      {config.label}
    </StatusBadge>
  )
}

export interface StatusIndicatorProps {
  status: string
  statusMap: Record<string, { label: string; variant: StatusVariant }>
  className?: string
}

export function StatusIndicator({
  status,
  statusMap,
  className,
}: StatusIndicatorProps) {
  const config = statusMap[status] || { label: status, variant: "default" as StatusVariant }
  return (
    <StatusBadge variant={config.variant} className={className}>
      {config.label}
    </StatusBadge>
  )
}
