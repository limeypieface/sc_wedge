"use client";

/**
 * CostDeltaIndicator
 *
 * Displays the cost change between the active and draft revisions.
 * Shows whether the change exceeds approval thresholds.
 *
 * ## Visual States
 * - Within threshold: Primary color, "Within threshold" message
 * - Exceeds threshold: Destructive color, "Approval required" message
 */

import type { CostDeltaInfo } from "../../_lib/types";
import { cn } from "@/lib/utils";

interface CostDeltaIndicatorProps {
  /** Cost delta information */
  costDeltaInfo: CostDeltaInfo;
}

/**
 * Format a number as currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format a decimal as percentage
 */
function formatPercent(decimal: number): string {
  const percent = decimal * 100;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export function CostDeltaIndicator({ costDeltaInfo }: CostDeltaIndicatorProps) {
  const { delta, percentChange, exceedsThreshold } = costDeltaInfo;

  return (
    <div
      className={cn(
        "p-3 border rounded-md",
        exceedsThreshold
          ? "bg-destructive/5 border-destructive/20"
          : "bg-primary/5 border-primary/20"
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium",
            exceedsThreshold ? "text-destructive" : "text-primary"
          )}
        >
          Cost Change
        </span>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            exceedsThreshold ? "text-destructive" : "text-primary"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {formatCurrency(delta)} ({formatPercent(percentChange)})
        </span>
      </div>

      {/* Status Message */}
      <p
        className={cn(
          "text-xs mt-1",
          exceedsThreshold ? "text-destructive/80" : "text-primary/80"
        )}
      >
        {exceedsThreshold
          ? "Exceeds threshold — approval required"
          : "Within threshold — no approval needed"}
      </p>
    </div>
  );
}
