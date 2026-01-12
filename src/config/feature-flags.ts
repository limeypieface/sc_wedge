/**
 * Feature Flags Configuration
 *
 * Central definition of all feature flags in the system.
 * Flags can be toggled at runtime via the admin UI.
 *
 * Categories:
 * - workflow: Business process features
 * - communication: Email, notifications, integrations
 * - ui: User interface features
 * - ai: AI-powered features
 * - experimental: Beta/preview features
 */

// ============================================================================
// TYPES
// ============================================================================

export type FeatureFlagCategory =
  | "workflow"
  | "communication"
  | "ui"
  | "ai"
  | "experimental"

export interface FeatureFlagDefinition {
  /** Unique identifier for the flag */
  id: string
  /** Human-readable name */
  name: string
  /** Description of what this flag controls */
  description: string
  /** Category for grouping in admin UI */
  category: FeatureFlagCategory
  /** Default value when not explicitly set */
  defaultValue: boolean
  /** Whether this flag requires a page reload to take effect */
  requiresReload?: boolean
  /** Dependencies - other flags that must be enabled for this to work */
  dependencies?: string[]
  /** Warning message to show when toggling */
  warning?: string
}

// ============================================================================
// FLAG DEFINITIONS
// ============================================================================

export const FEATURE_FLAG_DEFINITIONS: FeatureFlagDefinition[] = [
  // -------------------------------------------------------------------------
  // WORKFLOW
  // -------------------------------------------------------------------------
  {
    id: "rma_workflow",
    name: "RMA Workflow",
    description: "Enable Return Merchandise Authorization workflow for handling returns and replacements",
    category: "workflow",
    defaultValue: true,
  },
  {
    id: "revision_approvals",
    name: "Revision Approvals",
    description: "Enable approval workflow for PO/SO revisions",
    category: "workflow",
    defaultValue: true,
  },
  {
    id: "multi_level_approvals",
    name: "Multi-Level Approvals",
    description: "Require multiple approval levels based on order value thresholds",
    category: "workflow",
    defaultValue: false,
    dependencies: ["revision_approvals"],
  },
  {
    id: "approval_delegation",
    name: "Approval Delegation",
    description: "Allow approvers to delegate their approval authority to others",
    category: "workflow",
    defaultValue: false,
    dependencies: ["revision_approvals"],
  },
  {
    id: "quality_holds",
    name: "Quality Holds",
    description: "Enable quality hold workflow for received items",
    category: "workflow",
    defaultValue: true,
  },
  {
    id: "ncr_workflow",
    name: "NCR Workflow",
    description: "Enable Non-Conformance Report workflow",
    category: "workflow",
    defaultValue: true,
  },

  // -------------------------------------------------------------------------
  // COMMUNICATION
  // -------------------------------------------------------------------------
  {
    id: "email_integration",
    name: "Email Integration",
    description: "Enable email composition and sending from within the application",
    category: "communication",
    defaultValue: true,
  },
  {
    id: "email_templates",
    name: "Smart Email Templates",
    description: "Use context-aware email templates for different scenarios",
    category: "communication",
    defaultValue: true,
    dependencies: ["email_integration"],
  },
  {
    id: "voip_calling",
    name: "VoIP Calling",
    description: "Enable click-to-call functionality for vendor/customer contacts",
    category: "communication",
    defaultValue: false,
    warning: "Requires VoIP provider configuration",
  },
  {
    id: "document_attachments",
    name: "Document Attachments",
    description: "Allow attaching documents to emails and records",
    category: "communication",
    defaultValue: true,
  },

  // -------------------------------------------------------------------------
  // UI FEATURES
  // -------------------------------------------------------------------------
  {
    id: "dark_mode",
    name: "Dark Mode",
    description: "Enable dark mode theme option",
    category: "ui",
    defaultValue: true,
  },
  {
    id: "compact_mode",
    name: "Compact Mode",
    description: "Enable compact UI mode for power users",
    category: "ui",
    defaultValue: false,
  },
  {
    id: "keyboard_shortcuts",
    name: "Keyboard Shortcuts",
    description: "Enable keyboard shortcuts for common actions",
    category: "ui",
    defaultValue: true,
  },
  {
    id: "activity_timeline",
    name: "Activity Timeline",
    description: "Show activity timeline on order detail pages",
    category: "ui",
    defaultValue: true,
  },
  {
    id: "kpi_dashboard",
    name: "KPI Dashboard",
    description: "Show KPI metrics on dashboard and order pages",
    category: "ui",
    defaultValue: true,
  },

  // -------------------------------------------------------------------------
  // AI FEATURES
  // -------------------------------------------------------------------------
  {
    id: "ai_assistant",
    name: "AI Assistant",
    description: "Enable AI-powered assistant sidebar for help and suggestions",
    category: "ai",
    defaultValue: true,
  },
  {
    id: "ai_email_generation",
    name: "AI Email Generation",
    description: "Use AI to generate and polish email content",
    category: "ai",
    defaultValue: true,
    dependencies: ["email_integration", "ai_assistant"],
  },
  {
    id: "ai_issue_detection",
    name: "AI Issue Detection",
    description: "Use AI to proactively detect potential issues on orders",
    category: "ai",
    defaultValue: false,
    dependencies: ["ai_assistant"],
  },
  {
    id: "ai_suggestions",
    name: "AI Suggestions",
    description: "Show AI-powered suggestions for next actions",
    category: "ai",
    defaultValue: false,
    dependencies: ["ai_assistant"],
  },

  // -------------------------------------------------------------------------
  // EXPERIMENTAL
  // -------------------------------------------------------------------------
  {
    id: "predictive_analytics",
    name: "Predictive Analytics",
    description: "Show predictive analytics and forecasting on dashboards",
    category: "experimental",
    defaultValue: false,
    warning: "This feature is in beta and may have performance impacts",
  },
  {
    id: "supplier_portal",
    name: "Supplier Portal",
    description: "Enable supplier self-service portal access",
    category: "experimental",
    defaultValue: false,
    warning: "This feature is in early development",
  },
  {
    id: "customer_portal",
    name: "Customer Portal",
    description: "Enable customer self-service portal access",
    category: "experimental",
    defaultValue: false,
    warning: "This feature is in early development",
  },
  {
    id: "bulk_operations",
    name: "Bulk Operations",
    description: "Enable bulk edit and update operations on lists",
    category: "experimental",
    defaultValue: false,
  },
  {
    id: "advanced_search",
    name: "Advanced Search",
    description: "Enable advanced search with filters and saved queries",
    category: "experimental",
    defaultValue: false,
  },
]

