"use client"

/**
 * NotificationReminder
 *
 * Prompts the user to notify the external party (vendor/customer)
 * about upcoming order changes. Appears when a draft revision is created.
 *
 * ## Purpose
 * Building strong relationships by keeping external parties informed.
 * A heads-up email helps them prepare for changes.
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Check, Bell, Mail, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RevisionTerminology } from "./types"
import { PO_TERMINOLOGY } from "./types"

interface NotificationReminderProps {
  /** Optional terminology config - defaults to PO terminology */
  terminology?: RevisionTerminology

  /** Callback when dismiss button is clicked (optional) */
  onDismiss?: () => void

  /** Callback when send notification is clicked (optional) */
  onSendNotification?: () => void

  /** Whether the notification has already been sent */
  notified?: boolean
}

export function NotificationReminder({
  terminology = PO_TERMINOLOGY,
  onDismiss,
  onSendNotification,
  notified: initialNotified = false,
}: NotificationReminderProps) {
  const [notified, setNotified] = useState(initialNotified)

  /**
   * Handle sending the notification
   *
   * If a callback is provided, use it. Otherwise, just mark as notified locally.
   */
  const handleNotify = () => {
    if (onSendNotification) {
      onSendNotification()
    }
    setNotified(true)
  }

  return (
    <div
      className={cn(
        "p-3 border rounded-md",
        notified
          ? "bg-primary/5 border-primary/20"
          : "bg-primary/10 border-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1">
          {notified ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Bell className="w-4 h-4 text-primary animate-pulse" />
          )}
          <span className="text-sm font-medium text-primary">
            {notified
              ? `${terminology.externalParty} Notified`
              : `Notify Your ${terminology.externalParty}`}
          </span>
        </div>

        {onDismiss && !notified && (
          <button
            onClick={onDismiss}
            className="text-primary/60 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">
        {notified
          ? "You've sent a heads-up about upcoming changes."
          : `Give your ${terminology.externalParty.toLowerCase()} advance notice that changes are coming. This helps them prepare and strengthens the relationship.`}
      </p>

      {/* Action Button */}
      {!notified && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
          onClick={handleNotify}
        >
          <Mail className="w-4 h-4" />
          Send Heads-Up Email
        </Button>
      )}
    </div>
  )
}
