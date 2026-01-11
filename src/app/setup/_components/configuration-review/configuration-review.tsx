"use client";

/**
 * ConfigurationReview
 *
 * The main configuration review screen shown after discovery.
 * Displays AI recommendations and allows users to review/adjust settings.
 */

import { useState } from "react";
import {
  Sparkles,
  Check,
  X,
  ChevronRight,
  Settings,
  Shield,
  Package,
  Users,
  Bell,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from "@/components/ui";
import { useConfiguration, useRecommendations, type ConfigSection } from "@/lib/contexts";
import { cn } from "@/lib/utils";

export function ConfigurationReview() {
  const {
    configuration,
    phase,
    setPhase,
    setActiveSection,
    saveConfiguration,
    isLoading,
  } = useConfiguration();

  const { recommendations, highImpactCount, applyRecommendation, dismissRecommendation } =
    useRecommendations();

  if (!configuration) {
    return null;
  }

  const handleEditSection = (section: ConfigSection) => {
    setActiveSection(section);
    setPhase("configure");
  };

  const handleFinish = async () => {
    await saveConfiguration();
    setPhase("complete");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Configuration Review</h1>
          </div>
          <Button onClick={handleFinish} disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Setup"}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Recommendations</h2>
              {highImpactCount > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                  {highImpactCount} high impact
                </Badge>
              )}
            </div>
            <div className="grid gap-3">
              {recommendations.map((rec, i) => (
                <RecommendationCard
                  key={`${rec.section}-${rec.field}-${i}`}
                  recommendation={rec}
                  onApply={() => applyRecommendation(rec)}
                  onDismiss={() => dismissRecommendation(rec)}
                />
              ))}
            </div>
          </section>
        )}

        {recommendations.length === 0 && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Your configuration looks good! All recommendations have been applied.
            </p>
          </div>
        )}

        <Separator />

        {/* Configuration Sections */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Configuration Sections</h2>
          <p className="text-sm text-muted-foreground">
            Click any section to view and adjust its settings.
          </p>

          <div className="grid gap-4">
            {/* Approval Settings */}
            <ConfigSectionCard
              icon={Users}
              title="Approval Workflow"
              description={getApprovalSummary(configuration)}
              status={configuration.approval.enabled ? "enabled" : "disabled"}
              onClick={() => handleEditSection("approval")}
            />

            {/* Quality Settings */}
            <ConfigSectionCard
              icon={Shield}
              title="Quality & Receiving"
              description={getQualitySummary(configuration)}
              status={configuration.quality.enabled ? "enabled" : "disabled"}
              onClick={() => handleEditSection("quality")}
            />

            {/* Government Settings (if applicable) */}
            {configuration.government.enabled && (
              <ConfigSectionCard
                icon={AlertCircle}
                title="Government Compliance"
                description={getGovernmentSummary(configuration)}
                status="enabled"
                highlight
                onClick={() => handleEditSection("government")}
              />
            )}

            {/* Vendor Settings */}
            <ConfigSectionCard
              icon={Package}
              title="Vendor Management"
              description={getVendorSummary(configuration)}
              status={configuration.vendor.requireApprovedVendor ? "enabled" : "basic"}
              onClick={() => handleEditSection("vendor")}
            />

            {/* Notification Settings */}
            <ConfigSectionCard
              icon={Bell}
              title="Notifications"
              description={getNotificationSummary(configuration)}
              status={configuration.notifications.emailEnabled ? "enabled" : "disabled"}
              onClick={() => handleEditSection("notifications")}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RecommendationCardProps {
  recommendation: {
    section: string;
    field: string;
    reason: string;
    impact: "low" | "medium" | "high";
  };
  onApply: () => void;
  onDismiss: () => void;
}

function RecommendationCard({ recommendation, onApply, onDismiss }: RecommendationCardProps) {
  const impactColors = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-muted/30 flex items-start gap-4">
      <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium capitalize">
            {recommendation.section.replace(/_/g, " ")}
          </span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium capitalize",
              impactColors[recommendation.impact]
            )}
          >
            {recommendation.impact} impact
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          onClick={onApply}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface ConfigSectionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: "enabled" | "disabled" | "basic";
  highlight?: boolean;
  onClick: () => void;
}

function ConfigSectionCard({
  icon: Icon,
  title,
  description,
  status,
  highlight,
  onClick,
}: ConfigSectionCardProps) {
  const statusConfig = {
    enabled: { label: "Enabled", className: "bg-emerald-100 text-emerald-700" },
    disabled: { label: "Disabled", className: "bg-slate-100 text-slate-600" },
    basic: { label: "Basic", className: "bg-blue-100 text-blue-700" },
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border text-left transition-all",
        "hover:border-primary/50 hover:bg-muted/50",
        highlight ? "border-amber-200 bg-amber-50/50" : "border-border"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            highlight ? "bg-amber-100" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              highlight ? "text-amber-600" : "text-muted-foreground"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{title}</h3>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                statusConfig[status].className
              )}
            >
              {statusConfig[status].label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {description}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
  );
}

// ============================================================================
// SUMMARY HELPERS
// ============================================================================

function getApprovalSummary(config: any): string {
  if (!config.approval.enabled) return "Approval workflow disabled";
  const tiers = config.approval.thresholds.length;
  const autoApprove = config.approval.autoApproveLimit;
  if (autoApprove > 0) {
    return `${tiers} tier${tiers > 1 ? "s" : ""}, auto-approve under $${autoApprove.toLocaleString()}`;
  }
  return `${tiers} approval tier${tiers > 1 ? "s" : ""}, all purchases require approval`;
}

function getQualitySummary(config: any): string {
  const parts = [];
  if (config.quality.enabled) {
    parts.push(`${config.quality.defaultInspectionLevel} inspection`);
  }
  if (config.receiving.threeWayMatchEnabled) {
    parts.push("3-way matching");
  }
  if (config.receiving.lotTrackingEnabled) {
    parts.push("lot tracking");
  }
  if (parts.length === 0) {
    return "Basic receiving, no inspection required";
  }
  return parts.join(", ");
}

function getGovernmentSummary(config: any): string {
  const parts = [];
  if (config.government.farCompliance.enabled) {
    parts.push("FAR");
  }
  if (config.government.farCompliance.dfarsEnabled) {
    parts.push("DFARS");
  }
  if (config.government.itar.enabled) {
    parts.push("ITAR");
  }
  if (config.government.smallBusiness.enabled) {
    parts.push("SB goals");
  }
  return parts.join(", ") || "Government compliance enabled";
}

function getVendorSummary(config: any): string {
  const parts = [];
  if (config.vendor.requireApprovedVendor) {
    parts.push("approved vendor list");
  }
  if (config.vendor.scorecardEnabled) {
    parts.push("scorecarding");
  }
  if (config.vendor.qualificationEnabled) {
    parts.push("qualification");
  }
  if (parts.length === 0) {
    return "Basic vendor management";
  }
  return `Requires ${parts.join(", ")}`;
}

function getNotificationSummary(config: any): string {
  const channels = [];
  if (config.notifications.emailEnabled) channels.push("email");
  if (config.notifications.inAppEnabled) channels.push("in-app");
  const eventCount = Object.values(config.notifications.events).filter(Boolean).length;
  return `${channels.join(" & ")} notifications, ${eventCount} event${eventCount !== 1 ? "s" : ""} tracked`;
}
