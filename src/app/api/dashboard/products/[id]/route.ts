import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { updateProductSchema } from "@/lib/validators"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name ?? undefined,
        repoOwner: parsed.data.repoOwner !== undefined ? (parsed.data.repoOwner || null) : undefined,
        repoName: parsed.data.repoName !== undefined ? (parsed.data.repoName || null) : undefined,
        defaultAssignee: parsed.data.defaultAssignee !== undefined ? (parsed.data.defaultAssignee || null) : undefined,
        supportEmail: parsed.data.supportEmail !== undefined ? (parsed.data.supportEmail || null) : undefined,
        webhookSecret: parsed.data.webhookSecret !== undefined ? (parsed.data.webhookSecret || null) : undefined,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("[dashboard/products/[id]] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
