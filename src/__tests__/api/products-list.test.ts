import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  default: {
    product: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireDashboardAccess: vi.fn(),
}))

import prisma from "@/lib/prisma"
import { requireDashboardAccess } from "@/lib/auth"
import { GET } from "@/app/api/dashboard/products/list/route"

const allProducts = [
  { id: "prod-1", name: "TinyCal", slug: "tinycal" },
  { id: "prod-2", name: "TinyDesk", slug: "tinydesk" },
]

describe("GET /api/dashboard/products/list", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.product.findMany).mockResolvedValue(allProducts as never)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireDashboardAccess).mockResolvedValue(null)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns all products for admin users", async () => {
    vi.mocked(requireDashboardAccess).mockResolvedValue({
      user: { id: "u1", email: "admin@example.com" } as never,
      ownedProductIds: [],
      isAdmin: true,
      isProductOwner: false,
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it("returns all products for product owners", async () => {
    vi.mocked(requireDashboardAccess).mockResolvedValue({
      user: { id: "u2", email: "owner@example.com" } as never,
      ownedProductIds: ["prod-1"],
      isAdmin: false,
      isProductOwner: true,
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it("returns all products for regular users (not just owned)", async () => {
    vi.mocked(requireDashboardAccess).mockResolvedValue({
      user: { id: "u3", email: "viewer@example.com" } as never,
      ownedProductIds: [],
      isAdmin: false,
      isProductOwner: false,
    })

    const res = await GET()
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveLength(2)
    // Key assertion: regular users get an unfiltered query, not { id: { in: [] } }
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })
})
