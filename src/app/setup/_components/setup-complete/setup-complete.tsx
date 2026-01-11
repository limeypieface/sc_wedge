"use client";

/**
 * SetupComplete
 *
 * Final screen after configuration is complete.
 * Shows a success message and next steps.
 */

import { Check, ArrowRight, Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { useConfiguration } from "@/lib/contexts";
import Link from "next/link";

export function SetupComplete() {
  const { configuration, resetConfiguration, setPhase } = useConfiguration();

  const handleStartOver = () => {
    resetConfiguration();
  };

  const handleEditConfiguration = () => {
    setPhase("review");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-8">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Setup Complete
          </h1>
          <p className="text-muted-foreground">
            Your procurement configuration has been saved. You're ready to start
            creating purchase orders.
          </p>
        </div>

        {/* Configuration Summary */}
        {configuration && (
          <div className="p-4 bg-muted/50 rounded-lg text-left space-y-2">
            <h3 className="text-sm font-medium">Configuration Summary</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • Complexity: <span className="capitalize">{configuration.complexityTier}</span>
              </p>
              <p>
                • Approval: {configuration.approval.enabled ? "Enabled" : "Disabled"}
              </p>
              <p>
                • Quality Inspection: {configuration.quality.enabled ? "Enabled" : "Disabled"}
              </p>
              {configuration.government.enabled && (
                <p>• Government Compliance: Enabled</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/supply/purchase-orders">
              Go to Purchase Orders
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEditConfiguration}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Configuration
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={handleStartOver}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          You can always change your configuration later from Settings → Procurement.
        </p>
      </div>
    </div>
  );
}
