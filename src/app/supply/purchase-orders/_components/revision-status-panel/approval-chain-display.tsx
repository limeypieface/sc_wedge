"use client";

/**
 * ApprovalChainDisplay
 *
 * Shows the approval chain progress with each approver's status.
 * Indicates which step is current and highlights if it's the user's turn.
 *
 * ## Visual States for Each Step
 * - Approved: Green check, filled background
 * - Rejected: Red X, filled background
 * - Pending (current): Border highlight, level number
 * - Pending (future): Muted, level number
 */

import { Check, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApprovalChain, ApprovalStep } from "../../_lib/types";

interface ApprovalChainDisplayProps {
  /** The approval chain to display */
  chain: ApprovalChain;

  /** Current user's ID (to highlight their turn) */
  currentUserId: string;
}

export function ApprovalChainDisplay({
  chain,
  currentUserId,
}: ApprovalChainDisplayProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        Approval Chain
      </p>

      <div className="space-y-2">
        {chain.steps.map((step) => (
          <ApprovalStepRow
            key={step.id}
            step={step}
            isCurrent={step.level === chain.currentLevel}
            isCurrentUser={step.approver.id === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ApprovalStepRowProps {
  step: ApprovalStep;
  isCurrent: boolean;
  isCurrentUser: boolean;
}

function ApprovalStepRow({
  step,
  isCurrent,
  isCurrentUser,
}: ApprovalStepRowProps) {
  const { status, approver, notes, actionDate } = step;

  return (
    <div
      className={cn(
        "p-2 rounded-md",
        status === "approved" && "bg-primary/5",
        status === "rejected" && "bg-destructive/5",
        status === "pending" && isCurrent && "bg-muted border border-border"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <StepStatusIcon step={step} />

        {/* Approver Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{approver.name}</p>
          <p className="text-xs text-muted-foreground">{approver.role}</p>
        </div>

        {/* Status Badge / Date */}
        <div className="text-right">
          {status === "approved" && (
            <p className="text-xs text-primary">{actionDate}</p>
          )}
          {status === "rejected" && (
            <p className="text-xs text-destructive">{actionDate}</p>
          )}
          {status === "pending" && isCurrent && (
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/20"
            >
              {isCurrentUser ? "Your Turn" : "Awaiting"}
            </Badge>
          )}
        </div>
      </div>

      {/* Approval Notes */}
      {notes && status !== "pending" && (
        <div className="mt-2 pl-9">
          <p className="text-xs text-muted-foreground italic">"{notes}"</p>
        </div>
      )}
    </div>
  );
}

interface StepStatusIconProps {
  step: ApprovalStep;
}

function StepStatusIcon({ step }: StepStatusIconProps) {
  const { status, level } = step;

  const baseClasses =
    "flex items-center justify-center w-6 h-6 rounded-full shrink-0";

  if (status === "approved") {
    return (
      <div className={cn(baseClasses, "bg-primary text-primary-foreground")}>
        <Check className="h-3.5 w-3.5" />
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        className={cn(baseClasses, "bg-destructive text-destructive-foreground")}
      >
        <XCircle className="h-3.5 w-3.5" />
      </div>
    );
  }

  // Pending
  return (
    <div
      className={cn(baseClasses, "bg-muted-foreground/20 text-muted-foreground")}
    >
      <span className="text-xs font-medium">{level}</span>
    </div>
  );
}
