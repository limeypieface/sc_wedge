/**
 * Configuration Types
 *
 * Comprehensive purchasing configuration schema with progressive complexity disclosure.
 * Supports Manufacturing (Commercial & Government) procurement operations.
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Organization type determines available configuration options */
export enum OrganizationType {
  Commercial = "commercial",
  Government = "government",
  Both = "both",
}

/** Complexity tier determines default settings and UI density */
export enum ComplexityTier {
  /** Basic procurement - minimal approval, simple receiving */
  Starter = "starter",
  /** Standard operations - approval chains, quality checks */
  Standard = "standard",
  /** Advanced operations - multi-tier approval, full inspection */
  Advanced = "advanced",
  /** Enterprise operations - complete compliance, audit trails */
  Enterprise = "enterprise",
}

/** Manufacturing sub-type for specialized defaults */
export enum ManufacturingType {
  /** Discrete manufacturing - individual units, assemblies */
  Discrete = "discrete",
  /** Process manufacturing - batch/continuous, formulations */
  Process = "process",
  /** Mixed mode - both discrete and process */
  Mixed = "mixed",
}

/** Quality inspection levels */
export enum InspectionLevel {
  /** No inspection - trust supplier */
  None = "none",
  /** Sample inspection - statistical sampling */
  Sample = "sample",
  /** Full inspection - 100% inspection */
  Full = "full",
  /** Certification-based - supplier certified, reduced inspection */
  Certified = "certified",
}

/** Government contract types */
export enum GovernmentContractType {
  /** Fixed-price contracts */
  FixedPrice = "fixed_price",
  /** Cost-reimbursement contracts */
  CostReimbursement = "cost_reimbursement",
  /** Time and materials */
  TimeAndMaterials = "time_and_materials",
  /** Indefinite delivery/quantity */
  IDIQ = "idiq",
}

// ============================================================================
// DISCOVERY CONTEXT
// ============================================================================

/** User's answers during context discovery */
export interface DiscoveryContext {
  /** What type of manufacturing? */
  manufacturingType: ManufacturingType | null;

  /** Do they work with government contracts? */
  organizationType: OrganizationType | null;

  /** Approximate team size */
  teamSize: "solo" | "small" | "medium" | "large" | null;

  /** Do they have quality requirements? */
  hasQualityRequirements: boolean | null;

  /** Do they need lot/serial tracking? */
  needsLotTracking: boolean | null;

  /** Do they have existing approval workflows? */
  hasApprovalWorkflows: boolean | null;

  /** Government-specific: ITAR controlled? */
  isITARControlled: boolean | null;

  /** Government-specific: small business goals? */
  hasSmallBusinessGoals: boolean | null;

  /** Recommended complexity tier (computed) */
  recommendedTier: ComplexityTier | null;
}

// ============================================================================
// APPROVAL CONFIGURATION
// ============================================================================

/** Single approval threshold level */
export interface ApprovalThreshold {
  id: string;
  /** Minimum amount for this tier */
  minAmount: number;
  /** Maximum amount (null = unlimited) */
  maxAmount: number | null;
  /** Approvers required at this level */
  approvers: ApproverDefinition[];
  /** Sequential or parallel approval */
  approvalMode: "sequential" | "parallel" | "any";
}

/** Approver definition */
export interface ApproverDefinition {
  id: string;
  /** Role-based or specific user */
  type: "role" | "user" | "manager";
  /** Role name or user ID */
  value: string;
  /** Display name */
  displayName: string;
  /** Can delegate? */
  canDelegate: boolean;
}

/** Approval workflow configuration */
export interface ApprovalConfiguration {
  /** Is approval enabled? */
  enabled: boolean;

  /** Threshold-based approval tiers */
  thresholds: ApprovalThreshold[];

  /** Auto-approve below this amount */
  autoApproveLimit: number;

  /** Require approval for contract changes */
  requireApprovalForChanges: boolean;

