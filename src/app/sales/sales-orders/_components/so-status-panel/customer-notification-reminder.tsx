"use client";

/**
 * CustomerNotificationReminder
 *
 * Prompts the user to consider notifying the customer about upcoming changes.
 * Shows during draft stage to encourage proactive customer communication.
 */

import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { SORevision } from "../../_lib/types";

interface CustomerNotificationReminderProps {
  revision: SORevision;
  onDismiss?: () => void;
  onSendNotification?: () => void;
}

export function CustomerNotificationReminder({
  revision,
  onDismiss,
  onSendNotification,
}: CustomerNotificationReminderProps) {
  return (
    <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
      <div className="flex items-start gap-3">
        <Mail className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">
            Customer heads-up recommended
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Consider notifying the customer about the upcoming order revision
            before finalizing.
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {onSendNotification && (
        <div className="mt-2 pl-7">
          <Button
            variant="outline"
            size="sm"
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
            onClick={onSendNotification}
          >
            <Mail className="h-3 w-3 mr-1" />
            Send Heads-Up Email
          </Button>
        </div>
      )}
    </div>
  );
}
