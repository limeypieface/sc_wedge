"use client";

/**
 * DiscoveryWizard
 *
 * A conversational setup wizard that guides users through understanding
 * their procurement needs before configuring the system.
 *
 * Uses an agentic, helpful tone without being overwhelming.
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button, Progress } from "@/components/ui";
import { useDiscovery } from "@/lib/contexts";
import { cn } from "@/lib/utils";

import { WelcomeStep } from "./steps/welcome-step";
import { ManufacturingTypeStep } from "./steps/manufacturing-type-step";
import { OrganizationTypeStep } from "./steps/organization-type-step";
import { TeamSizeStep } from "./steps/team-size-step";
import { QualityRequirementsStep } from "./steps/quality-requirements-step";
import { GovernmentDetailsStep } from "./steps/government-details-step";
import { SummaryStep } from "./steps/summary-step";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: "tween",
  duration: 0.2,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DiscoveryWizard() {
  const {
    discoveryStep,
    discoveryProgress,
    setDiscoveryStep,
    getNextDiscoveryStep,
    getPreviousDiscoveryStep,
    completeDiscovery,
  } = useDiscovery();

  const nextStep = getNextDiscoveryStep();
  const prevStep = getPreviousDiscoveryStep();
  const isSummary = discoveryStep === "summary";
  const isWelcome = discoveryStep === "welcome";

  const handleNext = () => {
    if (isSummary) {
      completeDiscovery();
    } else if (nextStep) {
      setDiscoveryStep(nextStep);
    }
  };

  const handleBack = () => {
    if (prevStep) {
      setDiscoveryStep(prevStep);
    }
  };

  const renderStep = () => {
    switch (discoveryStep) {
      case "welcome":
        return <WelcomeStep />;
      case "manufacturing-type":
        return <ManufacturingTypeStep />;
      case "organization-type":
        return <OrganizationTypeStep />;
      case "team-size":
        return <TeamSizeStep />;
      case "quality-requirements":
        return <QualityRequirementsStep />;
      case "government-details":
        return <GovernmentDetailsStep />;
      case "summary":
        return <SummaryStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Configuration Setup</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {discoveryProgress}% complete
            </span>
          </div>
          <Progress value={discoveryProgress} className="h-1" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={discoveryStep}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation footer */}
        <footer className="border-t border-border px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={!prevStep}
              className={cn(!prevStep && "invisible")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button onClick={handleNext}>
              {isSummary ? (
                <>
                  Continue to Configuration
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : isWelcome ? (
                <>
                  Let's Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
