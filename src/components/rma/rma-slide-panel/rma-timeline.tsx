"use client"

/**
 * RMATimeline
 *
 * Displays the timeline of RMA status changes.
 */

import { SlidePanelSection } from "@/components/ui/slide-panel"
import { cn } from "@/lib/utils"
import type { RMATimelineEvent } from "@/types/rma-types"

interface RMATimelineProps {
  timeline: RMATimelineEvent[]
}

export function RMATimeline({ timeline }: RMATimelineProps) {
  // Sort timeline in reverse chronological order (most recent first)
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <SlidePanelSection title="TIMELINE">
      <div className="relative">
        {sortedTimeline.map((event, index) => {
          const isFirst = index === 0
          const isLast = index === sortedTimeline.length - 1
          const date = new Date(event.timestamp)

          return (
            <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    isFirst ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
                {!isLast && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <p className={cn(
                  "text-sm",
                  isFirst ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {event.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                    })}
                  </span>
                  <span>
                    {date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {event.actor && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{event.actor}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SlidePanelSection>
  )
}
