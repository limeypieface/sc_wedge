/**
 * Purchase Order Type Enum
 *
 * Distinguishes between standard POs, blanket (contract) POs, and releases.
 */

export enum POType {
  /** Standard one-time purchase order */
  Standard = "STANDARD",

  /** Blanket/contract PO with authorized spend limit */
  Blanket = "BLANKET",

  /** Release against a blanket PO */
  Release = "RELEASE",
}

/**
 * Metadata for each PO type
 */
export interface POTypeMeta {
  label: string;
  description: string;
  className: string;
  iconName: "file-text" | "layers" | "file-output";
  hasReleases: boolean;
  hasParent: boolean;
  supportsExpiration: boolean;
}

export const POTypeMeta = {
  meta: {
    [POType.Standard]: {
      label: "Standard PO",
      description: "One-time purchase order for specific goods/services",
      className: "bg-muted text-muted-foreground",
      iconName: "file-text" as const,
      hasReleases: false,
      hasParent: false,
      supportsExpiration: false,
    },
    [POType.Blanket]: {
      label: "Blanket PO",
      description: "Contract PO with authorized spend limit and multiple releases",
      className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      iconName: "layers" as const,
      hasReleases: true,
      hasParent: false,
      supportsExpiration: true,
    },
    [POType.Release]: {
      label: "Release",
      description: "Release order against a blanket PO",
      className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
      iconName: "file-output" as const,
      hasReleases: false,
      hasParent: true,
      supportsExpiration: false,
    },
  } as Record<POType, POTypeMeta>,

  /**
   * Check if PO type can have releases
   */
  canHaveReleases(type: POType): boolean {
    return this.meta[type]?.hasReleases ?? false;
  },

  /**
   * Check if PO type has a parent (is a release)
   */
  hasParentPO(type: POType): boolean {
    return this.meta[type]?.hasParent ?? false;
  },

  /**
   * Get the display prefix for PO numbers
   */
  getNumberPrefix(type: POType): string {
    switch (type) {
      case POType.Blanket:
        return "BPO";
      case POType.Release:
        return "REL";
      default:
        return "PO";
    }
  },
};