// ============================================================================
// HELPERS
// ============================================================================

/** Get all flags as a map for quick lookup */
export const FEATURE_FLAGS_MAP = FEATURE_FLAG_DEFINITIONS.reduce(
  (acc, flag) => {
    acc[flag.id] = flag
    return acc
  },
  {} as Record<string, FeatureFlagDefinition>
)

/** Get default values for all flags */
export function getDefaultFlagValues(): Record<string, boolean> {
  return FEATURE_FLAG_DEFINITIONS.reduce(
    (acc, flag) => {
      acc[flag.id] = flag.defaultValue
      return acc
    },
    {} as Record<string, boolean>
  )
}

/** Get flags grouped by category */
export function getFlagsByCategory(): Record<FeatureFlagCategory, FeatureFlagDefinition[]> {
  return FEATURE_FLAG_DEFINITIONS.reduce(
    (acc, flag) => {
      if (!acc[flag.category]) {
        acc[flag.category] = []
      }
      acc[flag.category].push(flag)
      return acc
    },
    {} as Record<FeatureFlagCategory, FeatureFlagDefinition[]>
  )
}

/** Category display names */
export const CATEGORY_LABELS: Record<FeatureFlagCategory, string> = {
  workflow: "Workflow",
  communication: "Communication",
  ui: "User Interface",
  ai: "AI Features",
  experimental: "Experimental",
}

/** Category descriptions */
export const CATEGORY_DESCRIPTIONS: Record<FeatureFlagCategory, string> = {
  workflow: "Business process and workflow automation features",
  communication: "Email, notifications, and external communication features",
  ui: "User interface customization and display options",
  ai: "AI-powered assistance and automation features",
  experimental: "Beta features in development - use with caution",
}

/** Flag ID type for type safety */
export type FeatureFlagId = typeof FEATURE_FLAG_DEFINITIONS[number]["id"]

/** All flag IDs as a const array for iteration */
export const ALL_FLAG_IDS = FEATURE_FLAG_DEFINITIONS.map(f => f.id) as FeatureFlagId[]
