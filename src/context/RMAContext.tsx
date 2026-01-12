"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type {
  RMA,
  RMAStatus,
  RMAVariant,
  CreateRMAInput,
  RecordAuthorizationInput,
  RecordResolutionInput,
  RMATimelineEvent,
} from "@/types/rma-types"

// ============================================================================
// CONTEXT STATE
// ============================================================================

interface RMAContextState {
  // All active RMAs
  activeRMAs: RMA[]

  // Currently selected RMA (for slide panel)
  selectedRMA: RMA | null

  // Slide panel open state
  isPanelOpen: boolean
}

// ============================================================================
// CONTEXT VALUE
// ============================================================================

interface RMAContextValue {
  // State
  state: RMAContextState

  // Panel controls
  openRMAPanel: (rma: RMA) => void
  closeRMAPanel: () => void

  // RMA CRUD operations
  createRMA: (input: CreateRMAInput) => Promise<RMA>
  updateRMAStatus: (rmaId: string, status: RMAStatus, data?: Partial<RMA>) => void

  // Workflow actions
  recordAuthorization: (rmaId: string, input: RecordAuthorizationInput) => void
  recordReturnShipped: (rmaId: string, carrier: string, trackingNumber: string) => void
  recordResolution: (rmaId: string, input: RecordResolutionInput) => void

