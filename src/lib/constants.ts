import type { TicketStatus } from "@prisma/client"

export const STATUS_ORDER: TicketStatus[] = [
  "RECEIVED",
  "ISSUE_CREATED",
  "FIX_IN_PROGRESS",
  "PR_OPEN",
  "CHANGES_REQUESTED",
  "MERGED",
  "DEPLOYED",
  "CLOSED",
]

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "secondary" }
> = {
  RECEIVED: { label: "Received", variant: "default" },
  ISSUE_CREATED: { label: "Issue Created", variant: "info" },
  FIX_IN_PROGRESS: { label: "Fix in Progress", variant: "info" },
  PR_OPEN: { label: "PR Open", variant: "warning" },
  CHANGES_REQUESTED: { label: "Changes Requested", variant: "warning" },
  MERGED: { label: "Merged", variant: "success" },
  DEPLOYED: { label: "Deployed", variant: "success" },
  CLOSED: { label: "Closed", variant: "secondary" },
}

export const PIPELINE_STAGES = STATUS_ORDER.map((status) => ({
  status,
  label: STATUS_CONFIG[status].label,
}))

export const EVENT_TYPES = {
  TICKET_CREATED: "ticket_created",
  ISSUE_LINKED: "issue_linked",
  ISSUE_ASSIGNED: "issue_assigned",
  PR_OPENED: "pr_opened",
  CHANGES_REQUESTED: "changes_requested",
  PR_MERGED: "pr_merged",
  DEPLOYED: "deployed",
  STATUS_CHANGED: "status_changed",
  COMMENT: "comment",
} as const
