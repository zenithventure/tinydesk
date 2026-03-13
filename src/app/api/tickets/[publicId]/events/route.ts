import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { publicId: params.publicId },
      select: { id: true },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const events = await prisma.timelineEvent.findMany({
      where: { ticketId: ticket.id, public: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        eventType: true,
        actor: true,
        summary: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      events.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("[api/tickets/publicId/events] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