  // Queries
  getRMAById: (rmaId: string) => RMA | undefined
  getRMAForIssue: (issueId: string) => RMA | undefined
  hasActiveRMA: (issueId: string) => boolean
  getRMAsForOrder: (orderNumber: string) => RMA[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRMAId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `RMA-${year}-${random}`
}

function createTimelineEvent(
  status: RMAStatus,
  description: string,
  actor?: string
): RMATimelineEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    status,
    description,
    actor,
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const RMAContext = createContext<RMAContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface RMAProviderProps {
  children: ReactNode
  initialRMAs?: RMA[]
}

export function RMAProvider({ children, initialRMAs = [] }: RMAProviderProps) {
  const [state, setState] = useState<RMAContextState>({
    activeRMAs: initialRMAs,
    selectedRMA: null,
    isPanelOpen: false,
  })

  // -------------------------------------------------------------------------
  // Panel Controls
  // -------------------------------------------------------------------------

  const openRMAPanel = useCallback((rma: RMA) => {
    setState((prev) => ({
      ...prev,
      selectedRMA: rma,
      isPanelOpen: true,
    }))
  }, [])

  const closeRMAPanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPanelOpen: false,
      // Keep selectedRMA for animation, clear after close
    }))
  }, [])

  // -------------------------------------------------------------------------
  // RMA CRUD Operations
  // -------------------------------------------------------------------------

  const createRMA = useCallback(async (input: CreateRMAInput): Promise<RMA> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newRMA: RMA = {
      id: generateRMAId(),
      variant: input.variant,
      orderNumber: input.orderNumber,
      issueId: input.issueId,
      ncrId: input.ncrId,
      shipmentId: input.shipmentId,
      lineNumber: input.lineNumber,
      sku: input.sku,
      itemName: input.itemName,
      type: input.type,
      reason: input.reason,
      qtyAffected: input.qtyAffected,
      status: "requested",
      requestedDate: new Date().toISOString(),
      requestedBy: "Current User", // Would come from auth context
      notes: input.notes,
      timeline: [
        createTimelineEvent("requested", "RMA request created", "Current User"),
      ],
    }

    setState((prev) => ({
      ...prev,
      activeRMAs: [...prev.activeRMAs, newRMA],
    }))

    return newRMA
  }, [])

  const updateRMAStatus = useCallback(
    (rmaId: string, status: RMAStatus, data?: Partial<RMA>) => {
      setState((prev) => ({
        ...prev,
        activeRMAs: prev.activeRMAs.map((rma) => {
          if (rma.id !== rmaId) return rma

          const timelineEvent = createTimelineEvent(
            status,
            `Status changed to ${status.replace(/_/g, " ")}`,
            "Current User"
          )

          return {
            ...rma,
            ...data,
            status,
            timeline: [...(rma.timeline || []), timelineEvent],
          }
        }),
        // Update selectedRMA if it's the one being updated
        selectedRMA:
          prev.selectedRMA?.id === rmaId
            ? {
                ...prev.selectedRMA,
                ...data,
                status,
                timeline: [
                  ...(prev.selectedRMA.timeline || []),
                  createTimelineEvent(
                    status,
                    `Status changed to ${status.replace(/_/g, " ")}`,
                    "Current User"
                  ),
                ],
              }
            : prev.selectedRMA,
      }))
    },
    []
  )

  // -------------------------------------------------------------------------
  // Workflow Actions
  // -------------------------------------------------------------------------

  const recordAuthorization = useCallback(
    (rmaId: string, input: RecordAuthorizationInput) => {
      setState((prev) => {
        const updateRMA = (rma: RMA): RMA => {
          if (rma.id !== rmaId) return rma

          const timelineEvent = createTimelineEvent(
            "authorized",
            `Authorized with RMA# ${input.rmaNumber}`,
            "Current User"
          )

          return {
            ...rma,
            status: "authorized",
            rmaNumber: input.rmaNumber,
            returnAddress: input.returnAddress,
            returnInstructions: input.returnInstructions,
            authorizedDate: new Date().toISOString(),
            timeline: [...(rma.timeline || []), timelineEvent],
          }
        }

        return {
          ...prev,
          activeRMAs: prev.activeRMAs.map(updateRMA),
          selectedRMA: prev.selectedRMA
            ? updateRMA(prev.selectedRMA)
            : prev.selectedRMA,
        }
      })
    },
    []
  )

  const recordReturnShipped = useCallback(
    (rmaId: string, carrier: string, trackingNumber: string) => {
      setState((prev) => {
        const updateRMA = (rma: RMA): RMA => {
          if (rma.id !== rmaId) return rma

          const timelineEvent = createTimelineEvent(
            "return_shipped",
            `Return shipped via ${carrier} (${trackingNumber})`,
            "Current User"
          )

          return {
            ...rma,
            status: "return_shipped",
            returnCarrier: carrier,
            returnTrackingNumber: trackingNumber,
            returnShippedDate: new Date().toISOString(),
            timeline: [...(rma.timeline || []), timelineEvent],
          }
        }

        return {
          ...prev,
          activeRMAs: prev.activeRMAs.map(updateRMA),
          selectedRMA: prev.selectedRMA
            ? updateRMA(prev.selectedRMA)
            : prev.selectedRMA,
        }
      })
    },
    []
  )

  const recordResolution = useCallback(
    (rmaId: string, input: RecordResolutionInput) => {
      setState((prev) => {
        const updateRMA = (rma: RMA): RMA => {
          if (rma.id !== rmaId) return rma

          let description = "RMA resolved"
          if (input.replacementShipmentId) {
            description = `Resolved - Replacement shipped (${input.replacementShipmentId})`
          } else if (input.creditMemoNumber) {
            description = `Resolved - Credit issued (${input.creditMemoNumber})`
          } else if (input.dispositionNotes) {
            description = `Resolved - Disposed per instructions`
          }

          const timelineEvent = createTimelineEvent(
            "resolved",
            description,
            "Current User"
          )

          return {
            ...rma,
            status: "resolved",
            replacementShipmentId: input.replacementShipmentId,
            creditMemoNumber: input.creditMemoNumber,
            creditAmount: input.creditAmount,
            dispositionNotes: input.dispositionNotes,
            resolvedDate: new Date().toISOString(),
            timeline: [...(rma.timeline || []), timelineEvent],
          }
        }

        return {
          ...prev,
          activeRMAs: prev.activeRMAs.map(updateRMA),
          selectedRMA: prev.selectedRMA
            ? updateRMA(prev.selectedRMA)
            : prev.selectedRMA,
        }
      })
    },
    []
  )

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const getRMAById = useCallback(
    (rmaId: string): RMA | undefined => {
      return state.activeRMAs.find((rma) => rma.id === rmaId)
    },
    [state.activeRMAs]
  )

  const getRMAForIssue = useCallback(
    (issueId: string): RMA | undefined => {
      return state.activeRMAs.find(
        (rma) => rma.issueId === issueId && rma.status !== "resolved"
      )
    },
    [state.activeRMAs]
  )

  const hasActiveRMA = useCallback(
    (issueId: string): boolean => {
      return state.activeRMAs.some(
        (rma) => rma.issueId === issueId && rma.status !== "resolved"
      )
    },
    [state.activeRMAs]
  )

  const getRMAsForOrder = useCallback(
    (orderNumber: string): RMA[] => {
      return state.activeRMAs.filter((rma) => rma.orderNumber === orderNumber)
    },
    [state.activeRMAs]
  )

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------

  const value: RMAContextValue = {
    state,
    openRMAPanel,
    closeRMAPanel,
    createRMA,
    updateRMAStatus,
    recordAuthorization,
    recordReturnShipped,
    recordResolution,
    getRMAById,
    getRMAForIssue,
    hasActiveRMA,
    getRMAsForOrder,
  }

  return <RMAContext.Provider value={value}>{children}</RMAContext.Provider>
}

// ============================================================================
// HOOKS
// ============================================================================

export function useRMAContext() {
  const context = useContext(RMAContext)
  if (!context) {
    throw new Error("useRMAContext must be used within an RMAProvider")
  }
  return context
}

// Safe hook that doesn't throw - useful for optional RMA functionality
export function useRMASafe() {
  return useContext(RMAContext)
}
