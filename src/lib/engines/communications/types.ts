/**
 * Communication Broker Engine - Types
 *
 * Multi-channel, thread-based, context-aware communications.
 * Supports email, internal notes, notifications, and external messaging.
 */

// ============================================================================
// CORE COMMUNICATION TYPES
// ============================================================================

/**
 * Communication channel types
 */
export type CommunicationChannel =
  | "email"
  | "internal_note"
  | "notification"
  | "sms"
  | "webhook"
  | "comment"

/**
 * Communication direction
 */
export type CommunicationDirection = "inbound" | "outbound" | "internal"

/**
 * Communication status
 */
export type CommunicationStatus =
  | "draft"
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "bounced"

/**
 * Communication priority
 */
export type CommunicationPriority = "urgent" | "high" | "normal" | "low"

// ============================================================================
// PARTICIPANT TYPES
// ============================================================================

/**
 * A participant in a communication
 */
export interface Participant {
  id: string
  type: "user" | "contact" | "system" | "external"
  name: string
  email?: string
  phone?: string
  role?: string // e.g., "buyer", "supplier", "approver"
}

/**
 * Recipient of a message
 */
export interface Recipient extends Participant {
  recipientType: "to" | "cc" | "bcc"
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * A single communication message
 */
export interface Message {
  id: string
  threadId: string
  channel: CommunicationChannel
  direction: CommunicationDirection
  status: CommunicationStatus
  priority: CommunicationPriority

  /** Message content */
  subject?: string
  body: string
  bodyFormat: "plain" | "html" | "markdown"

  /** Participants */
  sender: Participant
  recipients: Recipient[]

  /** Attachments */
  attachments?: Attachment[]

  /** Timestamps */
  createdAt: Date
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date

  /** Tracking */
  externalId?: string // ID in external system (e.g., email message-id)
  inReplyTo?: string // Message ID this is replying to

  /** Metadata */
  meta?: Record<string, unknown>
}

/**
 * Attachment to a message
 */
export interface Attachment {
  id: string
  name: string
  mimeType: string
  size: number
  url?: string
  content?: string // Base64 encoded for small files
}

// ============================================================================
// THREAD TYPES
// ============================================================================

/**
 * A communication thread (conversation)
 */
export interface CommunicationThread {
  id: string
  subject: string
  channel: CommunicationChannel
  status: ThreadStatus
  priority: CommunicationPriority

  /** Context - what this thread is about */
  context: ThreadContext

  /** Participants in this thread */
  participants: Participant[]

  /** Messages in thread (ordered by createdAt) */
  messageIds: string[]
  messageCount: number

  /** Unread tracking */
  unreadCount: number
  lastReadAt?: Date

  /** Timestamps */
  createdAt: Date
  updatedAt: Date
  closedAt?: Date

  /** Thread metadata */
  tags?: string[]
  meta?: Record<string, unknown>
}

/**
 * Thread status
 */
export type ThreadStatus = "active" | "awaiting_response" | "resolved" | "closed"

/**
 * Context linking thread to business objects
 */
export interface ThreadContext {
  /** Primary object this thread is about */
  objectType: string // e.g., "purchase_order", "sales_order", "shipment"
  objectId: string
  objectLabel?: string // e.g., "PO-2024-0001"

  /** Additional related objects */
  relatedObjects?: {
    type: string
    id: string
    label?: string
  }[]

  /** Category/purpose of the communication */
  category?: CommunicationCategory
}

/**
 * Communication categories
 */
export type CommunicationCategory =
  | "order_confirmation"
  | "shipping_update"
  | "invoice_query"
  | "quality_issue"
  | "change_request"
  | "general_inquiry"
  | "approval_request"
  | "reminder"
  | "escalation"
  | "other"

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * A message template
 */
export interface MessageTemplate {
  id: string
  name: string
  description?: string
  channel: CommunicationChannel
  category?: CommunicationCategory

  /** Template content */
  subject?: string
  body: string
  bodyFormat: "plain" | "html" | "markdown"

  /** Variables that can be substituted */
  variables: TemplateVariable[]

  /** Default recipients (by role/type) */
  defaultRecipients?: {
    role: string
    recipientType: "to" | "cc" | "bcc"
  }[]

  /** When this template should be suggested */
  suggestedFor?: {
    objectType: string
    status?: string
    category?: CommunicationCategory
  }[]

  /** Metadata */
  active: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * A variable in a template
 */
export interface TemplateVariable {
  name: string // e.g., "order_number", "recipient_name"
  label: string
  type: "string" | "number" | "date" | "currency" | "list"
  required: boolean
  defaultValue?: unknown
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * An in-app notification
 */
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority: CommunicationPriority

  /** Content */
  title: string
  body: string

  /** Action to take when clicked */
  action?: NotificationAction

  /** Context */
  context?: ThreadContext

  /** Status */
  read: boolean
  readAt?: Date
  dismissed: boolean

  /** Timestamps */
  createdAt: Date
  expiresAt?: Date
}

/**
 * Notification types
 */
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "action_required"
  | "mention"
  | "assignment"
  | "status_change"
  | "reminder"

/**
 * Action for a notification
 */
export interface NotificationAction {
  type: "navigate" | "open_modal" | "external_link"
  label: string
  target: string // URL or modal ID
  params?: Record<string, unknown>
}

// ============================================================================
// BROKER TYPES
// ============================================================================

/**
 * Configuration for the communication broker
 */
export interface CommunicationBrokerConfig {
  /** Generate unique IDs */
  generateId?: () => string

  /** Default channel */
  defaultChannel?: CommunicationChannel

  /** Default priority */
  defaultPriority?: CommunicationPriority

  /** Template resolver */
  templates?: MessageTemplate[]
}

/**
 * Input for creating a message
 */
export interface CreateMessageInput {
  threadId?: string // If undefined, creates new thread
  channel?: CommunicationChannel
  direction?: CommunicationDirection
  priority?: CommunicationPriority

  subject?: string
  body: string
  bodyFormat?: "plain" | "html" | "markdown"

  sender: Participant
  recipients: Recipient[]
  attachments?: Attachment[]

  /** For new threads */
  context?: ThreadContext
  tags?: string[]

  meta?: Record<string, unknown>
}

/**
 * Input for sending from a template
 */
export interface SendFromTemplateInput {
  templateId: string
  variables: Record<string, unknown>
  recipients: Recipient[]
  sender: Participant
  context: ThreadContext
  threadId?: string
}

/**
 * Filter criteria for querying threads
 */
export interface ThreadFilter {
  channels?: CommunicationChannel[]
  statuses?: ThreadStatus[]
  priorities?: CommunicationPriority[]
  categories?: CommunicationCategory[]
  objectType?: string
  objectId?: string
  participantId?: string
  hasUnread?: boolean
  createdAfter?: Date
  createdBefore?: Date
  tags?: string[]
}

/**
 * Sort options for threads
 */
export interface ThreadSort {
  field: "createdAt" | "updatedAt" | "priority" | "unreadCount"
  direction: "asc" | "desc"
}

/**
 * Filter criteria for querying notifications
 */
export interface NotificationFilter {
  userId: string
  types?: NotificationType[]
  priorities?: CommunicationPriority[]
  read?: boolean
  dismissed?: boolean
  objectType?: string
  objectId?: string
}
