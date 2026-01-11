"use client";

/**
 * WorkflowProgress
 *
 * Visual progress bar showing the revision workflow steps.
 * Highlights the current step and shows completed steps.
 *
 * Steps: Draft → Approval → Approved → Sent → Active
 */

import { RevisionStatus, RevisionStatusMeta } from "@/types/enums";
import { cn } from "@/lib/utils";

interface WorkflowProgressProps {
  /** Current revision status */
  status: RevisionStatus;
}

export function WorkflowProgress({ status }: WorkflowProgressProps) {
  const steps = RevisionStatusMeta.workflowSteps;
  const currentStepIndex = RevisionStatusMeta.getStepIndex(status);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Workflow Progress
      </p>

      {/* Progress Bar */}
      <div className="flex items-center gap-0.5">
        {steps.map((step, index) => (
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
        {steps.map((step) => (
          <span key={step.id}>{step.label}</span>
        ))}
      </div>
    </div>
  );
}
