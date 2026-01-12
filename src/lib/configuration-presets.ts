/**
 * Configuration Presets
 *
 * High-level presets that map user choices to detailed configuration.
 * Used by the onboarding wizard to set sensible defaults quickly.
 */

import {
  PurchasingConfiguration,
  ApprovalConfiguration,
  QualityConfiguration,
  ReceivingConfiguration,
  GovernmentConfiguration,
  VendorConfiguration,
  NotificationConfiguration,
  ComplexityTier,
  OrganizationType,
  ManufacturingType,
  InspectionLevel,
  GovernmentContractType,
  DiscoveryContext,
} from "@/types/configuration.types";

// ============================================================================
// PRESET TYPES
// ============================================================================

/** Approval complexity levels */
export type ApprovalPreset = "none" | "simple" | "tiered" | "advanced";

/** Receiving strictness levels */
export type ReceivingPreset = "flexible" | "standard" | "strict";

/** Invoice matching levels */
export type InvoiceMatchPreset = "two-way" | "three-way" | "three-way-strict";

/** Quality process levels */
export type QualityPreset = "none" | "basic" | "full";

/** Vendor management levels */
export type VendorPreset = "open" | "preferred" | "approved-only";

/** Complete preset selection from wizard */
export interface ConfigurationPresetSelection {
  approval: ApprovalPreset;
  receiving: ReceivingPreset;
  invoiceMatch: InvoiceMatchPreset;
  quality: QualityPreset;
  vendor: VendorPreset;
  isGovernment: boolean;
  manufacturingType: ManufacturingType;
}

// ============================================================================
// PRESET DESCRIPTIONS (for UI)
// ============================================================================

export const APPROVAL_PRESETS: Record<ApprovalPreset, { label: string; description: string; details: string[] }> = {
  none: {
    label: "No Approval Required",
    description: "Anyone can create and send POs",
    details: ["All purchases auto-approved", "Best for small teams with high trust"],
  },
  simple: {
    label: "Simple Approval",
    description: "One approver for all purchases",
    details: ["Manager approves all POs", "Auto-approve under $500", "Quick and straightforward"],
  },
  tiered: {
    label: "Tiered by Amount",
    description: "Different approvers based on value",
    details: ["Under $500: Auto-approved", "$500-$5K: Manager", "$5K+: Manager + Finance"],
  },
  advanced: {
    label: "Role-Based Routing",
    description: "Complex approval chains with escalation",
    details: ["Multi-level approval chains", "Escalation timeouts", "Delegation support"],
  },
};

export const RECEIVING_PRESETS: Record<ReceivingPreset, { label: string; description: string; details: string[] }> = {
  flexible: {
    label: "Flexible",
    description: "Trust suppliers, minimal checks",
    details: ["±10% quantity variance OK", "Over-receiving allowed", "No packing slip required"],
  },
  standard: {
    label: "Standard",
    description: "Balanced controls",
    details: ["±5% quantity variance", "Packing slip required", "Auto-close when complete"],
  },
  strict: {
    label: "Strict",
    description: "Tight controls, exact quantities",
    details: ["Exact quantities required", "No over-receiving", "Full documentation required"],
  },
};

export const INVOICE_MATCH_PRESETS: Record<InvoiceMatchPreset, { label: string; description: string; details: string[] }> = {
  "two-way": {
    label: "Two-Way Match",
    description: "Match PO to Invoice",
    details: ["Verify invoice matches PO", "Faster processing", "Trust that goods received"],
  },
  "three-way": {
    label: "Three-Way Match",
    description: "Match PO, Receipt, and Invoice",
    details: ["Invoice must match receipt", "2% price tolerance", "Standard for manufacturing"],
  },
  "three-way-strict": {
    label: "Three-Way Strict",
    description: "Exact matching required",
    details: ["Zero tolerance on quantity", "Minimal price variance", "Required for government"],
  },
};

export const QUALITY_PRESETS: Record<QualityPreset, { label: string; description: string; details: string[] }> = {
  none: {
    label: "No Quality Tracking",
    description: "Direct to stock, no inspection",
    details: ["Items go directly to inventory", "No NCR tracking", "Simplest workflow"],
  },
  basic: {
    label: "Basic Quality",
    description: "NCR tracking, optional inspection",
    details: ["NCR creation for issues", "Quality holds available", "Inspection per item category"],
  },
  full: {
    label: "Full Quality Management",
    description: "Complete quality workflow",
    details: ["Mandatory disposition on NCR", "Supplier notifications", "Hold until released"],
  },
};

