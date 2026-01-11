"use client";

/**
 * Setup Page
 *
 * Main entry point for the configuration setup flow.
 * Routes to the appropriate phase component based on context state.
 */

import { useConfiguration } from "@/lib/contexts";
import { DiscoveryWizard } from "./_components/discovery-wizard";
import { ConfigurationReview } from "./_components/configuration-review";
import { ConfigurationEditor } from "./_components/configuration-editor";
import { SetupComplete } from "./_components/setup-complete";

export default function SetupPage() {
  const { phase } = useConfiguration();

  switch (phase) {
    case "discovery":
      return <DiscoveryWizard />;
    case "review":
      return <ConfigurationReview />;
    case "configure":
      return <ConfigurationEditor />;
    case "complete":
      return <SetupComplete />;
    default:
      return <DiscoveryWizard />;
  }
}
