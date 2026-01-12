"use client"

/**
 * Feature Flag Components
 *
 * Components for conditional rendering based on feature flags.
 * Provides a clean, declarative API for feature toggling in JSX.
 */

import { type ReactNode } from "react"
import { useFeatureFlag, useFeatureFlagsSafe } from "@/context/FeatureFlagsContext"
import type { FeatureFlagId } from "@/config/feature-flags"

// ============================================================================
// FEATURE COMPONENT
// ============================================================================

interface FeatureProps {
  /** The feature flag ID to check */
  flag: FeatureFlagId | string
  /** Content to render when the feature is enabled */
  children: ReactNode
  /** Optional content to render when the feature is disabled */
  fallback?: ReactNode
  /** If true, renders children when flag is OFF (inverse logic) */
  inverse?: boolean
}

/**
 * Conditionally render content based on a feature flag.
 *
 * @example
 * // Basic usage
 * <Feature flag="rma_workflow">
 *   <RMAPanel />
 * </Feature>
 *
 * @example
 * // With fallback
 * <Feature flag="ai_assistant" fallback={<ManualSearch />}>
 *   <AIAssistant />
 * </Feature>
 *
 * @example
 * // Inverse (show when disabled)
 * <Feature flag="new_ui" inverse>
 *   <LegacyComponent />
 * </Feature>
 */
export function Feature({
  flag,
  children,
  fallback = null,
  inverse = false,
}: FeatureProps) {
  const isEnabled = useFeatureFlag(flag)
  const shouldRender = inverse ? !isEnabled : isEnabled

  return <>{shouldRender ? children : fallback}</>
}

// ============================================================================
// FEATURE GATE COMPONENT
// ============================================================================

interface FeatureGateProps {
  /** Feature flags that must ALL be enabled */
  require?: (FeatureFlagId | string)[]
  /** Feature flags where AT LEAST ONE must be enabled */
  requireAny?: (FeatureFlagId | string)[]
  /** Feature flags that must ALL be disabled */
  exclude?: (FeatureFlagId | string)[]
  /** Content to render when conditions are met */
  children: ReactNode
  /** Optional content to render when conditions are not met */
  fallback?: ReactNode
}

/**
 * Conditionally render content based on multiple feature flag conditions.
 *
 * @example
 * // Require multiple flags
 * <FeatureGate require={["email_integration", "ai_email_generation"]}>
 *   <AIEmailComposer />
 * </FeatureGate>
 *
 * @example
 * // Require any of several flags
 * <FeatureGate requireAny={["voip_calling", "email_integration"]}>
 *   <CommunicationPanel />
 * </FeatureGate>
 *
 * @example
 * // Complex conditions
 * <FeatureGate
 *   require={["ai_assistant"]}
 *   exclude={["compact_mode"]}
 * >
 *   <FullAIPanel />
 * </FeatureGate>
 */
export function FeatureGate({
  require = [],
  requireAny = [],
  exclude = [],
  children,
  fallback = null,
}: FeatureGateProps) {
  const context = useFeatureFlagsSafe()

  // Check if flag is enabled (handles missing context gracefully)
  const checkFlag = (flagId: string): boolean => {
    if (!context) return false
    return context.isEnabled(flagId)
  }

  // All required flags must be enabled
  const allRequiredEnabled = require.every(checkFlag)

  // At least one of requireAny must be enabled (or requireAny is empty)
  const anyRequiredEnabled = requireAny.length === 0 || requireAny.some(checkFlag)

  // All excluded flags must be disabled
  const allExcludedDisabled = exclude.every((flagId) => !checkFlag(flagId))

  const shouldRender = allRequiredEnabled && anyRequiredEnabled && allExcludedDisabled

  return <>{shouldRender ? children : fallback}</>
}

// ============================================================================
// FEATURE DEBUG COMPONENT
// ============================================================================

interface FeatureDebugProps {
  /** Show debug info for specific flags, or all if not specified */
  flags?: (FeatureFlagId | string)[]
  /** Only show in development mode */
  devOnly?: boolean
}

/**
 * Debug component to display current feature flag states.
 * Useful during development to verify flag states.
 *
 * @example
 * <FeatureDebug flags={["rma_workflow", "ai_assistant"]} />
 */
export function FeatureDebug({ flags, devOnly = true }: FeatureDebugProps) {
  const context = useFeatureFlagsSafe()

  // Only render in development if devOnly is true
  if (devOnly && process.env.NODE_ENV !== "development") {
    return null
  }

  if (!context) {
    return (
      <div className="text-xs text-red-500 p-2 bg-red-50 rounded">
        FeatureFlagsProvider not found
      </div>
    )
  }

  const { state } = context
  const flagsToShow = flags || Object.keys(state.flags)

  return (
    <div className="text-xs font-mono p-2 bg-muted rounded border space-y-1">
      <div className="font-semibold text-muted-foreground mb-2">Feature Flags</div>
      {flagsToShow.map((flagId) => (
        <div key={flagId} className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              context.isEnabled(flagId) ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-muted-foreground">{flagId}:</span>
          <span>{context.isEnabled(flagId) ? "ON" : "OFF"}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// HOC FOR CLASS COMPONENTS
// ============================================================================

/**
 * Higher-order component to wrap a component with feature flag check.
 *
 * @example
 * const ProtectedComponent = withFeatureFlag("premium_feature")(MyComponent)
 */
export function withFeatureFlag<P extends object>(
  flagId: FeatureFlagId | string,
  FallbackComponent?: React.ComponentType<P>
) {
  return function WithFeatureFlagWrapper(
    WrappedComponent: React.ComponentType<P>
  ) {
    return function WithFeatureFlag(props: P) {
      const isEnabled = useFeatureFlag(flagId)

      if (!isEnabled) {
        if (FallbackComponent) {
          return <FallbackComponent {...props} />
        }
        return null
      }

      return <WrappedComponent {...props} />
    }
  }
}