export const VENDOR_PRESETS: Record<VendorPreset, { label: string; description: string; details: string[] }> = {
  open: {
    label: "Open Sourcing",
    description: "Buy from any vendor",
    details: ["No vendor restrictions", "Basic vendor records", "Flexible sourcing"],
  },
  preferred: {
    label: "Preferred Vendors",
    description: "Track preferred suppliers",
    details: ["Flag preferred vendors", "Performance tracking", "Suggestions, not requirements"],
  },
  "approved-only": {
    label: "Approved Vendors Only",
    description: "Restrict to qualified suppliers",
    details: ["Must be on approved list", "Qualification required", "Scorecard tracking"],
  },
};

// ============================================================================
// PRESET GENERATORS
// ============================================================================

function generateApprovalConfig(preset: ApprovalPreset): ApprovalConfiguration {
  const base: ApprovalConfiguration = {
    enabled: preset !== "none",
    thresholds: [],
    autoApproveLimit: 0,
    requireApprovalForChanges: true,
    changeApprovalThreshold: 10,
    allowSelfApproval: false,
    escalationTimeoutHours: null,
    notifications: {
      onSubmit: true,
      onApprove: true,
      onReject: true,
      onEscalate: false,
    },
  };

  switch (preset) {
    case "none":
      return { ...base, enabled: false };

    case "simple":
      return {
        ...base,
        autoApproveLimit: 500,
        thresholds: [
          {
            id: "tier-1",
            minAmount: 500,
            maxAmount: null,
            approvers: [{ id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true }],
            approvalMode: "any",
          },
        ],
      };

    case "tiered":
      return {
        ...base,
        autoApproveLimit: 500,
        thresholds: [
          {
            id: "tier-1",
            minAmount: 500,
            maxAmount: 5000,
            approvers: [{ id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true }],
            approvalMode: "any",
          },
          {
            id: "tier-2",
            minAmount: 5000,
            maxAmount: null,
            approvers: [
              { id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true },
              { id: "fin", type: "role", value: "finance", displayName: "Finance", canDelegate: false },
            ],
            approvalMode: "sequential",
          },
        ],
      };

    case "advanced":
      return {
        ...base,
        autoApproveLimit: 0,
        escalationTimeoutHours: 48,
        notifications: { ...base.notifications, onEscalate: true },
        thresholds: [
          {
            id: "tier-1",
            minAmount: 0,
            maxAmount: 5000,
            approvers: [{ id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true }],
            approvalMode: "any",
          },
          {
            id: "tier-2",
            minAmount: 5000,
            maxAmount: 25000,
            approvers: [
              { id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true },
              { id: "fin", type: "role", value: "finance", displayName: "Finance", canDelegate: false },
            ],
            approvalMode: "sequential",
          },
          {
            id: "tier-3",
            minAmount: 25000,
            maxAmount: null,
            approvers: [
              { id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true },
              { id: "fin", type: "role", value: "finance", displayName: "Finance", canDelegate: false },
              { id: "exec", type: "role", value: "executive", displayName: "Executive", canDelegate: false },
            ],
            approvalMode: "sequential",
          },
        ],
      };
  }
}

function generateReceivingConfig(preset: ReceivingPreset): ReceivingConfiguration {
  switch (preset) {
    case "flexible":
      return {
        threeWayMatchEnabled: false,
        quantityTolerance: 10,
        priceTolerance: 5,
        allowOverReceive: true,
        maxOverReceivePercent: 20,
        lotTrackingEnabled: false,
        serialTrackingEnabled: false,
        requirePackingSlip: false,
        autoCloseOnFullReceipt: true,
      };

    case "standard":
      return {
        threeWayMatchEnabled: true,
        quantityTolerance: 5,
        priceTolerance: 2,
        allowOverReceive: true,
        maxOverReceivePercent: 10,
        lotTrackingEnabled: false,
        serialTrackingEnabled: false,
        requirePackingSlip: true,
        autoCloseOnFullReceipt: true,
      };

    case "strict":
      return {
        threeWayMatchEnabled: true,
        quantityTolerance: 0,
        priceTolerance: 0,
        allowOverReceive: false,
        maxOverReceivePercent: 0,
        lotTrackingEnabled: true,
        serialTrackingEnabled: false,
        requirePackingSlip: true,
        autoCloseOnFullReceipt: false,
      };
  }
}

