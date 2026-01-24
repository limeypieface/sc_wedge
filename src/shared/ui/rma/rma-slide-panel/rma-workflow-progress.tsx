"use client"

/**
 * RMAWorkflowProgress
 *
 * Visual progress bar showing the RMA workflow steps.
 * Highlights the current step and shows completed steps.
 *
 * Steps: Requested → Authorized → Shipped → Resolution → Complete
 */

import { cn } from "@/lib/utils"
import { RMA_WORKFLOW_STEPS, getRMAStepIndex, type RMAStatus } from "@/types/rma-types"

interface RMAWorkflowProgressProps {
  /** Current RMA status */
  status: RMAStatus
}

export function RMAWorkflowProgress({ status }: RMAWorkflowProgressProps) {
  const currentStepIndex = getRMAStepIndex(status)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Workflow Progress
      </p>

      {/* Progress Bar */}
      <div className="flex items-center gap-0.5">
        {RMA_WORKFLOW_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index <= currentStepIndex ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {RMA_WORKFLOW_STEPS.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              index === currentStepIndex && "text-primary font-medium"
            )}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}
