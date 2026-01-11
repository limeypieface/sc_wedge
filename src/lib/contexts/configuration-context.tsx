"use client";

/**
 * ConfigurationContext
 *
 * Manages the purchasing configuration state throughout the setup flow.
 * Handles discovery, recommendations, and configuration persistence.
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";
import {
  PurchasingConfiguration,
  DiscoveryContext,
  ComplexityTier,
  OrganizationType,
  ManufacturingType,
  ApprovalConfiguration,
  QualityConfiguration,
  ReceivingConfiguration,
  GovernmentConfiguration,
  VendorConfiguration,
  NotificationConfiguration,
  ConfigurationRecommendation,
  computeRecommendedTier,
  getDefaultConfiguration,
  generateRecommendations,
  DEFAULT_COMMERCIAL_STARTER,
} from "@/types/configuration.types";

// ============================================================================
// TYPES
// ============================================================================

/** Discovery step in the wizard */
export type DiscoveryStep =
  | "welcome"
  | "manufacturing-type"
  | "organization-type"
  | "team-size"
  | "quality-requirements"
  | "government-details"
  | "summary";

/** Overall setup phase */
export type SetupPhase = "discovery" | "review" | "configure" | "complete";

/** Configuration section being edited */
export type ConfigSection =
  | "approval"
  | "quality"
  | "receiving"
  | "government"
  | "vendor"
  | "notifications";

/** State shape */
interface ConfigurationState {
  /** Current setup phase */
  phase: SetupPhase;

  /** Current discovery step */
  discoveryStep: DiscoveryStep;

  /** Discovery answers (partial during wizard) */
  discovery: Partial<DiscoveryContext>;

  /** Full configuration (populated after discovery) */
  configuration: PurchasingConfiguration | null;

  /** AI-generated recommendations */
  recommendations: ConfigurationRecommendation[];

  /** Which config section is being edited */
  activeSection: ConfigSection | null;

  /** Unsaved changes flag */
  hasUnsavedChanges: boolean;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: string | null;
}

/** Action types */
type ConfigurationAction =
  | { type: "SET_PHASE"; phase: SetupPhase }
  | { type: "SET_DISCOVERY_STEP"; step: DiscoveryStep }
  | { type: "UPDATE_DISCOVERY"; updates: Partial<DiscoveryContext> }
  | { type: "COMPLETE_DISCOVERY" }
  | { type: "SET_CONFIGURATION"; config: PurchasingConfiguration }
  | { type: "UPDATE_SECTION"; section: ConfigSection; data: unknown }
  | { type: "SET_ACTIVE_SECTION"; section: ConfigSection | null }
  | { type: "APPLY_RECOMMENDATION"; recommendation: ConfigurationRecommendation }
  | { type: "DISMISS_RECOMMENDATION"; recommendation: ConfigurationRecommendation }
  | { type: "SAVE_CONFIGURATION" }
  | { type: "RESET_CONFIGURATION" }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null };

/** Context value */
interface ConfigurationContextValue extends ConfigurationState {
  // Phase navigation
  setPhase: (phase: SetupPhase) => void;

  // Discovery methods
  setDiscoveryStep: (step: DiscoveryStep) => void;
  updateDiscovery: (updates: Partial<DiscoveryContext>) => void;
  completeDiscovery: () => void;
  getNextDiscoveryStep: () => DiscoveryStep | null;
  getPreviousDiscoveryStep: () => DiscoveryStep | null;

  // Configuration methods
  updateSection: <T extends ConfigSection>(section: T, data: SectionDataType<T>) => void;
  setActiveSection: (section: ConfigSection | null) => void;

  // Recommendation methods
  applyRecommendation: (recommendation: ConfigurationRecommendation) => void;
  dismissRecommendation: (recommendation: ConfigurationRecommendation) => void;

  // Persistence
  saveConfiguration: () => Promise<void>;
  resetConfiguration: () => void;

  // Computed values
  recommendedTier: ComplexityTier;
  isGovernment: boolean;
  discoveryProgress: number;
}

// Type helper for section data
type SectionDataType<T extends ConfigSection> = T extends "approval"
  ? Partial<ApprovalConfiguration>
  : T extends "quality"
  ? Partial<QualityConfiguration>
  : T extends "receiving"
  ? Partial<ReceivingConfiguration>
  : T extends "government"
  ? Partial<GovernmentConfiguration>
  : T extends "vendor"
  ? Partial<VendorConfiguration>
  : T extends "notifications"
  ? Partial<NotificationConfiguration>
  : never;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ConfigurationState = {
  phase: "discovery",
  discoveryStep: "welcome",
  discovery: {},
  configuration: null,
  recommendations: [],
  activeSection: null,
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
};

// ============================================================================
// REDUCER
// ============================================================================

