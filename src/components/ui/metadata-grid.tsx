"use client"

import { cn } from "@/lib/utils"

export interface MetadataItem {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export interface MetadataGridProps {
  items: MetadataItem[]
  columns?: 1 | 2 | 3 | 4
  variant?: "default" | "compact" | "card"
  className?: string
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
}

const variantStyles = {
  default: {
    container: "gap-4",
    item: "",
    label: "text-xs text-muted-foreground mb-1",
    value: "text-sm font-medium",
  },
  compact: {
    container: "gap-3",
    item: "",
    label: "text-xs text-muted-foreground",
    value: "text-sm",
  },
  card: {
    container: "gap-4",
    item: "p-3 rounded-lg bg-muted/30",
    label: "text-xs text-muted-foreground mb-1",
    value: "text-sm font-medium",
  },
}

export function MetadataGrid({
  items,
  columns = 2,
  variant = "default",
  className,
}: MetadataGridProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn("grid", columnClasses[columns], styles.container, className)}
    >
      {items.map((item, index) => (
        <div key={index} className={cn(styles.item, item.className)}>
          <div className={cn("flex items-center gap-1", styles.label)}>
            {item.icon}
            {item.label}
          </div>
          <div className={styles.value}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export interface MetadataRowProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function MetadataRow({ label, value, icon, className }: MetadataRowProps) {
  return (
    <div className={cn("flex justify-between items-center py-2", className)}>
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export interface MetadataListProps {
  items: MetadataItem[]
  divider?: boolean
  className?: string
}

export function MetadataList({ items, divider = true, className }: MetadataListProps) {
  return (
    <div className={cn(divider && "divide-y divide-border", className)}>
      {items.map((item, index) => (
        <MetadataRow
          key={index}
          label={item.label}
          value={item.value}
          icon={item.icon}
          className={item.className}
        />
      ))}
    </div>
  )
}

export interface MetadataSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function MetadataSection({ title, children, className }: MetadataSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      )}
      {children}
    </div>
  )
}
