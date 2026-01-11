"use client";

/**
 * WorkflowProgress
 *
 * Visual progress bar showing the current stage in the SO revision workflow.
 * Displays completed, current, and upcoming steps.
 */

import { cn } from "@/lib/utils";
import { SORevisionStatus, SORevisionStatusMeta } from "@/types/enums";

interface WorkflowProgressProps {
  /** Current revision status */
  status: SORevisionStatus;
}

export function WorkflowProgress({ status }: WorkflowProgressProps) {
  const steps = SORevisionStatusMeta.workflowSteps;
  const currentIndex = SORevisionStatusMeta.getStepIndex(status);

  // Handle rejected status - show at draft position
  const displayIndex = status === SORevisionStatus.Rejected ? 0 : currentIndex;

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div
              className={cn(
                "w-3 h-3 rounded-full shrink-0",
                index < displayIndex && "bg-primary",
                index === displayIndex && "bg-primary ring-2 ring-primary/30",
                index > displayIndex && "bg-muted-foreground/30"
              )}
            />

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1",
                  index < displayIndex ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              "text-xs",
              index <= displayIndex
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
