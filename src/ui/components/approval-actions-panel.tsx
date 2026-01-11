/**
 * ApprovalActionsPanel Component
 *
 * Renders available approval actions based on capabilities.
 * Only shows buttons for actions the user can perform.
 *
 * Design principles:
 * - Capabilities-driven rendering
 * - Clear action feedback
 * - Accessible and responsive
 */

import React, { useState, useCallback } from "react";
import { ApprovalCapabilities, VoteDecision } from "../../domain/approval-engine";

// ============================================================================
// TYPES
// ============================================================================

export interface ApprovalActionsPanelProps {
  /** Computed capabilities */
  readonly capabilities: ApprovalCapabilities;
  /** Callback when an action is triggered */
  readonly onAction: (action: VoteDecision | "cancel", reason?: string) => Promise<void>;
  /** Whether an action is in progress */
  readonly loading?: boolean;
  /** Custom class name */
  readonly className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ApprovalActionsPanel({
  capabilities,
  onAction,
  loading = false,
  className = "",
}: ApprovalActionsPanelProps): React.ReactElement | null {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<VoteDecision | "cancel" | null>(null);

  const handleAction = useCallback(
    async (action: VoteDecision | "cancel", requiresReason: boolean) => {
      if (requiresReason && !showReasonInput) {
        setPendingAction(action);
        setShowReasonInput(true);
        return;
      }

      try {
        await onAction(action, reason || undefined);
        setShowReasonInput(false);
        setReason("");
        setPendingAction(null);
      } catch {
        // Error handling would be done by parent
      }
    },
    [onAction, reason, showReasonInput]
  );

  const handleSubmitWithReason = useCallback(async () => {
    if (pendingAction) {
      await handleAction(pendingAction, false);
    }
  }, [pendingAction, handleAction]);

  const handleCancelReasonInput = useCallback(() => {
    setShowReasonInput(false);
    setReason("");
    setPendingAction(null);
  }, []);

  // Check if any action is available
  const hasActions =
    capabilities.canApprove ||
    capabilities.canReject ||
    capabilities.canRequestChanges ||
    capabilities.canCancel;

  if (!hasActions) {
    return null;
  }

  return (
    <div className={`approval-actions-panel ${className}`}>
      {showReasonInput ? (
        <div className="reason-input-container">
          <label htmlFor="action-reason" className="reason-label">
            {pendingAction === "reject"
              ? "Reason for rejection (required)"
              : pendingAction === "request_changes"
              ? "What changes are needed?"
              : "Reason (optional)"}
          </label>
          <textarea
            id="action-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter your reason..."
            rows={3}
            className="reason-textarea"
            disabled={loading}
          />
          <div className="reason-actions">
            <button
              type="button"
              onClick={handleCancelReasonInput}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitWithReason}
              disabled={loading || (pendingAction === "reject" && !reason.trim())}
              className={`btn-primary ${
                pendingAction === "reject" ? "btn-danger" : ""
              }`}
            >
              {loading ? "Processing..." : "Submit"}
            </button>
          </div>
        </div>
      ) : (
        <div className="action-buttons">
          {capabilities.canApprove && (
            <button
              type="button"
              onClick={() => handleAction("approve", false)}
              disabled={loading}
              className="btn-approve"
              title="Approve this request"
            >
              {loading ? "Processing..." : "Approve"}
            </button>
          )}

          {capabilities.canRequestChanges && (
            <button
              type="button"
              onClick={() => handleAction("request_changes", true)}
              disabled={loading}
              className="btn-request-changes"
              title="Request changes before approving"
            >
              Request Changes
            </button>
          )}

          {capabilities.canReject && (
            <button
              type="button"
              onClick={() => handleAction("reject", true)}
              disabled={loading}
              className="btn-reject"
              title="Reject this request"
            >
              Reject
            </button>
          )}

          {capabilities.canCancel && (
            <button
              type="button"
              onClick={() => handleAction("cancel", true)}
              disabled={loading}
              className="btn-cancel"
              title="Cancel this approval request"
            >
              Cancel Request
            </button>
          )}
        </div>
      )}

      <style>{`
        .approval-actions-panel {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-buttons button {
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-approve {
          background: #10b981;
          color: white;
          border: none;
        }

        .btn-approve:hover:not(:disabled) {
          background: #059669;
        }

        .btn-request-changes {
          background: #f59e0b;
          color: white;
          border: none;
        }

        .btn-request-changes:hover:not(:disabled) {
          background: #d97706;
        }

        .btn-reject {
          background: #ef4444;
          color: white;
          border: none;
        }

        .btn-reject:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn-cancel {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f3f4f6;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reason-input-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .reason-label {
          font-weight: 500;
          color: #374151;
        }

        .reason-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          resize: vertical;
          font-family: inherit;
        }

        .reason-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .reason-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-secondary {
          padding: 8px 16px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-primary {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-primary.btn-danger {
          background: #ef4444;
        }
      `}</style>
    </div>
  );
}
