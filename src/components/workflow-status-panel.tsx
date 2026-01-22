/**
 * WorkflowStatusPanel - Wrapper around RevisionStatusPanel for workflow API
 *
 * This is a stub component that wraps RevisionStatusPanel for compatibility
 * with the MVP workflow API pattern.
 */

"use client"

import { RevisionStatusPanel } from "./revision-status-panel"

interface WorkflowStatusPanelProps {
  workflow: {
    hasPendingDraft: boolean
    pendingDraft?: unknown
    activeRevision?: unknown
    createDraft?: () => void
    enterEditMode?: () => void
    exitEditMode?: () => void
    isEditMode?: boolean
  } | null
}

export function WorkflowStatusPanel({ workflow }: WorkflowStatusPanelProps) {
  if (!workflow) {
    return null
  }

  // Use the existing RevisionStatusPanel which gets its data from context
  return <RevisionStatusPanel />
}
