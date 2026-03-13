import { TimelineEventItem } from "./timeline-event-item"
import type { TimelineEventPublic } from "@/types"

interface TimelineProps {
  events: TimelineEventPublic[]
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500">No timeline events yet.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-0">
        {events.map((event) => (
          <TimelineEventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
