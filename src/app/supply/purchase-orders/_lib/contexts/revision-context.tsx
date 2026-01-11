"use client";

/**
 * Revision Context
 *
 * Manages the state and operations for PO revision workflows.
 * This is the core state management for the approval process.
 *
 * ## Responsibilities
 * - Track current user and their permissions
 * - Manage active revision (what vendor sees) and draft revision (being edited)
 * - Handle revision lifecycle: create → submit → approve → send → acknowledge
 * - Calculate cost deltas and determine if approval is required
 * - Provide computed permissions based on user role and revision state
 *
 * ## State Model
 * ```
 * ┌─────────────────┐     ┌─────────────────┐
 * │ Active Revision │     │ Draft Revision  │
 * │ (Acknowledged)  │────>│ (Being Edited)  │
 * └─────────────────┘     └─────────────────┘
 *         │                       │
 *         │                       v
 *         │               ┌─────────────────┐
 *         │               │ Pending Approval│
 *         │               └─────────────────┘
 *         │                       │
 *         │                       v
 *         │               ┌─────────────────┐
 *         │               │    Approved     │
 *         │               └─────────────────┘
 *         │                       │
 *         │                       v
 *         │               ┌─────────────────┐
 *         │               │      Sent       │
 *         │               └─────────────────┘
 *         │                       │
 *         │<──────────────────────┘
 *         │        (Acknowledged)
 *         v
 * ┌─────────────────┐
 * │  New Active     │
 * └─────────────────┘
 * ```
 *
 * ## Migration to Sindri
 * - Replace local state with Apollo cache
 * - Replace adapter calls with GraphQL mutations
 * - Connect to real authentication context
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

import { RevisionStatus } from "@/types/enums";
import type {
  PORevision,
  RevisionChangeInput,
  CurrentUser,
  Approver,
  ApprovalConfig,
  CostDeltaInfo,
  ApprovalStep,
  LineItem,
} from "../types";
import {
  DEFAULT_APPROVAL_CONFIG,
  calculateCostDelta,
  getNextVersion,
  isCriticalEdit,
} from "../types";
import {
  createDraftRevision as createDraftAdapter,
  addChangeToDraft as addChangeAdapter,
  submitForApproval as submitAdapter,
  approveRevision as approveAdapter,
  rejectRevision as rejectAdapter,
  sendToVendor as sendAdapter,
  recordAcknowledgment as ackAdapter,
  discardDraft as discardAdapter,
} from "../../_adapters";

// ============================================================================
// CONTEXT TYPE DEFINITION
// ============================================================================

/**
 * Issue that can be raised during revision workflow
 */
interface POIssue {
  id: string;
  category: "revision" | "quality" | "compliance";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  vendorNotified: boolean;
}

/**
 * Complete context interface
 *
 * Organized into logical groups for easier understanding.
 */
interface RevisionContextType {
  // ──────────────────────────────────────────────────────────────────────
  // USER STATE
  // ──────────────────────────────────────────────────────────────────────

  /** Currently logged in user */
  currentUser: CurrentUser;

  /** All available users (for simulation/switching) */
  availableUsers: CurrentUser[];

  /** Change the current user (simulation only) */
  setCurrentUser: (user: CurrentUser) => void;

  // ──────────────────────────────────────────────────────────────────────
  // REVISION STATE
  // ──────────────────────────────────────────────────────────────────────

  /** Currently active (acknowledged) revision */
  activeRevision: PORevision | null;

  /** Draft revision being edited (if any) */
  pendingDraftRevision: PORevision | null;

  /** Currently selected revision for viewing */
  selectedRevision: PORevision | null;

  /** All revisions in history */
  revisionHistory: PORevision[];

  /** Select a revision to view */
  selectRevision: (revision: PORevision | null) => void;

  // ──────────────────────────────────────────────────────────────────────
  // EDIT MODE
  // ──────────────────────────────────────────────────────────────────────

  /** Whether edit mode is active */
  isEditMode: boolean;

  /** Enter edit mode (creates draft if needed) */
  enterEditMode: () => void;

  /** Exit edit mode */
  exitEditMode: () => void;

