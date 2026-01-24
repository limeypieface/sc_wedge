"use client"

import { cn } from "@/lib/utils"

export interface StatCardProps {
  title?: string
  value: string | number
  label: string
  variant?: "default" | "warning" | "error" | "success" | "info"
  percentage?: number
  icon?: React.ReactNode
  className?: string
}

const variantStyles = {
  default: {
    container: "bg-muted/30",
    value: "text-foreground",
    label: "text-muted-foreground",
  },
  warning: {
    container: "bg-amber-50",
    value: "text-amber-700",
    label: "text-amber-600",
  },
  error: {
    container: "bg-red-50",
    value: "text-red-700",
    label: "text-red-600",
  },
  success: {
    container: "bg-green-50",
    value: "text-green-700",
    label: "text-green-600",
  },
  info: {
    container: "bg-blue-50",
    value: "text-blue-700",
    label: "text-blue-600",
  },
}

export function StatCard({
  title,
  value,
  label,
  variant = "default",
  percentage,
  icon,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={cn("p-4 rounded-lg", styles.container, className)}>
      {title && (
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {title}
        </div>
      )}
      <div className="flex items-center gap-2">
        {icon && <div className={styles.value}>{icon}</div>}
        <div className={cn("text-2xl font-bold", styles.value)}>{value}</div>
        {percentage !== undefined && (
          <span className={cn("text-sm", styles.label)}>({percentage}%)</span>
        )}
      </div>
      <div className={cn("text-xs", styles.label)}>{label}</div>
    </div>
  )
}

export interface StatGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }

  return (
    <div className={cn("grid gap-4", colsClass[columns], className)}>
      {children}
    </div>
  )
}
