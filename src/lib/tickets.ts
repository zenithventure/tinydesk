import prisma from "./prisma"
import { generatePublicId } from "./utils"
import { sendTicketReceipt, sendStatusUpdate } from "./email"
import { STATUS_CONFIG, EVENT_TYPES } from "./constants"
import type { TicketStatus } from "@prisma/client"

export async function createTicket(input: {
  productId: string
  submitterEmail: string
  submitterName?: string
  subject: string
  body: string
}) {
  // Get the next sequence number
  const count = await prisma.ticket.count()
  const publicId = generatePublicId(count + 1)

  const ticket = await prisma.ticket.create({
    data: {
      publicId,
      productId: input.productId,
      submitterEmail: input.submitterEmail,
      submitterName: input.submitterName,
      subject: input.subject,
      body: input.body,
      status: "RECEIVED",
    },
    include: { product: true },
  })

  // Append timeline event
  await appendTimelineEvent({
    ticketId: ticket.id,
    eventType: EVENT_TYPES.TICKET_CREATED,
    summary: "Ticket submitted",
    actor: input.submitterEmail,
    public: true,
  })

  // Send receipt email (fire-and-forget)
  sendTicketReceipt(input.submitterEmail, publicId, input.subject)

  return ticket
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  options?: { actor?: string; summary?: string; eventType?: string; payload?: any }
) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: newStatus },
    include: { product: true },
  })

  const summary = options?.summary || `Status changed to ${STATUS_CONFIG[newStatus].label}`

  await appendTimelineEvent({
    ticketId,
    eventType: options?.eventType || EVENT_TYPES.STATUS_CHANGED,
    summary,
    actor: options?.actor,
    payload: options?.payload,
    public: true,
  })

  // Notify submitter
  sendStatusUpdate(
    ticket.submitterEmail,
    ticket.publicId,
    ticket.subject,
    STATUS_CONFIG[newStatus].label,
    summary
  )

  return ticket
}

export async function appendTimelineEvent(input: {
  ticketId: string
  eventType: string
  summary: string
  actor?: string
  payload?: any
  public?: boolean
}) {
  return prisma.timelineEvent.create({
    data: {
      ticketId: input.ticketId,
      eventType: input.eventType,
      summary: input.summary,
      actor: input.actor,
      payload: input.payload ?? undefined,
      public: input.public ?? true,
    },
  })
}
