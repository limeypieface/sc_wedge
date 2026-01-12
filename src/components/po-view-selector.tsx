"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export type POViewMode = "overview" | "financial" | "delivery" | "fulfillment" | "risk"

interface POViewSelectorProps {
  value: POViewMode
  onChange: (value: POViewMode) => void
}

const VIEW_OPTIONS: { value: POViewMode; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "financial", label: "Financial" },
  { value: "delivery", label: "Delivery" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "risk", label: "Risk" },
]

export function POViewSelector({ value, onChange }: POViewSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const activeButton = container.querySelector(`[data-value="${value}"]`) as HTMLButtonElement
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-0.5 p-1 bg-muted rounded-lg"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 h-[calc(100%-8px)] bg-background rounded-md shadow-sm transition-all duration-200 ease-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />

      {/* Options */}
      {VIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          data-value={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === option.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
