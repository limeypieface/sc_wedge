"use client";

/**
 * QualityRequirementsStep
 *
 * Asks about quality inspection and tracking requirements.
 * Manufacturing typically needs quality controls; this step calibrates the level.
 */

import { CheckCircle2, XCircle } from "lucide-react";
import { useDiscovery } from "@/lib/contexts";
import { cn } from "@/lib/utils";

export function QualityRequirementsStep() {
  const { discovery, updateDiscovery } = useDiscovery();

  return (
    <div className="space-y-8">
      {/* Question */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Do you need quality inspection?
        </h1>
        <p className="text-muted-foreground">
          Tell me about your quality and traceability requirements so I can set
          up the right receiving workflows.
        </p>
      </div>

      {/* Quality Inspection Toggle */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Incoming Quality Inspection</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            selected={discovery.hasQualityRequirements === true}
            onClick={() => updateDiscovery({ hasQualityRequirements: true })}
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Yes, we inspect"
            description="Materials are inspected before being released to production"
          />
          <ToggleCard
            selected={discovery.hasQualityRequirements === false}
            onClick={() => updateDiscovery({ hasQualityRequirements: false })}
            icon={<XCircle className="w-5 h-5" />}
            title="No inspection"
            description="We trust our suppliers or inspect in production"
          />
        </div>
      </div>

      {/* Lot Tracking Toggle */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Lot & Serial Tracking</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            selected={discovery.needsLotTracking === true}
            onClick={() => updateDiscovery({ needsLotTracking: true })}
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Yes, we track lots"
            description="Need to trace materials back to supplier lots"
          />
          <ToggleCard
            selected={discovery.needsLotTracking === false}
            onClick={() => updateDiscovery({ needsLotTracking: false })}
            icon={<XCircle className="w-5 h-5" />}
            title="No tracking needed"
            description="Materials don't require lot-level traceability"
          />
        </div>
      </div>

      {/* Approval Workflows Toggle */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Purchase Approval Workflows</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            selected={discovery.hasApprovalWorkflows === true}
            onClick={() => updateDiscovery({ hasApprovalWorkflows: true })}
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Multi-level approval"
            description="Purchases require approval based on amount or type"
          />
          <ToggleCard
            selected={discovery.hasApprovalWorkflows === false}
            onClick={() => updateDiscovery({ hasApprovalWorkflows: false })}
            icon={<XCircle className="w-5 h-5" />}
            title="Simple approval"
            description="Minimal approval requirements"
          />
        </div>
      </div>

      {/* Contextual help */}
      {discovery.hasQualityRequirements && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Quality features include:</strong>{" "}
            Inspection sampling, NCR (non-conformance) tracking, quality holds,
            certificate of conformance requirements, and material test reports.
          </p>
        </div>
      )}
    </div>
  );
}

interface ToggleCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ToggleCard({ selected, onClick, icon, title, description }: ToggleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border text-left transition-all",
        "hover:border-primary/50 hover:bg-muted/50",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mb-3",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
