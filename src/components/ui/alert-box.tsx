"use client"

import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type AlertVariant = "info" | "success" | "warning" | "error" | "neutral"

export interface AlertBoxProps {
  title?: string
  children: React.ReactNode
  variant?: AlertVariant
  icon?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  actions?: React.ReactNode
  className?: string
}

const variantStyles: Record<
  AlertVariant,
  { container: string; icon: string; title: string }
> = {
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    title: "text-blue-800",
  },
  success: {
    container: "bg-green-50 border-green-200",
    icon: "text-green-600",
    title: "text-green-800",
  },
  warning: {
    container: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    title: "text-amber-800",
  },
  error: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-600",
    title: "text-red-800",
  },
  neutral: {
    container: "bg-muted/50 border-border",
    icon: "text-muted-foreground",
    title: "text-foreground",
  },
}

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="w-5 h-5" />,
  success: <CheckCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  neutral: <Info className="w-5 h-5" />,
}

export function AlertBox({
  title,
  children,
  variant = "info",
  icon,
  dismissible = false,
  onDismiss,
  actions,
  className,
}: AlertBoxProps) {
  const styles = variantStyles[variant]
  const displayIcon = icon ?? defaultIcons[variant]

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg border",
        styles.container,
        className
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5", styles.icon)}>{displayIcon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn("font-medium mb-1", styles.title)}>{title}</h4>
        )}
        <div className="text-sm text-muted-foreground">{children}</div>
        {actions && <div className="mt-3">{actions}</div>}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export interface VarianceAlertProps {
  label: string
  expected: string | number
  actual: string | number
  variance: string | number
  variancePercent?: number
  isNegative?: boolean
  className?: string
}

export function VarianceAlert({
  label,
  expected,
  actual,
  variance,
  variancePercent,
  isNegative = true,
  className,
}: VarianceAlertProps) {
  const variant = isNegative ? "error" : "warning"
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        styles.container,
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn("font-medium", styles.title)}>{label}</span>
        <span className={cn("font-bold", isNegative ? "text-red-600" : "text-amber-600")}>
          {variance}
          {variancePercent !== undefined && ` (${variancePercent}%)`}
        </span>
      </div>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div>
          <span className="text-xs">Expected:</span>
          <span className="ml-1 font-medium">{expected}</span>
        </div>
        <div>
          <span className="text-xs">Actual:</span>
          <span className="ml-1 font-medium">{actual}</span>
        </div>
      </div>
    </div>
  )
}

export interface StatusAlertProps {
  status: string
  message: string
  timestamp?: string
  className?: string
}

export function StatusAlert({
  status,
  message,
  timestamp,
  className,
}: StatusAlertProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/30",
        className
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{status}</span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
