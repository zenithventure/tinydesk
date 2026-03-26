import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { updateUserSchema } from "@/lib/validators"

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
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { role, ownedProductIds } = parsed.data

    // Prevent self-demotion
    if (params.id === admin.id && role && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } })
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine the effective role after update
    const effectiveRole = role ?? target.role

    // Update user role if provided
    if (role) {
      await prisma.user.update({
        where: { id: params.id },
        data: { role },
      })
    }

    // Handle product ownership
    if (effectiveRole === "ADMIN") {
      // Admins implicitly own all products — clear any explicit ownership
      await prisma.productOwner.deleteMany({ where: { userId: params.id } })
    } else if (ownedProductIds !== undefined) {
      // Replace strategy: delete all, then create new
      await prisma.productOwner.deleteMany({ where: { userId: params.id } })
      if (ownedProductIds.length > 0) {
        await prisma.productOwner.createMany({
          data: ownedProductIds.map((productId) => ({
            userId: params.id,
            productId,
          })),
        })
      }
    }

    // Return updated user with owned products
    const updated = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        ownedProducts: {
          select: {
            product: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[dashboard/users] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
