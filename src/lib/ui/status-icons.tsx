/**
 * Universal Status Icons
 *
 * Provides consistent status icon indicators across all domains (PO, SO, lines, etc.).
 * Each domain can map its specific statuses to these universal stages.
 *
 * Visual stages:
 * - Draft: Dashed circle (not yet active)
 * - Planned: Dot-dashed circle (scheduled but not started)
 * - Open: Empty solid circle (active, awaiting action)
 * - Started: Progress at ~10% (just begun)
 * - Partial: Progress at ~50% (in progress)
 * - MostlyComplete: Progress at ~75% (nearing completion)
 * - Complete: Progress at 100% (finished)
 * - OnHold: Pause icon (paused/waiting)
 * - Cancelled: X icon (terminated)
 * - Backordered: Clock icon (delayed/waiting for supply)
 */

import React, { type ReactNode } from "react";
import {
  CircleDashed,
  CircleDotDashed,
  Circle,
  CircleX,
  CirclePause,
  Clock,
} from "lucide-react";
import { StatusIcon } from "@/components/icons/status-icon";

// ============================================================================
// Status Stage Types
// ============================================================================

/**
 * Universal status stages representing visual states.
 * Domain-specific statuses should map to one of these stages.
 */
export type StatusStage =
  | "draft"
  | "planned"
  | "open"
  | "started"
  | "partial"
  | "mostlyComplete"
  | "nearComplete"
  | "complete"
  | "onHold"
  | "cancelled"
  | "backordered";

/**
 * Progress percentages for each stage.
 * Used by StatusIcon to render the pie fill.
 */
export const STATUS_STAGE_PERCENT: Record<StatusStage, number | null> = {
  draft: null,
  planned: null,
  open: null,
  started: 10,
  partial: 50,
  mostlyComplete: 75,
  nearComplete: 90,
  complete: 100,
  onHold: null,
  cancelled: null,
  backordered: null,
};

// ============================================================================
// Icon Configuration
// ============================================================================

interface StatusIconConfig {
  /** The icon component or element */
  icon: ReactNode;
  /** Optional additional CSS class */
  className?: string;
  /** Description for accessibility */
  description: string;
}

const DEFAULT_ICON_CLASS = "h-4 w-4";

/**
 * Get the icon configuration for a status stage.
 */
