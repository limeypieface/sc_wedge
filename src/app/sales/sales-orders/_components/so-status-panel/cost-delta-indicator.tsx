"use client";

/**
 * CostDeltaIndicator
 *
 * Displays the cost change between the active and draft revisions.
 * Shows both absolute and percentage changes with appropriate styling.
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CostDeltaInfo } from "@/types/approval-types";

interface CostDeltaIndicatorProps {
  costDeltaInfo: CostDeltaInfo;
}

export function CostDeltaIndicator({ costDeltaInfo }: CostDeltaIndicatorProps) {
  const { delta, percentChange, exceedsThreshold } = costDeltaInfo;

  const isIncrease = delta > 0;
  const isDecrease = delta < 0;
  const isUnchanged = delta === 0;

  const Icon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));

  const formatPercent = (percent: number) =>
    `${(Math.abs(percent) * 100).toFixed(1)}%`;

  return (
    <div
      className={cn(
        "p-3 rounded-md",
        isIncrease && "bg-green-50 border border-green-200",
        isDecrease && "bg-amber-50 border border-amber-200",
        isUnchanged && "bg-muted/50 border border-border"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4",
            isIncrease && "text-green-600",
            isDecrease && "text-amber-600",
            isUnchanged && "text-muted-foreground"
          )}
        />

        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Order Value Change
          </p>
          <p
            className={cn(
              "text-sm font-semibold",
              isIncrease && "text-green-700",
              isDecrease && "text-amber-700",
              isUnchanged && "text-muted-foreground"
            )}
          >
            {isIncrease && "+"}
            {isDecrease && "-"}
            {formatCurrency(delta)} ({isIncrease && "+"}
            {isDecrease && "-"}
            {formatPercent(percentChange)})
          </p>
        </div>

        {exceedsThreshold && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
            Requires Approval
          </span>
        )}
      </div>
    </div>
  );
}