  /** Change threshold % that requires re-approval */
  changeApprovalThreshold: number;

  /** Allow self-approval for own requisitions */
  allowSelfApproval: boolean;

  /** Escalation timeout in hours */
  escalationTimeoutHours: number | null;

  /** Notify on approval actions */
  notifications: {
    onSubmit: boolean;
    onApprove: boolean;
    onReject: boolean;
    onEscalate: boolean;
  };
}

// ============================================================================
// RECEIVING & QUALITY CONFIGURATION
// ============================================================================

/** Quality inspection configuration */
export interface QualityConfiguration {
  /** Is quality inspection enabled? */
  enabled: boolean;

  /** Default inspection level */
  defaultInspectionLevel: InspectionLevel;

  /** Inspection levels by commodity/category */
  categoryOverrides: {
    category: string;
    level: InspectionLevel;
  }[];

  /** Require certificate of conformance */
  requireCOC: boolean;

  /** Require material test reports */
  requireMTR: boolean;

  /** NCR (Non-Conformance Report) settings */
  ncr: {
    enabled: boolean;
    autoCreateOnFailure: boolean;
    requireDisposition: boolean;
    notifySupplier: boolean;
  };

  /** Quality hold settings */
  qualityHold: {
    enabled: boolean;
    autoHoldOnNCR: boolean;
    requireApprovalToRelease: boolean;
  };
}

/** Receiving configuration */
export interface ReceivingConfiguration {
  /** Three-way matching enabled */
  threeWayMatchEnabled: boolean;

  /** Tolerance for quantity variance (%) */
  quantityTolerance: number;

  /** Tolerance for price variance (%) */
  priceTolerance: number;

  /** Allow over-receiving */
  allowOverReceive: boolean;

  /** Max over-receive percentage */
  maxOverReceivePercent: number;

  /** Lot tracking enabled */
  lotTrackingEnabled: boolean;

  /** Serial number tracking enabled */
  serialTrackingEnabled: boolean;

  /** Require packing slip */
  requirePackingSlip: boolean;

  /** Auto-close lines when fully received */
  autoCloseOnFullReceipt: boolean;
}

// ============================================================================
// GOVERNMENT COMPLIANCE CONFIGURATION
// ============================================================================

/** FAR/DFARS compliance settings */
export interface FARComplianceConfiguration {
  /** FAR compliance enabled */
  enabled: boolean;

  /** DFARS compliance enabled */
  dfarsEnabled: boolean;

  /** Required clauses to include */
  requiredClauses: string[];

  /** Auto-include standard clauses */
  autoIncludeClauses: boolean;

  /** Cost accounting standards */
  costAccountingEnabled: boolean;

  /** Contract type defaults */
  defaultContractType: GovernmentContractType;
}

/** ITAR (International Traffic in Arms) configuration */
export interface ITARConfiguration {
  /** ITAR controls enabled */
  enabled: boolean;

  /** Require citizenship verification */
  requireCitizenshipVerification: boolean;

  /** Restrict to domestic suppliers */
  domesticSuppliersOnly: boolean;

  /** Require export control classification */
  requireECCN: boolean;

  /** Auto-flag controlled items */
  autoFlagControlledItems: boolean;
}

/** Small business compliance */
export interface SmallBusinessConfiguration {
  /** Small business tracking enabled */
  enabled: boolean;

  /** Small business goal percentage */
  goalPercentage: number;

  /** Track by category */
  categories: {
    name: string;
    code: string;
    goalPercentage: number;
  }[];

  /** Auto-suggest small business vendors */
  autoSuggest: boolean;
}

/** Complete government configuration */
export interface GovernmentConfiguration {
  /** Is government contracting enabled */
  enabled: boolean;

  /** FAR/DFARS compliance */
  farCompliance: FARComplianceConfiguration;

  /** ITAR controls */
  itar: ITARConfiguration;

