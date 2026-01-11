"use client";

/**
 * ManufacturingTypeStep
 *
 * Asks about the type of manufacturing operations.
 * This affects quality inspection, lot tracking, and receiving defaults.
 */

import { Cpu, FlaskConical, Layers } from "lucide-react";
import { useDiscovery } from "@/lib/contexts";
import { ManufacturingType } from "@/types/configuration.types";
import { cn } from "@/lib/utils";

export function ManufacturingTypeStep() {
  const { discovery, updateDiscovery } = useDiscovery();

  const options = [
    {
      value: ManufacturingType.Discrete,
      icon: Cpu,
      title: "Discrete Manufacturing",
      description:
        "Individual units, assemblies, and components. Each item is distinct and countable.",
      examples: "Electronics, machinery, furniture, automotive parts",
    },
    {
      value: ManufacturingType.Process,
      icon: FlaskConical,
      title: "Process Manufacturing",
      description:
        "Batch or continuous production using formulas and recipes. Items are measured, not counted.",
      examples: "Chemicals, food & beverage, pharmaceuticals, cosmetics",
    },
    {
      value: ManufacturingType.Mixed,
      icon: Layers,
      title: "Mixed Mode",
      description:
        "Combination of discrete and process manufacturing. Different product lines use different methods.",
      examples: "Packaged foods, assembled products with process components",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Question */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          What type of manufacturing do you do?
        </h1>
        <p className="text-muted-foreground">
          This helps me set up the right receiving and quality inspection
          workflows for your products.
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = discovery.manufacturingType === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => updateDiscovery({ manufacturingType: option.value })}
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
                  <h3 className="font-medium">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Examples: {option.examples}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contextual help */}
      {discovery.manufacturingType === ManufacturingType.Process && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Good to know:</strong> Process
            manufacturing typically requires lot tracking and certificate of
            analysis for traceability. I'll enable these by default.
          </p>
        </div>
      )}
    </div>
  );
}
