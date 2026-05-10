import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDashboardAccess } from "@/lib/auth"

/**
 * Returns a lightweight list of products for the ticket submission form.
 * All authenticated users see all products in submission context.
 * (Ticket visibility remains scoped by user permissions in the dashboard.)
 */
export async function GET() {
  const access = await requireDashboardAccess()
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // All authenticated users see all products for the submission dropdown
  const where = {}

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
