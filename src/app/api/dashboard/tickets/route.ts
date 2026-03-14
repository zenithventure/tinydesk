import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDashboardAccess } from "@/lib/auth"
import { ticketListQuerySchema } from "@/lib/validators"

export async function GET(req: NextRequest) {
  const access = await requireDashboardAccess()
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { user, ownedProductIds, isAdmin } = access

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

  // Base filter: scope by role/ownership
  const where: any = {}

  if (isAdmin) {
    // ADMIN: no extra scoping — can see all tickets
  } else if (ownedProductIds.length > 0) {
    // Product owner: see all tickets in owned products
    where.productId = { in: ownedProductIds }
  } else {
    // Regular user: see only tickets they submitted
    where.submitterEmail = user.email
  }

  // Additional filters from query params
  if (status) where.status = status
  if (productId) {
    // If the user is not an admin, make sure the requested productId is within their scope
    if (!isAdmin && ownedProductIds.length > 0) {
      if (!ownedProductIds.includes(productId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
    where.productId = productId
  }
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
