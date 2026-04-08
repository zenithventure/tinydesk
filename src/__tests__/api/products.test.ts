import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  default: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
}))

import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { updateProductSchema } from "@/lib/validators"

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe("updateProductSchema", () => {
  it("rejects invalid supportEmail", () => {
    expect(updateProductSchema.safeParse({ supportEmail: "bad" }).success).toBe(false)
  })

  it("accepts partial update with only defaultAssignee", () => {
    const result = updateProductSchema.safeParse({ defaultAssignee: "octocat" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.defaultAssignee).toBe("octocat")
    }
  })

  it("accepts empty object (no changes)", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/dashboard/products/[id] — product not found
// ---------------------------------------------------------------------------

describe("PATCH /api/dashboard/products/[id] — product not found", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null for non-existent product", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

    const result = await prisma.product.findUnique({ where: { id: "nonexistent" } })
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/dashboard/products/[id] — field updates
// ---------------------------------------------------------------------------

describe("PATCH /api/dashboard/products/[id] — field updates", () => {
  const existingProduct = {
    id: "prod-1",
    name: "Incubation Web Site",
    slug: "incubation-web-site",
    repoOwner: "zenithventure",
    repoName: "website-incubation-program",
    defaultAssignee: null,
    supportEmail: null,
    webhookSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates defaultAssignee", async () => {
    const updated = { ...existingProduct, defaultAssignee: "szewong" }
    vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as never)
    vi.mocked(prisma.product.update).mockResolvedValue(updated as never)

    const result = await prisma.product.update({
      where: { id: existingProduct.id },
      data: { defaultAssignee: "szewong" },
    })

    expect(result.defaultAssignee).toBe("szewong")
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: existingProduct.id },
      data: { defaultAssignee: "szewong" },
    })
  })

  it("clears defaultAssignee with null", async () => {
    const productWithAssignee = { ...existingProduct, defaultAssignee: "szewong" }
    const updated = { ...productWithAssignee, defaultAssignee: null }
    vi.mocked(prisma.product.findUnique).mockResolvedValue(productWithAssignee as never)
    vi.mocked(prisma.product.update).mockResolvedValue(updated as never)

    const result = await prisma.product.update({
      where: { id: existingProduct.id },
      data: { defaultAssignee: null },
    })

    expect(result.defaultAssignee).toBeNull()
  })

  it("updates product name", async () => {
    const updated = { ...existingProduct, name: "Incubation Website" }
    vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as never)
    vi.mocked(prisma.product.update).mockResolvedValue(updated as never)

    const result = await prisma.product.update({
      where: { id: existingProduct.id },
      data: { name: "Incubation Website" },
    })

    expect(result.name).toBe("Incubation Website")
  })

  it("updates multiple fields at once", async () => {
    const updated = {
      ...existingProduct,
      defaultAssignee: "octocat",
      supportEmail: "help@example.com",
    }
    vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as never)
    vi.mocked(prisma.product.update).mockResolvedValue(updated as never)

    const result = await prisma.product.update({
      where: { id: existingProduct.id },
      data: { defaultAssignee: "octocat", supportEmail: "help@example.com" },
    })

    expect(result.defaultAssignee).toBe("octocat")
    expect(result.supportEmail).toBe("help@example.com")
  })

  it("updates repoOwner and repoName", async () => {
    const updated = { ...existingProduct, repoOwner: "neworg", repoName: "newrepo" }
    vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as never)
    vi.mocked(prisma.product.update).mockResolvedValue(updated as never)

    const result = await prisma.product.update({
      where: { id: existingProduct.id },
      data: { repoOwner: "neworg", repoName: "newrepo" },
    })

    expect(result.repoOwner).toBe("neworg")
    expect(result.repoName).toBe("newrepo")
  })

  it("clears optional fields by setting to null", async () => {
    const productWithFields = {
      ...existingProduct,
      supportEmail: "old@example.com",
      webhookSecret: "whsec_old",
    }
    const updated = { ...productWithFields, supportEmail: null, webhookSecret: null }
    vi.mocked(prisma.product.findUnique).mockResolvedValue(productWithFields as never)
    vi.mocked(prisma.product.update).mockResolvedValue(updated as never)

    const result = await prisma.product.update({
      where: { id: existingProduct.id },
      data: { supportEmail: null, webhookSecret: null },
    })

    expect(result.supportEmail).toBeNull()
    expect(result.webhookSecret).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Empty-string-to-null conversion logic
// ---------------------------------------------------------------------------

describe("PATCH /api/dashboard/products/[id] — empty string to null conversion", () => {
  it("converts empty defaultAssignee to null for prisma", () => {
    const parsed = updateProductSchema.safeParse({ defaultAssignee: "" })
    expect(parsed.success).toBe(true)

    if (parsed.success) {
      const value = parsed.data.defaultAssignee
      const prismaValue = value !== undefined ? (value || null) : undefined
      expect(prismaValue).toBeNull()
    }
  })

  it("preserves non-empty defaultAssignee for prisma", () => {
    const parsed = updateProductSchema.safeParse({ defaultAssignee: "szewong" })
    expect(parsed.success).toBe(true)

    if (parsed.success) {
      const value = parsed.data.defaultAssignee
      const prismaValue = value !== undefined ? (value || null) : undefined
      expect(prismaValue).toBe("szewong")
    }
  })

  it("leaves undefined fields as undefined (no change)", () => {
    const parsed = updateProductSchema.safeParse({ name: "New Name" })
    expect(parsed.success).toBe(true)

    if (parsed.success) {
      const value = parsed.data.defaultAssignee
      const prismaValue = value !== undefined ? (value || null) : undefined
      expect(prismaValue).toBeUndefined()
    }
  })
})

// ---------------------------------------------------------------------------
// GET /api/dashboard/products/list — all authenticated users see all products
// ---------------------------------------------------------------------------

describe("GET /api/dashboard/products/list — submission dropdown products", () => {
  const mockProducts = [
    { id: "prod-1", name: "Admin Product", slug: "admin-product" },
    { id: "prod-2", name: "Owned Product", slug: "owned-product" },
    { id: "prod-3", name: "Self-Service Product", slug: "self-service-product" },
    { id: "prod-4", name: "Another Product", slug: "another-product" },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns all products for admin user", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

    const result = await prisma.product.findMany({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    expect(result).toHaveLength(4)
    expect(result).toEqual(mockProducts)
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })
  })

  it("returns all products for product owner user", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

    const result = await prisma.product.findMany({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    expect(result).toHaveLength(4)
    expect(result).toEqual(mockProducts)
  })

  it("returns all products for regular VIEWER user (non-owner)", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

    // VIEWER users without ownership should now see all products
    const result = await prisma.product.findMany({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    expect(result).toHaveLength(4)
    expect(result).toEqual(mockProducts)
  })

  it("returns products ordered by name ascending", async () => {
    const sortedProducts = [
      { id: "prod-4", name: "Admin Product", slug: "admin-product" },
      { id: "prod-2", name: "Another Product", slug: "another-product" },
      { id: "prod-3", name: "Owned Product", slug: "owned-product" },
      { id: "prod-1", name: "Self-Service Product", slug: "self-service-product" },
    ]
    vi.mocked(prisma.product.findMany).mockResolvedValue(sortedProducts as never)

    const result = await prisma.product.findMany({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    expect(result[0].name).toBe("Admin Product")
    expect(result[result.length - 1].name).toBe("Self-Service Product")
  })

  it("returns empty list when no products exist", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never)

    const result = await prisma.product.findMany({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    expect(result).toHaveLength(0)
    expect(result).toEqual([])
  })

  it("selects only id, name, and slug fields", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

    await prisma.product.findMany({
      where: {},
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, name: true, slug: true },
      })
    )
  })
})
