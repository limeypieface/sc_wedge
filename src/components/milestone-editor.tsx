"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  Flag,
  Plus,
  Trash2,
  GripVertical,
  Check,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
} from "lucide-react"
import type { MilestoneItem, MilestoneStatus } from "@/app/supply/purchase-orders/_lib/types/purchase-order.types"

interface MilestoneEditorProps {
  milestones: MilestoneItem[]
  totalAmount?: number
  onChange?: (milestones: MilestoneItem[]) => void
  onStatusChange?: (milestoneId: string, newStatus: MilestoneStatus) => void
  readOnly?: boolean
  showTotalValidation?: boolean
  compact?: boolean
}

const STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; icon: React.ReactNode; className: string; bgClassName: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "text-muted-foreground",
    bgClassName: "bg-muted",
  },
  in_progress: {
    label: "In Progress",
    icon: <Play className="w-3.5 h-3.5" />,
    className: "text-blue-600 dark:text-blue-400",
    bgClassName: "bg-blue-100 dark:bg-blue-900/30",
  },
  completed: {
    label: "Completed",
    icon: <Check className="w-3.5 h-3.5" />,
    className: "text-amber-600 dark:text-amber-400",
    bgClassName: "bg-amber-100 dark:bg-amber-900/30",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "text-emerald-600 dark:text-emerald-400",
    bgClassName: "bg-emerald-100 dark:bg-emerald-900/30",
  },
}

const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus | null> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "approved",
  approved: null,
}

