/**
 * Communication Broker Engine
 *
 * Multi-channel, thread-based, context-aware communications.
 * Pure functions with no side effects.
 *
 * Features:
 * - Thread-based conversations
 * - Multi-channel support (email, notes, notifications)
 * - Template-based message generation
 * - Context linking to business objects
 * - Filtering and querying
 */

import type {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
  CommunicationPriority,
  Participant,
  Recipient,
  Message,
  Attachment,
  CommunicationThread,
  ThreadStatus,
  ThreadContext,
  CommunicationCategory,
  MessageTemplate,
  TemplateVariable,
  Notification,
  NotificationType,
  NotificationAction,
  CommunicationBrokerConfig,
  CreateMessageInput,
  SendFromTemplateInput,
  ThreadFilter,
  ThreadSort,
  NotificationFilter,
} from "./types"

export * from "./types"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Priority ordering for sorting
 */
const PRIORITY_ORDER: Record<CommunicationPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

/**
 * Status ordering for sorting
 */
const STATUS_ORDER: Record<ThreadStatus, number> = {
  active: 0,
  awaiting_response: 1,
  resolved: 2,
  closed: 3,
}

// ============================================================================
// COMMUNICATION BROKER
// ============================================================================

/**
 * Create a communication broker
 */
export function createCommunicationBroker(config: CommunicationBrokerConfig = {}) {
  const {
    generateId: customGenerateId = generateId,
    defaultChannel = "email",
    defaultPriority = "normal",
    templates = [],
  } = config

  // Index templates by ID
  const templatesById = new Map<string, MessageTemplate>()
  for (const template of templates) {
    templatesById.set(template.id, template)
  }

  return {
    /**
     * Create a new message (and optionally a new thread)
     */
    createMessage(
      input: CreateMessageInput,
      existingThread?: CommunicationThread
    ): { message: Message; thread: CommunicationThread } {
      const now = new Date()
      const messageId = customGenerateId()
      const threadId = input.threadId || existingThread?.id || customGenerateId()

      const message: Message = {
        id: messageId,
        threadId,
        channel: input.channel || defaultChannel,
        direction: input.direction || "outbound",
        status: "draft",
        priority: input.priority || defaultPriority,
        subject: input.subject,
        body: input.body,
        bodyFormat: input.bodyFormat || "plain",
        sender: input.sender,
        recipients: input.recipients,
        attachments: input.attachments,
        createdAt: now,
        meta: input.meta,
      }

      // Create or update thread
      const thread: CommunicationThread = existingThread
        ? {
            ...existingThread,
            messageIds: [...existingThread.messageIds, messageId],
            messageCount: existingThread.messageCount + 1,
            updatedAt: now,
            // Update participants if new ones added
            participants: mergeParticipants(existingThread.participants, [
              input.sender,
              ...input.recipients,
            ]),
          }
        : {
            id: threadId,
            subject: input.subject || "New Conversation",
            channel: input.channel || defaultChannel,
            status: "active",
            priority: input.priority || defaultPriority,
            context: input.context || { objectType: "general", objectId: threadId },
            participants: [input.sender, ...input.recipients],
            messageIds: [messageId],
            messageCount: 1,
            unreadCount: 0,
            createdAt: now,
            updatedAt: now,
            tags: input.tags,
            meta: input.meta,
          }

      return { message, thread }
    },

    /**
     * Send a message (mark as sent)
     */
    sendMessage(message: Message): Message {
      return {
        ...message,
        status: "sent",
        sentAt: new Date(),
      }
    },

    /**
     * Mark message as delivered
     */
    markDelivered(message: Message): Message {
      return {
        ...message,
        status: "delivered",
        deliveredAt: new Date(),
      }
    },

    /**
     * Mark message as read
     */
    markRead(message: Message): Message {
      return {
        ...message,
        status: "read",
        readAt: new Date(),
      }
    },

    /**
     * Mark message as failed
     */
    markFailed(message: Message, error?: string): Message {
      return {
        ...message,
        status: "failed",
        meta: { ...message.meta, error },
      }
    },

    /**
     * Create a reply to a message
     */
    createReply(
      originalMessage: Message,
      thread: CommunicationThread,
      input: {
        body: string
        bodyFormat?: "plain" | "html" | "markdown"
        sender: Participant
        recipients?: Recipient[]
        attachments?: Attachment[]
      }
    ): { message: Message; thread: CommunicationThread } {
      const recipients =
        input.recipients ||
        originalMessage.recipients.filter((r) => r.id !== input.sender.id)

      // Include original sender if not the current sender
      if (originalMessage.sender.id !== input.sender.id) {
        const senderAsRecipient: Recipient = {
          ...originalMessage.sender,
          recipientType: "to",
        }
        if (!recipients.some((r) => r.id === senderAsRecipient.id)) {
          recipients.unshift(senderAsRecipient)
        }
      }

      return this.createMessage(
        {
          threadId: thread.id,
          channel: originalMessage.channel,
          direction: "outbound",
          priority: originalMessage.priority,
          subject: originalMessage.subject
            ? `Re: ${originalMessage.subject.replace(/^Re:\s*/i, "")}`
            : undefined,
          body: input.body,
          bodyFormat: input.bodyFormat || "plain",
          sender: input.sender,
          recipients,
          attachments: input.attachments,
          context: thread.context,
        },
        thread
      )
    },

    /**
     * Generate a message from a template
     */
    generateFromTemplate(
      templateId: string,
      variables: Record<string, unknown>
    ): { subject?: string; body: string } | null {
      const template = templatesById.get(templateId)
      if (!template) return null

      let body = template.body
      let subject = template.subject

      // Replace variables
      for (const variable of template.variables) {
        const value = variables[variable.name] ?? variable.defaultValue ?? ""
        const placeholder = `{{${variable.name}}}`

        // Format value based on type
        const formatted = formatTemplateValue(value, variable.type)

        body = body.replace(new RegExp(placeholder, "g"), formatted)
        if (subject) {
          subject = subject.replace(new RegExp(placeholder, "g"), formatted)
        }
      }

      return { subject, body }
    },

    /**
     * Send a message from a template
     */
    sendFromTemplate(
      input: SendFromTemplateInput,
      existingThread?: CommunicationThread
    ): { message: Message; thread: CommunicationThread } | null {
      const generated = this.generateFromTemplate(input.templateId, input.variables)
      if (!generated) return null

      const template = templatesById.get(input.templateId)!

      return this.createMessage(
        {
          threadId: input.threadId,
          channel: template.channel,
          subject: generated.subject,
          body: generated.body,
          bodyFormat: template.bodyFormat,
          sender: input.sender,
          recipients: input.recipients,
          context: input.context,
        },
        existingThread
      )
    },

    /**
     * Get suggested templates for a context
     */
    getSuggestedTemplates(
      objectType: string,
      status?: string,
      category?: CommunicationCategory
    ): MessageTemplate[] {
      return templates.filter((t) => {
        if (!t.active || !t.suggestedFor) return false
        return t.suggestedFor.some(
          (s) =>
            s.objectType === objectType &&
            (!s.status || s.status === status) &&
            (!s.category || s.category === category)
        )
      })
    },

    /**
     * Get all templates
     */
    getTemplates(): MessageTemplate[] {
      return templates.filter((t) => t.active)
    },

    /**
     * Get a template by ID
     */
    getTemplate(templateId: string): MessageTemplate | undefined {
      return templatesById.get(templateId)
    },

    /**
     * Update thread status
     */
    updateThreadStatus(thread: CommunicationThread, status: ThreadStatus): CommunicationThread {
      return {
        ...thread,
        status,
        updatedAt: new Date(),
        closedAt: status === "closed" ? new Date() : thread.closedAt,
      }
    },

    /**
     * Close a thread
     */
    closeThread(thread: CommunicationThread): CommunicationThread {
      return this.updateThreadStatus(thread, "closed")
    },

    /**
     * Reopen a thread
     */
    reopenThread(thread: CommunicationThread): CommunicationThread {
      return {
        ...this.updateThreadStatus(thread, "active"),
        closedAt: undefined,
      }
    },

    /**
     * Mark thread as awaiting response
     */
    markAwaitingResponse(thread: CommunicationThread): CommunicationThread {
      return this.updateThreadStatus(thread, "awaiting_response")
    },

    /**
     * Add a tag to a thread
     */
    addTag(thread: CommunicationThread, tag: string): CommunicationThread {
      if (thread.tags?.includes(tag)) return thread
      return {
        ...thread,
        tags: [...(thread.tags || []), tag],
        updatedAt: new Date(),
      }
    },

    /**
     * Remove a tag from a thread
     */
    removeTag(thread: CommunicationThread, tag: string): CommunicationThread {
      return {
        ...thread,
        tags: (thread.tags || []).filter((t) => t !== tag),
        updatedAt: new Date(),
      }
    },

    /**
     * Update unread count
     */
    markThreadRead(thread: CommunicationThread): CommunicationThread {
      return {
        ...thread,
        unreadCount: 0,
        lastReadAt: new Date(),
        updatedAt: new Date(),
      }
    },

    /**
     * Increment unread count (for incoming messages)
     */
    incrementUnread(thread: CommunicationThread, count: number = 1): CommunicationThread {
      return {
        ...thread,
        unreadCount: thread.unreadCount + count,
        updatedAt: new Date(),
      }
    },
  }
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Create a notification
 */
export function createNotification(input: {
  userId: string
  type: NotificationType
  priority?: CommunicationPriority
  title: string
  body: string
  action?: NotificationAction
  context?: ThreadContext
  expiresAt?: Date
}): Notification {
  return {
    id: generateId(),
    userId: input.userId,
    type: input.type,
    priority: input.priority || "normal",
    title: input.title,
    body: input.body,
    action: input.action,
    context: input.context,
    read: false,
    dismissed: false,
    createdAt: new Date(),
    expiresAt: input.expiresAt,
  }
}

/**
 * Mark notification as read
 */
export function markNotificationRead(notification: Notification): Notification {
  return {
    ...notification,
    read: true,
    readAt: new Date(),
  }
}

/**
 * Dismiss a notification
 */
export function dismissNotification(notification: Notification): Notification {
  return {
    ...notification,
    dismissed: true,
  }
}

/**
 * Create action required notification
 */
export function createActionNotification(
  userId: string,
  title: string,
  body: string,
  action: NotificationAction,
  context?: ThreadContext
): Notification {
  return createNotification({
    userId,
    type: "action_required",
    priority: "high",
    title,
    body,
    action,
    context,
  })
}

/**
 * Create status change notification
 */
export function createStatusChangeNotification(
  userId: string,
  objectLabel: string,
  oldStatus: string,
  newStatus: string,
  context: ThreadContext
): Notification {
  return createNotification({
    userId,
    type: "status_change",
    priority: "normal",
    title: `${objectLabel} Status Changed`,
    body: `Status changed from ${oldStatus} to ${newStatus}`,
    action: {
      type: "navigate",
      label: "View Details",
      target: `/${context.objectType}/${context.objectId}`,
    },
    context,
  })
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter threads based on criteria
 */
export function filterThreads(
  threads: CommunicationThread[],
  filter: ThreadFilter
): CommunicationThread[] {
  return threads.filter((thread) => {
    if (filter.channels?.length && !filter.channels.includes(thread.channel)) {
      return false
    }
    if (filter.statuses?.length && !filter.statuses.includes(thread.status)) {
      return false
    }
    if (filter.priorities?.length && !filter.priorities.includes(thread.priority)) {
      return false
    }
    if (
      filter.categories?.length &&
      thread.context.category &&
      !filter.categories.includes(thread.context.category)
    ) {
      return false
    }
    if (filter.objectType && thread.context.objectType !== filter.objectType) {
      return false
    }
    if (filter.objectId && thread.context.objectId !== filter.objectId) {
      return false
    }
    if (filter.participantId) {
      const hasParticipant = thread.participants.some((p) => p.id === filter.participantId)
      if (!hasParticipant) return false
    }
    if (filter.hasUnread !== undefined) {
      const hasUnread = thread.unreadCount > 0
      if (filter.hasUnread !== hasUnread) return false
    }
    if (filter.createdAfter && thread.createdAt < filter.createdAfter) {
      return false
    }
    if (filter.createdBefore && thread.createdAt > filter.createdBefore) {
      return false
    }
    if (filter.tags?.length) {
      const hasAllTags = filter.tags.every((tag) => thread.tags?.includes(tag))
      if (!hasAllTags) return false
    }
    return true
  })
}

/**
 * Sort threads
 */
export function sortThreads(
  threads: CommunicationThread[],
  sort: ThreadSort
): CommunicationThread[] {
  const sorted = [...threads]
  const multiplier = sort.direction === "asc" ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case "createdAt":
        return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier
      case "updatedAt":
        return (a.updatedAt.getTime() - b.updatedAt.getTime()) * multiplier
      case "priority":
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * multiplier
      case "unreadCount":
        return (a.unreadCount - b.unreadCount) * multiplier
      default:
        return 0
    }
  })

  return sorted
}

