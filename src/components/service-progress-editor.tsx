"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Clock, TrendingUp, Calculator, Save, X } from "lucide-react"
import type { ServiceProgress } from "@/app/supply/purchase-orders/_lib/types/purchase-order.types"

interface ServiceProgressEditorProps {
  progress: ServiceProgress
  onChange?: (progress: ServiceProgress) => void
  onSave?: (progress: ServiceProgress) => void
  onCancel?: () => void
  readOnly?: boolean
  showSaveCancel?: boolean
  compact?: boolean
}

export function ServiceProgressEditor({
  progress,
  onChange,
  onSave,
  onCancel,
  readOnly = false,
  showSaveCancel = false,
  compact = false,
}: ServiceProgressEditorProps) {
  const [localProgress, setLocalProgress] = useState<ServiceProgress>({
    ...progress,
  })
  const [autoCalculate, setAutoCalculate] = useState(false)

  const updateProgress = useCallback(
    (updates: Partial<ServiceProgress>) => {
      const newProgress = { ...localProgress, ...updates }

      // Auto-calculate percentage from units if enabled
      if (autoCalculate && updates.consumedUnits !== undefined) {
        if (newProgress.estimatedUnits > 0) {
          newProgress.percentComplete = Math.min(
            100,
            Math.round((newProgress.consumedUnits / newProgress.estimatedUnits) * 100)
          )
        }
      }

      // Auto-calculate units from percentage if enabled
      if (autoCalculate && updates.percentComplete !== undefined) {
        if (newProgress.estimatedUnits > 0) {
          newProgress.consumedUnits = Math.round(
            (newProgress.percentComplete / 100) * newProgress.estimatedUnits
          )
        }
      }

      newProgress.lastUpdated = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      setLocalProgress(newProgress)
      onChange?.(newProgress)
    },
    [localProgress, autoCalculate, onChange]
  )

  const handleSave = () => {
    onSave?.(localProgress)
  }

  const getProgressColor = (percent: number): string => {
    if (percent >= 100) return "bg-emerald-500"
    if (percent >= 75) return "bg-emerald-400"
    if (percent >= 50) return "bg-blue-500"
    if (percent >= 25) return "bg-amber-500"
    return "bg-slate-400"
  }

  const getUnitLabel = (unitType: string): string => {
    switch (unitType) {
      case "hours":
        return "hrs"
      case "days":
        return "days"
      default:
        return "units"
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{localProgress.percentComplete}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", getProgressColor(localProgress.percentComplete))}
              style={{ width: `${localProgress.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Units consumed */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {localProgress.unitType === "hours" ? "Hours" : "Units"}
          </span>
          <span className="font-medium tabular-nums">
            {localProgress.consumedUnits} / {localProgress.estimatedUnits} {getUnitLabel(localProgress.unitType)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Percentage Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Completion
          </Label>
          <span className="text-2xl font-bold tabular-nums">
            {localProgress.percentComplete}%
          </span>
        </div>

        {readOnly ? (
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", getProgressColor(localProgress.percentComplete))}
              style={{ width: `${localProgress.percentComplete}%` }}
            />
          </div>
        ) : (
          <Slider
            value={[localProgress.percentComplete]}
            onValueChange={([value]) => updateProgress({ percentComplete: value })}
            max={100}
            step={5}
            className="w-full"
          />
        )}

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Units Tracking */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {localProgress.unitType === "hours" ? "Hours" : "Units"} Consumed
        </Label>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Consumed</span>
            {readOnly ? (
              <div className="text-lg font-semibold tabular-nums">
                {localProgress.consumedUnits}
              </div>
            ) : (
              <Input
                type="number"
                value={localProgress.consumedUnits}
                onChange={(e) =>
                  updateProgress({ consumedUnits: parseInt(e.target.value) || 0 })
                }
                className="h-9 tabular-nums"
                min={0}
                max={localProgress.estimatedUnits * 2}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">of Estimated</span>
            {readOnly ? (
              <div className="text-lg font-semibold tabular-nums">
                {localProgress.estimatedUnits}
              </div>
            ) : (
              <Input
                type="number"
                value={localProgress.estimatedUnits}
                onChange={(e) =>
                  updateProgress({ estimatedUnits: parseInt(e.target.value) || 0 })
                }
                className="h-9 tabular-nums"
                min={1}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Remaining</span>
            <div
              className={cn(
                "text-lg font-semibold tabular-nums",
                localProgress.consumedUnits > localProgress.estimatedUnits && "text-destructive"
              )}
            >
              {Math.max(0, localProgress.estimatedUnits - localProgress.consumedUnits)}
            </div>
          </div>
        </div>

        {/* Units progress bar */}
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                localProgress.consumedUnits > localProgress.estimatedUnits
                  ? "bg-destructive"
                  : "bg-primary"
              )}
              style={{
                width: `${Math.min(100, (localProgress.consumedUnits / localProgress.estimatedUnits) * 100)}%`,
              }}
            />
          </div>
          {localProgress.consumedUnits > localProgress.estimatedUnits && (
            <p className="text-xs text-destructive">
              Over budget by{" "}
              {localProgress.consumedUnits - localProgress.estimatedUnits}{" "}
              {getUnitLabel(localProgress.unitType)}
            </p>
          )}
        </div>
      </div>

      {/* Auto-calculate toggle */}
      {!readOnly && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={autoCalculate}
            onChange={(e) => setAutoCalculate(e.target.checked)}
            className="w-4 h-4 rounded border-muted-foreground/30"
          />
          <Calculator className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Auto-calculate percentage from {localProgress.unitType}
          </span>
        </label>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label>Progress Notes</Label>
        {readOnly ? (
          <p className="text-sm text-muted-foreground">
            {localProgress.notes || "No notes"}
          </p>
        ) : (
          <Textarea
            value={localProgress.notes || ""}
            onChange={(e) => updateProgress({ notes: e.target.value })}
            placeholder="Add notes about the current progress..."
            className="min-h-[60px] resize-none"
          />
        )}
      </div>

      {/* Last Updated */}
      {localProgress.lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated: {localProgress.lastUpdated}
        </p>
      )}

      {/* Save/Cancel buttons */}
      {showSaveCancel && !readOnly && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save Progress
          </Button>
        </div>
      )}
    </div>
  )
}
