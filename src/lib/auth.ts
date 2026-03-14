import { auth } from "@/auth"
import prisma from "./prisma"

export async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.user.findUnique({ where: { id: session.user.id } })
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser()
  if (!user || user.role !== "ADMIN") return null
  return user
}

/**
 * Returns the product IDs that the given user owns.
 */
export async function getOwnedProductIds(userId: string): Promise<string[]> {
  const rows = await prisma.productOwner.findMany({
    where: { userId },
    select: { productId: true },
  })
  return rows.map((r) => r.productId)
}

/**
 * Allows any authenticated user into the dashboard — ADMIN, product owner, or regular user.
 *
 * Returns the user and their owned product IDs so callers can apply
 * the appropriate visibility rules:
 *  - ADMIN          → access to everything
 *  - product owner  → access to owned products' tickets
 *  - regular user   → access only to tickets they submitted
 */
export async function requireDashboardAccess(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>
  ownedProductIds: string[]
  isAdmin: boolean
  isProductOwner: boolean
} | null> {
  const user = await getAuthenticatedUser()
  if (!user) return null

  const ownedProductIds = await getOwnedProductIds(user.id)
  const isAdmin = user.role === "ADMIN"
  const isProductOwner = ownedProductIds.length > 0

  return { user, ownedProductIds, isAdmin, isProductOwner }
}