  // ──────────────────────────────────────────────────────────────────────
  // APPROVAL CONFIGURATION
  // ──────────────────────────────────────────────────────────────────────

  /** Threshold configuration for requiring approval */
  approvalConfig: ApprovalConfig;

  /** Cost change information for current draft */
  costDeltaInfo: CostDeltaInfo | null;

  /** Whether current changes require approval */
  requiresApproval: boolean;

  // ──────────────────────────────────────────────────────────────────────
  // REVISION LIFECYCLE ACTIONS
  // ──────────────────────────────────────────────────────────────────────

  /** Create a new draft revision */
  createDraft: () => Promise<PORevision | null>;

  /** Update the draft revision */
  updateDraft: (updates: Partial<PORevision>) => void;

  /** Add a change record to the draft */
  addChangeToDraft: (change: RevisionChangeInput) => void;

  /** Discard the current draft */
  discardDraft: () => void;

  // ──────────────────────────────────────────────────────────────────────
  // APPROVAL WORKFLOW ACTIONS
  // ──────────────────────────────────────────────────────────────────────

  /** Submit draft for approval */
  submitForApproval: (notes?: string) => Promise<void>;

  /** Approve current revision (for approvers) */
  approveRevision: (notes?: string) => Promise<void>;

  /** Reject current revision (for approvers) */
  rejectRevision: (notes: string) => Promise<void>;

  /** Request changes (alternative to reject) */
  requestChanges: (notes: string) => Promise<void>;

  // ──────────────────────────────────────────────────────────────────────
  // VENDOR COMMUNICATION ACTIONS
  // ──────────────────────────────────────────────────────────────────────

  /** Send approved revision to vendor */
  sendToSupplier: () => Promise<void>;

  /** Skip approval and send directly (for minor changes) */
  skipApprovalAndSend: () => Promise<void>;

  /** Record vendor acknowledgment */
  recordAcknowledgment: (acknowledgedBy: string) => Promise<void>;

  // ──────────────────────────────────────────────────────────────────────
  // COMPUTED PERMISSIONS
  // ──────────────────────────────────────────────────────────────────────

  /** Whether current user can edit the draft */
  canEdit: boolean;

  /** Whether current user can submit for approval */
  canSubmit: boolean;

  /** Whether current user can approve */
  canApprove: boolean;

  /** Whether current user can send to supplier */
  canSendToSupplier: boolean;

  /** Whether changes can skip approval */
  canSkipApproval: boolean;

  /** Whether draft can be discarded */
  canDiscard: boolean;

  // ──────────────────────────────────────────────────────────────────────
  // APPROVAL CHAIN INFO
  // ──────────────────────────────────────────────────────────────────────

  /** Current approval step (if in approval) */
  currentApprovalStep: ApprovalStep | null;

  /** Next approver in the chain */
  nextApprover: Approver | null;

  // ──────────────────────────────────────────────────────────────────────
  // ISSUES
  // ──────────────────────────────────────────────────────────────────────

  /** Issues related to the current revision */
  revisionIssues: POIssue[];

