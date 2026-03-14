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

// Mock github-app
vi.mock("@/lib/github-app", () => ({
  createGitHubIssue: vi.fn(),
  isGitHubAppConfigured: vi.fn().mockReturnValue(false),
}))

import prisma from "@/lib/prisma"
import { createTicket, updateTicketStatus, appendTimelineEvent } from "@/lib/tickets"
import { sendTicketReceipt } from "@/lib/email"
import { isGitHubAppConfigured } from "@/lib/github-app"

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
      product: { name: "TinyCal", repoOwner: null, repoName: null, defaultAssignee: null },
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

  it("creates a ticket with screenshots", async () => {
    const screenshots = ["https://blob.vercel.com/img1.png", "https://blob.vercel.com/img2.png"]
    vi.mocked(prisma.ticket.count).mockResolvedValue(0)
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "ticket-2",
      publicId: "TD-0001",
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Bug with screenshots",
      body: "See attached",
      screenshots,
      status: "RECEIVED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: { name: "TinyCal", repoOwner: null, repoName: null, defaultAssignee: null },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)

    const result = await createTicket({
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Bug with screenshots",
      body: "See attached",
      screenshots,
    })

    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          screenshots,
        }),
      })
    )
    expect(result.publicId).toBe("TD-0001")
  })

  it("sends receipt email on creation", async () => {
    vi.mocked(prisma.ticket.count).mockResolvedValue(0)
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "ticket-3",
      publicId: "TD-0001",
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Test",
      body: "Body",
      status: "RECEIVED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: { name: "TinyCal", repoOwner: null, repoName: null, defaultAssignee: null },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)

    await createTicket({
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Test",
      body: "Body",
    })

    expect(sendTicketReceipt).toHaveBeenCalledWith("user@example.com", "TD-0001", "Test")
  })

  it("does not auto-create GitHub issue when app is not configured", async () => {
    vi.mocked(isGitHubAppConfigured).mockReturnValue(false)
    vi.mocked(prisma.ticket.count).mockResolvedValue(0)
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "ticket-4",
      publicId: "TD-0001",
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Test",
      body: "Body",
      status: "RECEIVED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: { name: "TinyCal", repoOwner: "zenithventure", repoName: "tinycal", defaultAssignee: null },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)

    await createTicket({
      productId: "product-1",
      submitterEmail: "user@example.com",
      subject: "Test",
      body: "Body",
    })

    const { createGitHubIssue } = await import("@/lib/github-app")
    expect(createGitHubIssue).not.toHaveBeenCalled()
  })

  it("auto-creates GitHub issue when app is configured and product has repo", async () => {
    vi.mocked(isGitHubAppConfigured).mockReturnValue(true)
    vi.mocked(prisma.ticket.count).mockResolvedValue(7)
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "ticket-5",
      publicId: "TD-0008",
      productId: "product-tinydesk",
      submitterEmail: "szewong@zenithstudio.io",
      subject: "Add product owner role to the system",
      body: "We need a product owner role.",
      screenshots: [],
      status: "RECEIVED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        name: "TinyDesk",
        repoOwner: "zenithventure",
        repoName: "tinydesk",
        defaultAssignee: null,
      },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)
    vi.mocked(prisma.ticket.update).mockResolvedValue({} as any)

    const { createGitHubIssue } = await import("@/lib/github-app")
    vi.mocked(createGitHubIssue).mockResolvedValue({
      number: 42,
      html_url: "https://github.com/zenithventure/tinydesk/issues/42",
    })

    await createTicket({
      productId: "product-tinydesk",
      submitterEmail: "szewong@zenithstudio.io",
      subject: "Add product owner role to the system",
      body: "We need a product owner role.",
    })

    expect(createGitHubIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "zenithventure",
        repo: "tinydesk",
        title: "[TD-0008] Add product owner role to the system",
      })
    )
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          issueNumber: 42,
          issueUrl: "https://github.com/zenithventure/tinydesk/issues/42",
          status: "ISSUE_CREATED",
        }),
      })
    )
  })

  it("auto-creates GitHub issue and sets FIX_IN_PROGRESS when defaultAssignee is set", async () => {
    vi.mocked(isGitHubAppConfigured).mockReturnValue(true)
    vi.mocked(prisma.ticket.count).mockResolvedValue(8)
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "ticket-6",
      publicId: "TD-0009",
      productId: "product-tinydesk",
      submitterEmail: "user@example.com",
      subject: "Another bug",
      body: "Bug details",
      screenshots: [],
      status: "RECEIVED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        name: "TinyDesk",
        repoOwner: "zenithventure",
        repoName: "tinydesk",
        defaultAssignee: "szewong",
      },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)
    vi.mocked(prisma.ticket.update).mockResolvedValue({} as any)

    const { createGitHubIssue } = await import("@/lib/github-app")
    vi.mocked(createGitHubIssue).mockResolvedValue({
      number: 43,
      html_url: "https://github.com/zenithventure/tinydesk/issues/43",
    })

    await createTicket({
      productId: "product-tinydesk",
      submitterEmail: "user@example.com",
      subject: "Another bug",
      body: "Bug details",
    })

    expect(createGitHubIssue).toHaveBeenCalledWith(
      expect.objectContaining({ assignee: "szewong" })
    )
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FIX_IN_PROGRESS" }),
      })
    )
  })

  it("gracefully handles GitHub issue creation failure without crashing ticket creation", async () => {
    vi.mocked(isGitHubAppConfigured).mockReturnValue(true)
    vi.mocked(prisma.ticket.count).mockResolvedValue(9)
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "ticket-7",
      publicId: "TD-0010",
      productId: "product-tinydesk",
      submitterEmail: "user@example.com",
      subject: "Test failure handling",
      body: "Details",
      screenshots: [],
      status: "RECEIVED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        name: "TinyDesk",
        repoOwner: "zenithventure",
        repoName: "tinydesk",
        defaultAssignee: null,
      },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)

    const { createGitHubIssue } = await import("@/lib/github-app")
    vi.mocked(createGitHubIssue).mockRejectedValue(new Error("GitHub API error"))

    // Should not throw — ticket creation succeeds even if issue creation fails
    const result = await createTicket({
      productId: "product-tinydesk",
      submitterEmail: "user@example.com",
      subject: "Test failure handling",
      body: "Details",
    })

    expect(result.publicId).toBe("TD-0010")
    expect(createGitHubIssue).toHaveBeenCalled()
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

  it("sends status update email to submitter", async () => {
    vi.mocked(prisma.ticket.update).mockResolvedValue({
      id: "ticket-1",
      publicId: "TD-0001",
      submitterEmail: "user@example.com",
      subject: "Test",
      status: "MERGED",
      product: { name: "TinyCal" },
    } as any)
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({} as any)

    await updateTicketStatus("ticket-1", "MERGED", {
      actor: "dev",
      summary: "PR merged",
    })

    const { sendStatusUpdate } = await import("@/lib/email")
    expect(sendStatusUpdate).toHaveBeenCalledWith(
      "user@example.com",
      "TD-0001",
      "Test",
      "Merged",
      "PR merged"
    )
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

  it("creates a private timeline event", async () => {
    vi.mocked(prisma.timelineEvent.create).mockResolvedValue({
      id: "event-2",
      ticketId: "ticket-1",
      eventType: "comment",
      summary: "Internal note",
      public: false,
    } as any)

    const result = await appendTimelineEvent({
      ticketId: "ticket-1",
      eventType: "comment",
      summary: "Internal note",
      public: false,
    })

    expect(prisma.timelineEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ public: false }),
      })
    )
  })
})