  /** Small business */
  smallBusiness: SmallBusinessConfiguration;

  /** Contract segregation (separate cost pools) */
  contractSegregation: boolean;

  /** Require contract number on all POs */
  requireContractNumber: boolean;
}

// ============================================================================
// VENDOR MANAGEMENT CONFIGURATION
// ============================================================================

/** Vendor management settings */
export interface VendorConfiguration {
  /** Require approved vendor list */
  requireApprovedVendor: boolean;

  /** Vendor qualification enabled */
  qualificationEnabled: boolean;

  /** Vendor scorecarding enabled */
  scorecardEnabled: boolean;

  /** Performance metrics to track */
  performanceMetrics: {
    onTimeDelivery: boolean;
    qualityScore: boolean;
    priceCompetitiveness: boolean;
    responsiveness: boolean;
  };

  /** Auto-disqualify below score */
  autoDisqualifyThreshold: number | null;

  /** Require insurance certificates */
  requireInsurance: boolean;

  /** Require W9/tax documents */
  requireTaxDocuments: boolean;
}

// ============================================================================
// NOTIFICATION CONFIGURATION
// ============================================================================

/** Notification preferences */
export interface NotificationConfiguration {
  /** Email notifications enabled */
  emailEnabled: boolean;

  /** In-app notifications enabled */
  inAppEnabled: boolean;

  /** Events to notify on */
  events: {
    poCreated: boolean;
    poApproved: boolean;
    poRejected: boolean;
    shipmentReceived: boolean;
    invoiceReceived: boolean;
    qualityIssue: boolean;
    deliveryDelayed: boolean;
  };

  /** Daily digest instead of real-time */
  digestMode: boolean;
}

// ============================================================================
// MASTER CONFIGURATION
// ============================================================================

/** Complete purchasing configuration */
export interface PurchasingConfiguration {
  /** Unique configuration ID */
  id: string;

  /** Organization name */
  organizationName: string;

  /** Discovery context (user's answers) */
  discovery: DiscoveryContext;

  /** Computed complexity tier */
  complexityTier: ComplexityTier;

  /** Organization type */
  organizationType: OrganizationType;

  /** Manufacturing type */
  manufacturingType: ManufacturingType;

  /** Approval settings */
  approval: ApprovalConfiguration;

  /** Quality inspection */
  quality: QualityConfiguration;

  /** Receiving settings */
  receiving: ReceivingConfiguration;

  /** Government compliance (if applicable) */
  government: GovernmentConfiguration;

  /** Vendor management */
  vendor: VendorConfiguration;

  /** Notifications */
  notifications: NotificationConfiguration;

  /** Created timestamp */
  createdAt: Date;

  /** Last modified timestamp */
  updatedAt: Date;