/**
 * Filter notifications based on criteria
 */
export function filterNotifications(
  notifications: Notification[],
  filter: NotificationFilter
): Notification[] {
  return notifications.filter((notification) => {
    if (notification.userId !== filter.userId) {
      return false
    }
    if (filter.types?.length && !filter.types.includes(notification.type)) {
      return false
    }
    if (filter.priorities?.length && !filter.priorities.includes(notification.priority)) {
      return false
    }
    if (filter.read !== undefined && notification.read !== filter.read) {
      return false
    }
    if (filter.dismissed !== undefined && notification.dismissed !== filter.dismissed) {
      return false
    }
    if (filter.objectType && notification.context?.objectType !== filter.objectType) {
      return false
    }
    if (filter.objectId && notification.context?.objectId !== filter.objectId) {
      return false
    }
    return true
  })
}

/**
 * Get threads for a specific object
 */
export function getThreadsForObject(
  threads: CommunicationThread[],
  objectType: string,
  objectId: string
): CommunicationThread[] {
  return filterThreads(threads, { objectType, objectId })
}

/**
 * Get unread threads
 */
export function getUnreadThreads(threads: CommunicationThread[]): CommunicationThread[] {
  return filterThreads(threads, { hasUnread: true })
}

/**
 * Get unread notification count
 */
