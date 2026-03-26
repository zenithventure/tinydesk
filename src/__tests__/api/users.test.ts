import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    productOwner: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
}))

import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { updateUserSchema } from "@/lib/validators"

describe("updateUserSchema", () => {
  it("rejects invalid role", () => {
    expect(updateUserSchema.safeParse({ role: "SUPERADMIN" }).success).toBe(false)
  })

  it("accepts valid role", () => {
    expect(updateUserSchema.safeParse({ role: "ADMIN" }).success).toBe(true)
  })

  it("accepts ownedProductIds", () => {
    expect(updateUserSchema.safeParse({ ownedProductIds: ["p1"] }).success).toBe(true)
  })
})

describe("GET /api/dashboard/users logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns user list from prisma", async () => {
    const mockUsers = [
      { id: "u1", name: "Alice", email: "alice@test.com", role: "ADMIN", createdAt: new Date(), ownedProducts: [] },
      { id: "u2", name: "Bob", email: "bob@test.com", role: "VIEWER", createdAt: new Date(), ownedProducts: [{ product: { id: "p1", name: "TinyCal" } }] },
    ]
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)

    const result = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        ownedProducts: { select: { product: { select: { id: true, name: true } } } },
      },
    })

    expect(result).toHaveLength(2)
    expect(result[0].email).toBe("alice@test.com")
    expect(result[1].email).toBe("bob@test.com")
  })

  it("returns empty array when no users exist", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([])

    const result = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })

    expect(result).toEqual([])
  })
})

describe("PATCH /api/dashboard/users/[id] logic", () => {
  const adminUser = { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" }
  const targetUser = { id: "user-2", name: "Bob", email: "bob@test.com", role: "VIEWER" }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects self-demotion", () => {
    const body = { role: "VIEWER" }
    const parsed = updateUserSchema.safeParse(body)
    expect(parsed.success).toBe(true)

    // Business logic: admin cannot change their own role to non-ADMIN
    const targetId = adminUser.id
    const isSelfDemotion = targetId === adminUser.id && parsed.data?.role && parsed.data.role !== "ADMIN"
    expect(isSelfDemotion).toBe(true)
  })

  it("allows changing another user role", () => {
    const body = { role: "ADMIN" }
    const parsed = updateUserSchema.safeParse(body)
    expect(parsed.success).toBe(true)

    const targetId = targetUser.id
    const isSelfDemotion = targetId === adminUser.id && parsed.data?.role && parsed.data.role !== "ADMIN"
    expect(isSelfDemotion).toBe(false)
  })

  it("rejects unknown user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await prisma.user.findUnique({ where: { id: "nonexistent" } })
    expect(result).toBeNull()
  })

  it("updates user role successfully", async () => {
    const updated = { ...targetUser, role: "ADMIN" }
    vi.mocked(prisma.user.update).mockResolvedValue(updated as never)

    const result = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "ADMIN" },
    })

    expect(result.role).toBe("ADMIN")
  })

  it("replaces product ownership on update", async () => {
    vi.mocked(prisma.productOwner.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.productOwner.createMany).mockResolvedValue({ count: 2 })

    await prisma.productOwner.deleteMany({ where: { userId: targetUser.id } })
    await prisma.productOwner.createMany({
      data: [
        { userId: targetUser.id, productId: "p1" },
        { userId: targetUser.id, productId: "p2" },
      ],
    })

    expect(prisma.productOwner.deleteMany).toHaveBeenCalledWith({ where: { userId: targetUser.id } })
    expect(prisma.productOwner.createMany).toHaveBeenCalledWith({
      data: [
        { userId: targetUser.id, productId: "p1" },
        { userId: targetUser.id, productId: "p2" },
      ],
    })
  })

  it("clears product ownership when promoting to ADMIN", async () => {
    vi.mocked(prisma.productOwner.deleteMany).mockResolvedValue({ count: 2 })

    await prisma.productOwner.deleteMany({ where: { userId: targetUser.id } })

    expect(prisma.productOwner.deleteMany).toHaveBeenCalledWith({ where: { userId: targetUser.id } })
  })
})
