"use client";

/**
 * ConfigurationEditor
 *
 * Container for editing individual configuration sections.
 * Renders the appropriate section editor based on activeSection.
 */

import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui";
import { useConfiguration, type ConfigSection } from "@/lib/contexts";

import { ApprovalEditor } from "./sections/approval-editor";
import { QualityEditor } from "./sections/quality-editor";
import { GovernmentEditor } from "./sections/government-editor";
import { VendorEditor } from "./sections/vendor-editor";
import { NotificationsEditor } from "./sections/notifications-editor";

export function ConfigurationEditor() {
  const {
    activeSection,
    setActiveSection,
    setPhase,
    saveConfiguration,
    hasUnsavedChanges,
    isLoading,
  } = useConfiguration();

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      await saveConfiguration();
    }
    setActiveSection(null);
    setPhase("review");
  };

  const sectionTitle = getSectionTitle(activeSection);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold">{sectionTitle}</h1>
          </div>
          <Button
            onClick={() => saveConfiguration()}
            disabled={!hasUnsavedChanges || isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {renderSection(activeSection)}
      </main>
    </div>
  );
}

function getSectionTitle(section: ConfigSection | null): string {
  switch (section) {
    case "approval":
      return "Approval Workflow";
    case "quality":
      return "Quality & Receiving";
    case "government":
      return "Government Compliance";
    case "vendor":
      return "Vendor Management";
    case "notifications":
      return "Notifications";
    default:
      return "Configuration";
  }
}

function renderSection(section: ConfigSection | null) {
  switch (section) {
    case "approval":
      return <ApprovalEditor />;
    case "quality":
      return <QualityEditor />;
    case "government":
      return <GovernmentEditor />;
    case "vendor":
      return <VendorEditor />;
    case "notifications":
      return <NotificationsEditor />;
    default:
      return <div>Select a section to configure</div>;
  }
}
