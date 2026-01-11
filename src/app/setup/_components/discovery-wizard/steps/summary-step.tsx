"use client";

/**
 * SummaryStep
 *
 * Shows a summary of discovered requirements and the recommended
 * configuration tier before proceeding to detailed configuration.
 */

import { Check, Sparkles, Settings, ChevronRight } from "lucide-react";
import { useDiscovery } from "@/lib/contexts";
import {
  ComplexityTier,
  OrganizationType,
  ManufacturingType,
} from "@/types/configuration.types";
import { cn } from "@/lib/utils";

export function SummaryStep() {
  const { discovery, recommendedTier } = useDiscovery();

  const tierInfo = getTierInfo(recommendedTier);

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Here's what I've learned
        </h1>
        <p className="text-muted-foreground">
          Based on your answers, I've tailored the configuration to match your
          operations.
        </p>
      </div>

      {/* Discovery Summary */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Your Profile
        </h2>
        <div className="grid gap-2">
          <SummaryItem
            label="Manufacturing Type"
            value={getManufacturingLabel(discovery.manufacturingType)}
          />
          <SummaryItem
            label="Organization Type"
            value={getOrganizationLabel(discovery.organizationType)}
          />
          <SummaryItem
            label="Team Size"
            value={getTeamSizeLabel(discovery.teamSize)}
          />
          {discovery.hasQualityRequirements !== null && (
            <SummaryItem
              label="Quality Inspection"
              value={discovery.hasQualityRequirements ? "Required" : "Not required"}
            />
          )}
          {discovery.needsLotTracking !== null && (
            <SummaryItem
              label="Lot Tracking"
              value={discovery.needsLotTracking ? "Enabled" : "Not needed"}
            />
          )}
          {discovery.isITARControlled !== null && (
            <SummaryItem
              label="ITAR Controls"
              value={discovery.isITARControlled ? "Required" : "Not applicable"}
              highlight={discovery.isITARControlled}
            />
          )}
        </div>
      </div>

      {/* Recommended Tier */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Recommended Configuration
          </h2>
        </div>
        <div
          className={cn(
            "p-5 rounded-lg border-2",
            tierInfo.borderClass,
            tierInfo.bgClass
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{tierInfo.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tierInfo.description}
              </p>
            </div>
            <div
              className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                tierInfo.badgeClass
              )}
            >
              {tierInfo.label}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {tierInfo.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">What's next?</p>
            <p className="text-sm text-muted-foreground mt-1">
              I'll show you the recommended configuration with all the details.
              You can review and adjust any settings before going live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function SummaryItem({ label, value, highlight }: SummaryItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded bg-muted/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-medium",
          highlight && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function getManufacturingLabel(type: ManufacturingType | null | undefined): string {
  switch (type) {
    case ManufacturingType.Discrete:
      return "Discrete Manufacturing";
    case ManufacturingType.Process:
      return "Process Manufacturing";
    case ManufacturingType.Mixed:
      return "Mixed Mode";
    default:
      return "Not specified";
  }
}

function getOrganizationLabel(type: OrganizationType | null | undefined): string {
  switch (type) {
    case OrganizationType.Commercial:
      return "Commercial Only";
    case OrganizationType.Government:
      return "Government Contracting";
    case OrganizationType.Both:
      return "Commercial & Government";
    default:
      return "Not specified";
  }
}

function getTeamSizeLabel(size: string | null | undefined): string {
  switch (size) {
    case "solo":
      return "Solo";
    case "small":
      return "Small Team (2-5)";
    case "medium":
      return "Medium Team (6-20)";
    case "large":
      return "Large Organization (20+)";
    default:
      return "Not specified";
  }
}

interface TierInfo {
  name: string;
  label: string;
  description: string;
  features: string[];
  borderClass: string;
  bgClass: string;
  badgeClass: string;
}

function getTierInfo(tier: ComplexityTier): TierInfo {
  switch (tier) {
    case ComplexityTier.Starter:
      return {
        name: "Starter Configuration",
        label: "Simple",
        description:
          "Streamlined workflows designed for lean operations. Get up and running quickly.",
        features: [
          "Single-level approval workflow",
          "Basic receiving without inspection",
          "Standard vendor management",
          "Essential notifications",
        ],
        borderClass: "border-emerald-500/30",
        bgClass: "bg-emerald-500/5",
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };
    case ComplexityTier.Standard:
      return {
        name: "Standard Configuration",
        label: "Balanced",
        description:
          "Balanced controls for growing operations. Right-sized complexity.",
        features: [
          "Multi-level approval chains",
          "Sample quality inspection",
          "Three-way matching",
          "Vendor scorecarding",
        ],
        borderClass: "border-blue-500/30",
        bgClass: "bg-blue-500/5",
        badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      };
    case ComplexityTier.Advanced:
      return {
        name: "Advanced Configuration",
        label: "Full Featured",
        description:
          "Comprehensive controls for complex operations. Full audit trail.",
        features: [
          "Role-based approval routing",
          "Full quality inspection with NCR",
          "Lot & serial tracking",
          "Government compliance (FAR/DFARS)",
          "Small business goal tracking",
        ],
        borderClass: "border-violet-500/30",
        bgClass: "bg-violet-500/5",
        badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
      };
    case ComplexityTier.Enterprise:
      return {
        name: "Enterprise Configuration",
        label: "Maximum",
        description:
          "Maximum compliance and control for regulated industries.",
        features: [
          "Executive approval escalation",
          "ITAR export control management",
          "Contract cost segregation",
          "Complete audit trails",
          "Multi-entity support",
        ],
        borderClass: "border-amber-500/30",
        bgClass: "bg-amber-500/5",
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
  }
}
