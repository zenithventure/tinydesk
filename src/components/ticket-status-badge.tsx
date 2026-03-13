import { Badge } from "@/components/ui/badge"
import { STATUS_CONFIG } from "@/lib/constants"
import type { TicketStatus } from "@prisma/client"

interface TicketStatusBadgeProps {
  status: TicketStatus
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
