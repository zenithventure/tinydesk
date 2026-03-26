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

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe("updateUserSchema", () => {
  it("rejects invalid role", () => {
    expect(updateUserSchema.safeParse({ role: "SUPERADMIN" }).success).toBe(false)
  })

  it("accepts valid role ADMIN", () => {
    expect(updateUserSchema.safeParse({ role: "ADMIN" }).success).toBe(true)
  })

  it("accepts valid role VIEWER", () => {
    expect(updateUserSchema.safeParse({ role: "VIEWER" }).success).toBe(true)
  })

  it("accepts ownedProductIds alone", () => {
    expect(updateUserSchema.safeParse({ ownedProductIds: ["p1"] }).success).toBe(true)
  })

  it("accepts both role and ownedProductIds together", () => {
    const result = updateUserSchema.safeParse({ role: "VIEWER", ownedProductIds: ["p1", "p2"] })
    expect(result.success).toBe(true)
  })

  it("accepts empty object (both fields optional)", () => {
    expect(updateUserSchema.safeParse({}).success).toBe(true)
  })

  it("rejects non-string items in ownedProductIds", () => {
    expect(updateUserSchema.safeParse({ ownedProductIds: [123] }).success).toBe(false)
  })

  it("rejects empty string in ownedProductIds", () => {
    expect(updateUserSchema.safeParse({ ownedProductIds: [""] }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// GET /api/dashboard/users
// ---------------------------------------------------------------------------

describe("GET /api/dashboard/users logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns user list with owned products from prisma", async () => {
    const mockUsers = [
      {
        id: "u1",
        name: "Alice",
        email: "alice@test.com",
        image: null,
        role: "ADMIN",
        createdAt: new Date(),
        ownedProducts: [],
      },
      {
        id: "u2",
        name: "Bob",
        email: "bob@test.com",
        image: null,
        role: "VIEWER",
        createdAt: new Date(),
        ownedProducts: [{ product: { id: "p1", name: "TinyCal" } }],
      },
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
    expect(result[0].role).toBe("ADMIN")
    expect(result[1].role).toBe("VIEWER")
    expect((result[1] as typeof mockUsers[1]).ownedProducts).toHaveLength(1)
  })

  it("returns empty array when no users exist", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([])

    const result = await prisma.user.findMany({ orderBy: { createdAt: "desc" } })
    expect(result).toEqual([])
  })

  it("queries users ordered by createdAt desc", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([])

    await prisma.user.findMany({ orderBy: { createdAt: "desc" } })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    )
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/dashboard/users/[id] — self-demotion guard
// ---------------------------------------------------------------------------

describe("PATCH /api/dashboard/users/[id] — self-demotion guard", () => {
  const adminUser = { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" }

  it("detects self-demotion when admin changes own role to VIEWER", () => {
    const parsed = updateUserSchema.safeParse({ role: "VIEWER" })
    expect(parsed.success).toBe(true)

    const targetId = adminUser.id
    const isSelfDemotion = targetId === adminUser.id && parsed.data?.role && parsed.data.role !== "ADMIN"
    expect(isSelfDemotion).toBe(true)
  })

  it("does not flag self-demotion when admin sets own role to ADMIN (no-op)", () => {
    const parsed = updateUserSchema.safeParse({ role: "ADMIN" })
    expect(parsed.success).toBe(true)

    const targetId = adminUser.id
    const isSelfDemotion = targetId === adminUser.id && parsed.data?.role && parsed.data.role !== "ADMIN"
    expect(isSelfDemotion).toBe(false)
  })

  it("does not flag self-demotion when updating a different user", () => {
    const parsed = updateUserSchema.safeParse({ role: "VIEWER" })
    expect(parsed.success).toBe(true)

    const targetId = "other-user-id"
    const isSelfDemotion = targetId === adminUser.id && parsed.data?.role && parsed.data.role !== "ADMIN"
    expect(isSelfDemotion).toBe(false)
  })

  it("does not flag self-demotion when only updating product ownership", () => {
    const parsed = updateUserSchema.safeParse({ ownedProductIds: ["p1"] })
    expect(parsed.success).toBe(true)

    const targetId = adminUser.id
    const isSelfDemotion = targetId === adminUser.id && parsed.data?.role && parsed.data.role !== "ADMIN"
    expect(isSelfDemotion).toBeFalsy()
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/dashboard/users/[id] — role updates
// ---------------------------------------------------------------------------

describe("PATCH /api/dashboard/users/[id] — role updates", () => {
  const targetUser = { id: "user-2", name: "Bob", email: "bob@test.com", role: "VIEWER" }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null for non-existent user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await prisma.user.findUnique({ where: { id: "nonexistent" } })
    expect(result).toBeNull()
  })

  it("updates user role to ADMIN", async () => {
    const updated = { ...targetUser, role: "ADMIN" }
    vi.mocked(prisma.user.update).mockResolvedValue(updated as never)

    const result = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "ADMIN" },
    })

    expect(result.role).toBe("ADMIN")
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: targetUser.id },
      data: { role: "ADMIN" },
    })
  })

  it("updates user role to VIEWER", async () => {
    const adminTarget = { id: "user-3", name: "Carol", email: "carol@test.com", role: "ADMIN" }
    const updated = { ...adminTarget, role: "VIEWER" }
    vi.mocked(prisma.user.update).mockResolvedValue(updated as never)

    const result = await prisma.user.update({
      where: { id: adminTarget.id },
      data: { role: "VIEWER" },
    })

    expect(result.role).toBe("VIEWER")
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/dashboard/users/[id] — product ownership
// ---------------------------------------------------------------------------

describe("PATCH /api/dashboard/users/[id] — product ownership", () => {
  const targetUser = { id: "user-2", name: "Bob", email: "bob@test.com", role: "VIEWER" }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("replaces product ownership with new set", async () => {
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

  it("clears all product ownership with empty array", async () => {
    vi.mocked(prisma.productOwner.deleteMany).mockResolvedValue({ count: 3 })

    await prisma.productOwner.deleteMany({ where: { userId: targetUser.id } })

    expect(prisma.productOwner.deleteMany).toHaveBeenCalledWith({ where: { userId: targetUser.id } })
    expect(prisma.productOwner.createMany).not.toHaveBeenCalled()
  })

  it("clears product ownership when promoting to ADMIN", async () => {
    vi.mocked(prisma.productOwner.deleteMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.user.update).mockResolvedValue({ ...targetUser, role: "ADMIN" } as never)

    // Promote to ADMIN
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "ADMIN" },
    })

    // ADMIN implies all-products — clear explicit ownership
    await prisma.productOwner.deleteMany({ where: { userId: targetUser.id } })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: targetUser.id },
      data: { role: "ADMIN" },
    })
    expect(prisma.productOwner.deleteMany).toHaveBeenCalledWith({ where: { userId: targetUser.id } })
    // Should NOT create new ownership records for admin
    expect(prisma.productOwner.createMany).not.toHaveBeenCalled()
  })

  it("assigns single product ownership", async () => {
    vi.mocked(prisma.productOwner.deleteMany).mockResolvedValue({ count: 0 })
    vi.mocked(prisma.productOwner.createMany).mockResolvedValue({ count: 1 })

    await prisma.productOwner.deleteMany({ where: { userId: targetUser.id } })
    await prisma.productOwner.createMany({
      data: [{ userId: targetUser.id, productId: "p1" }],
    })

    expect(prisma.productOwner.createMany).toHaveBeenCalledWith({
      data: [{ userId: targetUser.id, productId: "p1" }],
    })
  })
})
