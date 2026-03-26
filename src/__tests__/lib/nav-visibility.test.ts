import { describe, it, expect } from "vitest"

// ---------------------------------------------------------------------------
// Pure helper extracted from the dashboard layout nav filtering logic.
// Tests the visibility rules without rendering React components.
// ---------------------------------------------------------------------------

interface NavItem {
  href: string
  label: string
  adminOnly?: boolean
  adminOrOwnerOnly?: boolean
}

function filterNavItems(
  items: NavItem[],
  context: { isAdmin: boolean; isProductOwner: boolean }
): NavItem[] {
  return items.filter((item) => {
    if (item.adminOnly) return context.isAdmin
    if (item.adminOrOwnerOnly) return context.isAdmin || context.isProductOwner
    return true
  })
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tickets", label: "Tickets" },
  { href: "/dashboard/products", label: "Products", adminOrOwnerOnly: true },
  { href: "/dashboard/users", label: "Users", adminOnly: true },
  { href: "/dashboard/support", label: "Submit Ticket" },
  { href: "/dashboard/settings", label: "Settings" },
]

describe("filterNavItems", () => {
  it("shows all items for admin users", () => {
    const result = filterNavItems(ALL_NAV_ITEMS, { isAdmin: true, isProductOwner: false })
    const labels = result.map((i) => i.label)
    expect(labels).toEqual(["Overview", "Tickets", "Products", "Users", "Submit Ticket", "Settings"])
  })

  it("shows products but not users for product owners", () => {
    const result = filterNavItems(ALL_NAV_ITEMS, { isAdmin: false, isProductOwner: true })
    const labels = result.map((i) => i.label)
    expect(labels).toEqual(["Overview", "Tickets", "Products", "Submit Ticket", "Settings"])
    expect(labels).not.toContain("Users")
  })

  it("hides admin-only and owner-only items for regular viewers", () => {
    const result = filterNavItems(ALL_NAV_ITEMS, { isAdmin: false, isProductOwner: false })
    const labels = result.map((i) => i.label)
    expect(labels).toEqual(["Overview", "Tickets", "Submit Ticket", "Settings"])
    expect(labels).not.toContain("Products")
    expect(labels).not.toContain("Users")
  })

  it("admin who is also a product owner sees all items", () => {
    const result = filterNavItems(ALL_NAV_ITEMS, { isAdmin: true, isProductOwner: true })
    const labels = result.map((i) => i.label)
    expect(labels).toEqual(["Overview", "Tickets", "Products", "Users", "Submit Ticket", "Settings"])
  })
})
