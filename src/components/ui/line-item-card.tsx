"use client"

import { cn } from "@/lib/utils"

export interface LineItemCardProps {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  metadata?: React.ReactNode
  actions?: React.ReactNode
  onClick?: () => void
  variant?: "default" | "interactive" | "bordered"
  className?: string
}

const variantStyles = {
  default: {
    container: "p-4 rounded-lg border border-border",
    hover: "",
  },
  interactive: {
    container: "p-4 rounded-lg border border-border cursor-pointer",
    hover: "hover:bg-muted/30 transition-colors",
  },
  bordered: {
    container: "p-4 rounded-lg bg-muted/30",
    hover: "",
  },
}

export function LineItemCard({
  icon,
  title,
  subtitle,
  badge,
  metadata,
  actions,
  onClick,
  variant = "default",
  className,
}: LineItemCardProps) {
  const styles = variantStyles[variant]
  const Component = onClick ? "button" : "div"

  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between text-left",
        styles.container,
        styles.hover,
        className
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{title}</span>
            {badge}
          </div>
          {subtitle && (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          )}
          {metadata && (
            <div className="text-xs text-muted-foreground mt-1">{metadata}</div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </Component>
  )
}

export interface LineItemMetadataProps {
  items: (string | React.ReactNode | null | undefined)[]
  separator?: string
  className?: string
}

export function LineItemMetadata({
  items,
  separator = "•",
  className,
}: LineItemMetadataProps) {
  const filteredItems = items.filter(Boolean)

  return (
    <div className={cn("flex flex-wrap gap-2 text-xs text-muted-foreground", className)}>
      {filteredItems.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span>{separator}</span>}
          <span>{item}</span>
        </span>
      ))}
    </div>
  )
}

export interface LineItemListProps {
  children: React.ReactNode
  emptyMessage?: string
  className?: string
}

export function LineItemList({
  children,
  emptyMessage = "No items",
  className,
}: LineItemListProps) {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : Boolean(children)

  if (!hasChildren) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return <div className={cn("space-y-2", className)}>{children}</div>
}