function configurationReducer(
  state: ConfigurationState,
  action: ConfigurationAction
): ConfigurationState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "SET_DISCOVERY_STEP":
      return { ...state, discoveryStep: action.step };

    case "UPDATE_DISCOVERY": {
      const newDiscovery = { ...state.discovery, ...action.updates };
      // Auto-compute recommended tier
      newDiscovery.recommendedTier = computeRecommendedTier(newDiscovery);
      return { ...state, discovery: newDiscovery };
    }

    case "COMPLETE_DISCOVERY": {
      const tier = state.discovery.recommendedTier || ComplexityTier.Starter;
      const orgType = state.discovery.organizationType || OrganizationType.Commercial;
      const baseConfig = getDefaultConfiguration(tier, orgType);

      const config: PurchasingConfiguration = {
        ...baseConfig,
        id: crypto.randomUUID(),
        organizationName: "",
        discovery: state.discovery as DiscoveryContext,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const recommendations = generateRecommendations(config);

      return {
        ...state,
        phase: "review",
        configuration: config,
        recommendations,
      };
    }

    case "SET_CONFIGURATION":
      return {
        ...state,
        configuration: action.config,
        recommendations: generateRecommendations(action.config),
      };

    case "UPDATE_SECTION": {
      if (!state.configuration) return state;

      const updated = {
        ...state.configuration,
        [action.section]: {
          ...state.configuration[action.section as keyof PurchasingConfiguration],
          ...(action.data as object),
        },
        updatedAt: new Date(),
      };

      return {
        ...state,
        configuration: updated,
        recommendations: generateRecommendations(updated),
        hasUnsavedChanges: true,
      };
    }

    case "SET_ACTIVE_SECTION":
      return { ...state, activeSection: action.section };

    case "APPLY_RECOMMENDATION": {
      if (!state.configuration) return state;

      const { section, field, recommendedValue } = action.recommendation;
      const sectionData = state.configuration[section as keyof PurchasingConfiguration];

      if (typeof sectionData === "object" && sectionData !== null) {
        const updated = {
          ...state.configuration,
          [section]: {
            ...sectionData,
            [field]: recommendedValue,
          },
          updatedAt: new Date(),
        };

        return {
          ...state,
          configuration: updated,
          recommendations: state.recommendations.filter(
            (r) => !(r.section === section && r.field === field)
          ),
          hasUnsavedChanges: true,
        };
      }
      return state;
    }

    case "DISMISS_RECOMMENDATION":
      return {
        ...state,
        recommendations: state.recommendations.filter(
          (r) =>
            !(
              r.section === action.recommendation.section &&
              r.field === action.recommendation.field
            )
        ),
      };

    case "SAVE_CONFIGURATION":
      return { ...state, hasUnsavedChanges: false };

    case "RESET_CONFIGURATION":
      return initialState;

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    case "SET_ERROR":
      return { ...state, error: action.error };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const ConfigurationContext = createContext<ConfigurationContextValue | null>(null);

// ============================================================================
// DISCOVERY STEP ORDER
// ============================================================================

const DISCOVERY_STEPS: DiscoveryStep[] = [
  "welcome",
  "manufacturing-type",
  "organization-type",
  "team-size",
  "quality-requirements",
  "government-details",
  "summary",
];

function getStepIndex(step: DiscoveryStep): number {
  return DISCOVERY_STEPS.indexOf(step);
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ConfigurationProviderProps {
  children: React.ReactNode;
}

export function ConfigurationProvider({ children }: ConfigurationProviderProps) {
  const [state, dispatch] = useReducer(configurationReducer, initialState);

  // Phase navigation
  const setPhase = useCallback((phase: SetupPhase) => {
    dispatch({ type: "SET_PHASE", phase });
  }, []);

  // Discovery methods
  const setDiscoveryStep = useCallback((step: DiscoveryStep) => {
    dispatch({ type: "SET_DISCOVERY_STEP", step });
  }, []);

  const updateDiscovery = useCallback((updates: Partial<DiscoveryContext>) => {
    dispatch({ type: "UPDATE_DISCOVERY", updates });
  }, []);

  const completeDiscovery = useCallback(() => {
    dispatch({ type: "COMPLETE_DISCOVERY" });
  }, []);

  const getNextDiscoveryStep = useCallback((): DiscoveryStep | null => {
    const currentIndex = getStepIndex(state.discoveryStep);

    // Skip government-details if not government org type
    let nextIndex = currentIndex + 1;
    if (
      DISCOVERY_STEPS[nextIndex] === "government-details" &&
      state.discovery.organizationType !== OrganizationType.Government &&
      state.discovery.organizationType !== OrganizationType.Both
    ) {
      nextIndex++;
    }

    if (nextIndex >= DISCOVERY_STEPS.length) return null;
    return DISCOVERY_STEPS[nextIndex];
  }, [state.discoveryStep, state.discovery.organizationType]);

  const getPreviousDiscoveryStep = useCallback((): DiscoveryStep | null => {
    const currentIndex = getStepIndex(state.discoveryStep);

    // Skip government-details if not government org type
    let prevIndex = currentIndex - 1;
    if (
      DISCOVERY_STEPS[prevIndex] === "government-details" &&
      state.discovery.organizationType !== OrganizationType.Government &&
      state.discovery.organizationType !== OrganizationType.Both
    ) {
      prevIndex--;
    }

    if (prevIndex < 0) return null;
    return DISCOVERY_STEPS[prevIndex];
  }, [state.discoveryStep, state.discovery.organizationType]);

  // Configuration methods
  const updateSection = useCallback(
    <T extends ConfigSection>(section: T, data: SectionDataType<T>) => {
      dispatch({ type: "UPDATE_SECTION", section, data });
    },
    []
  );

  const setActiveSection = useCallback((section: ConfigSection | null) => {
    dispatch({ type: "SET_ACTIVE_SECTION", section });
  }, []);

  // Recommendation methods
  const applyRecommendation = useCallback(
    (recommendation: ConfigurationRecommendation) => {
      dispatch({ type: "APPLY_RECOMMENDATION", recommendation });
    },
    []
  );

  const dismissRecommendation = useCallback(
    (recommendation: ConfigurationRecommendation) => {
      dispatch({ type: "DISMISS_RECOMMENDATION", recommendation });
    },
    []
  );

  // Persistence
  const saveConfiguration = useCallback(async () => {
    dispatch({ type: "SET_LOADING", isLoading: true });
    try {
      // In a real app, this would save to an API
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({ type: "SAVE_CONFIGURATION" });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        error: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, []);

  const resetConfiguration = useCallback(() => {
    dispatch({ type: "RESET_CONFIGURATION" });
  }, []);

  // Computed values
  const recommendedTier = useMemo(
    () => state.discovery.recommendedTier || ComplexityTier.Starter,
    [state.discovery.recommendedTier]
  );

  const isGovernment = useMemo(
    () =>
      state.discovery.organizationType === OrganizationType.Government ||
      state.discovery.organizationType === OrganizationType.Both,
    [state.discovery.organizationType]
  );

  const discoveryProgress = useMemo(() => {
    const currentIndex = getStepIndex(state.discoveryStep);
    return Math.round((currentIndex / (DISCOVERY_STEPS.length - 1)) * 100);
  }, [state.discoveryStep]);

  const value: ConfigurationContextValue = useMemo(
    () => ({
      ...state,
      setPhase,
      setDiscoveryStep,
      updateDiscovery,
      completeDiscovery,
      getNextDiscoveryStep,
      getPreviousDiscoveryStep,
      updateSection,
      setActiveSection,
      applyRecommendation,
      dismissRecommendation,
      saveConfiguration,
      resetConfiguration,
      recommendedTier,
      isGovernment,
      discoveryProgress,
    }),
    [
      state,
      setPhase,
      setDiscoveryStep,
      updateDiscovery,
      completeDiscovery,
      getNextDiscoveryStep,
      getPreviousDiscoveryStep,
      updateSection,
      setActiveSection,
      applyRecommendation,
      dismissRecommendation,
      saveConfiguration,
      resetConfiguration,
      recommendedTier,
      isGovernment,
      discoveryProgress,
    ]
  );

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useConfiguration(): ConfigurationContextValue {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error(
      "useConfiguration must be used within a ConfigurationProvider"
    );
  }
  return context;
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/** Hook for just the discovery state */
export function useDiscovery() {
  const {
    discovery,
    discoveryStep,
    discoveryProgress,
    updateDiscovery,
    setDiscoveryStep,
    getNextDiscoveryStep,
    getPreviousDiscoveryStep,
    completeDiscovery,
    recommendedTier,
    isGovernment,
  } = useConfiguration();

  return {
    discovery,
    discoveryStep,
    discoveryProgress,
    updateDiscovery,
    setDiscoveryStep,
    getNextDiscoveryStep,
    getPreviousDiscoveryStep,
    completeDiscovery,
    recommendedTier,
    isGovernment,
  };
}

/** Hook for recommendation management */
export function useRecommendations() {
  const { recommendations, applyRecommendation, dismissRecommendation } =
    useConfiguration();

  const highImpactCount = useMemo(
    () => recommendations.filter((r) => r.impact === "high").length,
    [recommendations]
  );

  return {
    recommendations,
    applyRecommendation,
    dismissRecommendation,
    highImpactCount,
    hasRecommendations: recommendations.length > 0,
  };
}
