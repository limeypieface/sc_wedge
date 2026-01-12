"use client"

/**
 * Feature Flags Settings
 *
 * Admin UI for toggling feature flags at runtime.
 * Displays flags grouped by category with descriptions and dependency info.
 */

import { useState } from "react"
import {
  Beaker,
  AlertTriangle,
  RotateCcw,
  Check,
  Link as LinkIcon,
  Info,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useFeatureFlags } from "@/context/FeatureFlagsContext"
import {
  FEATURE_FLAG_DEFINITIONS,
  getFlagsByCategory,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  FEATURE_FLAGS_MAP,
  type FeatureFlagCategory,
  type FeatureFlagDefinition,
} from "@/config/feature-flags"

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const CATEGORY_ICONS: Record<FeatureFlagCategory, React.ComponentType<{ className?: string }>> = {
  workflow: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  communication: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  ui: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  ai: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
      <circle cx="7.5" cy="14.5" r="1.5" />
      <circle cx="16.5" cy="14.5" r="1.5" />
    </svg>
  ),
  experimental: Beaker,
}

const CATEGORY_COLORS: Record<FeatureFlagCategory, string> = {
  workflow: "text-blue-600 bg-blue-50 border-blue-200",
  communication: "text-green-600 bg-green-50 border-green-200",
  ui: "text-purple-600 bg-purple-50 border-purple-200",
  ai: "text-amber-600 bg-amber-50 border-amber-200",
  experimental: "text-red-600 bg-red-50 border-red-200",
}

// ============================================================================
// FLAG ROW COMPONENT
// ============================================================================

interface FlagRowProps {
  flag: FeatureFlagDefinition
  isEnabled: boolean
  isDefaultValue: boolean
  onToggle: () => void
  onReset: () => void
  disabledReason?: string
}

function FlagRow({
  flag,
  isEnabled,
  isDefaultValue,
  onToggle,
  onReset,
  disabledReason,
}: FlagRowProps) {
  const isDisabled = !!disabledReason

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border transition-colors",
        isDisabled
          ? "bg-muted/30 border-muted opacity-60"
          : isEnabled
          ? "bg-primary/5 border-primary/20"
          : "bg-background border-border hover:border-muted-foreground/30"
      )}
    >
      {/* Toggle */}
      <div className="pt-0.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={onToggle}
                  disabled={isDisabled}
                />
              </div>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent side="right">
                <p>{disabledReason}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{flag.name}</span>

          {/* Modified badge */}
          {!isDefaultValue && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              Modified
            </Badge>
          )}

          {/* Dependencies */}
          {flag.dependencies && flag.dependencies.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <LinkIcon className="w-3 h-3" />
                    <span className="text-[10px]">
                      Requires {flag.dependencies.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Depends on:{" "}
                    {flag.dependencies
                      .map((d) => FEATURE_FLAGS_MAP[d]?.name || d)
                      .join(", ")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>

        {/* Warning */}
        {flag.warning && (
          <div className="flex items-center gap-1.5 mt-2 text-amber-600 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{flag.warning}</span>
          </div>
        )}
      </div>

      {/* Reset button (only show if modified) */}
      {!isDefaultValue && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset to default</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// ============================================================================
// CATEGORY SECTION COMPONENT
// ============================================================================

interface CategorySectionProps {
  category: FeatureFlagCategory
  flags: FeatureFlagDefinition[]
}

function CategorySection({ category, flags }: CategorySectionProps) {
  const { state, isEnabled, toggleFlag, resetFlag } = useFeatureFlags()
  const Icon = CATEGORY_ICONS[category]
  const colorClasses = CATEGORY_COLORS[category]

  // Check if a flag is at its default value
  const isDefaultValue = (flagId: string) => {
    const flagDef = FEATURE_FLAGS_MAP[flagId]
    return flagDef ? state.flags[flagId] === flagDef.defaultValue : true
  }

  // Get disabled reason for a flag (checks dependencies)
  const getDisabledReason = (flag: FeatureFlagDefinition): string | undefined => {
    if (!flag.dependencies) return undefined

    const missingDeps = flag.dependencies.filter((dep) => !isEnabled(dep))
    if (missingDeps.length > 0) {
      const depNames = missingDeps
        .map((d) => FEATURE_FLAGS_MAP[d]?.name || d)
        .join(", ")
      return `Requires: ${depNames}`
    }

    return undefined
  }

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg border", colorClasses)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold">{CATEGORY_LABELS[category]}</h3>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_DESCRIPTIONS[category]}
          </p>
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-2 ml-2">
        {flags.map((flag) => (
          <FlagRow
            key={flag.id}
            flag={flag}
            isEnabled={isEnabled(flag.id)}
            isDefaultValue={isDefaultValue(flag.id)}
            onToggle={() => toggleFlag(flag.id)}
            onReset={() => resetFlag(flag.id)}
            disabledReason={getDisabledReason(flag)}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeatureFlagsSettings() {
  const { state, resetToDefaults, hasModifications, getModifiedFlags } =
    useFeatureFlags()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const flagsByCategory = getFlagsByCategory()
  const categoryOrder: FeatureFlagCategory[] = [
    "workflow",
    "communication",
    "ui",
    "ai",
    "experimental",
  ]

  const modifiedCount = Object.keys(getModifiedFlags()).length

  const handleResetAll = () => {
    resetToDefaults()
    setShowResetConfirm(false)
  }

  if (!state.isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading feature flags...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feature Flags</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enable or disable features across the application. Changes take
            effect immediately.
          </p>
        </div>

        {hasModifications() && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {modifiedCount} modified
            </span>

            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Reset all?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetAll}
                >
                  Yes, reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
        <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium">Runtime Configuration</p>
          <p className="text-blue-700 mt-1">
            Feature flags are stored locally and persist across sessions. Some
            features may require dependencies to be enabled first.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {categoryOrder.map((category) => (
          <CategorySection
            key={category}
            category={category}
            flags={flagsByCategory[category] || []}
          />
        ))}
      </div>

      {/* Last updated */}
      {state.lastUpdated && (
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Last updated: {new Date(state.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  )
}
