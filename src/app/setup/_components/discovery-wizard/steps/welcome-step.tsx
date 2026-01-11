"use client";

/**
 * WelcomeStep
 *
 * The first step in the discovery wizard.
 * Sets a friendly, helpful tone for the setup process.
 */

import { Settings, Zap, Shield, Package } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Let's set up your procurement system
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          I'll ask a few questions to understand your operations, then configure
          the system to match how you work. This takes about 2 minutes.
        </p>
      </div>

      {/* What we'll cover */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          What we'll cover
        </h2>
        <div className="grid gap-4">
          <FeatureItem
            icon={Package}
            title="Your manufacturing type"
            description="Discrete, process, or mixed manufacturing"
          />
          <FeatureItem
            icon={Shield}
            title="Compliance requirements"
            description="Commercial and/or government contracting"
          />
          <FeatureItem
            icon={Settings}
            title="Quality & approvals"
            description="Inspection levels and approval workflows"
          />
          <FeatureItem
            icon={Zap}
            title="Smart defaults"
            description="I'll recommend settings based on your answers"
          />
        </div>
      </div>

      {/* Reassurance */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Don't worry about getting everything perfect—you can always adjust
          settings later. I'll explain each option as we go.
        </p>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
