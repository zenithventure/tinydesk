import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { updateTicketSchema } from "@/lib/validators"
import { updateTicketStatus, appendTimelineEvent } from "@/lib/tickets"
import { EVENT_TYPES } from "@/lib/constants"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { product: { select: { name: true } } },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  return NextResponse.json(ticket)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) {
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

    const { status, humanFlagged, ...rest } = parsed.data

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
        actor: admin.email,
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
