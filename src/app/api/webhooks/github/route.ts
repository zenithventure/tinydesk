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
      const issueNumber = extractIssueNumber(payload.pull_request?.body)
      if (!issueNumber) {
        return NextResponse.json({ ok: true, message: "No issue reference in PR" })
      }

      // Find ticket linked to this issue number for this product
      const ticket = await prisma.ticket.findFirst({
        where: {
          productId: product.id,
          issueNumber,
        },
      })

      if (!ticket) {
        return NextResponse.json({ ok: true, message: "No ticket linked to this issue" })
      }

      const statusMapping = mapEventToStatus(event, payload.action, payload)
      if (!statusMapping) {
        return NextResponse.json({ ok: true, message: "Unhandled action" })
      }

      // Link PR to ticket
      if (payload.action === "opened") {
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
