import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDashboardAccess } from "@/lib/auth"
import { updateTicketSchema } from "@/lib/validators"
import { updateTicketStatus, appendTimelineEvent } from "@/lib/tickets"
import { EVENT_TYPES } from "@/lib/constants"

/**
 * Checks whether the authenticated user can access the given ticket.
 * - ADMIN: yes
 * - Product owner: yes, if they own the ticket's product
 * - Regular user: yes, only if they submitted the ticket
 */
function canViewTicket(
  ticket: { productId: string; submitterEmail: string },
  access: { isAdmin: boolean; ownedProductIds: string[]; user: { email: string } }
): boolean {
  if (access.isAdmin) return true
  if (access.ownedProductIds.includes(ticket.productId)) return true
  return ticket.submitterEmail === access.user.email
}

/**
 * Checks whether the authenticated user can change the ticket's status.
 * - ADMIN: yes
 * - Product owner: yes, if they own the ticket's product
 * - Regular user: no
 */
function canChangeStatus(
  ticket: { productId: string },
  access: { isAdmin: boolean; ownedProductIds: string[] }
): boolean {
  if (access.isAdmin) return true
  return access.ownedProductIds.includes(ticket.productId)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireDashboardAccess()
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { product: { select: { name: true } } },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  if (!canViewTicket(ticket, access)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(ticket)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireDashboardAccess()
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = updateTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    if (!canViewTicket(ticket, access)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { status, humanFlagged, ...rest } = parsed.data

    // Regular users cannot change ticket status
    if (status && status !== ticket.status && !canChangeStatus(ticket, access)) {
      return NextResponse.json(
        { error: "Forbidden: only product owners and admins can change ticket status" },
        { status: 403 }
      )
    }

    // Update non-status fields
    if (humanFlagged !== undefined || Object.keys(rest).length > 0) {
      await prisma.ticket.update({
        where: { id: params.id },
        data: { humanFlagged, ...rest },
      })
    }

    // Update status with timeline event
    if (status && status !== ticket.status) {
      await updateTicketStatus(params.id, status, {
        actor: access.user.email,
        summary: `Status manually changed to ${status}`,
        eventType: EVENT_TYPES.STATUS_CHANGED,
      })
    }

    const updated = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { product: { select: { name: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[dashboard/tickets/id] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