function getStageIconConfig(stage: StatusStage, className = DEFAULT_ICON_CLASS): StatusIconConfig {
  switch (stage) {
    case "draft":
      return {
        icon: React.createElement(CircleDashed, { className }),
        description: "Draft - not yet active",
      };
    case "planned":
      return {
        icon: React.createElement(CircleDotDashed, { className }),
        description: "Planned - scheduled but not started",
      };
    case "open":
      return {
        icon: React.createElement(Circle, { className }),
        description: "Open - awaiting action",
      };
    case "started":
      return {
        icon: React.createElement(StatusIcon, { percent: 10, className }),
        description: "Started - just begun",
      };
    case "partial":
      return {
        icon: React.createElement(StatusIcon, { percent: 50, className }),
        description: "Partial - in progress",
      };
    case "mostlyComplete":
      return {
        icon: React.createElement(StatusIcon, { percent: 75, className }),
        description: "Mostly complete - nearing completion",
      };
    case "nearComplete":
      return {
        icon: React.createElement(StatusIcon, { percent: 90, className }),
        description: "Near complete - almost finished",
      };
    case "complete":
      return {
        icon: React.createElement(StatusIcon, { percent: 100, className }),
        description: "Complete - finished",
      };
    case "onHold":
      return {
        icon: React.createElement(CirclePause, { className: `${className} text-muted-foreground` }),
        description: "On hold - paused",
      };
    case "cancelled":
      return {
        icon: React.createElement(CircleX, { className }),
        description: "Cancelled - terminated",
      };
    case "backordered":
      return {
        icon: React.createElement(Clock, { className: `${className} text-amber-500` }),
        description: "Backordered - awaiting supply",
      };
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the icon ReactNode for a status stage.
 *
 * @param stage - The universal status stage
 * @param className - Optional CSS class override (default: "h-4 w-4")
 * @returns The icon as a ReactNode
 *
 * @example
 * const icon = getStatusIcon("partial"); // Returns 50% progress icon
 * const largeIcon = getStatusIcon("complete", "h-6 w-6");
 */
export function getStatusIcon(stage: StatusStage, className?: string): ReactNode {
  return getStageIconConfig(stage, className).icon;
}

/**
 * Get the progress percentage for a status stage.
 * Returns null for stages that don't use progress (draft, open, onHold, etc.).
 *
 * @param stage - The universal status stage
 * @returns The percentage (0-100) or null
 */
export function getStatusPercent(stage: StatusStage): number | null {
  return STATUS_STAGE_PERCENT[stage];
}

/**
 * Get the accessibility description for a status stage.
 *
 * @param stage - The universal status stage
 * @returns Human-readable description
 */
export function getStatusDescription(stage: StatusStage): string {
  return getStageIconConfig(stage).description;
}

/**
 * Create a status icon with custom progress percentage.
 * Use this when you need a specific percentage not covered by standard stages.
 *
 * @param percent - Progress percentage (0-100)
 * @param className - Optional CSS class (default: "h-4 w-4")
 * @returns StatusIcon element
 *
 * @example
 * const icon = createProgressIcon(25); // 25% filled
 */
export function createProgressIcon(percent: number, className = DEFAULT_ICON_CLASS): ReactNode {
  return React.createElement(StatusIcon, { percent, className });
}

// ============================================================================
// Stage Mapping Helpers
// ============================================================================

/**
 * Configuration for mapping domain statuses to universal stages.
 */
export interface StatusStageMapping<E extends string> {
  /** Map from domain status value to universal stage */
  stageMap: Record<E, StatusStage>;
  /** Get the icon for a domain status */
  icon: (status: E, className?: string) => ReactNode;
  /** Get the stage for a domain status */
  stage: (status: E) => StatusStage;
  /** Get the progress percent for a domain status (null if not a progress stage) */
  percent: (status: E) => number | null;
}

/**
 * Create a mapping from domain-specific statuses to universal stages.
 * This ensures consistent icons across your application.
 *
 * @param stageMap - Record mapping each domain status to a universal stage
 * @returns Helper functions for getting icons and stages
 *
 * @example
 * const poLineMapping = createStatusStageMapping({
 *   [LineItemStatus.Draft]: "draft",
 *   [LineItemStatus.Issued]: "started",
 *   [LineItemStatus.Open]: "open",
 *   [LineItemStatus.PartiallyReceived]: "partial",
 *   [LineItemStatus.Received]: "mostlyComplete",
 *   [LineItemStatus.Closed]: "complete",
 *   [LineItemStatus.OnHold]: "onHold",
 *   [LineItemStatus.Canceled]: "cancelled",
 * });
 *
 * const icon = poLineMapping.icon(LineItemStatus.PartiallyReceived);
 */
export function createStatusStageMapping<E extends string>(
  stageMap: Record<E, StatusStage>
): StatusStageMapping<E> {
  return {
    stageMap,
    icon: (status: E, className?: string) => getStatusIcon(stageMap[status], className),
    stage: (status: E) => stageMap[status],
    percent: (status: E) => getStatusPercent(stageMap[status]),
  };
}

// ============================================================================
// Pre-built Stage Mappings (for reference/use)
// ============================================================================

/**
 * Common status stage patterns for quick reference.
 *
 * Document lifecycle: draft → planned → open → started → partial → mostlyComplete → nearComplete → complete
 * With exceptions: onHold (pause), cancelled (terminate), backordered (waiting)
 */
export const COMMON_STAGE_PATTERNS = {
  /** Draft → Work In Progress → Complete flow */
  simple: ["draft", "started", "partial", "complete"] as const,

  /** Full lifecycle with planning phase */
  fullLifecycle: [
    "draft",
    "planned",
    "open",
    "started",
    "partial",
    "mostlyComplete",
    "nearComplete",
    "complete",
  ] as const,

  /** Order/shipment tracking */
  fulfillment: ["open", "started", "partial", "mostlyComplete", "nearComplete", "complete"] as const,

  /** Terminal/exception stages */
  exceptions: ["onHold", "cancelled", "backordered"] as const,
} as const;
