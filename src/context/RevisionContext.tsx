"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import { RevisionStatus } from "@/types/revision-status"
import type {
  Approver,
  ApprovalChain,
  ApprovalStep,
  CurrentUser,
} from "@/types/approval-types"
import type { PORevision, RevisionChange, AuditLogEntry } from "@/types/po-revision"
import { getNextVersionNumber, upgradeToMajorVersion } from "@/types/po-revision"
import {
  simulatedUsers,
  approvers,
  createApprovalChain,
  getPOData,
  lineItems as defaultLineItems,
  type LineItem,
} from "@/lib/mock-data"

// Map approvers to use simulated user IDs for consistency
function getApproversWithMatchingIds(): typeof approvers {
  return approvers.map(approver => {
    const matchingUser = simulatedUsers.find(u => u.name === approver.name)
    if (matchingUser) {
      return { ...approver, id: matchingUser.id }
    }
    return approver
  })
}

// Create initial revisions for a PO
// Only creates the active (acknowledged) revision - user initiates any drafts
function createInitialRevisions(poNumber: string): PORevision[] {
  const poData = getPOData(poNumber)
  const lineItems = poData?.lineItems || defaultLineItems

  // Active revision (the current acknowledged version)
  const activeRevision: PORevision = {
    id: `REV-${poNumber}-001`,
    poNumber,
    version: "1.0",
    status: RevisionStatus.Acknowledged,
    lineItems: [...lineItems],
    notes: "",
    createdAt: "Jan 5, 2026",
    createdBy: "John Smith",
    acknowledgedAt: "Jan 6, 2026",
    acknowledgedBy: "Vendor Contact",
    changes: [],
    changesSummary: "Initial PO created",
    isActive: true,
    isDraft: false,
  }

  // Only return the active revision - user initiates revision mode
  return [activeRevision]
}

interface CostDeltaInfo {
  originalTotal: number
  currentTotal: number
  delta: number
  deltaPercent: number
}

interface RevisionContextType {
  // Current user (for simulation)
  currentUser: CurrentUser
  setCurrentUser: (user: CurrentUser) => void
  availableUsers: CurrentUser[]

  // Revision state
  activeRevision: PORevision | null
  pendingDraftRevision: PORevision | null
  selectedRevision: PORevision | null
  revisionHistory: PORevision[]

  // View state
  isViewingDraft: boolean
  selectRevision: (revisionId: string) => void

  // Edit state
  isEditMode: boolean
  enterEditMode: () => void
  exitEditMode: () => void

  // Revision lifecycle actions
  createDraft: () => PORevision | null
  updateDraft: (updates: Partial<PORevision>) => void
  addChangeToDraft: (change: Omit<RevisionChange, "id" | "changedAt" | "changedBy">) => void
  discardDraft: () => void

  // Approval workflow actions
  submitForApproval: (notes?: string) => void
  approveRevision: (notes?: string) => void
  rejectRevision: (notes: string) => void
  requestChanges: (notes: string) => void

  // Post-approval actions
  sendToSupplier: () => void
  skipApprovalAndSend: () => void
  recordAcknowledgment: (acknowledgedBy: string) => void

  // Cost tracking
  updateCurrentTotal: (total: number) => void
  costDeltaInfo: CostDeltaInfo | null
  requiresApproval: boolean

  // Computed properties
  hasPendingDraft: boolean
  canEdit: boolean
  canSubmit: boolean
  canApprove: boolean
  canSkipApproval: boolean
  canSendToSupplier: boolean
  currentApprovalStep: ApprovalStep | null
  nextApprover: Approver | null
}

const RevisionContext = createContext<RevisionContextType | null>(null)

