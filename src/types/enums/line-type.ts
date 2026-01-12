/**
 * Line Type Enum
 *
 * Distinguishes between physical goods (items) and service-based line items.
 * Service lines do not go through receiving workflow but use completion tracking.
 */

export enum LineType {
  /** Physical goods - default type */
  Item = "ITEM",

  /** Service-based work (consulting, maintenance, etc.) */
  Service = "SERVICE",

  /** Non-Recurring Engineering */
  NRE = "NRE",
}

/**
 * Metadata for each line type
 */
export interface LineTypeMeta {
  label: string;
  description: string;
  className: string;
  iconName: "package" | "briefcase" | "wrench";
  requiresReceiving: boolean;
  supportsProgress: boolean;
}

export const LineTypeMeta = {
  meta: {
    [LineType.Item]: {
      label: "Item",
      description: "Physical goods requiring receiving",
      className: "bg-muted text-muted-foreground",
      iconName: "package" as const,
      requiresReceiving: true,
      supportsProgress: false,
    },
    [LineType.Service]: {
      label: "Service",
      description: "Service-based work tracked by completion",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      iconName: "briefcase" as const,
      requiresReceiving: false,
      supportsProgress: true,
    },
    [LineType.NRE]: {
      label: "NRE",
      description: "Non-recurring engineering work",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      iconName: "wrench" as const,
      requiresReceiving: false,
      supportsProgress: true,
    },
  } as Record<LineType, LineTypeMeta>,

  /**
   * Check if a line type requires physical receiving
   */
  requiresReceiving(type: LineType): boolean {
    return this.meta[type]?.requiresReceiving ?? true;
  },

  /**
   * Check if a line type supports progress tracking
   */
  supportsProgress(type: LineType): boolean {
    return this.meta[type]?.supportsProgress ?? false;
  },

  /**
   * Get all service-type line types
   */
  getServiceTypes(): LineType[] {
    return [LineType.Service, LineType.NRE];
  },
};

/**
 * Service Billing Type Enum
 *
 * Defines how service lines are billed and tracked.
 */
export enum ServiceBillingType {
  /** Fixed price - single agreed amount */
  FixedPrice = "FIXED_PRICE",

  /** Time & Materials - billed by consumed hours/units */
  TimeAndMaterials = "T_AND_M",

  /** Milestone - billed upon milestone completion */
  Milestone = "MILESTONE",
}

/**
 * Metadata for each billing type
 */
export interface ServiceBillingTypeMeta {
  label: string;
  shortLabel: string;
  description: string;
  className: string;
  supportsRate: boolean;
  supportsMilestones: boolean;
  supportsNTE: boolean;
}

export const ServiceBillingTypeMeta = {
  meta: {
    [ServiceBillingType.FixedPrice]: {
      label: "Fixed Price",
      shortLabel: "Fixed",
      description: "Single agreed-upon amount for the complete service",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      supportsRate: false,
      supportsMilestones: false,
      supportsNTE: false,
    },
    [ServiceBillingType.TimeAndMaterials]: {
      label: "Time & Materials",
      shortLabel: "T&M",
      description: "Billed based on hours/units consumed at an hourly rate",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      supportsRate: true,
      supportsMilestones: false,
      supportsNTE: true,
    },
    [ServiceBillingType.Milestone]: {
      label: "Milestone",
      shortLabel: "Milestone",
      description: "Payment upon completion of defined milestones",
      className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      supportsRate: false,
      supportsMilestones: true,
      supportsNTE: false,
    },
  } as Record<ServiceBillingType, ServiceBillingTypeMeta>,

  /**
   * Check if billing type supports rate-based billing
   */
  supportsRate(type: ServiceBillingType): boolean {
    return this.meta[type]?.supportsRate ?? false;
  },

  /**
   * Check if billing type supports milestones
   */
  supportsMilestones(type: ServiceBillingType): boolean {
    return this.meta[type]?.supportsMilestones ?? false;
  },
};

/**
 * Default service categories - can be extended by user configuration
 */
export const DEFAULT_SERVICE_CATEGORIES = [
  "NRE",
  "Consulting",
  "Maintenance",
  "Installation",
  "Training",
  "Testing",
  "Tooling",
  "Engineering",
  "Support",
] as const;

export type ServiceCategory = (typeof DEFAULT_SERVICE_CATEGORIES)[number] | string;
