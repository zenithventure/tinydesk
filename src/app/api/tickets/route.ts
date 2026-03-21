import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createTicketSchema } from "@/lib/validators"
import { createTicket } from "@/lib/tickets"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createTicketSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const messages = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ")
      return NextResponse.json(
        { error: messages || "Validation failed", details: fieldErrors },
        { status: 400 }
      )
    }

    const { productSlug, submitterEmail, submitterName, subject, body: ticketBody, screenshots } = parsed.data

    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const ticket = await createTicket({
      productId: product.id,
      submitterEmail,
      submitterName,
      subject,
      body: ticketBody,
      screenshots,
    })

    return NextResponse.json(
      {
        publicId: ticket.publicId,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[api/tickets] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
