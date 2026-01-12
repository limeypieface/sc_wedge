/**
 * StatusPill Component
 *
 * A generic, configuration-driven status indicator component.
 * Supports any status enum through TypeScript generics.
 *
 * Design principles:
 * - Fully configuration-driven (no hardcoded PO/SO logic)
 * - Type-safe with TypeScript generics
 * - Consistent visual language across the application
 * - Supports optional icons
 *
 * @example
 * // Define your status config
 * const PO_LINE_STATUS_CONFIG = {
 *   pending: { label: "Pending", color: "gray" },
 *   received: { label: "Received", color: "green" },
 * } satisfies StatusPillConfig<"pending" | "received">;
 *
 * // Use the component
 * <StatusPill status="pending" config={PO_LINE_STATUS_CONFIG} />
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Semantic color names for status pills.
 * Maps to consistent visual styles across the application.
 */
export type StatusPillColor =
  | "green"   // Success, completed, approved
  | "amber"   // Warning, pending action
  | "red"     // Error, rejected, danger
  | "blue"    // Info, in-progress, active
  | "gray";   // Default, neutral, draft

/**
 * Size variants for the status pill.
 */
export type StatusPillSize = "sm" | "md";

/**
 * Configuration for a single status value.
 */
export interface StatusItemConfig {
  /** Human-readable label */
  readonly label: string;
  /** Semantic color for the pill */
  readonly color: StatusPillColor;
  /** Optional icon (LucideIcon) */
  readonly icon?: LucideIcon;
  /** Optional description for tooltips */
  readonly description?: string;
}

/**
 * Complete configuration object mapping status values to their display config.
 * Use `satisfies` to ensure type safety.
 *
 * @typeParam T - Union of status string values
 */
export type StatusPillConfig<T extends string> = Record<T, StatusItemConfig>;

/**
 * Props for the StatusPill component.
 *
 * @typeParam T - Union of status string values
 */
export interface StatusPillProps<T extends string> {
  /** Current status value */
  readonly status: T;
  /** Configuration mapping statuses to display properties */
  readonly config: StatusPillConfig<T>;
  /** Size variant */
  readonly size?: StatusPillSize;
  /** Whether to show the label text */
  readonly showLabel?: boolean;
  /** Additional CSS classes */
  readonly className?: string;
}

// =============================================================================
// STYLES
// =============================================================================

/**
 * Color style mappings using Tailwind classes.
 * Each color has background, text, and border styles.
 */
const COLOR_STYLES: Record<StatusPillColor, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-red-100 text-red-800 border-red-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
};

/**
 * Size-specific styles.
 */
const SIZE_STYLES: Record<StatusPillSize, { container: string; icon: string; text: string }> = {
  sm: {
    container: "px-2 py-0.5 text-xs",
    icon: "h-3 w-3",
    text: "text-xs",
  },
  md: {
    container: "px-2.5 py-1 text-sm",
    icon: "h-4 w-4",
    text: "text-sm",
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * StatusPill - A generic status indicator component.
 *
 * Renders a pill/badge showing the current status with appropriate
 * color coding and optional icon. All display configuration is passed
 * via props, making this component fully reusable across different
 * status types (PO status, SO status, line status, etc.).
 */
export function StatusPill<T extends string>({
  status,
  config,
  size = "sm",
  showLabel = true,
  className,
}: StatusPillProps<T>): React.ReactElement {
  const statusConfig = config[status];

  if (!statusConfig) {
    // Fallback for unknown status
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap",
          SIZE_STYLES[size].container,
          COLOR_STYLES.gray,
          className
        )}
      >
        {showLabel && <span>{status}</span>}
      </span>
    );
  }

  const { label, color, icon: Icon } = statusConfig;
  const sizeStyle = SIZE_STYLES[size];
  const colorStyle = COLOR_STYLES[color];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        sizeStyle.container,
        colorStyle,
        className
      )}
      title={statusConfig.description}
    >
      {Icon && <Icon className={cn(sizeStyle.icon, "flex-shrink-0")} />}
      {showLabel && <span className={sizeStyle.text}>{label}</span>}
    </span>
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Helper to create a status pill config with type inference.
 *
 * @example
 * const config = createStatusPillConfig({
 *   draft: { label: "Draft", color: "gray" },
 *   approved: { label: "Approved", color: "green" },
 * });
 */
export function createStatusPillConfig<T extends string>(
  config: StatusPillConfig<T>
): StatusPillConfig<T> {
  return config;
}

/**
 * Maps a semantic color name to its corresponding Tailwind classes.
 * Useful when you need to apply status colors to other elements.
 */
export function getStatusColorClasses(color: StatusPillColor): string {
  return COLOR_STYLES[color];
}

/**
 * Maps a semantic color to border classes for panels/cards.
 * Matches the pattern used in revision-status-panel.
 */
export function getStatusBorderClass(color: StatusPillColor): string {
  const borderMap: Record<StatusPillColor, string> = {
    green: "border-l-green-500",
    amber: "border-l-amber-500",
    red: "border-l-red-500",
    blue: "border-l-blue-500",
    gray: "border-l-gray-400",
  };
  return borderMap[color];
}
