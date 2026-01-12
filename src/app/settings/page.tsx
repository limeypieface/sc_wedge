"use client";

/**
 * Settings Page
 *
 * Ongoing configuration management for users who have completed setup.
 * Sidebar navigation with direct access to any setting.
 */

import { useState, useEffect } from "react";
import {
  Settings,
  FileCheck,
  Package,
  DollarSign,
  Shield,
  Users,
  Bell,
  Landmark,
  ChevronRight,
  Search,
  RotateCcw,
  ExternalLink,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PurchasingConfiguration } from "@/types/configuration.types";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import Link from "next/link";

// Section components
import { ApprovalSettings } from "./_components/approval-settings";
import { ReceivingSettings } from "./_components/receiving-settings";
import { InvoiceSettings } from "./_components/invoice-settings";
import { QualitySettings } from "./_components/quality-settings";
import { VendorSettings } from "./_components/vendor-settings";
import { GovernmentSettings } from "./_components/government-settings";
import { NotificationSettings } from "./_components/notification-settings";
import { FeatureFlagsSettings } from "./_components/feature-flags-settings";

// ============================================================================
// TYPES
// ============================================================================

type SettingsSection =
  | "approval"
  | "receiving"
  | "invoice"
  | "quality"
  | "vendor"
  | "government"
  | "notifications"
  | "features";

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "approval", label: "Approval Workflow", icon: FileCheck, description: "Thresholds and routing" },
  { id: "receiving", label: "Receiving", icon: Package, description: "Tolerances and documentation" },
  { id: "invoice", label: "Invoice & Payment", icon: DollarSign, description: "Matching and holds" },
  { id: "quality", label: "Quality Processes", icon: Shield, description: "NCR and holds" },
  { id: "vendor", label: "Vendor Management", icon: Users, description: "Qualification and scoring" },
  { id: "government", label: "Government", icon: Landmark, description: "Compliance settings" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts and digests" },
  { id: "features", label: "Feature Flags", icon: ToggleRight, description: "Enable/disable features" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function SettingsPage() {
  // Default to "features" if no config exists, otherwise "approval"
  const [activeSection, setActiveSection] = useState<SettingsSection>("features");
  const [config, setConfig] = useState<PurchasingConfiguration | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load configuration from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("purchasingConfig");
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
        // If config exists and we haven't manually selected a section, go to approval
        setActiveSection("approval");
      } catch (e) {
        console.error("Failed to parse config:", e);
      }
    }
    setConfigLoaded(true);

    // Check URL for section parameter
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    if (section && NAV_ITEMS.some(item => item.id === section)) {
      setActiveSection(section as SettingsSection);
    }
  }, []);

  // Save configuration changes
  const handleConfigChange = (updates: Partial<PurchasingConfiguration>) => {
    if (!config) return;
    const updated = { ...config, ...updates, updatedAt: new Date().toISOString() };
    setConfig(updated);
    localStorage.setItem("purchasingConfig", JSON.stringify(updated));
  };

  // Filter nav items - always show "features", others require config
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    // Always show Feature Flags
    if (item.id === "features") {
      return item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // Other items require config
    if (!config) return false;
    return item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Check if selected section requires config
  const sectionRequiresConfig = activeSection !== "features";
  const showConfigRequired = sectionRequiresConfig && !config;

  return (
    <FeatureFlagsProvider>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="font-semibold">Settings</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isGovernmentHidden = item.id === "government" && config && !config.government?.enabled;

            if (isGovernmentHidden) return null;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className="text-xs opacity-70 truncate">{item.description}</p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <Link href="/setup">
              <RotateCcw className="w-4 h-4 mr-2" />
              Run Setup Wizard
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link href="/buyer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Back to Workbench
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Show config required message for non-feature sections without config */}
          {showConfigRequired && (
            <div className="text-center py-16 space-y-4">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">Configuration Required</h2>
              <p className="text-muted-foreground">
                Run the setup wizard to configure this section, or view Feature Flags which work independently.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button asChild>
                  <Link href="/setup">Run Setup Wizard</Link>
                </Button>
                <Button variant="outline" onClick={() => setActiveSection("features")}>
                  View Feature Flags
                </Button>
              </div>
            </div>
          )}

          {/* Config-dependent sections */}
          {config && activeSection === "approval" && (
            <ApprovalSettings config={config} onChange={handleConfigChange} />
          )}
          {config && activeSection === "receiving" && (
            <ReceivingSettings config={config} onChange={handleConfigChange} />
          )}
          {config && activeSection === "invoice" && (
            <InvoiceSettings config={config} onChange={handleConfigChange} />
          )}
          {config && activeSection === "quality" && (
            <QualitySettings config={config} onChange={handleConfigChange} />
          )}
          {config && activeSection === "vendor" && (
            <VendorSettings config={config} onChange={handleConfigChange} />
          )}
          {config && activeSection === "government" && (
            <GovernmentSettings config={config} onChange={handleConfigChange} />
          )}
          {config && activeSection === "notifications" && (
            <NotificationSettings config={config} onChange={handleConfigChange} />
          )}

          {/* Feature flags - always available */}
          {activeSection === "features" && (
            <FeatureFlagsSettings />
          )}
        </div>
      </main>
    </div>
    </FeatureFlagsProvider>
  );
}
