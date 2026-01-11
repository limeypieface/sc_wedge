/**
 * Mock Notification Service
 *
 * Development implementation that logs notifications to console.
 * Useful for testing and debugging notification flows.
 *
 * Design principles:
 * - Console logging for development visibility
 * - Can be configured to collect notifications for testing
 * - Same interface as production notification services
 */

import {
  NotificationService,
  NotificationPayload,
  NotificationType,
} from "../../application/ports/notification.port";
import { PrincipalId } from "../../domain/approval-engine";

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface MockNotificationConfig {
  /** Whether to log to console */
  readonly logToConsole?: boolean;
  /** Collect notifications for testing */
  readonly collectNotifications?: boolean;
  /** Simulated delay in ms */
  readonly delay?: number;
  /** Simulate failures for specific types */
  readonly failTypes?: readonly NotificationType[];
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Create a mock notification service
 */
export function createMockNotificationService(
  config: MockNotificationConfig = {}
): NotificationService & {
  getNotifications: () => readonly NotificationPayload[];
  clearNotifications: () => void;
} {
  const {
    logToConsole = true,
    collectNotifications = true,
    delay = 0,
    failTypes = [],
  } = config;

  const notifications: NotificationPayload[] = [];

  const simulateDelay = async (): Promise<void> => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  return {
    async send(notification: NotificationPayload): Promise<void> {
      await simulateDelay();

      // Check if this type should fail
      if (failTypes.includes(notification.type)) {
        throw new Error(`Simulated notification failure for type: ${notification.type}`);
      }

      if (collectNotifications) {
        notifications.push(notification);
      }

      if (logToConsole) {
        logNotification(notification);
      }
    },

    async sendMany(notificationList: readonly NotificationPayload[]): Promise<void> {
      for (const notification of notificationList) {
        await this.send(notification);
      }
    },

    async isOptedOut(
      _principalId: PrincipalId,
      _notificationType: NotificationType
    ): Promise<boolean> {
      // Mock: nobody is opted out
      return false;
    },

    getNotifications(): readonly NotificationPayload[] {
      return [...notifications];
    },

    clearNotifications(): void {
      notifications.length = 0;
    },
  };
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

function logNotification(notification: NotificationPayload): void {
  const icon = getNotificationIcon(notification.type);
  const recipients = notification.recipients.join(", ");

  console.group(`${icon} Notification: ${notification.type}`);
  console.log(`📬 To: ${recipients}`);
  console.log(`📋 Subject: ${notification.subject}`);
  console.log(`📝 Body: ${notification.body}`);
  if (notification.actionUrl) {
    console.log(`🔗 Action: ${notification.actionUrl}`);
  }
  if (notification.metadata) {
    console.log(`📎 Metadata:`, notification.metadata);
  }
  console.groupEnd();
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "approval_requested":
      return "📨";
    case "approval_reminder":
      return "⏰";
    case "vote_recorded":
      return "✅";
    case "approval_complete":
      return "🎉";
    case "approval_cancelled":
      return "❌";
    case "approval_expiring":
      return "⚠️";
    case "approval_expired":
      return "💀";
    default:
      return "📧";
  }
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a silent notification service for unit tests
 */
export function createSilentNotificationService(): NotificationService & {
  getNotifications: () => readonly NotificationPayload[];
  clearNotifications: () => void;
} {
  return createMockNotificationService({
    logToConsole: false,
    collectNotifications: true,
  });
}