export function getUnreadNotificationCount(
  notifications: Notification[],
  userId: string
): number {
  return filterNotifications(notifications, { userId, read: false, dismissed: false }).length
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Merge participant lists (dedupe by ID)
 */
function mergeParticipants(existing: Participant[], newParticipants: Participant[]): Participant[] {
  const byId = new Map<string, Participant>()
  for (const p of existing) {
    byId.set(p.id, p)
  }
  for (const p of newParticipants) {
    if (!byId.has(p.id)) {
      byId.set(p.id, p)
    }
  }
  return Array.from(byId.values())
}

/**
 * Format template value based on type
 */
function formatTemplateValue(
  value: unknown,
  type: TemplateVariable["type"]
): string {
  if (value === null || value === undefined) return ""

  switch (type) {
    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString()
      }
      return String(value)

    case "currency":
      if (typeof value === "number") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)
      }
      return String(value)

    case "number":
      if (typeof value === "number") {
        return new Intl.NumberFormat("en-US").format(value)
      }
      return String(value)

    case "list":
      if (Array.isArray(value)) {
        return value.join(", ")
      }
      return String(value)

    default:
      return String(value)
  }
}

/**
 * Create a participant from basic info
 */
export function createParticipant(
  id: string,
  name: string,
  type: Participant["type"] = "user",
  options?: { email?: string; phone?: string; role?: string }
): Participant {
  return {
    id,
    type,
    name,
    ...options,
  }
}

