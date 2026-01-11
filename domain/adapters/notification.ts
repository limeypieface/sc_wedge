/**
 * Notification Port
 *
 * Interface for sending notifications via various channels.
 * Implementations can send emails, push notifications, SMS, etc.
 */

import type { EntityId, Priority } from "../core/types"
import type { Result } from "../core/errors"

// ============================================================================
// NOTIFICATION PORT
// ============================================================================

/**
 * Notification channel types
 */
export type NotificationChannel = "email" | "push" | "sms" | "in_app" | "webhook"

/**
 * Notification request
 */
export interface NotificationRequest {
  readonly channel: NotificationChannel
  readonly recipientId: EntityId
  readonly recipientAddress?: string // email, phone, device token, webhook URL
  readonly subject?: string
  readonly body: string
  readonly bodyFormat?: "plain" | "html" | "markdown"
  readonly priority?: Priority
  readonly category?: string
  readonly action?: NotificationAction
  readonly metadata?: Readonly<Record<string, unknown>>
  readonly scheduledFor?: Date
  readonly expiresAt?: Date
}

/**
 * Action attached to notification
 */
export interface NotificationAction {
  readonly type: "navigate" | "action" | "dismiss"
  readonly label: string
  readonly url?: string
  readonly payload?: Readonly<Record<string, unknown>>
}

/**
 * Notification result
 */
export interface NotificationResult {
  readonly notificationId: EntityId
  readonly channel: NotificationChannel
  readonly status: "sent" | "queued" | "failed"
  readonly sentAt?: Date
  readonly error?: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * Notification sender interface
 */
export interface NotificationSenderPort {
  /**
   * Send a single notification
   */
  send(request: NotificationRequest): Promise<Result<NotificationResult>>

  /**
   * Send multiple notifications
   */
  sendBatch(requests: readonly NotificationRequest[]): Promise<Result<NotificationResult[]>>

  /**
   * Check delivery status
   */
  getStatus(notificationId: EntityId): Promise<Result<NotificationDeliveryStatus | null>>

  /**
   * Cancel a scheduled notification
   */
  cancel(notificationId: EntityId): Promise<Result<boolean>>
}

/**
 * Notification delivery status
 */
export interface NotificationDeliveryStatus {
  readonly notificationId: EntityId
  readonly status: "pending" | "sent" | "delivered" | "read" | "failed" | "cancelled"
  readonly sentAt?: Date
  readonly deliveredAt?: Date
  readonly readAt?: Date
  readonly failedAt?: Date
  readonly failureReason?: string
}

// ============================================================================
// TEMPLATE-BASED NOTIFICATIONS
// ============================================================================

/**
 * Template notification request
 */
export interface TemplateNotificationRequest {
  readonly templateId: string
  readonly channel: NotificationChannel
  readonly recipientId: EntityId
  readonly recipientAddress?: string
  readonly variables: Readonly<Record<string, unknown>>
  readonly priority?: Priority
  readonly scheduledFor?: Date
}

/**
 * Template-based notification sender
 */
export interface TemplateNotificationPort extends NotificationSenderPort {
  /**
   * Send notification using a template
   */
  sendFromTemplate(request: TemplateNotificationRequest): Promise<Result<NotificationResult>>
}

// ============================================================================
// IN-MEMORY IMPLEMENTATION (for testing)
// ============================================================================

/**
 * Create an in-memory notification sender for testing
 */
export function createInMemoryNotificationSender(): NotificationSenderPort & {
  getSentNotifications: () => NotificationRequest[]
  clear: () => void
} {
  const sentNotifications: NotificationRequest[] = []
  let nextId = 1

  return {
    async send(request) {
      sentNotifications.push(request)
      return {
        success: true,
        data: {
          notificationId: `ntf-${nextId++}` as EntityId,
          channel: request.channel,
          status: "sent",
          sentAt: new Date(),
        },
      }
    },
    async sendBatch(requests) {
      const results: NotificationResult[] = []
      for (const request of requests) {
        sentNotifications.push(request)
        results.push({
          notificationId: `ntf-${nextId++}` as EntityId,
          channel: request.channel,
          status: "sent",
          sentAt: new Date(),
        })
      }
      return { success: true, data: results }
    },
    async getStatus(notificationId) {
      return {
        success: true,
        data: {
          notificationId,
          status: "delivered",
          sentAt: new Date(),
          deliveredAt: new Date(),
        },
      }
    },
    async cancel() {
      return { success: true, data: true }
    },
    getSentNotifications: () => [...sentNotifications],
    clear: () => {
      sentNotifications.length = 0
    },
  }
}
