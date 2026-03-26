import { describe, it, expect } from "vitest"
import { createTicketSchema, updateTicketSchema, createProductSchema, updateProductSchema, updateUserSchema } from "@/lib/validators"

describe("createTicketSchema", () => {
  it("validates a correct ticket", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug report",
      body: "Something is broken",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing email", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "",
      subject: "Bug",
      body: "Details",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "not-an-email",
      subject: "Bug",
      body: "Details",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty subject", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "",
      body: "Details",
    })
    expect(result.success).toBe(false)
  })

  it("rejects subject over 200 chars", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "x".repeat(201),
      body: "Details",
    })
    expect(result.success).toBe(false)
  })

  it("allows optional submitterName", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      submitterName: "John",
      subject: "Bug",
      body: "Details",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid screenshots array", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
      screenshots: [
        "https://example.com/img1.png",
        "https://example.com/img2.png",
      ],
    })
    expect(result.success).toBe(true)
  })

  it("allows empty screenshots array", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
      screenshots: [],
    })
    expect(result.success).toBe(true)
  })

  it("rejects more than 3 screenshots", () => {
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

  it("rejects non-URL strings in screenshots", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
      screenshots: ["not-a-url"],
    })
    expect(result.success).toBe(false)
  })

  it("allows omitting screenshots entirely", () => {
    const result = createTicketSchema.safeParse({
      productSlug: "tinycal",
      submitterEmail: "user@example.com",
      subject: "Bug",
      body: "Details",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.screenshots).toBeUndefined()
    }
  })
})

describe("updateTicketSchema", () => {
  it("validates a valid status", () => {
    const result = updateTicketSchema.safeParse({ status: "MERGED" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = updateTicketSchema.safeParse({ status: "INVALID" })
    expect(result.success).toBe(false)
  })

  it("validates humanFlagged", () => {
    const result = updateTicketSchema.safeParse({ humanFlagged: true })
    expect(result.success).toBe(true)
  })
})

describe("createProductSchema", () => {
  it("validates a correct product", () => {
    const result = createProductSchema.safeParse({
      name: "TinyCal",
      slug: "tinycal",
    })
    expect(result.success).toBe(true)
  })

  it("rejects slug with uppercase", () => {
    const result = createProductSchema.safeParse({
      name: "TinyCal",
      slug: "TinyCal",
    })
    expect(result.success).toBe(false)
  })

  it("rejects slug with spaces", () => {
    const result = createProductSchema.safeParse({
      name: "TinyCal",
      slug: "tiny cal",
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional defaultAssignee", () => {
    const result = createProductSchema.safeParse({
      name: "TinyCal",
      slug: "tinycal",
      defaultAssignee: "z-team-alpha",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateProductSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateProductSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts name only", () => {
    const result = updateProductSchema.safeParse({ name: "New Name" })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = updateProductSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects name over 100 chars", () => {
    const result = updateProductSchema.safeParse({ name: "x".repeat(101) })
    expect(result.success).toBe(false)
  })

  it("accepts defaultAssignee", () => {
    const result = updateProductSchema.safeParse({ defaultAssignee: "szewong" })
    expect(result.success).toBe(true)
  })

  it("accepts empty defaultAssignee (to clear it)", () => {
    const result = updateProductSchema.safeParse({ defaultAssignee: "" })
    expect(result.success).toBe(true)
  })

  it("accepts valid supportEmail", () => {
    const result = updateProductSchema.safeParse({ supportEmail: "support@example.com" })
    expect(result.success).toBe(true)
  })

  it("accepts empty supportEmail (to clear it)", () => {
    const result = updateProductSchema.safeParse({ supportEmail: "" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid supportEmail", () => {
    const result = updateProductSchema.safeParse({ supportEmail: "not-email" })
    expect(result.success).toBe(false)
  })

  it("accepts repoOwner and repoName", () => {
    const result = updateProductSchema.safeParse({ repoOwner: "myorg", repoName: "myrepo" })
    expect(result.success).toBe(true)
  })

  it("accepts webhookSecret", () => {
    const result = updateProductSchema.safeParse({ webhookSecret: "whsec_abc123" })
    expect(result.success).toBe(true)
  })

  it("accepts all fields together", () => {
    const result = updateProductSchema.safeParse({
      name: "Updated Product",
      repoOwner: "myorg",
      repoName: "myrepo",
      defaultAssignee: "szewong",
      supportEmail: "help@example.com",
      webhookSecret: "whsec_123",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateUserSchema", () => {
  it("accepts role ADMIN", () => {
    const result = updateUserSchema.safeParse({ role: "ADMIN" })
    expect(result.success).toBe(true)
  })

  it("accepts role VIEWER", () => {
    const result = updateUserSchema.safeParse({ role: "VIEWER" })
    expect(result.success).toBe(true)
  })

  it("accepts ownedProductIds array", () => {
    const result = updateUserSchema.safeParse({ ownedProductIds: ["prod-1", "prod-2"] })
    expect(result.success).toBe(true)
  })

  it("accepts both role and ownedProductIds", () => {
    const result = updateUserSchema.safeParse({
      role: "VIEWER",
      ownedProductIds: ["prod-1"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid role", () => {
    const result = updateUserSchema.safeParse({ role: "SUPERADMIN" })
    expect(result.success).toBe(false)
  })

  it("rejects non-string items in ownedProductIds", () => {
    const result = updateUserSchema.safeParse({ ownedProductIds: [123] })
    expect(result.success).toBe(false)
  })

  it("rejects empty string in ownedProductIds", () => {
    const result = updateUserSchema.safeParse({ ownedProductIds: [""] })
    expect(result.success).toBe(false)
  })

  it("accepts empty ownedProductIds array", () => {
    const result = updateUserSchema.safeParse({ ownedProductIds: [] })
    expect(result.success).toBe(true)
  })

  it("accepts empty object (both fields optional)", () => {
    const result = updateUserSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
