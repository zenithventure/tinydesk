import { describe, it, expect } from "vitest"
import { cn, generatePublicId, absoluteUrl } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("merges tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })
})

describe("generatePublicId", () => {
  it("generates TD-0001 for sequence 1", () => {
    expect(generatePublicId(1)).toBe("TD-0001")
  })

  it("generates TD-0042 for sequence 42", () => {
    expect(generatePublicId(42)).toBe("TD-0042")
  })

  it("generates TD-1234 for sequence 1234", () => {
    expect(generatePublicId(1234)).toBe("TD-1234")
  })

  it("handles large numbers", () => {
    expect(generatePublicId(10000)).toBe("TD-10000")
  })
})

describe("absoluteUrl", () => {
  it("prepends app URL to path", () => {
    const original = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = "https://tinydesk.io"
    expect(absoluteUrl("/ticket/TD-0001")).toBe("https://tinydesk.io/ticket/TD-0001")
    process.env.NEXT_PUBLIC_APP_URL = original
  })
})
