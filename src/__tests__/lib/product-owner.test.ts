import { describe, it, expect } from "vitest"

// ---------------------------------------------------------------------------
// Pure helper functions extracted from the route handlers so they can be
// unit-tested without spinning up a full Next.js server or database.
// ---------------------------------------------------------------------------

interface TicketLike {
  productId: string
  submitterEmail: string
}

interface AccessLike {
  isAdmin: boolean
  ownedProductIds: string[]
  user: { email: string }
}

function canViewTicket(ticket: TicketLike, access: AccessLike): boolean {
  if (access.isAdmin) return true
  if (access.ownedProductIds.includes(ticket.productId)) return true
  return ticket.submitterEmail === access.user.email
}

function canChangeStatus(
  ticket: Pick<TicketLike, "productId">,
  access: Pick<AccessLike, "isAdmin" | "ownedProductIds">
): boolean {
  if (access.isAdmin) return true
  return access.ownedProductIds.includes(ticket.productId)
}

// ---------------------------------------------------------------------------
// canViewTicket
// ---------------------------------------------------------------------------

describe("canViewTicket", () => {
  const ticket: TicketLike = {
    productId: "prod-1",
    submitterEmail: "user@example.com",
  }

  it("allows admin to view any ticket", () => {
    const access: AccessLike = {
      isAdmin: true,
      ownedProductIds: [],
      user: { email: "admin@example.com" },
    }
    expect(canViewTicket(ticket, access)).toBe(true)
  })

  it("allows product owner to view tickets in their product", () => {
    const access: AccessLike = {
      isAdmin: false,
      ownedProductIds: ["prod-1", "prod-2"],
      user: { email: "owner@example.com" },
    }
    expect(canViewTicket(ticket, access)).toBe(true)
  })

  it("denies product owner from viewing tickets in other products", () => {
    const access: AccessLike = {
      isAdmin: false,
      ownedProductIds: ["prod-99"],
      user: { email: "owner@example.com" },
    }
    expect(canViewTicket(ticket, access)).toBe(false)
  })

  it("allows regular user to view their own ticket", () => {
    const access: AccessLike = {
      isAdmin: false,
      ownedProductIds: [],
      user: { email: "user@example.com" },
    }
    expect(canViewTicket(ticket, access)).toBe(true)
  })

  it("denies regular user from viewing someone else's ticket", () => {
    const access: AccessLike = {
      isAdmin: false,
      ownedProductIds: [],
      user: { email: "other@example.com" },
    }
    expect(canViewTicket(ticket, access)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// canChangeStatus
// ---------------------------------------------------------------------------

describe("canChangeStatus", () => {
  const ticket = { productId: "prod-1" }

  it("allows admin to change status", () => {
    expect(canChangeStatus(ticket, { isAdmin: true, ownedProductIds: [] })).toBe(true)
  })

  it("allows product owner to change status in their product", () => {
    expect(
      canChangeStatus(ticket, { isAdmin: false, ownedProductIds: ["prod-1"] })
    ).toBe(true)
  })

  it("denies product owner from changing status in another product", () => {
    expect(
      canChangeStatus(ticket, { isAdmin: false, ownedProductIds: ["prod-99"] })
    ).toBe(false)
  })

  it("denies regular user from changing status", () => {
    expect(
      canChangeStatus(ticket, { isAdmin: false, ownedProductIds: [] })
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Ticket list WHERE clause builder (mirrors the API route logic)
// ---------------------------------------------------------------------------

interface WhereClause {
  productId?: string | { in: string[] }
  submitterEmail?: string
}

function buildTicketWhereClause(access: AccessLike): WhereClause {
  if (access.isAdmin) return {}
  if (access.ownedProductIds.length > 0) {
    return { productId: { in: access.ownedProductIds } }
  }
  return { submitterEmail: access.user.email }
}

describe("buildTicketWhereClause", () => {
  it("returns empty filter for admins", () => {
    const where = buildTicketWhereClause({
      isAdmin: true,
      ownedProductIds: [],
      user: { email: "admin@example.com" },
    })
    expect(where).toEqual({})
  })

  it("filters by ownedProductIds for product owners", () => {
    const where = buildTicketWhereClause({
      isAdmin: false,
      ownedProductIds: ["prod-1", "prod-2"],
      user: { email: "owner@example.com" },
    })
    expect(where).toEqual({ productId: { in: ["prod-1", "prod-2"] } })
  })

  it("filters by submitterEmail for regular users", () => {
    const where = buildTicketWhereClause({
      isAdmin: false,
      ownedProductIds: [],
      user: { email: "user@example.com" },
    })
    expect(where).toEqual({ submitterEmail: "user@example.com" })
  })
})
