"use client";

/**
 * TeamSizeStep
 *
 * Asks about procurement team size to calibrate complexity.
 * Smaller teams need simpler workflows; larger teams need more structure.
 */

import { User, Users, UsersRound, Building } from "lucide-react";
import { useDiscovery } from "@/lib/contexts";
import { cn } from "@/lib/utils";

type TeamSize = "solo" | "small" | "medium" | "large";

export function TeamSizeStep() {
  const { discovery, updateDiscovery } = useDiscovery();

  const options: {
    value: TeamSize;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    implication: string;
  }[] = [
    {
      value: "solo",
      icon: User,
      title: "Just me",
      description: "I handle all procurement myself",
      implication: "Streamlined workflow, minimal approval steps",
    },
    {
      value: "small",
      icon: Users,
      title: "Small team (2-5)",
      description: "A few people manage procurement",
      implication: "Simple approval chains, shared visibility",
    },
    {
      value: "medium",
      icon: UsersRound,
      title: "Medium team (6-20)",
      description: "Dedicated procurement function",
      implication: "Role-based access, multi-level approvals",
    },
    {
      value: "large",
      icon: Building,
      title: "Large organization (20+)",
      description: "Multiple departments and locations",
      implication: "Full governance, delegation, audit trails",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Question */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          How large is your procurement team?
        </h1>
        <p className="text-muted-foreground">
          This helps me recommend the right level of workflow complexity—simpler
          for smaller teams, more structured for larger organizations.
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = discovery.teamSize === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => updateDiscovery({ teamSize: option.value })}
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
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                  <p className="text-xs text-primary/80 mt-2">
                    → {option.implication}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