function generateQualityConfig(preset: QualityPreset): QualityConfiguration {
  switch (preset) {
    case "none":
      return {
        enabled: false,
        defaultInspectionLevel: InspectionLevel.None,
        categoryOverrides: [],
        requireCOC: false,
        requireMTR: false,
        ncr: {
          enabled: false,
          autoCreateOnFailure: false,
          requireDisposition: false,
          notifySupplier: false,
        },
        qualityHold: {
          enabled: false,
          autoHoldOnNCR: false,
          requireApprovalToRelease: false,
        },
      };

    case "basic":
      return {
        enabled: true,
        defaultInspectionLevel: InspectionLevel.None, // Set per item category
        categoryOverrides: [],
        requireCOC: false,
        requireMTR: false,
        ncr: {
          enabled: true,
          autoCreateOnFailure: false,
          requireDisposition: false,
          notifySupplier: false,
        },
        qualityHold: {
          enabled: true,
          autoHoldOnNCR: false,
          requireApprovalToRelease: false,
        },
      };

    case "full":
      return {
        enabled: true,
        defaultInspectionLevel: InspectionLevel.Sample,
        categoryOverrides: [],
        requireCOC: true,
        requireMTR: false,
        ncr: {
          enabled: true,
          autoCreateOnFailure: true,
          requireDisposition: true,
          notifySupplier: true,
        },
        qualityHold: {
          enabled: true,
          autoHoldOnNCR: true,
          requireApprovalToRelease: true,
        },
      };
  }
}

function generateVendorConfig(preset: VendorPreset): VendorConfiguration {
  switch (preset) {
    case "open":
      return {
        requireApprovedVendor: false,
        qualificationEnabled: false,
        scorecardEnabled: false,
        performanceMetrics: {
          onTimeDelivery: true,
          qualityScore: false,
          priceCompetitiveness: false,
          responsiveness: false,
        },
        autoDisqualifyThreshold: null,
        requireInsurance: false,
        requireTaxDocuments: true,
      };

    case "preferred":
      return {
        requireApprovedVendor: false,
        qualificationEnabled: false,
        scorecardEnabled: true,
        performanceMetrics: {
          onTimeDelivery: true,
          qualityScore: true,
          priceCompetitiveness: true,
          responsiveness: false,
        },
        autoDisqualifyThreshold: null,
        requireInsurance: false,
        requireTaxDocuments: true,
      };

    case "approved-only":
      return {
        requireApprovedVendor: true,
        qualificationEnabled: true,
        scorecardEnabled: true,
        performanceMetrics: {
          onTimeDelivery: true,
          qualityScore: true,
          priceCompetitiveness: true,
          responsiveness: true,
        },
        autoDisqualifyThreshold: 60,
        requireInsurance: true,
        requireTaxDocuments: true,
      };
  }
}

