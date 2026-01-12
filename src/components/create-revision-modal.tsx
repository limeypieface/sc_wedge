"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRevision } from "@/context/RevisionContext"
import {
  MINOR_EDIT_TYPES,
  MAJOR_EDIT_TYPES,
  hasMajorChanges,
  getVersionIncrement,
  type EditType,
} from "@/types/edit-types"
import { cn } from "@/lib/utils"

interface CreateRevisionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedTypes: string[], versionIncrement: number) => void
}

export function CreateRevisionModal({ isOpen, onClose, onConfirm }: CreateRevisionModalProps) {
  const { activeRevision } = useRevision()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    )
  }

  const requiresApproval = hasMajorChanges(selectedTypes)
  const versionIncrement = getVersionIncrement(selectedTypes)
  const newVersion = activeRevision
    ? (parseFloat(activeRevision.version) + versionIncrement).toFixed(1)
    : "3.0"

  const handleConfirm = () => {
    if (selectedTypes.length === 0) return
    onConfirm(selectedTypes, versionIncrement)
    setSelectedTypes([])
  }

  const handleClose = () => {
    setSelectedTypes([])
    onClose()
  }

  if (!activeRevision) return null

  const renderEditType = (type: EditType) => {
    const isSelected = selectedTypes.includes(type.id)
    return (
      <button
        key={type.id}
        onClick={() => toggleType(type.id)}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:bg-muted/50"
        )}
      >
        <Checkbox
          checked={isSelected}
          className="mt-0.5"
          onCheckedChange={() => toggleType(type.id)}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{type.label}</p>
          <p className="text-xs text-muted-foreground">{type.description}</p>
        </div>
      </button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>What would you like to change?</DialogTitle>
          <DialogDescription className="text-left pt-2">
            Select the types of changes you need to make. This determines which
            fields will be editable and whether approval is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Minor Changes Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Minor Changes
              </span>
              <span className="text-xs text-muted-foreground">
                — No approval needed, v+0.1
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MINOR_EDIT_TYPES.map(renderEditType)}
            </div>
          </div>

          {/* Major Changes Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Major Changes
              </span>
              <span className="text-xs text-muted-foreground">
                — Requires approval, v+1.0
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MAJOR_EDIT_TYPES.map(renderEditType)}
            </div>
          </div>

          {/* Summary */}
          {selectedTypes.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Version:</span>
                <span className="font-medium">v{newVersion}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approval Required:</span>
                <span className={cn(
                  "font-medium",
                  requiresApproval ? "text-amber-600" : "text-emerald-600"
                )}>
                  {requiresApproval ? "Yes" : "No"}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedTypes.length === 0}>
            Create Draft v{selectedTypes.length > 0 ? newVersion : "..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
