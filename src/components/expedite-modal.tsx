"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LineItem } from "@/lib/mock-data"

interface ExpediteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expeditedLines: ExpediteLineData[]) => void
  lines: LineItem[]
}

export interface ExpediteLineData {
  lineId: number
  lineNumber: number
  sku: string
  name: string
  expediteFee: number
}

export function ExpediteModal({ isOpen, onClose, onSave, lines }: ExpediteModalProps) {
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set())
  const [fees, setFees] = useState<Record<number, number>>({})

  // Lines that can be expedited (not received/closed AND not already expedited)
  const expeditableLines = useMemo(() => {
    return lines.filter(line => {
      const status = line.status.toLowerCase()
      const canExpedite = status !== "received" && status !== "closed" && status !== "canceled"
      return canExpedite && !line.expedite
    })
  }, [lines])

  // Lines already marked as expedited
  const alreadyExpedited = useMemo(() => {
    return lines.filter(line => line.expedite)
  }, [lines])

  const toggleLine = (lineId: number) => {
    setSelectedLines(prev => {
      const next = new Set(prev)
      if (next.has(lineId)) {
        next.delete(lineId)
      } else {
        next.add(lineId)
      }
      return next
    })
  }

  const updateFee = (lineId: number, fee: number) => {
    setFees(prev => ({
      ...prev,
      [lineId]: Math.max(0, fee)
    }))
  }

  const handleSave = () => {
    const expeditedLines: ExpediteLineData[] = Array.from(selectedLines).map(lineId => {
      const line = lines.find(l => l.id === lineId)!
      return {
        lineId,
        lineNumber: line.lineNumber,
        sku: line.sku,
        name: line.name,
        expediteFee: fees[lineId] || 0
      }
    })
    onSave(expeditedLines)
    handleClose()
  }

  const handleClose = () => {
    setSelectedLines(new Set())
    setFees({})
    onClose()
  }

  const totalFees = Array.from(selectedLines).reduce((sum, lineId) => sum + (fees[lineId] || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Expedite Delivery</DialogTitle>
          <DialogDescription>
            Select lines to expedite and enter any associated fees.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Already expedited info */}
          {alreadyExpedited.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="font-medium text-amber-800">Already Expedited</p>
              <p className="text-amber-700 mt-1">
                {alreadyExpedited.map(l => `Line ${l.lineNumber} (${l.sku})`).join(", ")}
              </p>
            </div>
          )}

          {/* Expeditable lines */}
          {expeditableLines.length > 0 ? (
            <div className="space-y-2">
              {expeditableLines.map(line => {
                const isSelected = selectedLines.has(line.id)
                return (
                  <div
                    key={line.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleLine(line.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-xs font-medium">
                          {line.lineNumber}
                        </span>
                        <span className="text-primary font-medium text-sm">{line.sku}</span>
                        <span className="text-sm truncate">{line.name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="capitalize">{line.status}</span>
                        <span>Promised: {line.promisedDate}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          placeholder="Fee"
                          value={fees[line.id] || ""}
                          onChange={(e) => updateFee(line.id, parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 text-right text-sm"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              {alreadyExpedited.length > 0
                ? "All eligible lines are already expedited."
                : "No lines available for expediting."}
            </div>
          )}

          {/* Summary */}
          {selectedLines.size > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lines to expedite:</span>
                <span className="font-medium">{selectedLines.size}</span>
              </div>
              {totalFees > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total expedite fees:</span>
                  <span className="font-medium">${totalFees.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-muted-foreground">Approval required:</span>
                <span className="font-medium text-emerald-600">No</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={selectedLines.size === 0}>
            Expedite {selectedLines.size > 0 ? `${selectedLines.size} Line${selectedLines.size > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
