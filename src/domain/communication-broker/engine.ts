/**
 * Communication Broker Engine
 *
 * Multi-channel, thread-based, context-aware communications.
 * Pure functions with no side effects.
 */

import { defaultIdGenerator, type Priority, PRIORITY_ORDER } from "../core/utils"
import type {
  CommunicationChannel,
  CommunicationDirection,
  MessageStatus,
  ThreadStatus,
  CommunicationCategory,
  Participant,
  Recipient,
  Message,
  CommunicationThread,
  MessageTemplate,
  TemplateVariable,
  Notification,
  NotificationType,
  NotificationAction,
  ThreadContext,
  CommunicationBrokerConfig,
  CreateMessageInput,
  ThreadFilter,
  ThreadSort,
  NotificationFilter,
} from "./types"

// ============================================================================
// COMMUNICATION BROKER
// ============================================================================

/**
 * Create a communication broker
 */
export function createCommunicationBroker(config: CommunicationBrokerConfig = {}) {
  const {
    generateId = defaultIdGenerator.generate,
    defaultChannel = "email",
    defaultPriority = "normal",
    templates = [],
  } = config

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
      const messageId = generateId("msg")
      const threadId = input.threadId || existingThread?.id || generateId("thr")

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
        recipients: [...input.recipients],
        attachments: input.attachments,
        createdAt: now,
        meta: input.meta,
      }

      const thread: CommunicationThread = existingThread
        ? {
            ...existingThread,
            messageIds: [...existingThread.messageIds, messageId],
            messageCount: existingThread.messageCount + 1,
            updatedAt: now,
            participants: mergeParticipants([...existingThread.participants], [
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
     * Create a reply to a message
     */
    createReply(
      originalMessage: Message,
      thread: CommunicationThread,
      input: {
        body: string
        bodyFormat?: "plain" | "html" | "markdown"
        sender: Participant
        recipients?: readonly Recipient[]
      }
    ): { message: Message; thread: CommunicationThread } {
      const recipients: Recipient[] = input.recipients
        ? [...input.recipients]
        : [...originalMessage.recipients].filter((r) => r.id !== input.sender.id)

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

      for (const variable of template.variables) {
        const value = variables[variable.name] ?? variable.defaultValue ?? ""
        const placeholder = `{{${variable.name}}}`
        const formatted = formatTemplateValue(value, variable.type)

        body = body.replace(new RegExp(placeholder, "g"), formatted)
        if (subject) {
          subject = subject.replace(new RegExp(placeholder, "g"), formatted)
        }
      }

      return { subject, body }
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
     * Mark thread as read
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
     * Increment unread count
     */
    incrementUnread(thread: CommunicationThread, count: number = 1): CommunicationThread {
      return {
        ...thread,
        unreadCount: thread.unreadCount + count,
        updatedAt: new Date(),
      }
    },

    /**
     * Get templates
     */
    getTemplates(): MessageTemplate[] {
      return [...templates].filter((t) => t.active)
    },

    /**
     * Get suggested templates for context
     */
    getSuggestedTemplates(
      objectType: string,
      status?: string,
      category?: CommunicationCategory
    ): MessageTemplate[] {
      return [...templates].filter((t) => {
        if (!t.active || !t.suggestedFor) return false
        return t.suggestedFor.some(
          (s) =>
            s.objectType === objectType &&
            (!s.status || s.status === status) &&
            (!s.category || s.category === category)
        )
      })
    },
  }
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Create a notification
 */
export function createNotification(
  generateId: (prefix?: string) => string,
  input: {
    userId: string
    type: NotificationType
    priority?: Priority
    title: string
    body: string
    action?: NotificationAction
    context?: ThreadContext
    expiresAt?: Date
  }
): Notification {
  return {
    id: generateId("ntf"),
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

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Filter threads
 */
export function filterThreads(
  threads: readonly CommunicationThread[],
  filter: ThreadFilter
): CommunicationThread[] {
  return threads.filter((thread) => {
    if (filter.channels?.length && !filter.channels.includes(thread.channel)) return false
    if (filter.statuses?.length && !filter.statuses.includes(thread.status)) return false
    if (filter.priorities?.length && !filter.priorities.includes(thread.priority)) return false
    if (filter.objectType && thread.context.objectType !== filter.objectType) return false
    if (filter.objectId && thread.context.objectId !== filter.objectId) return false
    if (filter.participantId) {
      const hasParticipant = thread.participants.some((p) => p.id === filter.participantId)
      if (!hasParticipant) return false
    }
    if (filter.hasUnread !== undefined) {
      const hasUnread = thread.unreadCount > 0
      if (filter.hasUnread !== hasUnread) return false
    }
    if (filter.createdAfter && thread.createdAt < filter.createdAfter) return false
    if (filter.createdBefore && thread.createdAt > filter.createdBefore) return false
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
  threads: readonly CommunicationThread[],
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
 * Filter notifications
 */
export function filterNotifications(
  notifications: readonly Notification[],
  filter: NotificationFilter
): Notification[] {
  return notifications.filter((notification) => {
    if (notification.userId !== filter.userId) return false
    if (filter.types?.length && !filter.types.includes(notification.type)) return false
    if (filter.read !== undefined && notification.read !== filter.read) return false
    if (filter.dismissed !== undefined && notification.dismissed !== filter.dismissed) return false
    return true
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mergeParticipants(existing: Participant[], newParticipants: readonly Participant[]): Participant[] {
  const byId = new Map<string, Participant>()
  for (const p of existing) byId.set(p.id, p)
  for (const p of newParticipants) {
    if (!byId.has(p.id)) byId.set(p.id, p)
  }
  return Array.from(byId.values())
}

function formatTemplateValue(value: unknown, type: TemplateVariable["type"]): string {
  if (value === null || value === undefined) return ""

  switch (type) {
    case "date":
      if (value instanceof Date) return value.toLocaleDateString()
      return String(value)
    case "currency":
      if (typeof value === "number") {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
      }
      return String(value)
    case "number":
      if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value)
      return String(value)
    case "list":
      if (Array.isArray(value)) return value.join(", ")
      return String(value)
    default:
      return String(value)
  }
}

/**
 * Create a participant
 */
export function createParticipant(
  id: string,
  name: string,
  type: Participant["type"] = "user",
  options?: { email?: string; phone?: string; role?: string }
): Participant {
  return { id, type, name, ...options }
}

/**
 * Create a recipient from a participant
 */
export function createRecipient(
  participant: Participant,
  recipientType: Recipient["recipientType"] = "to"
): Recipient {
  return { ...participant, recipientType }
}
