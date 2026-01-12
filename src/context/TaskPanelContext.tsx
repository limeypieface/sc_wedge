"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface TaskPanelContextType {
  isOpen: boolean
  highlightedTaskId: string | null
  openPanel: () => void
  closePanel: () => void
  openToTask: (taskId: string) => void
  clearHighlight: () => void
}

const TaskPanelContext = createContext<TaskPanelContextType | null>(null)

export function TaskPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)

  const openPanel = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
    setHighlightedTaskId(null)
  }, [])

  const openToTask = useCallback((taskId: string) => {
    setHighlightedTaskId(taskId)
    setIsOpen(true)
  }, [])

  const clearHighlight = useCallback(() => {
    setHighlightedTaskId(null)
  }, [])

  return (
    <TaskPanelContext.Provider
      value={{
        isOpen,
        highlightedTaskId,
        openPanel,
        closePanel,
        openToTask,
        clearHighlight,
      }}
    >
      {children}
    </TaskPanelContext.Provider>
  )
}

export function useTaskPanel() {
  const context = useContext(TaskPanelContext)
  if (!context) {
    throw new Error("useTaskPanel must be used within a TaskPanelProvider")
  }
  return context
}
