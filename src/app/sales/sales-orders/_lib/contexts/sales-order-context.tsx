"use client";

/**
 * Sales Order Context
 *
 * Manages the state and operations for SO revision workflows.
 * This is the core state management for the Sales Order approval process.
 *
 * ## Responsibilities
 * - Track current user and their permissions
 * - Manage active revision (confirmed by customer) and draft revision (being edited)
 * - Handle revision lifecycle: create → submit → approve → send → confirm
 * - Calculate pricing deltas and determine if approval is required
 * - Provide computed permissions based on user role and revision state
 *
 * ## State Model
 * ```
 * ┌─────────────────┐     ┌─────────────────┐
 * │ Active Revision │     │ Draft Revision  │
 * │  (Confirmed)    │────>│ (Being Edited)  │
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
 *         │         (Confirmed)
 *         v
 * ┌─────────────────┐
 * │   New Active    │
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

import type {
  SORevision,
  SORevisionChange,
  SalesOrderLine,
  Customer,
} from "../types";
import { isCriticalChange, getNextVersion } from "../types";
import type {
  CurrentUser,
  Approver,
  ApprovalConfig,
  CostDeltaInfo,
  ApprovalStep,
  ApprovalCycle,
} from "@/types/approval-types";
import {
  DEFAULT_APPROVAL_CONFIG,
  calculateCostDelta,
  createApprovalChain,
} from "@/types/approval-types";
import {
  createDraftRevision,
  addChangeToDraft,
  submitForApproval as submitAdapter,
  approveRevision as approveAdapter,
  rejectRevision as rejectAdapter,
  sendRevision as sendAdapter,
  confirmRevision as confirmAdapter,
  generateChangesSummary,
} from "../../_adapters";

// ============================================================================
// CONTEXT TYPE DEFINITION
// ============================================================================

/**
 * Issue that can be raised during revision workflow
 */
interface SOIssue {
  id: string;
  category: "revision" | "credit" | "pricing" | "compliance";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  customerNotified: boolean;
}

/**
 * Complete context interface
 *
 * Organized into logical groups for easier understanding.
 */
interface SalesOrderContextType {
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
  // CUSTOMER CONTEXT
  // ──────────────────────────────────────────────────────────────────────

  /** Current customer for this order */
  customer: Customer | null;

  // ──────────────────────────────────────────────────────────────────────
  // REVISION STATE
  // ──────────────────────────────────────────────────────────────────────

  /** Currently active (confirmed) revision */
  activeRevision: SORevision | null;

  /** Draft revision being edited (if any) */
  pendingDraftRevision: SORevision | null;

  /** Currently selected revision for viewing */
  selectedRevision: SORevision | null;

  /** All revisions in history */
  revisionHistory: SORevision[];

  /** Select a revision to view */
  selectRevision: (revision: SORevision | null) => void;

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
  createDraft: () => Promise<SORevision | null>;

  /** Update the draft revision */
  updateDraft: (updates: Partial<SORevision>) => void;

  /** Add a change record to the draft */
  addChange: (change: Omit<SORevisionChange, "id" | "changedAt">) => void;

  /** Update line items in the draft */
  updateLineItems: (lines: SalesOrderLine[]) => void;

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
  // CUSTOMER COMMUNICATION ACTIONS
  // ──────────────────────────────────────────────────────────────────────

  /** Send approved revision to customer */
  sendToCustomer: () => Promise<void>;

  /** Skip approval and send directly (for minor changes) */
  skipApprovalAndSend: () => Promise<void>;

  /** Record customer confirmation */
  recordConfirmation: (confirmedBy: string) => Promise<void>;

  // ──────────────────────────────────────────────────────────────────────
  // COMPUTED PERMISSIONS
  // ──────────────────────────────────────────────────────────────────────

  /** Whether current user can edit the draft */
  canEdit: boolean;

  /** Whether current user can submit for approval */
  canSubmit: boolean;

  /** Whether current user can approve */
  canApprove: boolean;

  /** Whether current user can send to customer */
  canSendToCustomer: boolean;

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
  revisionIssues: SOIssue[];