function generateGovernmentConfig(isGovernment: boolean): GovernmentConfiguration {
  if (!isGovernment) {
    return {
      enabled: false,
      farCompliance: {
        enabled: false,
        dfarsEnabled: false,
        requiredClauses: [],
        autoIncludeClauses: false,
        costAccountingEnabled: false,
        defaultContractType: GovernmentContractType.FixedPrice,
      },
      itar: {
        enabled: false,
        requireCitizenshipVerification: false,
        domesticSuppliersOnly: false,
        requireECCN: false,
        autoFlagControlledItems: false,
      },
      smallBusiness: {
        enabled: false,
        goalPercentage: 0,
        categories: [],
        autoSuggest: false,
      },
      contractSegregation: false,
      requireContractNumber: false,
    };
  }

  return {
    enabled: true,
    farCompliance: {
      enabled: true,
      dfarsEnabled: true,
      requiredClauses: ["52.204-21", "52.204-25", "252.204-7012"],
      autoIncludeClauses: true,
      costAccountingEnabled: true,
      defaultContractType: GovernmentContractType.CostReimbursement,
    },
    itar: {
      enabled: false,
      requireCitizenshipVerification: false,
      domesticSuppliersOnly: false,
      requireECCN: true,
      autoFlagControlledItems: true,
    },
    smallBusiness: {
      enabled: true,
      goalPercentage: 23,
      categories: [
        { name: "Small Business", code: "SB", goalPercentage: 23 },
        { name: "Small Disadvantaged Business", code: "SDB", goalPercentage: 5 },
        { name: "Women-Owned Small Business", code: "WOSB", goalPercentage: 5 },
        { name: "HUBZone Small Business", code: "HUBZone", goalPercentage: 3 },
        { name: "Service-Disabled Veteran-Owned", code: "SDVOSB", goalPercentage: 3 },
      ],
      autoSuggest: true,
    },
    contractSegregation: true,
    requireContractNumber: true,
  };
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

/**
 * Generate a complete configuration from preset selections
 */
export function generateConfigurationFromPresets(
  selection: ConfigurationPresetSelection
): Omit<PurchasingConfiguration, "id" | "organizationName" | "createdAt" | "updatedAt"> {
  // Determine complexity tier based on selections
  let tier = ComplexityTier.Starter;
  if (selection.approval === "tiered" || selection.receiving === "standard") {
    tier = ComplexityTier.Standard;
  }
  if (selection.approval === "advanced" || selection.quality === "full" || selection.isGovernment) {
    tier = ComplexityTier.Advanced;
  }
  if (selection.isGovernment && selection.quality === "full") {
    tier = ComplexityTier.Enterprise;
  }

  const discovery: DiscoveryContext = {
    manufacturingType: selection.manufacturingType,
    organizationType: selection.isGovernment ? OrganizationType.Government : OrganizationType.Commercial,
    teamSize: selection.approval === "none" ? "solo" : selection.approval === "advanced" ? "large" : "medium",
    hasQualityRequirements: selection.quality !== "none",
    needsLotTracking: selection.receiving === "strict",
    hasApprovalWorkflows: selection.approval !== "none",
    isITARControlled: false,
    hasSmallBusinessGoals: selection.isGovernment,
    recommendedTier: tier,
  };

  return {
    discovery,
    complexityTier: tier,
    organizationType: selection.isGovernment ? OrganizationType.Government : OrganizationType.Commercial,
    manufacturingType: selection.manufacturingType,
    version: 1,
    approval: generateApprovalConfig(selection.approval),
    quality: generateQualityConfig(selection.quality),
    receiving: generateReceivingConfig(selection.receiving),
    government: generateGovernmentConfig(selection.isGovernment),
    vendor: generateVendorConfig(selection.vendor),
    notifications: {
      emailEnabled: true,
      inAppEnabled: true,
      events: {
        poCreated: false,
        poApproved: true,
        poRejected: true,
        shipmentReceived: true,
        invoiceReceived: true,
        qualityIssue: selection.quality !== "none",
        deliveryDelayed: true,
      },
      digestMode: false,
    },
  };
}

/**
 * Detect current presets from an existing configuration
 * (For showing which preset is currently selected in settings)
 */
export function detectPresetsFromConfiguration(config: PurchasingConfiguration): ConfigurationPresetSelection {
  // Detect approval preset
  let approval: ApprovalPreset = "none";
  if (config.approval.enabled) {
    if (config.approval.thresholds.length === 1) {
      approval = "simple";
    } else if (config.approval.thresholds.length === 2) {
      approval = "tiered";
    } else {
      approval = "advanced";
    }
  }

  // Detect receiving preset
  let receiving: ReceivingPreset = "standard";
  if (config.receiving.quantityTolerance >= 10) {
    receiving = "flexible";
  } else if (config.receiving.quantityTolerance === 0) {
    receiving = "strict";
  }

  // Detect invoice match preset
  let invoiceMatch: InvoiceMatchPreset = "two-way";
  if (config.receiving.threeWayMatchEnabled) {
    invoiceMatch = config.receiving.priceTolerance === 0 ? "three-way-strict" : "three-way";
  }

  // Detect quality preset
  let quality: QualityPreset = "none";
  if (config.quality.enabled) {
    quality = config.quality.ncr.requireDisposition ? "full" : "basic";
  }

  // Detect vendor preset
  let vendor: VendorPreset = "open";
  if (config.vendor.requireApprovedVendor) {
    vendor = "approved-only";
  } else if (config.vendor.scorecardEnabled) {
    vendor = "preferred";
  }

  return {
    approval,
    receiving,
    invoiceMatch,
    quality,
    vendor,
    isGovernment: config.government.enabled,
    manufacturingType: config.manufacturingType,
  };
}
