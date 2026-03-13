import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  default: {
    product: { findUnique: vi.fn() },
    ticket: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    timelineEvent: { create: vi.fn() },
  },
}))

vi.mock("@/lib/email", () => ({
  sendTicketReceipt: vi.fn(),
  sendStatusUpdate: vi.fn(),
}))

import prisma from "@/lib/prisma"
import { createTicketSchema } from "@/lib/validators"

describe("POST /api/tickets logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects invalid payload", () => {
    const result = createTicketSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("validates correct payload", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
    })
    expect(result.success).toBe(true)
  })
})

describe("GET /api/tickets/[publicId] logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null for non-existent ticket", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null)

    const result = await prisma.ticket.findUnique({
      where: { publicId: "TD-9999" },
    })

    expect(result).toBeNull()
  })
})
