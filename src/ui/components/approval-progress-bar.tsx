/**
 * ApprovalProgressBar Component
 *
 * Displays visual progress through multi-stage approvals.
 *
 * Design principles:
 * - Clear visual indication of progress
 * - Stage-by-stage breakdown available
 * - Accessible with proper ARIA attributes
 */

import React from "react";
import { StageProgress } from "../../domain/approval-engine";
import { StageViewModel } from "../../application/use-cases/get-approval-status.use-case";

// ============================================================================
// TYPES
// ============================================================================

export interface ApprovalProgressBarProps {
  /** Stage progress data */
  readonly progress: StageProgress;
  /** Optional stage details for expanded view */
  readonly stages?: readonly StageViewModel[];
  /** Whether to show stage breakdown */
  readonly showStages?: boolean;
  /** Custom class name */
  readonly className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ApprovalProgressBar({
  progress,
  stages,
  showStages = false,
  className = "",
}: ApprovalProgressBarProps): React.ReactElement {
  const { completedStages, totalStages, percentComplete, isRejected } = progress;

  return (
    <div className={`approval-progress ${className}`}>
      <div className="progress-header">
        <span className="progress-label">
          {isRejected
            ? "Rejected"
            : progress.isComplete
            ? "Complete"
            : `Stage ${progress.currentStage} of ${totalStages}`}
        </span>
        <span className="progress-count">
          {completedStages} / {totalStages} stages
        </span>
      </div>

      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={percentComplete}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Approval progress: ${Math.round(percentComplete)}% complete`}
      >
        <div
          className={`progress-fill ${isRejected ? "rejected" : ""}`}
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {showStages && stages && stages.length > 0 && (
        <div className="stages-breakdown">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`stage-item stage-${stage.status}`}
            >
              <div className="stage-indicator">
                {stage.status === "approved" && (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {stage.status === "rejected" && (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {stage.status === "active" && (
                  <div className="active-dot" />
                )}
                {stage.status === "pending" && (
                  <div className="pending-dot" />
                )}
                {stage.status === "skipped" && (
                  <span className="skipped-marker">-</span>
                )}
              </div>
              <div className="stage-info">
                <span className="stage-name">{stage.name}</span>
                <span className="stage-votes">
                  {stage.voteCount} / {stage.requiredVotes} votes
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .approval-progress {
          width: 100%;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .progress-label {
          font-weight: 500;
          color: #374151;
        }

        .progress-count {
          color: #6b7280;
        }

        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #10b981;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        .progress-fill.rejected {
          background: #ef4444;
        }

        .stages-breakdown {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stage-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 6px;
          background: #f9fafb;
        }

        .stage-item.stage-active {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .stage-item.stage-approved {
          color: #065f46;
        }

        .stage-item.stage-rejected {
          color: #991b1b;
        }

        .stage-indicator {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .active-dot {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .pending-dot {
          width: 12px;
          height: 12px;
          background: #d1d5db;
          border-radius: 50%;
        }

        .skipped-marker {
          color: #9ca3af;
          font-weight: bold;
        }

        .stage-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stage-name {
          font-weight: 500;
        }

        .stage-votes {
          font-size: 12px;
          color: #6b7280;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
