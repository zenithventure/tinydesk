import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    ticket: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    timelineEvent: {
      create: vi.fn(),
    },
  },
}))

// Mock email
vi.mock("@/lib/email", () => ({
  sendTicketReceipt: vi.fn(),
  sendStatusUpdate: vi.fn(),
}))

import prisma from "@/lib/prisma"
import { createTicket, updateTicketStatus, appendTimelineEvent } from "@/lib/tickets"

describe("createTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a ticket with correct publicId", async () => {
    vi.mocked(prisma.ticket.count).mockResolvedValue(5)
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "ticket-1",
      publicId: "TD-0006",
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Test",
      body: "Test body",
      status: "RECEIVED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: { name: "TinyCal" },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)

    const result = await createTicket({
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Test",
      body: "Test body",
    })

    expect(result.publicId).toBe("TD-0006")
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicId: "TD-0006",
          status: "RECEIVED",
        }),
      })
    )
  })
})

describe("updateTicketStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates ticket status and appends timeline event", async () => {
    vi.mocked(prisma.ticket.update).mockResolvedValue({
      id: "ticket-1",
      publicId: "TD-0001",
      submitterEmail: "user@example.com",
      subject: "Test",
      status: "ISSUE_CREATED",
      product: { name: "TinyCal" },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)

    const result = await updateTicketStatus("ticket-1", "ISSUE_CREATED", {
      actor: "github-bot",
      summary: "Issue created",
    })

    expect(result.status).toBe("ISSUE_CREATED")
    expect(prisma.timelineEvent.create).toHaveBeenCalled()
  })
})

describe("appendTimelineEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a timeline event", async () => {
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({
      id: "event-1",
      ticketId: "ticket-1",
      eventType: "ticket_created",
      summary: "Ticket submitted",
      public: true,
    } as any)

    const result = await appendTimelineEvent({
      ticketId: "ticket-1",
      eventType: "ticket_created",
      summary: "Ticket submitted",
      public: true,
    })

    expect(result.eventType).toBe("ticket_created")
  })
})