  /** Dismiss an issue */
  dismissRevisionIssue: (issueId: string) => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const RevisionContext = createContext<RevisionContextType | undefined>(
  undefined
);

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface RevisionProviderProps {
  children: ReactNode;

  /** Initial active revision */
  initialActiveRevision: PORevision | null;

  /** Initial revision history */
  initialRevisionHistory: PORevision[];

  /** Available users for simulation */
  availableUsers: CurrentUser[];

  /** Initial user */
  initialUser: CurrentUser;

  /** Available approvers */
  approvers: Approver[];

  /** Line items from the PO (for cost calculations) */
  lineItems: LineItem[];
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export function RevisionProvider({
  children,
  initialActiveRevision,
  initialRevisionHistory,
  availableUsers,
  initialUser,
  approvers,
  lineItems,
}: RevisionProviderProps) {
  // ──────────────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────────────

  const [currentUser, setCurrentUser] = useState<CurrentUser>(initialUser);
  const [activeRevision, setActiveRevision] = useState<PORevision | null>(
    initialActiveRevision
  );
  const [pendingDraftRevision, setPendingDraftRevision] =
    useState<PORevision | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<PORevision | null>(
    null
  );
  const [revisionHistory, setRevisionHistory] = useState<PORevision[]>(
    initialRevisionHistory
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [revisionIssues, setRevisionIssues] = useState<POIssue[]>([]);

  // Configuration
  const approvalConfig = DEFAULT_APPROVAL_CONFIG;

  // ──────────────────────────────────────────────────────────────────────
  // COST CALCULATIONS
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Calculate cost delta between active and draft revisions
   */
  const costDeltaInfo = useMemo((): CostDeltaInfo | null => {
    if (!activeRevision || !pendingDraftRevision) {
      return null;
    }

    const originalCost = activeRevision.lineItems.reduce(
      (sum, line) => sum + line.lineTotal,
      0
    );
    const newCost = pendingDraftRevision.lineItems.reduce(
      (sum, line) => sum + line.lineTotal,
      0
    );

    return calculateCostDelta(originalCost, newCost, approvalConfig);
  }, [activeRevision, pendingDraftRevision, approvalConfig]);

  /**
   * Whether current changes require approval
   */
  const requiresApproval = useMemo(() => {
    if (!pendingDraftRevision) return false;

    // Check if any critical edits were made
    const hasCriticalEdits = pendingDraftRevision.changes.some(
      (c) => c.editType === "critical"
    );

    // Check if cost delta exceeds threshold
    const exceedsThreshold = costDeltaInfo?.exceedsThreshold ?? false;

    return hasCriticalEdits || exceedsThreshold;
  }, [pendingDraftRevision, costDeltaInfo]);

  // ──────────────────────────────────────────────────────────────────────
  // COMPUTED PERMISSIONS
  // ──────────────────────────────────────────────────────────────────────

  const canEdit = useMemo(() => {
    // Only non-approvers can edit drafts
    if (currentUser.isApprover) return false;

    // Must be in draft or rejected status
    if (!pendingDraftRevision) return false;

    const status = pendingDraftRevision.status;
    return (
      status === RevisionStatus.Draft || status === RevisionStatus.Rejected
    );
  }, [currentUser, pendingDraftRevision]);

  const canSubmit = useMemo(() => {
    // Only non-approvers can submit
    if (currentUser.isApprover) return false;

    // Must have a draft with changes
    if (!pendingDraftRevision) return false;
    if (pendingDraftRevision.changes.length === 0) return false;

    const status = pendingDraftRevision.status;
    return (
      status === RevisionStatus.Draft || status === RevisionStatus.Rejected
    );
  }, [currentUser, pendingDraftRevision]);

  const canApprove = useMemo(() => {
    // Only approvers can approve
    if (!currentUser.isApprover) return false;

    // Must be pending approval
    if (!pendingDraftRevision) return false;
    if (pendingDraftRevision.status !== RevisionStatus.PendingApproval)
      return false;

    // Check if it's this user's turn in the chain
    const chain = pendingDraftRevision.approvalChain;
    if (!chain) return false;

    const currentStep = chain.steps.find((s) => s.level === chain.currentLevel);
    return currentStep?.approver.id === currentUser.id;
  }, [currentUser, pendingDraftRevision]);

  const canSendToSupplier = useMemo(() => {
    if (!pendingDraftRevision) return false;
    return pendingDraftRevision.status === RevisionStatus.Approved;
  }, [pendingDraftRevision]);

  const canSkipApproval = useMemo(() => {
    // Can skip if changes don't require approval
    if (!pendingDraftRevision) return false;
    if (currentUser.isApprover) return false;

    const status = pendingDraftRevision.status;
    if (status !== RevisionStatus.Draft) return false;

    return !requiresApproval && pendingDraftRevision.changes.length > 0;
  }, [currentUser, pendingDraftRevision, requiresApproval]);

  const canDiscard = useMemo(() => {
    if (!pendingDraftRevision) return false;

    // Can discard drafts and rejected revisions
    const status = pendingDraftRevision.status;
    return (
      status === RevisionStatus.Draft || status === RevisionStatus.Rejected
    );
  }, [pendingDraftRevision]);

  // ──────────────────────────────────────────────────────────────────────
  // APPROVAL CHAIN INFO
  // ──────────────────────────────────────────────────────────────────────

  const currentApprovalStep = useMemo((): ApprovalStep | null => {
    if (!pendingDraftRevision?.approvalChain) return null;

    const chain = pendingDraftRevision.approvalChain;
    return chain.steps.find((s) => s.level === chain.currentLevel) ?? null;
  }, [pendingDraftRevision]);

  const nextApprover = useMemo((): Approver | null => {
    return currentApprovalStep?.approver ?? null;
  }, [currentApprovalStep]);

  // ──────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ──────────────────────────────────────────────────────────────────────

  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const selectRevision = useCallback((revision: PORevision | null) => {
    setSelectedRevision(revision);
  }, []);

  const createDraft = useCallback(async (): Promise<PORevision | null> => {
    if (!activeRevision) return null;

    try {
      const draft = await createDraftAdapter(
        activeRevision.poNumber,
        activeRevision,
        currentUser.id
      );
      setPendingDraftRevision(draft);
      setIsEditMode(true);

      // Create issue for vendor notification
      const issue: POIssue = {
        id: `issue-${Date.now()}`,
        category: "revision",
        priority: "medium",
        title: "Notify vendor of upcoming changes",
        description:
          "Consider sending a heads-up email to the vendor about the upcoming PO revision.",
        vendorNotified: false,
      };
      setRevisionIssues((prev) => [...prev, issue]);

      return draft;
    } catch (error) {
      console.error("Failed to create draft:", error);
      return null;
    }
  }, [activeRevision, currentUser]);

  const updateDraft = useCallback((updates: Partial<PORevision>) => {
    setPendingDraftRevision((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates, updatedAt: new Date().toISOString() };
    });
  }, []);

  const addChangeToDraft = useCallback(
    (change: RevisionChangeInput) => {
      if (!pendingDraftRevision) return;

      // Add the change through the adapter
      addChangeAdapter(pendingDraftRevision.id, change, currentUser.id)
        .then((updated) => {
          setPendingDraftRevision(updated);

          // Update version if critical edit
          if (isCriticalEdit(change.field) && activeRevision) {
            const newVersion = getNextVersion(
              activeRevision.version,
              "critical"
            );
            setPendingDraftRevision((prev) =>
              prev ? { ...prev, version: newVersion } : null
            );
          }
        })
        .catch((error) => {
          console.error("Failed to add change:", error);
        });
    },
    [pendingDraftRevision, currentUser, activeRevision]
  );

  const discardDraft = useCallback(() => {
    if (!pendingDraftRevision) return;

    discardAdapter(pendingDraftRevision.id)
      .then(() => {
        setPendingDraftRevision(null);
        setIsEditMode(false);
        setRevisionIssues([]);
      })
      .catch((error) => {
        console.error("Failed to discard draft:", error);
      });
  }, [pendingDraftRevision]);

  const submitForApproval = useCallback(
    async (notes?: string) => {
      if (!pendingDraftRevision) return;

      try {
        const updated = await submitAdapter(
          pendingDraftRevision.id,
          notes ?? "",
          currentUser.name
        );
        setPendingDraftRevision(updated);
      } catch (error) {
        console.error("Failed to submit for approval:", error);
        throw error;
      }
    },
    [pendingDraftRevision, currentUser]
  );

  const approveRevision = useCallback(
    async (notes?: string) => {
      if (!pendingDraftRevision) return;

      try {
        const updated = await approveAdapter(
          pendingDraftRevision.id,
          notes ?? "",
          currentUser.name
        );
        setPendingDraftRevision(updated);
      } catch (error) {
        console.error("Failed to approve:", error);
        throw error;
      }
    },
    [pendingDraftRevision, currentUser]
  );

  const rejectRevision = useCallback(
    async (notes: string) => {
      if (!pendingDraftRevision) return;

      try {
        const updated = await rejectAdapter(
          pendingDraftRevision.id,
          notes,
          currentUser.name
        );
        setPendingDraftRevision(updated);
      } catch (error) {
        console.error("Failed to reject:", error);
        throw error;
      }
    },
    [pendingDraftRevision, currentUser]
  );

  const requestChanges = useCallback(
    async (notes: string) => {
      // Request changes is the same as reject with a different intent
      return rejectRevision(notes);
    },
    [rejectRevision]
  );

  const sendToSupplier = useCallback(async () => {
    if (!pendingDraftRevision) return;

    try {
      const updated = await sendAdapter(
        pendingDraftRevision.id,
        currentUser.name
      );
      setPendingDraftRevision(updated);
    } catch (error) {
      console.error("Failed to send to supplier:", error);
      throw error;
    }
  }, [pendingDraftRevision, currentUser]);

  const skipApprovalAndSend = useCallback(async () => {
    if (!pendingDraftRevision) return;

    try {
      // First approve automatically (skip chain)
      const approved: PORevision = {
        ...pendingDraftRevision,
        status: RevisionStatus.Approved,
        approvedBy: "System (Auto-approved)",
        approvedAt: new Date().toISOString(),
        approvalNotes: "Changes within threshold - approval not required",
      };
      setPendingDraftRevision(approved);

      // Then send to supplier
      const sent = await sendAdapter(approved.id, currentUser.name);
      setPendingDraftRevision(sent);
    } catch (error) {
      console.error("Failed to skip approval and send:", error);
      throw error;
    }
  }, [pendingDraftRevision, currentUser]);

  const recordAcknowledgment = useCallback(
    async (acknowledgedBy: string) => {
      if (!pendingDraftRevision) return;

      try {
        const updated = await ackAdapter(
          pendingDraftRevision.id,
          acknowledgedBy
        );

        // Move to active
        setActiveRevision(updated);
        setPendingDraftRevision(null);
        setRevisionHistory((prev) => [updated, ...prev]);
        setIsEditMode(false);
        setRevisionIssues([]);
      } catch (error) {
        console.error("Failed to record acknowledgment:", error);
        throw error;
      }
    },
    [pendingDraftRevision]
  );

  const dismissRevisionIssue = useCallback((issueId: string) => {
    setRevisionIssues((prev) => prev.filter((i) => i.id !== issueId));
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ──────────────────────────────────────────────────────────────────────

  const value = useMemo(
    (): RevisionContextType => ({
      // User
      currentUser,
      availableUsers,
      setCurrentUser,

      // Revision State
      activeRevision,
      pendingDraftRevision,
      selectedRevision,
      revisionHistory,
      selectRevision,

      // Edit Mode
      isEditMode,
      enterEditMode,
      exitEditMode,

      // Approval Config
      approvalConfig,
      costDeltaInfo,
      requiresApproval,

      // Lifecycle Actions
      createDraft,
      updateDraft,
      addChangeToDraft,
      discardDraft,

      // Approval Actions
      submitForApproval,
      approveRevision,
      rejectRevision,
      requestChanges,

      // Vendor Actions
      sendToSupplier,
      skipApprovalAndSend,
      recordAcknowledgment,

      // Permissions
      canEdit,
      canSubmit,
      canApprove,
      canSendToSupplier,
      canSkipApproval,
      canDiscard,

      // Approval Chain
      currentApprovalStep,
      nextApprover,

      // Issues
      revisionIssues,
      dismissRevisionIssue,
    }),
    [
      currentUser,
      availableUsers,
      activeRevision,
      pendingDraftRevision,
      selectedRevision,
      revisionHistory,
      selectRevision,
      isEditMode,
      enterEditMode,
      exitEditMode,
      approvalConfig,
      costDeltaInfo,
      requiresApproval,
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
      canEdit,
      canSubmit,
      canApprove,
      canSendToSupplier,
      canSkipApproval,
      canDiscard,
      currentApprovalStep,
      nextApprover,
      revisionIssues,
      dismissRevisionIssue,
    ]
  );

  return (
    <RevisionContext.Provider value={value}>
      {children}
    </RevisionContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Use the revision context
 *
 * @throws Error if used outside of RevisionProvider
 *
 * @example
 * const { activeRevision, canEdit, enterEditMode } = useRevision();
 */
export function useRevision(): RevisionContextType {
  const context = useContext(RevisionContext);
  if (!context) {
    throw new Error("useRevision must be used within a RevisionProvider");
  }
  return context;
}