  /** Configuration version */
  version: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/** Default configuration for Commercial Manufacturing - Starter tier */
export const DEFAULT_COMMERCIAL_STARTER: Omit<PurchasingConfiguration, "id" | "organizationName" | "createdAt" | "updatedAt"> = {
  discovery: {
    manufacturingType: ManufacturingType.Discrete,
    organizationType: OrganizationType.Commercial,
    teamSize: "small",
    hasQualityRequirements: false,
    needsLotTracking: false,
    hasApprovalWorkflows: false,
    isITARControlled: false,
    hasSmallBusinessGoals: false,
    recommendedTier: ComplexityTier.Starter,
  },
  complexityTier: ComplexityTier.Starter,
  organizationType: OrganizationType.Commercial,
  manufacturingType: ManufacturingType.Discrete,
  version: 1,

  approval: {
    enabled: true,
    thresholds: [
      {
        id: "tier-1",
        minAmount: 0,
        maxAmount: null,
        approvers: [{ id: "mgr", type: "manager", value: "direct", displayName: "Direct Manager", canDelegate: true }],
        approvalMode: "any",
      },
    ],
    autoApproveLimit: 500,
    requireApprovalForChanges: true,
    changeApprovalThreshold: 10,
    allowSelfApproval: false,
    escalationTimeoutHours: null,
    notifications: { onSubmit: true, onApprove: true, onReject: true, onEscalate: false },
  },

  quality: {
    enabled: false,
    defaultInspectionLevel: InspectionLevel.None,
    categoryOverrides: [],
    requireCOC: false,
    requireMTR: false,
    ncr: { enabled: false, autoCreateOnFailure: false, requireDisposition: false, notifySupplier: false },
    qualityHold: { enabled: false, autoHoldOnNCR: false, requireApprovalToRelease: false },
  },

  receiving: {
    threeWayMatchEnabled: false,
    quantityTolerance: 5,
    priceTolerance: 5,
    allowOverReceive: true,
    maxOverReceivePercent: 10,
    lotTrackingEnabled: false,
    serialTrackingEnabled: false,
    requirePackingSlip: false,
    autoCloseOnFullReceipt: true,
  },

  government: {
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
  },

  vendor: {
    requireApprovedVendor: false,
    qualificationEnabled: false,
    scorecardEnabled: false,
    performanceMetrics: {
      onTimeDelivery: true,
      qualityScore: false,
      priceCompetitiveness: true,
      responsiveness: false,
    },
    autoDisqualifyThreshold: null,
    requireInsurance: false,
    requireTaxDocuments: true,
  },

  notifications: {
    emailEnabled: true,
    inAppEnabled: true,
    events: {
      poCreated: false,
      poApproved: true,
      poRejected: true,
      shipmentReceived: true,
      invoiceReceived: true,
      qualityIssue: false,
      deliveryDelayed: true,
    },
    digestMode: false,
  },
};

/** Default configuration for Government Manufacturing - Advanced tier */
export const DEFAULT_GOVERNMENT_ADVANCED: Omit<PurchasingConfiguration, "id" | "organizationName" | "createdAt" | "updatedAt"> = {
  discovery: {
    manufacturingType: ManufacturingType.Discrete,
    organizationType: OrganizationType.Government,
    teamSize: "medium",
    hasQualityRequirements: true,
    needsLotTracking: true,
    hasApprovalWorkflows: true,
    isITARControlled: false,
    hasSmallBusinessGoals: true,
    recommendedTier: ComplexityTier.Advanced,
  },
  complexityTier: ComplexityTier.Advanced,
  organizationType: OrganizationType.Government,
  manufacturingType: ManufacturingType.Discrete,
  version: 1,

  approval: {
    enabled: true,
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
    autoApproveLimit: 0,
    requireApprovalForChanges: true,
    changeApprovalThreshold: 5,
    allowSelfApproval: false,
    escalationTimeoutHours: 48,
    notifications: { onSubmit: true, onApprove: true, onReject: true, onEscalate: true },
  },

  quality: {
    enabled: true,
    defaultInspectionLevel: InspectionLevel.Sample,
    categoryOverrides: [
      { category: "Critical Components", level: InspectionLevel.Full },
      { category: "Raw Materials", level: InspectionLevel.Certified },
    ],
    requireCOC: true,
    requireMTR: true,
    ncr: { enabled: true, autoCreateOnFailure: true, requireDisposition: true, notifySupplier: true },
    qualityHold: { enabled: true, autoHoldOnNCR: true, requireApprovalToRelease: true },
  },

  receiving: {
    threeWayMatchEnabled: true,
    quantityTolerance: 2,
    priceTolerance: 0,
    allowOverReceive: false,
    maxOverReceivePercent: 0,
    lotTrackingEnabled: true,
    serialTrackingEnabled: true,
    requirePackingSlip: true,
    autoCloseOnFullReceipt: false,
  },

  government: {
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
  },

  vendor: {
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
  },

  notifications: {
    emailEnabled: true,
    inAppEnabled: true,
    events: {
      poCreated: true,
      poApproved: true,
      poRejected: true,
      shipmentReceived: true,
      invoiceReceived: true,
      qualityIssue: true,
      deliveryDelayed: true,
    },
    digestMode: false,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Compute recommended tier based on discovery answers */
export function computeRecommendedTier(discovery: Partial<DiscoveryContext>): ComplexityTier {
  let score = 0;

  // Team size scoring
  if (discovery.teamSize === "solo") score += 0;
  else if (discovery.teamSize === "small") score += 1;
  else if (discovery.teamSize === "medium") score += 2;
  else if (discovery.teamSize === "large") score += 3;

  // Feature requirements
  if (discovery.hasQualityRequirements) score += 2;
  if (discovery.needsLotTracking) score += 1;
  if (discovery.hasApprovalWorkflows) score += 1;

  // Government adds complexity
  if (discovery.organizationType === OrganizationType.Government) score += 2;
  else if (discovery.organizationType === OrganizationType.Both) score += 3;

  // ITAR adds significant complexity
  if (discovery.isITARControlled) score += 2;

  // Small business goals add tracking overhead
  if (discovery.hasSmallBusinessGoals) score += 1;

  // Map score to tier
  if (score <= 2) return ComplexityTier.Starter;
  if (score <= 5) return ComplexityTier.Standard;
  if (score <= 8) return ComplexityTier.Advanced;
  return ComplexityTier.Enterprise;
}

/** Get default configuration for a given tier and type */
export function getDefaultConfiguration(
  tier: ComplexityTier,
  orgType: OrganizationType
): Omit<PurchasingConfiguration, "id" | "organizationName" | "createdAt" | "updatedAt"> {
  if (orgType === OrganizationType.Government) {
    return DEFAULT_GOVERNMENT_ADVANCED;
  }
  return DEFAULT_COMMERCIAL_STARTER;
}

/** AI-generated configuration recommendations */
export interface ConfigurationRecommendation {
  section: keyof PurchasingConfiguration;
  field: string;
  currentValue: unknown;
  recommendedValue: unknown;
  reason: string;
  impact: "low" | "medium" | "high";
}

/** Generate recommendations based on discovery context */
export function generateRecommendations(
  config: PurchasingConfiguration
): ConfigurationRecommendation[] {
  const recommendations: ConfigurationRecommendation[] = [];

  // Quality recommendations for manufacturing
  if (config.manufacturingType !== ManufacturingType.Process && !config.quality.enabled) {
    recommendations.push({
      section: "quality",
      field: "enabled",
      currentValue: false,
      recommendedValue: true,
      reason: "Manufacturing operations typically benefit from quality inspection to catch issues early.",
      impact: "high",
    });
  }

  // Lot tracking for process manufacturing
  if (config.manufacturingType === ManufacturingType.Process && !config.receiving.lotTrackingEnabled) {
    recommendations.push({
      section: "receiving",
      field: "lotTrackingEnabled",
      currentValue: false,
      recommendedValue: true,
      reason: "Process manufacturing requires lot tracking for traceability and recalls.",
      impact: "high",
    });
  }

  // Government compliance checks
  if (config.organizationType === OrganizationType.Government && !config.government.enabled) {
    recommendations.push({
      section: "government",
      field: "enabled",
      currentValue: false,
      recommendedValue: true,
      reason: "Government contracting requires FAR/DFARS compliance tracking.",
      impact: "high",
    });
  }

  // Three-way match for better financial control
  if (config.complexityTier !== ComplexityTier.Starter && !config.receiving.threeWayMatchEnabled) {
    recommendations.push({
      section: "receiving",
      field: "threeWayMatchEnabled",
      currentValue: false,
      recommendedValue: true,
      reason: "Three-way matching prevents payment errors and fraud.",
      impact: "medium",
    });
  }

  return recommendations;
}
