import { describe, it, expect } from "vitest"
import { createTicketSchema, updateTicketSchema, createProductSchema } from "@/lib/validators"

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
