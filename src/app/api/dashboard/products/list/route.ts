import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDashboardAccess } from "@/lib/auth"

/**
 * Returns a lightweight list of products for the ticket submission form.
 * Admins see all products; product owners see their owned products + self-service;
 * regular users see only self-service products.
 */
export async function GET() {
  const access = await requireDashboardAccess()
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let where: any

  if (access.isAdmin) {
    where = {}
  } else if (access.ownedProductIds.length > 0) {
    // Product owners see their products + any self-service products
    where = {
      OR: [
        { id: { in: access.ownedProductIds } },
        { selfService: true },
      ],
    }
  } else {
    // Regular users see only self-service products
    where = { selfService: true }
  }

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("[dashboard/products/list] Error:", error)
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 })
  }
}
