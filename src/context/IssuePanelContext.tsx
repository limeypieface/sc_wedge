"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface IssuePanelContextType {
  isOpen: boolean
  highlightedIssueId: string | null
  openPanel: () => void
  closePanel: () => void
  openToIssue: (issueId: string) => void
  clearHighlight: () => void
}

const IssuePanelContext = createContext<IssuePanelContextType | null>(null)

export function IssuePanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIssueId, setHighlightedIssueId] = useState<string | null>(null)

  const openPanel = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
    setHighlightedIssueId(null)
  }, [])

  const openToIssue = useCallback((issueId: string) => {
    setHighlightedIssueId(issueId)
    setIsOpen(true)
  }, [])

  const clearHighlight = useCallback(() => {
    setHighlightedIssueId(null)
  }, [])

  return (
    <IssuePanelContext.Provider
      value={{
        isOpen,
        highlightedIssueId,
        openPanel,
        closePanel,
        openToIssue,
        clearHighlight,
      }}
    >
      {children}
    </IssuePanelContext.Provider>
  )
}

export function useIssuePanel() {
  const context = useContext(IssuePanelContext)
  if (!context) {
    throw new Error("useIssuePanel must be used within an IssuePanelProvider")
  }
  return context
}
