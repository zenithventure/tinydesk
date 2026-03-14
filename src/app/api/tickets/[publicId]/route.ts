import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { publicId: params.publicId },
      include: { product: { select: { name: true } } },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({
      publicId: ticket.publicId,
      subject: ticket.subject,
      status: ticket.status,
      productName: ticket.product.name,
      screenshots: ticket.screenshots,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      issueUrl: ticket.issueUrl,
      prUrl: ticket.prUrl,
      deploymentUrl: ticket.deploymentUrl,
    })
  } catch (error) {
    console.error("[api/tickets/publicId] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
