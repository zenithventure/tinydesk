import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyGitHubSignature, extractTicketId, extractIssueNumber, mapEventToStatus } from "@/lib/github"
import { updateTicketStatus, appendTimelineEvent } from "@/lib/tickets"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const event = req.headers.get("x-github-event")
    const signature = req.headers.get("x-hub-signature-256")

    if (!event) {
      return NextResponse.json({ error: "Missing X-GitHub-Event header" }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)

    // Determine which product this webhook is for based on the repo
    const repoFullName = payload.repository?.full_name
    if (!repoFullName) {
      return NextResponse.json({ error: "Missing repository info" }, { status: 400 })
    }

    const [repoOwner, repoName] = repoFullName.split("/")
    const product = await prisma.product.findFirst({
      where: { repoOwner, repoName },
    })

    if (!product) {
      return NextResponse.json({ ok: true, message: "No matching product" })
    }

    // Verify signature if webhook secret is configured
    if (product.webhookSecret) {
      if (!verifyGitHubSignature(rawBody, signature, product.webhookSecret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Mark webhook as configured on first successful delivery
    if (!product.webhookConfigured) {
      await prisma.product.update({
        where: { id: product.id },
        data: { webhookConfigured: true },
      })
    }

    // Handle issue events
    if (event === "issues") {
      const ticketId = extractTicketId(payload.issue?.body)
      if (!ticketId) {
        return NextResponse.json({ ok: true, message: "No ticket reference found" })
      }

      const ticket = await prisma.ticket.findUnique({
        where: { publicId: ticketId },
      })

      if (!ticket) {
        return NextResponse.json({ ok: true, message: "Ticket not found" })
      }

      const statusMapping = mapEventToStatus(event, payload.action, payload)
      if (!statusMapping) {
        return NextResponse.json({ ok: true, message: "Unhandled action" })
      }

      // Link issue to ticket
      if (payload.action === "opened") {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            issueNumber: payload.issue.number,
            issueUrl: payload.issue.html_url,
          },
        })
      }

      await updateTicketStatus(ticket.id, statusMapping.status as any, {
        actor: payload.sender?.login,
        summary: statusMapping.summary,
        eventType: statusMapping.eventType,
        payload: { githubEvent: event, action: payload.action },
      })

      return NextResponse.json({ ok: true, ticketId, status: statusMapping.status })
    }

    // Handle PR events
    if (event === "pull_request") {
      const ticket = await findTicketForPR(product.id, payload)

      if (!ticket) {
        return NextResponse.json({ ok: true, message: "No ticket linked to this PR" })
      }

      const statusMapping = mapEventToStatus(event, payload.action, payload)
      if (!statusMapping) {
        return NextResponse.json({ ok: true, message: "Unhandled action" })
      }

      // Link PR to ticket on open/reopen
      if (payload.action === "opened" || payload.action === "reopened") {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            prNumber: payload.pull_request.number,
            prUrl: payload.pull_request.html_url,
          },
        })
      }

      await updateTicketStatus(ticket.id, statusMapping.status as any, {
        actor: payload.sender?.login,
        summary: statusMapping.summary,
        eventType: statusMapping.eventType,
        payload: { githubEvent: event, action: payload.action },
      })

      return NextResponse.json({ ok: true, ticketId: ticket.publicId, status: statusMapping.status })
    }

    // Handle PR review events
    if (event === "pull_request_review") {
      const prNumber = payload.pull_request?.number
      if (!prNumber) {
        return NextResponse.json({ ok: true, message: "Missing PR number" })
      }

      const ticket = await prisma.ticket.findFirst({
        where: {
          productId: product.id,
          prNumber,
        },
      })

      if (!ticket) {
        return NextResponse.json({ ok: true, message: "No ticket linked to this PR" })
      }

      const statusMapping = mapEventToStatus(event, payload.action, payload)
      if (!statusMapping) {
        return NextResponse.json({ ok: true, message: "Unhandled review action" })
      }

      await updateTicketStatus(ticket.id, statusMapping.status as any, {
        actor: payload.review?.user?.login,
        summary: statusMapping.summary,
        eventType: statusMapping.eventType,
        payload: { githubEvent: event, action: payload.action },
      })

      return NextResponse.json({ ok: true, ticketId: ticket.publicId, status: statusMapping.status })
    }

    return NextResponse.json({ ok: true, message: "Event not handled" })
  } catch (error) {
    console.error("[webhooks/github] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Find the TinyDesk ticket linked to an incoming pull_request webhook event.
 *
 * Strategy (in priority order):
 *  1. By prNumber from the webhook payload — reliable for all actions because
 *     prNumber is stored on the ticket when the PR is opened.
 *  2. By issueNumber extracted from the PR body (e.g. "Closes #N") — covers
 *     cases where the PR was opened before TinyDesk stored the prNumber.
 *  3. By publicId extracted directly from the PR body
 *     (e.g. "TinyDesk-Ticket: TD-XXXX") — covers PRs that reference the
 *     ticket without going through a GitHub issue.
 *
 * This multi-strategy lookup fixes TD-0005: previously only strategy #2 was
 * used, so a merged PR whose body lacked "Closes/Fixes/Resolves #N" would
 * silently fail to update the ticket status.
 */
async function findTicketForPR(productId: string, payload: any) {
  const prNumber: number | undefined = payload.pull_request?.number
  const prBody: string | null = payload.pull_request?.body ?? null

  // 1. Look up by prNumber stored on the ticket (most reliable path)
  if (prNumber) {
    const ticket = await prisma.ticket.findFirst({
      where: { productId, prNumber },
    })
    if (ticket) return ticket
  }

  // 2. Look up by issueNumber extracted from PR body ("Closes #N")
  const issueNumber = extractIssueNumber(prBody)
  if (issueNumber) {
    const ticket = await prisma.ticket.findFirst({
      where: { productId, issueNumber },
    })
    if (ticket) return ticket
  }

  // 3. Look up by TinyDesk ticket ID embedded directly in PR body
  const ticketPublicId = extractTicketId(prBody)
  if (ticketPublicId) {
    const ticket = await prisma.ticket.findFirst({
      where: { productId, publicId: ticketPublicId },
    })
    if (ticket) return ticket
  }

  return null
}