  /** Dismiss an issue */
  dismissRevisionIssue: (issueId: string) => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const SalesOrderContext = createContext<SalesOrderContextType | undefined>(
  undefined
);

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface SalesOrderProviderProps {
  children: ReactNode;

  /** Customer for this order */
  customer: Customer;

  /** Initial active revision */
  initialActiveRevision: SORevision | null;

  /** Initial revision history */
  initialRevisionHistory: SORevision[];

  /** Available users for simulation */
  availableUsers: CurrentUser[];

  /** Initial user */
  initialUser: CurrentUser;

  /** Available approvers */
  approvers: Approver[];

  /** Line items from the SO (for cost calculations) */
  lineItems: SalesOrderLine[];
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export function SalesOrderProvider({
  children,
  customer,
  initialActiveRevision,
  initialRevisionHistory,
  availableUsers,
  initialUser,
  approvers,
  lineItems,
}: SalesOrderProviderProps) {
  // ──────────────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────────────

  const [currentUser, setCurrentUser] = useState<CurrentUser>(initialUser);
  const [activeRevision, setActiveRevision] = useState<SORevision | null>(
    initialActiveRevision
  );
  const [pendingDraftRevision, setPendingDraftRevision] =
    useState<SORevision | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<SORevision | null>(
    null
  );
  const [revisionHistory, setRevisionHistory] = useState<SORevision[]>(
    initialRevisionHistory
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [revisionIssues, setRevisionIssues] = useState<SOIssue[]>([]);

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
    return status === "draft" || status === "rejected";
  }, [currentUser, pendingDraftRevision]);

  const canSubmit = useMemo(() => {
    // Only non-approvers can submit
    if (currentUser.isApprover) return false;

    // Must have a draft with changes
    if (!pendingDraftRevision) return false;
    if (pendingDraftRevision.changes.length === 0) return false;

    const status = pendingDraftRevision.status;
    return status === "draft" || status === "rejected";
  }, [currentUser, pendingDraftRevision]);

  const canApprove = useMemo(() => {
    // Only approvers can approve
    if (!currentUser.isApprover) return false;

    // Must be pending approval
    if (!pendingDraftRevision) return false;
    if (pendingDraftRevision.status !== "pending_approval") return false;

    // Check if it's this user's turn in the chain
    const chain = pendingDraftRevision.approvalChain;
    if (!chain) return false;

    const currentStep = chain.steps.find((s) => s.level === chain.currentLevel);
    return currentStep?.approver.id === currentUser.id;
  }, [currentUser, pendingDraftRevision]);

  const canSendToCustomer = useMemo(() => {
    if (!pendingDraftRevision) return false;
    return pendingDraftRevision.status === "approved";
  }, [pendingDraftRevision]);

  const canSkipApproval = useMemo(() => {
    // Can skip if changes don't require approval
    if (!pendingDraftRevision) return false;
    if (currentUser.isApprover) return false;

    const status = pendingDraftRevision.status;
    if (status !== "draft") return false;

    return !requiresApproval && pendingDraftRevision.changes.length > 0;
  }, [currentUser, pendingDraftRevision, requiresApproval]);

  const canDiscard = useMemo(() => {
    if (!pendingDraftRevision) return false;

    // Can discard drafts and rejected revisions
    const status = pendingDraftRevision.status;
    return status === "draft" || status === "rejected";
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

  const selectRevision = useCallback((revision: SORevision | null) => {
    setSelectedRevision(revision);
  }, []);

  const createDraft = useCallback(async (): Promise<SORevision | null> => {
    if (!activeRevision) return null;

    try {
      const draft = createDraftRevision(activeRevision, currentUser.id);
      setPendingDraftRevision(draft);
      setIsEditMode(true);

      // Create issue for customer notification
      const issue: SOIssue = {
        id: `issue-${Date.now()}`,
        category: "revision",
        priority: "medium",
        title: "Notify customer of upcoming changes",
        description:
          "Consider sending a heads-up to the customer about the upcoming SO revision.",
        customerNotified: false,
      };
      setRevisionIssues((prev) => [...prev, issue]);

      return draft;
    } catch (error) {
      console.error("Failed to create draft:", error);
      return null;
    }
  }, [activeRevision, currentUser]);

  const updateDraft = useCallback((updates: Partial<SORevision>) => {
    setPendingDraftRevision((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const addChange = useCallback(
    (change: Omit<SORevisionChange, "id" | "changedAt">) => {
      if (!pendingDraftRevision) return;

      const updated = addChangeToDraft(pendingDraftRevision, {
        ...change,
        changedBy: currentUser.id,
      });
      setPendingDraftRevision(updated);
    },
    [pendingDraftRevision, currentUser]
  );

  const updateLineItems = useCallback(
    (newLines: SalesOrderLine[]) => {
      if (!pendingDraftRevision || !activeRevision) return;

      // Detect changes between original and new lines
      const now = new Date().toISOString();
      const changes: SORevisionChange[] = [];

      // Track added, removed, and modified lines
      const originalMap = new Map(activeRevision.lineItems.map((l) => [l.id, l]));
      const newMap = new Map(newLines.map((l) => [l.id, l]));

      // Check for removed lines
      for (const orig of activeRevision.lineItems) {
        if (!newMap.has(orig.id)) {
          changes.push({
            id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            field: "removeLine",
            lineNumber: orig.lineNumber,
            previousValue: orig,
            newValue: null,
            editType: "critical",
            changedBy: currentUser.id,
            changedAt: now,
            description: `Removed line ${orig.lineNumber}: ${orig.description}`,
          });
        }
      }

      // Check for added and modified lines
      for (const newLine of newLines) {
        const orig = originalMap.get(newLine.id);
        if (!orig) {
          changes.push({
            id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            field: "addLine",
            lineNumber: newLine.lineNumber,
            previousValue: null,
            newValue: newLine,
            editType: "critical",
            changedBy: currentUser.id,
            changedAt: now,
            description: `Added line ${newLine.lineNumber}: ${newLine.description}`,
          });
        } else {
          // Check individual fields
          if (orig.quantity !== newLine.quantity) {
            changes.push({
              id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              field: "quantity",
              lineNumber: newLine.lineNumber,
              previousValue: orig.quantity,
              newValue: newLine.quantity,
              editType: "critical",
              changedBy: currentUser.id,
              changedAt: now,
              description: `Line ${newLine.lineNumber}: Changed quantity from ${orig.quantity} to ${newLine.quantity}`,
            });
          }
          if (orig.unitPrice !== newLine.unitPrice) {
            changes.push({
              id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              field: "unitPrice",
              lineNumber: newLine.lineNumber,
              previousValue: orig.unitPrice,
              newValue: newLine.unitPrice,
              editType: "critical",
              changedBy: currentUser.id,
              changedAt: now,
              description: `Line ${newLine.lineNumber}: Changed unit price from $${orig.unitPrice?.toFixed(2)} to $${newLine.unitPrice?.toFixed(2)}`,
            });
          }
          if (orig.discountPercent !== newLine.discountPercent) {
            changes.push({
              id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              field: "discountPercent",
              lineNumber: newLine.lineNumber,
              previousValue: orig.discountPercent,
              newValue: newLine.discountPercent,
              editType: "critical",
              changedBy: currentUser.id,
              changedAt: now,
              description: `Line ${newLine.lineNumber}: Changed discount from ${orig.discountPercent}% to ${newLine.discountPercent}%`,
            });
          }
        }
      }

      // Calculate new version
      const hasCritical = changes.some((c) => c.editType === "critical");
      const newVersion = getNextVersion(
        activeRevision.version,
        hasCritical || pendingDraftRevision.changes.some((c) => c.editType === "critical")
      );

      setPendingDraftRevision((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lineItems: newLines,
          changes: [...prev.changes, ...changes],
          version: newVersion,
          changesSummary: generateChangesSummary([...prev.changes, ...changes]),
        };
      });
    },
    [pendingDraftRevision, activeRevision, currentUser]
  );

  const discardDraft = useCallback(() => {
    if (!pendingDraftRevision) return;

    setPendingDraftRevision(null);
    setIsEditMode(false);
    setRevisionIssues([]);
  }, [pendingDraftRevision]);

  const submitForApproval = useCallback(
    async (notes?: string) => {
      if (!pendingDraftRevision) return;

      try {
        // Create approval chain
        const chain = createApprovalChain(pendingDraftRevision.id, approvers);

        // Create new approval cycle
        const cycleNumber = (pendingDraftRevision.approvalHistory?.length ?? 0) + 1;
        const newCycle: ApprovalCycle = {
          id: `cycle-${Date.now()}`,
          cycleNumber,
          submittedAt: new Date().toISOString(),
          submittedBy: currentUser.name,
          submissionNotes: notes,
          outcome: "pending",
        };

        const updated = submitAdapter(
          pendingDraftRevision,
          currentUser.id,
          notes
        );

        setPendingDraftRevision({
          ...updated,
          approvalChain: chain,
          approvalHistory: [
            ...(pendingDraftRevision.approvalHistory ?? []),
            newCycle,
          ],
        });
      } catch (error) {
        console.error("Failed to submit for approval:", error);
        throw error;
      }
    },
    [pendingDraftRevision, currentUser, approvers]
  );

  const approveRevision = useCallback(
    async (notes?: string) => {
      if (!pendingDraftRevision) return;

      try {
        const updated = approveAdapter(pendingDraftRevision);

        // Update approval chain step
        const chain = pendingDraftRevision.approvalChain;
        if (chain) {
          const updatedSteps = chain.steps.map((step) =>
            step.level === chain.currentLevel
              ? {
                  ...step,
                  status: "approved" as const,
                  action: "approve" as const,
                  notes,
                  actionDate: new Date().toISOString(),
                  actionBy: currentUser.name,
                }
              : step
          );

          const allApproved = updatedSteps.every((s) => s.status === "approved");
          const nextLevel = chain.currentLevel + 1;

          updated.approvalChain = {
            ...chain,
            steps: updatedSteps,
            currentLevel: allApproved ? chain.currentLevel : nextLevel,
            isComplete: allApproved,
            completedAt: allApproved ? new Date().toISOString() : undefined,
            outcome: allApproved ? "approved" : undefined,
          };
        }

        // Update approval cycle
        const history = [...(pendingDraftRevision.approvalHistory ?? [])];
        if (history.length > 0) {
          const lastCycle = history[history.length - 1];
          history[history.length - 1] = {
            ...lastCycle,
            reviewedBy: currentUser.name,
            reviewerRole: currentUser.role,
            reviewedAt: new Date().toISOString(),
            outcome: "approved",
            feedback: notes,
          };
        }

        setPendingDraftRevision({
          ...updated,
          approvalHistory: history,
        });
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
        const updated = rejectAdapter(pendingDraftRevision, currentUser.id, notes);

        // Update approval chain step
        const chain = pendingDraftRevision.approvalChain;
        if (chain) {
          const updatedSteps = chain.steps.map((step) =>
            step.level === chain.currentLevel
              ? {
                  ...step,
                  status: "rejected" as const,
                  action: "reject" as const,
                  notes,
                  actionDate: new Date().toISOString(),
                  actionBy: currentUser.name,
                }
              : step
          );

          updated.approvalChain = {
            ...chain,
            steps: updatedSteps,
            isComplete: true,
            completedAt: new Date().toISOString(),
            outcome: "rejected",
          };
        }

        // Update approval cycle
        const history = [...(pendingDraftRevision.approvalHistory ?? [])];
        if (history.length > 0) {
          const lastCycle = history[history.length - 1];
          history[history.length - 1] = {
            ...lastCycle,
            reviewedBy: currentUser.name,
            reviewerRole: currentUser.role,
            reviewedAt: new Date().toISOString(),
            outcome: "rejected",
            feedback: notes,
          };
        }

        setPendingDraftRevision({
          ...updated,
          approvalHistory: history,
        });
      } catch (error) {
        console.error("Failed to reject:", error);
        throw error;
      }
    },
    [pendingDraftRevision, currentUser]
  );

  const requestChanges = useCallback(
    async (notes: string) => {
      if (!pendingDraftRevision) return;

      try {
        const updated = rejectAdapter(pendingDraftRevision, currentUser.id, notes);

        // Update approval chain step with "request_changes" action
        const chain = pendingDraftRevision.approvalChain;
        if (chain) {
          const updatedSteps = chain.steps.map((step) =>
            step.level === chain.currentLevel
              ? {
                  ...step,
                  status: "rejected" as const,
                  action: "request_changes" as const,
                  notes,
                  actionDate: new Date().toISOString(),
                  actionBy: currentUser.name,
                }
              : step
          );

          updated.approvalChain = {
            ...chain,
            steps: updatedSteps,
            isComplete: true,
            completedAt: new Date().toISOString(),
            outcome: "rejected",
          };
        }

        // Update approval cycle
        const history = [...(pendingDraftRevision.approvalHistory ?? [])];
        if (history.length > 0) {
          const lastCycle = history[history.length - 1];
          history[history.length - 1] = {
            ...lastCycle,
            reviewedBy: currentUser.name,
            reviewerRole: currentUser.role,
            reviewedAt: new Date().toISOString(),
            outcome: "changes_requested",
            feedback: notes,
          };
        }

        setPendingDraftRevision({
          ...updated,
          approvalHistory: history,
        });
      } catch (error) {
        console.error("Failed to request changes:", error);
        throw error;
      }
    },
    [pendingDraftRevision, currentUser]
  );

  const sendToCustomer = useCallback(async () => {
    if (!pendingDraftRevision) return;

    try {
      const updated = sendAdapter(pendingDraftRevision, currentUser.id);
      setPendingDraftRevision(updated);
    } catch (error) {
      console.error("Failed to send to customer:", error);
      throw error;
    }
  }, [pendingDraftRevision, currentUser]);

  const skipApprovalAndSend = useCallback(async () => {
    if (!pendingDraftRevision) return;

    try {
      // First approve automatically (skip chain)
      const approved: SORevision = {
        ...pendingDraftRevision,
        status: "approved",
        approvedAt: new Date().toISOString(),
      };
      setPendingDraftRevision(approved);

      // Then send to customer
      const sent = sendAdapter(approved, currentUser.id);
      setPendingDraftRevision(sent);
    } catch (error) {
      console.error("Failed to skip approval and send:", error);
      throw error;
    }
  }, [pendingDraftRevision, currentUser]);

  const recordConfirmation = useCallback(
    async (confirmedBy: string) => {
      if (!pendingDraftRevision) return;

      try {
        const updated = confirmAdapter(pendingDraftRevision, confirmedBy);

        // Move to active
        setActiveRevision(updated);
        setPendingDraftRevision(null);
        setRevisionHistory((prev) => [updated, ...prev]);
        setIsEditMode(false);
        setRevisionIssues([]);
      } catch (error) {
        console.error("Failed to record confirmation:", error);
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
    (): SalesOrderContextType => ({
      // User
      currentUser,
      availableUsers,
      setCurrentUser,

      // Customer
      customer,

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
      addChange,
      updateLineItems,
      discardDraft,

      // Approval Actions
      submitForApproval,
      approveRevision,
      rejectRevision,
      requestChanges,

      // Customer Actions
      sendToCustomer,
      skipApprovalAndSend,
      recordConfirmation,

      // Permissions
      canEdit,
      canSubmit,
      canApprove,
      canSendToCustomer,
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
      customer,
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
      addChange,
      updateLineItems,
      discardDraft,
      submitForApproval,
      approveRevision,
      rejectRevision,
      requestChanges,
      sendToCustomer,
      skipApprovalAndSend,
      recordConfirmation,
      canEdit,
      canSubmit,
      canApprove,
      canSendToCustomer,
      canSkipApproval,
      canDiscard,
      currentApprovalStep,
      nextApprover,
      revisionIssues,
      dismissRevisionIssue,
    ]
  );

  return (
    <SalesOrderContext.Provider value={value}>
      {children}
    </SalesOrderContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Use the sales order context
 *
 * @throws Error if used outside of SalesOrderProvider
 *
 * @example
 * const { activeRevision, canEdit, enterEditMode } = useSalesOrder();
 */
export function useSalesOrder(): SalesOrderContextType {
  const context = useContext(SalesOrderContext);
  if (!context) {
    throw new Error("useSalesOrder must be used within a SalesOrderProvider");
  }
  return context;
}
