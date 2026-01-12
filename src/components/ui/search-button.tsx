"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface SearchButtonProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onClear?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  variant?: "expandable" | "icon-only"
  expandDirection?: "left" | "right"
  size?: "default" | "sm" | "lg"
  autoFocus?: boolean
}

export const SearchButton = React.forwardRef<HTMLDivElement, SearchButtonProps>(
  (
    {
      placeholder = "Search...",
      value = "",
      onChange,
      onClear,
      disabled = false,
      loading = false,
      variant = "expandable",
      expandDirection = "left",
      size = "default",
      autoFocus = true,
      className,
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [localValue, setLocalValue] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const blurTimeoutRef = React.useRef<NodeJS.Timeout>()

    React.useEffect(() => {
      setLocalValue(value)
    }, [value])

    React.useEffect(() => {
      if (isExpanded && autoFocus && inputRef.current) {
        inputRef.current.focus()
      }
    }, [isExpanded, autoFocus])

    React.useEffect(() => {
      return () => {
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current)
        }
      }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setLocalValue(newValue)
      onChange?.(newValue)
    }

    const handleBlur = () => {
      blurTimeoutRef.current = setTimeout(() => {
        if (!localValue.trim()) {
          setIsExpanded(false)
        }
      }, 150)
    }

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setLocalValue("")
      onChange?.("")
      onClear?.()
      setIsExpanded(false)
    }

    const sizeClasses = {
      default: "h-9 w-9",
      sm: "h-6 w-6",
      lg: "h-10 w-10",
    }

    const expandedWidthClasses = {
      default: "w-64",
      sm: "w-48",
      lg: "w-80",
    }

    const iconSizeClasses = {
      default: "h-4 w-4",
      sm: "h-3.5 w-3.5",
      lg: "h-5 w-5",
    }

    if (variant === "icon-only" || !isExpanded) {
      return (
        <Button
          ref={ref as React.RefObject<HTMLButtonElement>}
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className={cn(
            sizeClasses[size],
            "text-muted-foreground hover:text-foreground hover:bg-transparent",
            className
          )}
        >
          <Search className={iconSizeClasses[size]} />
          <span className="sr-only">Search</span>
        </Button>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center transition-all duration-200 ease-in-out",
          expandedWidthClasses[size],
          expandDirection === "right" ? "origin-left" : "origin-right",
          className
        )}
      >
        <div
          className={cn(
            "relative flex items-center w-full rounded-lg border border-input bg-background shadow-sm hover:bg-accent/5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all",
            size === "sm" && "h-6",
            size === "default" && "h-9",
            size === "lg" && "h-10"
          )}
        >
          <Search
            className={cn(
              "ml-2 text-muted-foreground pointer-events-none flex-shrink-0",
              iconSizeClasses[size]
            )}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled || loading}
            className={cn(
              "flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              size === "sm" && "h-6 text-xs",
              size === "default" && "h-9 text-sm",
              size === "lg" && "h-10 text-base"
            )}
          />
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || !localValue}
            className={cn(
              "mr-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0",
              loading && "animate-spin",
              !localValue && !loading && "opacity-40 cursor-default"
            )}
          >
            <X className={iconSizeClasses[size]} />
            <span className="sr-only">Clear search</span>
          </button>
        </div>
      </div>
    )
  }
)

SearchButton.displayName = "SearchButton"