/**
 * Create a recipient from a participant
 */
export function createRecipient(
  participant: Participant,
  recipientType: Recipient["recipientType"] = "to"
): Recipient {
  return {
    ...participant,
    recipientType,
  }
}

/**
 * Calculate communication statistics
 */
export function calculateCommunicationStats(threads: CommunicationThread[]): {
  total: number
  active: number
  awaitingResponse: number
  resolved: number
  closed: number
  unread: number
  byChannel: Record<CommunicationChannel, number>
  byCategory: Record<string, number>
} {
  const stats = {
    total: threads.length,
    active: 0,
    awaitingResponse: 0,
    resolved: 0,
    closed: 0,
    unread: 0,
    byChannel: {} as Record<CommunicationChannel, number>,
    byCategory: {} as Record<string, number>,
  }

  for (const thread of threads) {
    // Status counts
    switch (thread.status) {
      case "active":
        stats.active++
        break
      case "awaiting_response":
        stats.awaitingResponse++
        break
      case "resolved":
        stats.resolved++
        break
      case "closed":
        stats.closed++
        break
    }

    // Unread
    if (thread.unreadCount > 0) {
      stats.unread++
    }

    // By channel
    stats.byChannel[thread.channel] = (stats.byChannel[thread.channel] || 0) + 1

    // By category
    if (thread.context.category) {
      stats.byCategory[thread.context.category] =
        (stats.byCategory[thread.context.category] || 0) + 1
    }
  }

  return stats
}
