import prisma from "./prisma"
import { generatePublicId, absoluteUrl } from "./utils"
import { sendTicketReceipt, sendStatusUpdate } from "./email"
import { createGitHubIssue, isGitHubAppConfigured } from "./github-app"
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

  // Auto-create GitHub issue if the product has a linked repo
  if (ticket.product.repoOwner && ticket.product.repoName && isGitHubAppConfigured()) {
    autoCreateGitHubIssue(ticket).catch((err) => {
      console.error("[tickets] Failed to auto-create GitHub issue:", err)
    })
  }

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

async function autoCreateGitHubIssue(ticket: {
  id: string
  publicId: string
  subject: string
  body: string
  submitterEmail: string
  product: { repoOwner: string | null; repoName: string | null; defaultAssignee: string | null }
}) {
  const { repoOwner, repoName, defaultAssignee } = ticket.product
  if (!repoOwner || !repoName) return

  const statusUrl = absoluteUrl(`/ticket/${ticket.publicId}`)
  const issueBody = [
    `**${ticket.subject}**`,
    "",
    ticket.body,
    "",
    "---",
    `TinyDesk-Ticket: ${ticket.publicId}`,
    `Submitted by: ${ticket.submitterEmail}`,
    `Status page: ${statusUrl}`,
  ].join("\n")

  try {
    const issue = await createGitHubIssue({
      owner: repoOwner,
      repo: repoName,
      title: `[${ticket.publicId}] ${ticket.subject}`,
      body: issueBody,
      assignee: defaultAssignee || undefined,
    })

    // Link the issue to the ticket
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        status: defaultAssignee ? "FIX_IN_PROGRESS" : "ISSUE_CREATED",
      },
    })

    await appendTimelineEvent({
      ticketId: ticket.id,
      eventType: EVENT_TYPES.ISSUE_LINKED,
      summary: `GitHub issue #${issue.number} created automatically`,
      actor: "tinydesk-bot",
      public: true,
    })

    if (defaultAssignee) {
      await appendTimelineEvent({
        ticketId: ticket.id,
        eventType: "issue_assigned",
        summary: `Issue assigned to @${defaultAssignee}`,
        actor: "tinydesk-bot",
        public: true,
      })
    }
  } catch (err) {
    console.error("[tickets] autoCreateGitHubIssue error:", err)
  }
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
