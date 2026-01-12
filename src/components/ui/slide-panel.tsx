"use client"

import { useEffect, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SlidePanelProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  width?: "sm" | "md" | "lg" | "xl" | "full"
  side?: "left" | "right"
  showOverlay?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  headerActions?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
}

const widthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "md",
  side = "right",
  showOverlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  headerActions,
  footer,
  className,
  contentClassName,
}: SlidePanelProps) {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose()
      }
    },
    [closeOnEscape, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      {showOverlay && (
        <div
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-full bg-background shadow-xl flex flex-col",
          widthClasses[width],
          side === "right" ? "right-0" : "left-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-lg font-semibold truncate">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {headerActions}
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn("flex-1 overflow-y-auto p-4", contentClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-border">{footer}</div>
        )}
      </div>
    </div>
  )
}

export interface SlidePanelSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function SlidePanelSection({
  title,
  children,
  className,
}: SlidePanelSectionProps) {
  return (
    <div className={cn("mb-6", className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
