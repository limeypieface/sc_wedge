"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface LineDisplaySelectorProps {
  value: string
  onChange: (value: string) => void
}

const VIEW_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "financials", label: "Financials" },
  { value: "quantity", label: "Quantity" },
  { value: "needs", label: "Needs" },
  { value: "quality", label: "Quality" },
  { value: "logistics", label: "Logistics" },
  { value: "sourcing", label: "Sourcing" },
  { value: "services", label: "Services" },
]

export type LineViewMode = "basic" | "financials" | "quantity" | "needs" | "quality" | "logistics" | "sourcing" | "services"

export function LineDisplaySelector({ value, onChange }: LineDisplaySelectorProps) {
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
