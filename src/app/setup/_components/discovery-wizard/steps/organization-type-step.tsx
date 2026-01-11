"use client";

/**
 * OrganizationTypeStep
 *
 * Asks whether they work with government contracts.
 * This significantly affects compliance requirements.
 */

import { Building2, Landmark, GitMerge } from "lucide-react";
import { useDiscovery } from "@/lib/contexts";
import { OrganizationType } from "@/types/configuration.types";
import { cn } from "@/lib/utils";

export function OrganizationTypeStep() {
  const { discovery, updateDiscovery } = useDiscovery();

  const options = [
    {
      value: OrganizationType.Commercial,
      icon: Building2,
      title: "Commercial Only",
      description:
        "Standard B2B procurement. No government contracts or special compliance requirements.",
      callout: null,
    },
    {
      value: OrganizationType.Government,
      icon: Landmark,
      title: "Government Contracting",
      description:
        "Federal, state, or local government contracts. FAR/DFARS compliance, small business tracking.",
      callout: "Enables FAR compliance features",
    },
    {
      value: OrganizationType.Both,
      icon: GitMerge,
      title: "Both Commercial & Government",
      description:
        "Mixed portfolio of commercial and government work. Separate tracking and compliance for each.",
      callout: "Full feature set with contract segregation",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Question */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Do you work with government contracts?
        </h1>
        <p className="text-muted-foreground">
          Government contracting has specific compliance requirements that I'll
          configure for you.
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = discovery.organizationType === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => updateDiscovery({ organizationType: option.value })}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all",
                "hover:border-primary/50 hover:bg-muted/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{option.title}</h3>
                    {option.callout && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {option.callout}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contextual help */}
      {(discovery.organizationType === OrganizationType.Government ||
        discovery.organizationType === OrganizationType.Both) && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm font-medium">Government compliance includes:</p>
          <ul className="text-sm text-muted-foreground space-y-1 pl-4">
            <li>• FAR/DFARS clause management</li>
            <li>• Small business goal tracking</li>
            <li>• Cost accounting by contract</li>
            <li>• Export control classification (ECCN)</li>
          </ul>
          <p className="text-xs text-muted-foreground/70 pt-2">
            I'll ask a few more questions about your specific requirements.
          </p>
        </div>
      )}
    </div>
  );
}