export function RevisionProvider({
  children,
  poNumber,
}: {
  children: ReactNode
  poNumber: string
}) {
  // Current simulated user
  const [currentUser, setCurrentUser] = useState<CurrentUser>(simulatedUsers[0])

  // Revision state - initialize with proper revisions
  const [revisions, setRevisions] = useState<PORevision[]>(() =>
    createInitialRevisions(poNumber)
  )

  // Selected revision ID for viewing
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null)

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)

  // Cost tracking
  const [originalTotal, setOriginalTotal] = useState<number>(0)
  const [currentTotal, setCurrentTotal] = useState<number>(0)

  const updateCurrentTotal = useCallback((total: number) => {
    setCurrentTotal(total)
    if (originalTotal === 0) {
      setOriginalTotal(total)
    }
  }, [originalTotal])

  const costDeltaInfo = useMemo(() => {
    if (originalTotal === 0) return null
    const delta = currentTotal - originalTotal
    const deltaPercent = originalTotal > 0 ? (delta / originalTotal) * 100 : 0
    return {
      originalTotal,
      currentTotal,
      delta,
      deltaPercent,
    }
  }, [originalTotal, currentTotal])

  // Derived state
  const activeRevision = useMemo(
    () => revisions.find((r) => r.isActive) || null,
    [revisions]
  )

  const pendingDraftRevision = useMemo(
    () => revisions.find((r) => r.isDraft) || null,
    [revisions]
  )

  const selectedRevision = useMemo(() => {
    if (selectedRevisionId) {
      return revisions.find((r) => r.id === selectedRevisionId) || activeRevision
    }
    return pendingDraftRevision || activeRevision
  }, [selectedRevisionId, revisions, activeRevision, pendingDraftRevision])

  const revisionHistory = useMemo(
    () =>
      [...revisions].sort((a, b) => {
        const vA = parseFloat(a.version)
        const vB = parseFloat(b.version)
        return vB - vA
      }),
    [revisions]
  )

  const isViewingDraft = selectedRevision?.isDraft ?? false

  // Computed permissions
  const hasPendingDraft = pendingDraftRevision !== null

  const canEdit = useMemo(() => {
    // Can edit if viewing draft or if no draft exists and viewing active
    if (pendingDraftRevision && isViewingDraft) return true
    if (!pendingDraftRevision && activeRevision) return true
    return false
  }, [pendingDraftRevision, isViewingDraft, activeRevision])

  const canSubmit = useMemo(() => {
    // Can submit if there's a draft with changes, or a rejected revision that can be resubmitted
    const status = pendingDraftRevision?.status
    return (
      (status === RevisionStatus.Draft || status === RevisionStatus.Rejected) &&
      pendingDraftRevision.changes.length > 0
    )
  }, [pendingDraftRevision])

  const canApprove = useMemo(() => {
    if (!pendingDraftRevision?.approvalChain) return false
    if (pendingDraftRevision.status !== RevisionStatus.PendingApproval) return false
    if (!currentUser.isApprover) return false

    const chain = pendingDraftRevision.approvalChain
    const currentStep = chain.steps.find((s) => s.level === chain.currentLevel)
    return currentStep?.approver.id === currentUser.id && currentStep?.status === "pending"
  }, [pendingDraftRevision, currentUser])

  const canSendToSupplier = useMemo(() => {
    return pendingDraftRevision?.status === RevisionStatus.Approved
  }, [pendingDraftRevision])

  const requiresApproval = useMemo(() => {
    if (!costDeltaInfo) return false
    // Requires approval if cost change exceeds 5%
    return Math.abs(costDeltaInfo.deltaPercent) > 5
  }, [costDeltaInfo])

  const canSkipApproval = useMemo(() => {
    // Can skip approval if changes don't require approval (under 5% cost change)
    // Any buyer can send directly to vendor without approval workflow
    if (!pendingDraftRevision) return false
    if (pendingDraftRevision.status !== RevisionStatus.Draft) return false
    if (pendingDraftRevision.changes.length === 0) return false

    // If changes don't exceed 5% threshold, buyer can skip approval
    return !requiresApproval
  }, [pendingDraftRevision, requiresApproval])

  const currentApprovalStep = useMemo(() => {
    if (!pendingDraftRevision?.approvalChain) return null
    const chain = pendingDraftRevision.approvalChain
    return chain.steps.find((s) => s.level === chain.currentLevel) || null
  }, [pendingDraftRevision])

  const nextApprover = useMemo(() => {
    if (!currentApprovalStep) return null
    if (currentApprovalStep.status !== "pending") return null
    return currentApprovalStep.approver
  }, [currentApprovalStep])

  // Actions
  const selectRevision = useCallback((revisionId: string) => {
    setSelectedRevisionId(revisionId)
  }, [])

  const enterEditMode = useCallback(() => {
    setIsEditMode(true)
  }, [])

  const exitEditMode = useCallback(() => {
    setIsEditMode(false)
  }, [])

  const createDraft = useCallback(() => {
    if (!activeRevision) return null
    if (pendingDraftRevision) return pendingDraftRevision

    // Start with minor version - will be upgraded to major if approval is required
    const newVersion = getNextVersionNumber(activeRevision.version, "minor")
    const newId = `REV-${Date.now()}`

    const newDraft: PORevision = {
      id: newId,
      poNumber: activeRevision.poNumber,
      version: newVersion,
      status: RevisionStatus.Draft,
      lineItems: JSON.parse(JSON.stringify(activeRevision.lineItems)),
      notes: activeRevision.notes,
      shippingInstructions: activeRevision.shippingInstructions,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      createdBy: currentUser.name,
      changes: [],
      changesSummary: "",
      previousVersion: activeRevision.version,
      isActive: false,
      isDraft: true,
    }

    setRevisions((prev) => [...prev, newDraft])
    setSelectedRevisionId(newId)
    setIsEditMode(true)

    return newDraft
  }, [activeRevision, pendingDraftRevision, currentUser.name])

  const updateDraft = useCallback((updates: Partial<PORevision>) => {
    setRevisions((prev) =>
      prev.map((r) => (r.isDraft ? { ...r, ...updates } : r))
    )
  }, [])

  const addChangeToDraft = useCallback(
    (change: Omit<RevisionChange, "id" | "changedAt" | "changedBy">) => {
      const fullChange: RevisionChange = {
        ...change,
        id: `CHG-${Date.now()}`,
        changedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        changedBy: currentUser.name,
      }

      setRevisions((prev) =>
        prev.map((r) =>
          r.isDraft
            ? {
                ...r,
                changes: [...r.changes, fullChange],
                changesSummary: [...r.changes, fullChange]
                  .map((c) => c.description)
                  .join("; "),
              }
            : r
        )
      )
    },
    [currentUser.name]
  )

  const discardDraft = useCallback(() => {
    setRevisions((prev) => prev.filter((r) => !r.isDraft))
    setSelectedRevisionId(null)
    setIsEditMode(false)
  }, [])

  const submitForApproval = useCallback((notes?: string) => {
    if (!pendingDraftRevision || !activeRevision) return

    // Upgrade to major version when submitting for approval (changes exceed 5%)
    const majorVersion = upgradeToMajorVersion(activeRevision.version)
    const now = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    // Determine if this is a resubmission (has previous audit entries)
    const isResubmission = (pendingDraftRevision.auditLog?.length || 0) > 0

    // Create audit log entry
    const auditEntry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}`,
      action: isResubmission ? "resubmitted" : "submitted",
      user: currentUser.name,
      date: now,
      notes: notes,
    }

    // Create proper approval chain with consistent user IDs
    const approverList = getApproversWithMatchingIds().slice(0, 2)
    const chain: ApprovalChain = {
      id: `APPR-${pendingDraftRevision.id}`,
      revisionId: pendingDraftRevision.id,
      steps: approverList.map((approver, idx) => ({
        id: `STEP-${pendingDraftRevision.id}-${idx + 1}`,
        level: idx + 1,
        approver: { ...approver, level: idx + 1 },
        status: "pending" as const,
      })),
      currentLevel: 1,
      isComplete: false,
      startedAt: now,
    }

    setRevisions((prev) =>
      prev.map((r) =>
        r.id === pendingDraftRevision.id
          ? {
              ...r,
              version: majorVersion,
              status: RevisionStatus.PendingApproval,
              submittedAt: now,
              submittedBy: currentUser.name,
              submissionNotes: notes,
              approvalChain: chain,
              auditLog: [...(r.auditLog || []), auditEntry],
            }
          : r
      )
    )
    setIsEditMode(false)
  }, [pendingDraftRevision, activeRevision, currentUser.name])

  const approveRevision = useCallback(
    (notes?: string) => {
      if (!pendingDraftRevision?.approvalChain) return

      const chain = pendingDraftRevision.approvalChain
      const currentLevel = chain.currentLevel
      const now = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      // Get current approver's role
      const currentStep = chain.steps.find((s) => s.level === currentLevel)
      const approverRole = currentStep?.approver.role

      // Create audit log entry for approval
      const auditEntry: AuditLogEntry = {
        id: `AUDIT-${Date.now()}`,
        action: "approved",
        user: currentUser.name,
        role: approverRole,
        date: now,
        notes: notes,
      }

      const updatedSteps = chain.steps.map((step) =>
        step.level === currentLevel
          ? {
              ...step,
              status: "approved" as const,
              action: "approve" as const,
              notes,
              actionDate: now,
              actionBy: currentUser.name,
            }
          : step
      )

      const maxLevel = Math.max(...chain.steps.map((s) => s.level))
      const nextLevel = currentLevel + 1
      const isComplete = nextLevel > maxLevel

      const updatedChain: ApprovalChain = {
        ...chain,
        steps: updatedSteps,
        currentLevel: isComplete ? currentLevel : nextLevel,
        isComplete,
        completedAt: isComplete ? now : undefined,
        outcome: isComplete ? "approved" : undefined,
      }

      setRevisions((prev) =>
        prev.map((r) =>
          r.id === pendingDraftRevision.id
            ? {
                ...r,
                status: isComplete ? RevisionStatus.Approved : RevisionStatus.PendingApproval,
                approvedAt: isComplete ? now : undefined,
                approvalChain: updatedChain,
                auditLog: [...(r.auditLog || []), auditEntry],
              }
            : r
        )
      )
    },
    [pendingDraftRevision, currentUser.name]
  )

  const rejectRevision = useCallback(
    (notes: string) => {
      if (!pendingDraftRevision?.approvalChain) return

      const chain = pendingDraftRevision.approvalChain
      const currentLevel = chain.currentLevel
      const now = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      // Get current approver's role
      const currentStep = chain.steps.find((s) => s.level === currentLevel)
      const approverRole = currentStep?.approver.role

      // Create audit log entry for rejection
      const auditEntry: AuditLogEntry = {
        id: `AUDIT-${Date.now()}`,
        action: "rejected",
        user: currentUser.name,
        role: approverRole,
        date: now,
        notes: notes,
      }

      const updatedSteps = chain.steps.map((step) =>
        step.level === currentLevel
          ? {
              ...step,
              status: "rejected" as const,
              action: "reject" as const,
              notes,
              actionDate: now,
              actionBy: currentUser.name,
            }
          : step
      )

      const updatedChain: ApprovalChain = {
        ...chain,
        steps: updatedSteps,
        isComplete: true,
        completedAt: now,
        outcome: "rejected",
      }

      setRevisions((prev) =>
        prev.map((r) =>
          r.id === pendingDraftRevision.id
            ? {
                ...r,
                status: RevisionStatus.Rejected,
                rejectionNotes: notes,
                rejectedAt: now,
                rejectedBy: currentUser.name,
                approvalChain: updatedChain,
                auditLog: [...(r.auditLog || []), auditEntry],
              }
            : r
        )
      )
    },
    [pendingDraftRevision, currentUser.name]
  )

  const requestChanges = useCallback(
    (notes: string) => {
      // Returns to draft status for editing with feedback
      if (!pendingDraftRevision) return

      const now = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      // Get current approver's role if available
      const chain = pendingDraftRevision.approvalChain
      const currentStep = chain?.steps.find((s) => s.level === chain.currentLevel)
      const approverRole = currentStep?.approver.role

      // Create audit log entry for changes requested
      const auditEntry: AuditLogEntry = {
        id: `AUDIT-${Date.now()}`,
        action: "changes_requested",
        user: currentUser.name,
        role: approverRole,
        date: now,
        notes: notes,
      }

      setRevisions((prev) =>
        prev.map((r) =>
          r.id === pendingDraftRevision.id
            ? {
                ...r,
                status: RevisionStatus.Rejected, // Use Rejected status so buyer sees it needs attention
                rejectionNotes: notes,
                rejectedAt: now,
                rejectedBy: currentUser.name,
                approvalChain: undefined, // Clear chain, will restart on resubmit
                auditLog: [...(r.auditLog || []), auditEntry],
              }
            : r
        )
      )
    },
    [pendingDraftRevision, currentUser.name]
  )

  const sendToSupplier = useCallback(() => {
    if (!pendingDraftRevision) return

    const now = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    // Create audit log entry for sending
    const auditEntry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}`,
      action: "sent",
      user: currentUser.name,
      date: now,
    }

    setRevisions((prev) =>
      prev.map((r) =>
        r.id === pendingDraftRevision.id
          ? {
              ...r,
              status: RevisionStatus.Sent,
              sentAt: now,
              sentBy: currentUser.name,
              auditLog: [...(r.auditLog || []), auditEntry],
            }
          : r
      )
    )
  }, [pendingDraftRevision, currentUser.name])

  const skipApprovalAndSend = useCallback(() => {
    if (!pendingDraftRevision) return

    const now = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    // Create audit log entry for direct send (no approval needed)
    const auditEntry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}`,
      action: "sent",
      user: currentUser.name,
      date: now,
      notes: "Sent directly (approval not required)",
    }

    // Mark as approved and sent in one step
    setRevisions((prev) =>
      prev.map((r) =>
        r.id === pendingDraftRevision.id
          ? {
              ...r,
              status: RevisionStatus.Sent,
              approvedAt: now,
              sentAt: now,
              sentBy: currentUser.name,
              auditLog: [...(r.auditLog || []), auditEntry],
            }
          : r
      )
    )
    setIsEditMode(false)
  }, [pendingDraftRevision, currentUser.name])

  const recordAcknowledgment = useCallback(
    (acknowledgedBy: string) => {
      if (!pendingDraftRevision) return

      // Mark draft as acknowledged and active, deactivate previous active
      setRevisions((prev) =>
        prev.map((r) => {
          if (r.id === pendingDraftRevision.id) {
            return {
              ...r,
              status: RevisionStatus.Acknowledged,
              acknowledgedAt: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              acknowledgedBy,
              isActive: true,
              isDraft: false,
            }
          }
          if (r.isActive) {
            return { ...r, isActive: false }
          }
          return r
        })
      )

      setSelectedRevisionId(null)
    },
    [pendingDraftRevision]
  )

  const value: RevisionContextType = {
    currentUser,
    setCurrentUser,
    availableUsers: simulatedUsers,
    activeRevision,
    pendingDraftRevision,
    selectedRevision,
    revisionHistory,
    isViewingDraft,
    selectRevision,
    isEditMode,
    enterEditMode,
    exitEditMode,
    createDraft,
    updateDraft,
    addChangeToDraft,
    discardDraft,
    submitForApproval,
    approveRevision,
    rejectRevision,
    requestChanges,
    sendToSupplier,
    skipApprovalAndSend,
    recordAcknowledgment,
    updateCurrentTotal,
    costDeltaInfo,
    requiresApproval,
    hasPendingDraft,
    canEdit,
    canSubmit,
    canApprove,
    canSkipApproval,
    canSendToSupplier,
    currentApprovalStep,
    nextApprover,
  }

  return (
    <RevisionContext.Provider value={value}>{children}</RevisionContext.Provider>
  )
}

export function useRevision() {
  const context = useContext(RevisionContext)
  if (!context) {
    throw new Error("useRevision must be used within a RevisionProvider")
  }
  return context
}

/**
 * Safe version of useRevision that returns null if not within a RevisionProvider.
 * Use this when the component may be used outside of a RevisionProvider context.
 */
export function useRevisionSafe() {
  return useContext(RevisionContext)
}
