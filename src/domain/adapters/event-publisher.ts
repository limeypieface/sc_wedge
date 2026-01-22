/**
 * Event Publisher Port
 *
 * Interface for publishing domain events.
 * Implementations can publish to various event buses, queues, etc.
 */

import type { EntityId } from "../core/types"
import type { DomainEvent } from "../core/events"
import type { Result } from "../core/errors"

// ============================================================================
// EVENT PUBLISHER PORT
// ============================================================================

/**
 * Event publisher interface
 */
export interface EventPublisherPort {
  /**
   * Publish a single event
   */
  publish<T extends DomainEvent>(event: T): Promise<Result<void>>

  /**
   * Publish multiple events
   */
  publishBatch<T extends DomainEvent>(events: readonly T[]): Promise<Result<void>>
}

/**
 * Event subscriber interface
 */
export interface EventSubscriberPort {
  /**
   * Subscribe to events of a specific type
   */
  subscribe<T extends DomainEvent>(
    type: string,
    handler: EventHandler<T>
  ): Subscription

  /**
   * Subscribe to all events
   */
  subscribeAll(handler: EventHandler<DomainEvent>): Subscription
}

/**
 * Event handler function
 */
export type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>

/**
 * Subscription handle
 */
export interface Subscription {
  readonly id: string
  unsubscribe(): void
  isActive(): boolean
}

// ============================================================================
// EVENT BUS (combining publisher and subscriber)
// ============================================================================

/**
 * Event bus combining publisher and subscriber
 */
export interface EventBusPort extends EventPublisherPort, EventSubscriberPort {}

// ============================================================================
// IN-MEMORY IMPLEMENTATION (for testing)
// ============================================================================

/**
 * Create an in-memory event bus for testing
 */
export function createInMemoryEventBus(): EventBusPort & {
  getPublishedEvents: () => DomainEvent[]
  clear: () => void
} {
  const publishedEvents: DomainEvent[] = []
  const subscriptions = new Map<string, { type: string | "*"; handler: EventHandler<DomainEvent> }>()
  let subscriptionId = 0

  return {
    async publish<T extends DomainEvent>(event: T) {
      publishedEvents.push(event)

      // Notify subscribers
      for (const [, sub] of subscriptions) {
        if (sub.type === "*" || sub.type === event.type) {
          await sub.handler(event)
        }
      }

      return { success: true, data: undefined }
    },

    async publishBatch<T extends DomainEvent>(events: readonly T[]) {
      for (const event of events) {
        await this.publish(event)
      }
      return { success: true, data: undefined }
    },

    subscribe<T extends DomainEvent>(type: string, handler: EventHandler<T>): Subscription {
      const id = `sub-${++subscriptionId}`
      subscriptions.set(id, { type, handler: handler as EventHandler<DomainEvent> })

      return {
        id,
        unsubscribe() {
          subscriptions.delete(id)
        },
        isActive() {
          return subscriptions.has(id)
        },
      }
    },

    subscribeAll(handler: EventHandler<DomainEvent>): Subscription {
      const id = `sub-${++subscriptionId}`
      subscriptions.set(id, { type: "*", handler })

      return {
        id,
        unsubscribe() {
          subscriptions.delete(id)
        },
        isActive() {
          return subscriptions.has(id)
        },
      }
    },

    getPublishedEvents: () => [...publishedEvents],
    clear: () => {
      publishedEvents.length = 0
    },
  }
}
