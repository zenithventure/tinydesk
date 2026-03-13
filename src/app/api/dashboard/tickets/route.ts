import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { ticketListQuerySchema } from "@/lib/validators"

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const parsed = ticketListQuerySchema.safeParse({
    page: url.searchParams.get("page") || "1",
    pageSize: url.searchParams.get("pageSize") || "20",
    status: url.searchParams.get("status") || undefined,
    productId: url.searchParams.get("productId") || undefined,
    search: url.searchParams.get("search") || undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 })
  }

  const { page, pageSize, status, productId, search } = parsed.data

  const where: any = {}
  if (status) where.status = status
  if (productId) where.productId = productId
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { publicId: { contains: search, mode: "insensitive" } },
      { submitterEmail: { contains: search, mode: "insensitive" } },
    ]
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  return NextResponse.json({
    data: tickets.map((t) => ({
      id: t.id,
      publicId: t.publicId,
      subject: t.subject,
      submitterEmail: t.submitterEmail,
      submitterName: t.submitterName,
      status: t.status,
      productName: t.product.name,
      humanFlagged: t.humanFlagged,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
