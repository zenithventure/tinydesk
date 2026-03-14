import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { createProductSchema } from "@/lib/validators"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tickets: true } } },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.product.findUnique({
      where: { slug: parsed.data.slug },
    })

    if (existing) {
      return NextResponse.json({ error: "Product with this slug already exists" }, { status: 409 })
    }

    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        repoOwner: parsed.data.repoOwner || null,
        repoName: parsed.data.repoName || null,
        defaultAssignee: parsed.data.defaultAssignee || null,
        supportEmail: parsed.data.supportEmail || null,
        webhookSecret: parsed.data.webhookSecret || null,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("[dashboard/products] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
