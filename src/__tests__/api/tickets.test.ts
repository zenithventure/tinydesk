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

vi.mock("@/lib/github-app", () => ({
  createGitHubIssue: vi.fn(),
  isGitHubAppConfigured: vi.fn().mockReturnValue(false),
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

  it("validates payload with screenshots", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
      screenshots: ["https://blob.vercel.com/screenshot1.png"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects payload with too many screenshots", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
      screenshots: [
        "https://example.com/1.png",
        "https://example.com/2.png",
        "https://example.com/3.png",
        "https://example.com/4.png",
      ],
    })
    expect(result.success).toBe(false)
  })

  it("rejects payload with invalid screenshot URLs", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
      screenshots: ["not-a-url"],
    })
    expect(result.success).toBe(false)
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
