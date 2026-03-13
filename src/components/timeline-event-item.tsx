import { GitBranch, GitPullRequest, CheckCircle, Circle, MessageSquare, Rocket, Ticket } from "lucide-react"
import type { TimelineEventPublic } from "@/types"

const EVENT_ICONS: Record<string, typeof Circle> = {
  ticket_created: Ticket,
  issue_linked: GitBranch,
  issue_assigned: GitBranch,
  pr_opened: GitPullRequest,
  changes_requested: MessageSquare,
  pr_merged: CheckCircle,
  deployed: Rocket,
  status_changed: Circle,
  comment: MessageSquare,
}

interface TimelineEventItemProps {
  event: TimelineEventPublic
}

export function TimelineEventItem({ event }: TimelineEventItemProps) {
  const Icon = EVENT_ICONS[event.eventType] || Circle

  return (
    <div className="relative flex items-start gap-4 pb-6 pl-10">
      <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
        <Icon className="w-2 h-2 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{event.summary}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {event.actor && (
            <span className="text-xs text-gray-500">{event.actor}</span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(event.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
