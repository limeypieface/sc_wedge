"use client";

/**
 * GovernmentDetailsStep
 *
 * Additional questions for government contracting.
 * Only shown when organizationType includes government.
 */

import { Shield, Target, AlertTriangle } from "lucide-react";
import { useDiscovery } from "@/lib/contexts";
import { cn } from "@/lib/utils";

export function GovernmentDetailsStep() {
  const { discovery, updateDiscovery } = useDiscovery();

  return (
    <div className="space-y-8">
      {/* Question */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tell me more about your government work
        </h1>
        <p className="text-muted-foreground">
          These details help me configure the right compliance controls for your
          specific requirements.
        </p>
      </div>

      {/* ITAR Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium">Export Controls (ITAR/EAR)</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateDiscovery({ isITARControlled: true })}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              discovery.isITARControlled === true
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-sm">ITAR Controlled</span>
            </div>
            <p className="text-xs text-muted-foreground">
              We manufacture or procure defense articles requiring ITAR
              compliance
            </p>
          </button>

          <button
            onClick={() => updateDiscovery({ isITARControlled: false })}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              discovery.isITARControlled === false
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border"
            )}
          >
            <span className="font-medium text-sm block mb-2">
              No ITAR Requirements
            </span>
            <p className="text-xs text-muted-foreground">
              Our products are not subject to ITAR export controls
            </p>
          </button>
        </div>
      </div>

      {/* Small Business Goals */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium">Small Business Goals</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateDiscovery({ hasSmallBusinessGoals: true })}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              discovery.hasSmallBusinessGoals === true
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border"
            )}
          >
            <span className="font-medium text-sm block mb-2">
              Track SB Goals
            </span>
            <p className="text-xs text-muted-foreground">
              We have small business subcontracting goals to meet (e.g., SBA
              requirements)
            </p>
          </button>

          <button
            onClick={() => updateDiscovery({ hasSmallBusinessGoals: false })}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              discovery.hasSmallBusinessGoals === false
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border"
            )}
          >
            <span className="font-medium text-sm block mb-2">
              No SB Tracking
            </span>
            <p className="text-xs text-muted-foreground">
              Small business goals don't apply or we don't need to track them
            </p>
          </button>
        </div>
      </div>

      {/* ITAR Warning */}
      {discovery.isITARControlled && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                ITAR Compliance Enabled
              </p>
              <p className="text-xs text-muted-foreground">
                I'll configure vendor restrictions, citizenship verification
                requirements, and export control classification tracking. You
                should verify these settings with your export compliance officer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Small Business Info */}
      {discovery.hasSmallBusinessGoals && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Small business tracking:</strong>{" "}
            I'll set up tracking for SB, SDB, WOSB, HUBZone, and SDVOSB
            categories with standard federal goals. You can adjust percentages
            later.
          </p>
        </div>
      )}
    </div>
  );
}
