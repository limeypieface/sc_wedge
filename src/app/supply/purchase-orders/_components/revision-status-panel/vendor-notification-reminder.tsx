"use client";

/**
 * VendorNotificationReminder
 *
 * Prompts the buyer to notify the vendor about upcoming PO changes.
 * Appears when a draft revision is created.
 *
 * ## Purpose
 * Building strong vendor relationships by keeping them informed.
 * A heads-up email helps vendors prepare for changes.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Bell, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PORevision } from "../../_lib/types";

interface VendorNotificationReminderProps {
  /** The draft revision */
  revision: PORevision;
}

export function VendorNotificationReminder({
  revision,
}: VendorNotificationReminderProps) {
  const [vendorNotified, setVendorNotified] = useState(false);

  /**
   * Handle sending the notification
   *
   * In full implementation, this would open the email compose modal
   * with a pre-filled "heads up" template.
   */
  const handleNotifyVendor = () => {
    // TODO: Open email modal with revision_heads_up template
    // For now, just mark as notified
    setVendorNotified(true);
  };

  return (
    <div
      className={cn(
        "p-3 border rounded-md",
        vendorNotified
          ? "bg-primary/5 border-primary/20"
          : "bg-primary/10 border-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {vendorNotified ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <Bell className="w-4 h-4 text-primary animate-pulse" />
        )}
        <span className="text-sm font-medium text-primary">
          {vendorNotified ? "Vendor Notified" : "Notify Your Vendor"}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">
        {vendorNotified
          ? "You've sent a heads-up about upcoming changes."
          : "Give your vendor advance notice that changes are coming. This helps them prepare and strengthens the relationship."}
      </p>

      {/* Action Button */}
      {!vendorNotified && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
          onClick={handleNotifyVendor}
        >
          <Mail className="w-4 h-4" />
          Send Heads-Up Email
        </Button>
      )}
    </div>
  );
}