export function MilestoneEditor({
  milestones,
  totalAmount,
  onChange,
  onStatusChange,
  readOnly = false,
  showTotalValidation = true,
  compact = false,
}: MilestoneEditorProps) {
  const [localMilestones, setLocalMilestones] = useState<MilestoneItem[]>(milestones)

  const milestonesTotal = localMilestones.reduce((sum, m) => sum + m.amount, 0)
  const completedAmount = localMilestones
    .filter((m) => m.status === "approved")
    .reduce((sum, m) => sum + m.amount, 0)
  const isValidTotal = !totalAmount || Math.abs(milestonesTotal - totalAmount) < 0.01

  const updateMilestones = useCallback(
    (newMilestones: MilestoneItem[]) => {
      setLocalMilestones(newMilestones)
      onChange?.(newMilestones)
    },
    [onChange]
  )

  const updateMilestone = useCallback(
    (id: string, updates: Partial<MilestoneItem>) => {
      const newMilestones = localMilestones.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      )
      updateMilestones(newMilestones)
    },
    [localMilestones, updateMilestones]
  )

  const addMilestone = useCallback(() => {
    const newMilestone: MilestoneItem = {
      id: `MS-${Date.now()}`,
      name: "",
      amount: 0,
      status: "pending",
      sequence: localMilestones.length + 1,
    }
    updateMilestones([...localMilestones, newMilestone])
  }, [localMilestones, updateMilestones])

  const removeMilestone = useCallback(
    (id: string) => {
      const newMilestones = localMilestones
        .filter((m) => m.id !== id)
        .map((m, idx) => ({ ...m, sequence: idx + 1 }))
      updateMilestones(newMilestones)
    },
    [localMilestones, updateMilestones]
  )

  const advanceStatus = useCallback(
    (milestone: MilestoneItem) => {
      const nextStatus = NEXT_STATUS[milestone.status]
      if (!nextStatus) return

      const updates: Partial<MilestoneItem> = { status: nextStatus }
      if (nextStatus === "completed") {
        updates.completedDate = new Date().toISOString().split("T")[0]
      }

      updateMilestone(milestone.id, updates)
      onStatusChange?.(milestone.id, nextStatus)
    },
    [updateMilestone, onStatusChange]
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  if (compact) {
    return (
      <div className="space-y-2">
        {localMilestones.map((milestone, idx) => {
          const config = STATUS_CONFIG[milestone.status]
          return (
            <div
              key={milestone.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                    config.bgClassName,
                    config.className
                  )}
                >
                  {config.icon}
                </span>
                <span className="truncate">{milestone.name || `Milestone ${idx + 1}`}</span>
              </div>
              <span className="font-medium tabular-nums shrink-0">
                {formatCurrency(milestone.amount)}
              </span>
            </div>
          )
        })}

        {/* Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
          <span className="text-muted-foreground">
            {localMilestones.filter((m) => m.status === "approved").length} of{" "}
            {localMilestones.length} approved
          </span>
          <span className="font-medium">
            {formatCurrency(completedAmount)} / {formatCurrency(milestonesTotal)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with totals */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Milestones</span>
          <span className="text-xs text-muted-foreground">
            ({localMilestones.length})
          </span>
        </div>
        {showTotalValidation && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm",
              isValidTotal ? "text-muted-foreground" : "text-destructive"
            )}
          >
            {!isValidTotal && <AlertCircle className="w-4 h-4" />}
            <span className="tabular-nums">
              {formatCurrency(milestonesTotal)}
              {totalAmount && (
                <span className="text-muted-foreground">
                  {" "}
                  / {formatCurrency(totalAmount)}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Milestones list */}
      <div className="space-y-3">
        {localMilestones.map((milestone, idx) => {
          const config = STATUS_CONFIG[milestone.status]
          const nextStatus = NEXT_STATUS[milestone.status]
          const canAdvance = nextStatus && !readOnly

          return (
            <div
              key={milestone.id}
              className={cn(
                "border rounded-lg p-3 transition-colors",
                milestone.status === "approved"
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                  : "border-border"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Drag handle (hidden if readOnly) */}
                {!readOnly && (
                  <div className="mt-2.5 cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}

                {/* Sequence number */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-2",
                    config.bgClassName,
                    config.className
                  )}
                >
                  {milestone.status === "approved" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Name and amount row */}
                  <div className="flex items-center gap-3">
                    {readOnly ? (
                      <span className="font-medium flex-1">
                        {milestone.name || `Milestone ${idx + 1}`}
                      </span>
                    ) : (
                      <Input
                        value={milestone.name}
                        onChange={(e) =>
                          updateMilestone(milestone.id, { name: e.target.value })
                        }
                        placeholder={`Milestone ${idx + 1}`}
                        className="h-8 flex-1"
                      />
                    )}

                    {readOnly ? (
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(milestone.amount)}
                      </span>
                    ) : (
                      <div className="relative w-28">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          value={milestone.amount}
                          onChange={(e) =>
                            updateMilestone(milestone.id, {
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 pl-6 tabular-nums"
                          min={0}
                          step={100}
                        />
                      </div>
                    )}
                  </div>

                  {/* Description (if editing or has description) */}
                  {(!readOnly || milestone.description) && (
                    <>
                      {readOnly ? (
                        milestone.description && (
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        )
                      ) : (
                        <Textarea
                          value={milestone.description || ""}
                          onChange={(e) =>
                            updateMilestone(milestone.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Description (optional)"
                          className="min-h-[40px] resize-none text-sm"
                        />
                      )}
                    </>
                  )}

                  {/* Due date and status row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {readOnly ? (
                        milestone.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {milestone.dueDate}
                          </span>
                        )
                      ) : (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <Input
                            type="date"
                            value={milestone.dueDate || ""}
                            onChange={(e) =>
                              updateMilestone(milestone.id, {
                                dueDate: e.target.value,
                              })
                            }
                            className="h-7 text-xs w-32"
                          />
                        </div>
                      )}

                      {milestone.completedDate && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          Completed: {milestone.completedDate}
                        </span>
                      )}
                    </div>

                    {/* Status badge and action */}
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          config.bgClassName,
                          config.className
                        )}
                      >
                        {config.icon}
                        {config.label}
                      </span>

                      {canAdvance && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => advanceStatus(milestone)}
                          className="h-7 text-xs"
                        >
                          Mark as {STATUS_CONFIG[nextStatus].label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                {!readOnly && (
                  <button
                    onClick={() => removeMilestone(milestone.id)}
                    className="mt-2 p-1 rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add milestone button */}
      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          onClick={addMilestone}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Milestone
        </Button>
      )}

      {/* Total validation warning */}
      {showTotalValidation && !isValidTotal && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Milestone amounts ({formatCurrency(milestonesTotal)}) must equal the line total (
            {formatCurrency(totalAmount || 0)})
          </span>
        </div>
      )}

      {/* Progress summary */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            {localMilestones.filter((m) => m.status === "approved").length} of{" "}
            {localMilestones.length} approved
          </span>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground">Approved: </span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(completedAmount)}
          </span>
          <span className="text-muted-foreground">
            {" "}
            ({Math.round((completedAmount / milestonesTotal) * 100) || 0}%)
          </span>
        </div>
      </div>
    </div>
  )
}
