/**
 * Communication Broker Engine - Types
 *
 * Multi-channel, thread-based, context-aware communications.
 */

import type { EntityId, Actor, Timestamp, Priority, ObjectReference } from "../core/types"

// ============================================================================
// CORE COMMUNICATION TYPES
// ============================================================================

/**
 * Communication channel
 */
export type CommunicationChannel =
  | "email"
  | "internal_note"
  | "notification"
  | "sms"
  | "chat"

/**
 * Communication direction
 */
export type CommunicationDirection = "inbound" | "outbound" | "internal"

/**
 * Message status
 */
export type MessageStatus =
  | "draft"
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "bounced"

/**
 * Thread status
 */
export type ThreadStatus =
  | "active"
  | "awaiting_response"
  | "resolved"
  | "closed"

/**
 * Communication category
 */
export type CommunicationCategory =
  | "inquiry"
  | "update"
  | "issue"
  | "approval"
  | "notification"
  | "general"

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * A participant in communication
 */
export interface Participant {
  readonly id: EntityId
  readonly type: "user" | "contact" | "system" | "external"
  readonly name: string
  readonly email?: string
  readonly phone?: string
  readonly role?: string
}

/**
 * A recipient of a message
 */
export interface Recipient extends Participant {
  readonly recipientType: "to" | "cc" | "bcc"
}

/**
 * A message
 */
export interface Message {
  readonly id: EntityId
  readonly threadId: EntityId
  readonly channel: CommunicationChannel
  readonly direction: CommunicationDirection
  readonly status: MessageStatus

  readonly priority: Priority
  readonly subject?: string
  readonly body: string
  readonly bodyFormat: "plain" | "html" | "markdown"

  readonly sender: Participant
  readonly recipients: readonly Recipient[]

  readonly attachments?: readonly Attachment[]

  /** Timestamps */
  readonly createdAt: Timestamp
  readonly sentAt?: Timestamp
  readonly deliveredAt?: Timestamp
  readonly readAt?: Timestamp

  /** Reply tracking */
  readonly inReplyTo?: EntityId
  readonly references?: readonly EntityId[]

  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * An attachment
 */
export interface Attachment {
  readonly id: EntityId
  readonly name: string
  readonly mimeType: string
  readonly size: number
  readonly url?: string
  readonly content?: string // base64 for small files
}

// ============================================================================
// THREAD TYPES
// ============================================================================

/**
 * Communication thread (conversation)
 */
export interface CommunicationThread {
  readonly id: EntityId
  readonly subject: string
  readonly channel: CommunicationChannel
  readonly status: ThreadStatus
  readonly priority: Priority
  readonly category?: CommunicationCategory

  /** Link to business object */
  readonly context: ThreadContext

  readonly participants: readonly Participant[]

  readonly messageIds: readonly EntityId[]
  readonly messageCount: number
  readonly unreadCount: number

  /** Timestamps */
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly lastReadAt?: Timestamp
  readonly closedAt?: Timestamp

  readonly tags?: readonly string[]
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Context linking thread to business object
 */
export interface ThreadContext {
  readonly objectType: string
  readonly objectId: EntityId
  readonly objectLabel?: string
  readonly category?: CommunicationCategory
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Message template
 */
export interface MessageTemplate {
  readonly id: EntityId
  readonly name: string
  readonly description?: string
  readonly channel: CommunicationChannel
  readonly subject?: string
  readonly body: string
  readonly bodyFormat: "plain" | "html" | "markdown"
  readonly variables: readonly TemplateVariable[]
  readonly active: boolean
  readonly suggestedFor?: readonly TemplateSuggestion[]
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Template variable
 */
export interface TemplateVariable {
  readonly name: string
  readonly type: "string" | "number" | "date" | "currency" | "list"
  readonly required: boolean
  readonly defaultValue?: unknown
  readonly description?: string
}

/**
 * When to suggest a template
 */
export interface TemplateSuggestion {
  readonly objectType: string
  readonly status?: string
  readonly category?: CommunicationCategory
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification type
 */
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "action_required"
  | "status_change"

/**
 * Notification action
 */
export interface NotificationAction {
  readonly type: "navigate" | "action" | "dismiss"
  readonly label: string
  readonly target?: string
  readonly payload?: Readonly<Record<string, unknown>>
}

/**
 * A notification
 */
export interface Notification {
  readonly id: EntityId
  readonly userId: EntityId
  readonly type: NotificationType
  readonly priority: Priority
  readonly title: string
  readonly body: string
  readonly action?: NotificationAction
  readonly context?: ThreadContext
  readonly read: boolean
  readonly readAt?: Timestamp
  readonly dismissed: boolean
  readonly createdAt: Timestamp
  readonly expiresAt?: Timestamp
}

// ============================================================================
// ENGINE TYPES
// ============================================================================

/**
 * Configuration for communication broker
 */
export interface CommunicationBrokerConfig {
  readonly generateId?: (prefix?: string) => EntityId
  readonly defaultChannel?: CommunicationChannel
  readonly defaultPriority?: Priority
  readonly templates?: readonly MessageTemplate[]
}

/**
 * Input for creating a message
 */
export interface CreateMessageInput {
  readonly threadId?: EntityId
  readonly channel?: CommunicationChannel
  readonly direction?: CommunicationDirection
  readonly priority?: Priority
  readonly subject?: string
  readonly body: string
  readonly bodyFormat?: "plain" | "html" | "markdown"
  readonly sender: Participant
  readonly recipients: readonly Recipient[]
  readonly attachments?: readonly Attachment[]
  readonly context?: ThreadContext
  readonly tags?: readonly string[]
  readonly meta?: Readonly<Record<string, unknown>>
}

/**
 * Input for sending from template
 */
export interface SendFromTemplateInput {
  readonly templateId: EntityId
  readonly threadId?: EntityId
  readonly sender: Participant
  readonly recipients: readonly Recipient[]
  readonly variables: Readonly<Record<string, unknown>>
  readonly context?: ThreadContext
}

/**
 * Filter for threads
 */
export interface ThreadFilter {
  readonly channels?: readonly CommunicationChannel[]
  readonly statuses?: readonly ThreadStatus[]
  readonly priorities?: readonly Priority[]
  readonly categories?: readonly CommunicationCategory[]
  readonly objectType?: string
  readonly objectId?: EntityId
  readonly participantId?: EntityId
  readonly hasUnread?: boolean
  readonly createdAfter?: Timestamp
  readonly createdBefore?: Timestamp
  readonly tags?: readonly string[]
}

/**
 * Sort for threads
 */
export interface ThreadSort {
  readonly field: "createdAt" | "updatedAt" | "priority" | "unreadCount"
  readonly direction: "asc" | "desc"
}

/**
 * Filter for notifications
 */
export interface NotificationFilter {
  readonly userId: EntityId
  readonly types?: readonly NotificationType[]
  readonly priorities?: readonly Priority[]
  readonly read?: boolean
  readonly dismissed?: boolean
  readonly objectType?: string
  readonly objectId?: EntityId
}
