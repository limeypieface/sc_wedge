"use client"

import { useTaskPanel } from "@/context/TaskPanelContext"
import { cn } from "@/lib/utils"

interface TaskButtonProps {
  taskId: string
  taskNumber: string
  className?: string
}

export function TaskButton({ taskId, taskNumber, className }: TaskButtonProps) {
  const { openToTask } = useTaskPanel()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        openToTask(taskId)
      }}
      className={cn(
        "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded",
        "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
        "transition-colors cursor-pointer",
        className
      )}
      title={`Open ${taskNumber}`}
    >
      {taskNumber}
    </button>
  )
}
