/**
 * Service Line Status Enum
 *
 * Tracks the completion status of service-type line items.
 * Service lines use this instead of receiving status.
 */

export enum ServiceLineStatus {
  /** Service work has not started */
  NotStarted = "NOT_STARTED",

  /** Service work is actively in progress */
  InProgress = "IN_PROGRESS",

  /** Service work is temporarily paused */
  OnHold = "ON_HOLD",

  /** Service completed, awaiting approval */
  PendingApproval = "PENDING_APPROVAL",

  /** Service has been approved/accepted */
  Approved = "APPROVED",

  /** Service fully completed */
  Completed = "COMPLETED",

  /** Service has been cancelled */
  Cancelled = "CANCELLED",
}

/**
 * Metadata for each service line status
 */
export interface ServiceLineStatusMeta {
  label: string;
  description: string;
  className: string;
  iconName: "clock" | "play" | "pause" | "check" | "check-circle" | "circle-check" | "x";
  isActive: boolean;
  isComplete: boolean;
  allowsEdit: boolean;
}

export const ServiceLineStatusMeta = {
  meta: {
    [ServiceLineStatus.NotStarted]: {
      label: "Not Started",
      description: "Service work has not begun",
      className: "bg-muted text-muted-foreground",
      iconName: "clock" as const,
      isActive: false,
      isComplete: false,
      allowsEdit: true,
    },
    [ServiceLineStatus.InProgress]: {
      label: "In Progress",
      description: "Service work is actively being performed",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      iconName: "play" as const,
      isActive: true,
      isComplete: false,
      allowsEdit: true,
    },
    [ServiceLineStatus.OnHold]: {
      label: "On Hold",
      description: "Service work is temporarily paused",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      iconName: "pause" as const,
      isActive: false,
      isComplete: false,
      allowsEdit: true,
    },
    [ServiceLineStatus.PendingApproval]: {
      label: "Pending Approval",
      description: "Service completed, awaiting approval",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      iconName: "check" as const,
      isActive: false,
      isComplete: false,
      allowsEdit: false,
    },
    [ServiceLineStatus.Approved]: {
      label: "Approved",
      description: "Service has been approved/accepted",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      iconName: "check-circle" as const,
      isActive: false,
      isComplete: true,
      allowsEdit: false,
    },
    [ServiceLineStatus.Completed]: {
      label: "Completed",
      description: "Service work is fully complete",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      iconName: "circle-check" as const,
      isActive: false,
      isComplete: true,
      allowsEdit: false,
    },
    [ServiceLineStatus.Cancelled]: {
      label: "Cancelled",
      description: "Service has been cancelled",
      className: "bg-muted text-muted-foreground line-through",
      iconName: "x" as const,
      isActive: false,
      isComplete: true,
      allowsEdit: false,
    },
  } as Record<ServiceLineStatus, ServiceLineStatusMeta>,

  /**
   * Get statuses that indicate work is ongoing
   */
  getActiveStatuses(): ServiceLineStatus[] {
    return Object.entries(this.meta)
      .filter(([_, meta]) => meta.isActive)
      .map(([status]) => status as ServiceLineStatus);
  },

  /**
   * Get statuses that indicate completion
   */
  getCompleteStatuses(): ServiceLineStatus[] {
    return Object.entries(this.meta)
      .filter(([_, meta]) => meta.isComplete)
      .map(([status]) => status as ServiceLineStatus);
  },

  /**
   * Get valid next statuses for a given status
   */
  getValidTransitions(currentStatus: ServiceLineStatus): ServiceLineStatus[] {
    const transitions: Record<ServiceLineStatus, ServiceLineStatus[]> = {
      [ServiceLineStatus.NotStarted]: [
        ServiceLineStatus.InProgress,
        ServiceLineStatus.Cancelled,
      ],
      [ServiceLineStatus.InProgress]: [
        ServiceLineStatus.OnHold,
        ServiceLineStatus.PendingApproval,
        ServiceLineStatus.Completed,
        ServiceLineStatus.Cancelled,
      ],
      [ServiceLineStatus.OnHold]: [
        ServiceLineStatus.InProgress,
        ServiceLineStatus.Cancelled,
      ],
      [ServiceLineStatus.PendingApproval]: [
        ServiceLineStatus.Approved,
        ServiceLineStatus.InProgress, // Rejected, needs rework
      ],
      [ServiceLineStatus.Approved]: [ServiceLineStatus.Completed],
      [ServiceLineStatus.Completed]: [],
      [ServiceLineStatus.Cancelled]: [],
    };
    return transitions[currentStatus] || [];
  },
};
