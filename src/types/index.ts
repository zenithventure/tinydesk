import type { TicketStatus } from "@prisma/client"

export type { TicketStatus } from "@prisma/client"

export interface TicketCreateInput {
  productSlug: string
  submitterEmail: string
  submitterName?: string
  subject: string
  body: string
}

export interface TicketPublic {
  publicId: string
  subject: string
  status: TicketStatus
  productName: string
  createdAt: string
  updatedAt: string
  issueUrl?: string | null
  prUrl?: string | null
  deploymentUrl?: string | null
}

export interface TimelineEventPublic {
  id: string
  eventType: string
  actor?: string | null
  summary: string
  createdAt: string
}

export interface DashboardTicket {
  id: string
  publicId: string
  subject: string
  submitterEmail: string
  submitterName?: string | null
  status: TicketStatus
  productName: string
  humanFlagged: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
