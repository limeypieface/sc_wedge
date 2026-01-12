"use client"

/**
 * Feature Flags Context
 *
 * Provides runtime access to feature flags throughout the application.
 * Flags are persisted to localStorage and can be toggled via the admin UI.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import {
  FEATURE_FLAG_DEFINITIONS,
  FEATURE_FLAGS_MAP,
  getDefaultFlagValues,
  type FeatureFlagId,
} from "@/config/feature-flags"

// ============================================================================
// TYPES
// ============================================================================

interface FeatureFlagsState {
  /** Current flag values */
  flags: Record<string, boolean>
  /** Whether flags have been loaded from storage */
  isLoaded: boolean
  /** Timestamp of last update */
  lastUpdated: number | null
}

interface FeatureFlagsContextValue {
  /** Current state */
  state: FeatureFlagsState

  /** Check if a specific flag is enabled */
  isEnabled: (flagId: string) => boolean

  /** Toggle a single flag */
  toggleFlag: (flagId: string) => void

  /** Set a flag to a specific value */
  setFlag: (flagId: string, value: boolean) => void

  /** Set multiple flags at once */
  setFlags: (flags: Record<string, boolean>) => void

  /** Reset all flags to defaults */
  resetToDefaults: () => void

  /** Reset a single flag to its default */
  resetFlag: (flagId: string) => void

  /** Get all flags that are different from defaults */
  getModifiedFlags: () => Record<string, boolean>

  /** Check if any flags have been modified from defaults */
  hasModifications: () => boolean
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = "sindri_feature_flags"
const STORAGE_TIMESTAMP_KEY = "sindri_feature_flags_updated"

function loadFlagsFromStorage(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn("Failed to load feature flags from storage:", e)
  }
  return null
}

function saveFlagsToStorage(flags: Record<string, boolean>): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString())
  } catch (e) {
    console.warn("Failed to save feature flags to storage:", e)
  }
}

function getStorageTimestamp(): number | null {
  if (typeof window === "undefined") return null

  try {
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY)
    return timestamp ? parseInt(timestamp, 10) : null
  } catch {
    return null
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface FeatureFlagsProviderProps {
  children: ReactNode
  /** Optional initial overrides (useful for testing) */
  initialOverrides?: Record<string, boolean>
}

export function FeatureFlagsProvider({
  children,
  initialOverrides,
}: FeatureFlagsProviderProps) {
  const [state, setState] = useState<FeatureFlagsState>({
    flags: getDefaultFlagValues(),
    isLoaded: false,
    lastUpdated: null,
  })

  // Load flags from storage on mount
  useEffect(() => {
    const defaults = getDefaultFlagValues()
    const stored = loadFlagsFromStorage()
    const timestamp = getStorageTimestamp()

    // Merge: defaults < stored < initialOverrides
    const merged = {
      ...defaults,
      ...(stored || {}),
      ...(initialOverrides || {}),
    }

    setState({
      flags: merged,
      isLoaded: true,
      lastUpdated: timestamp,
    })
  }, [initialOverrides])

  // Check if a flag is enabled, considering dependencies
  const isEnabled = useCallback(
    (flagId: string): boolean => {
      const flagValue = state.flags[flagId]
      if (!flagValue) return false

      // Check dependencies
      const flagDef = FEATURE_FLAGS_MAP[flagId]
      if (flagDef?.dependencies) {
        for (const dep of flagDef.dependencies) {
          if (!state.flags[dep]) {
            return false
          }
        }
      }

      return true
    },
    [state.flags]
  )

  // Toggle a flag
  const toggleFlag = useCallback((flagId: string) => {
    setState((prev) => {
      const newFlags = {
        ...prev.flags,
        [flagId]: !prev.flags[flagId],
      }
      saveFlagsToStorage(newFlags)
      return {
        ...prev,
        flags: newFlags,
        lastUpdated: Date.now(),
      }
    })
  }, [])

  // Set a flag to a specific value
  const setFlag = useCallback((flagId: string, value: boolean) => {
    setState((prev) => {
      const newFlags = {
        ...prev.flags,
        [flagId]: value,
      }
      saveFlagsToStorage(newFlags)
      return {
        ...prev,
        flags: newFlags,
        lastUpdated: Date.now(),
      }
    })
  }, [])

  // Set multiple flags at once
  const setFlags = useCallback((flags: Record<string, boolean>) => {
    setState((prev) => {
      const newFlags = {
        ...prev.flags,
        ...flags,
      }
      saveFlagsToStorage(newFlags)
      return {
        ...prev,
        flags: newFlags,
        lastUpdated: Date.now(),
      }
    })
  }, [])

  // Reset all flags to defaults
  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultFlagValues()
    setState((prev) => {
      saveFlagsToStorage(defaults)
      return {
        ...prev,
        flags: defaults,
        lastUpdated: Date.now(),
      }
    })
  }, [])

  // Reset a single flag to its default
  const resetFlag = useCallback((flagId: string) => {
    const flagDef = FEATURE_FLAGS_MAP[flagId]
    if (!flagDef) return

    setState((prev) => {
      const newFlags = {
        ...prev.flags,
        [flagId]: flagDef.defaultValue,
      }
      saveFlagsToStorage(newFlags)
      return {
        ...prev,
        flags: newFlags,
        lastUpdated: Date.now(),
      }
    })
  }, [])

  // Get all flags that differ from defaults
  const getModifiedFlags = useCallback((): Record<string, boolean> => {
    const defaults = getDefaultFlagValues()
    const modified: Record<string, boolean> = {}

    for (const [key, value] of Object.entries(state.flags)) {
      if (defaults[key] !== value) {
        modified[key] = value
      }
    }

    return modified
  }, [state.flags])

  // Check if any flags have been modified
  const hasModifications = useCallback((): boolean => {
    return Object.keys(getModifiedFlags()).length > 0
  }, [getModifiedFlags])

  const value: FeatureFlagsContextValue = {
    state,
    isEnabled,
    toggleFlag,
    setFlag,
    setFlags,
    resetToDefaults,
    resetFlag,
    getModifiedFlags,
    hasModifications,
  }

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access feature flags context
 * @throws Error if used outside of FeatureFlagsProvider
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext)
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider")
  }
  return context
}

/**
 * Safe version that returns null if no provider
 */
export function useFeatureFlagsSafe(): FeatureFlagsContextValue | null {
  return useContext(FeatureFlagsContext)
}

/**
 * Convenience hook to check a single flag
 */
export function useFeatureFlag(flagId: FeatureFlagId | string): boolean {
  const context = useContext(FeatureFlagsContext)
  if (!context) {
    // Return default value if no provider
    const flagDef = FEATURE_FLAGS_MAP[flagId]
    return flagDef?.defaultValue ?? false
  }
  return context.isEnabled(flagId)
}

/**
 * Hook to check multiple flags at once
 */
export function useFeatureFlagsMultiple(
  flagIds: (FeatureFlagId | string)[]
): Record<string, boolean> {
  const context = useContext(FeatureFlagsContext)

  return flagIds.reduce(
    (acc, flagId) => {
      if (!context) {
        const flagDef = FEATURE_FLAGS_MAP[flagId]
        acc[flagId] = flagDef?.defaultValue ?? false
      } else {
        acc[flagId] = context.isEnabled(flagId)
      }
      return acc
    },
    {} as Record<string, boolean>
  )
}
