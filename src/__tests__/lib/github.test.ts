import { describe, it, expect } from "vitest"
import { createHmac } from "crypto"
import {
  verifyGitHubSignature,
  extractTicketId,
  extractIssueNumber,
  mapEventToStatus,
} from "@/lib/github"

describe("verifyGitHubSignature", () => {
  const secret = "test-secret"

  function sign(payload: string): string {
    return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")
  }

  it("returns true for valid signature", () => {
    const payload = '{"test": true}'
    expect(verifyGitHubSignature(payload, sign(payload), secret)).toBe(true)
  })

  it("returns false for invalid signature", () => {
    expect(verifyGitHubSignature("payload", "sha256=invalid", secret)).toBe(false)
  })

  it("returns false for null signature", () => {
    expect(verifyGitHubSignature("payload", null, secret)).toBe(false)
  })
})

describe("extractTicketId", () => {
  it("extracts ticket ID from issue body", () => {
    expect(extractTicketId("Some text\nTinyDesk-Ticket: TD-0042\nMore text")).toBe("TD-0042")
  })

  it("is case-insensitive", () => {
    expect(extractTicketId("tinydesk-ticket: td-0001")).toBe("TD-0001")
  })

  it("returns null for no match", () => {
    expect(extractTicketId("No ticket reference here")).toBeNull()
  })

  it("returns null for null body", () => {
    expect(extractTicketId(null)).toBeNull()
  })
})

describe("extractIssueNumber", () => {
  it("extracts from 'Closes #N'", () => {
    expect(extractIssueNumber("Closes #42")).toBe(42)
  })

  it("extracts from 'Fixes #N'", () => {
    expect(extractIssueNumber("Fixes #7")).toBe(7)
  })

  it("extracts from 'Resolves #N'", () => {
    expect(extractIssueNumber("Resolves #123")).toBe(123)
  })

  it("is case-insensitive", () => {
    expect(extractIssueNumber("closes #5")).toBe(5)
  })

  it("returns null for no match", () => {
    expect(extractIssueNumber("No reference")).toBeNull()
  })

  it("returns null for null body", () => {
    expect(extractIssueNumber(null)).toBeNull()
  })
})

describe("mapEventToStatus", () => {
  it("maps issues.opened to ISSUE_CREATED", () => {
    const result = mapEventToStatus("issues", "opened", { issue: { number: 1 } })
    expect(result?.status).toBe("ISSUE_CREATED")
  })

  it("maps issues.assigned to FIX_IN_PROGRESS", () => {
    const result = mapEventToStatus("issues", "assigned", { assignee: { login: "dev" } })
    expect(result?.status).toBe("FIX_IN_PROGRESS")
  })

  it("maps pull_request.opened to PR_OPEN", () => {
    const result = mapEventToStatus("pull_request", "opened", { pull_request: { number: 10 } })
    expect(result?.status).toBe("PR_OPEN")
  })

  it("maps pull_request_review with changes_requested", () => {
    const result = mapEventToStatus("pull_request_review", "submitted", {
      review: { state: "changes_requested", user: { login: "reviewer" } },
    })
    expect(result?.status).toBe("CHANGES_REQUESTED")
  })

  it("maps pull_request.closed with merged=true to MERGED", () => {
    const result = mapEventToStatus("pull_request", "closed", {
      pull_request: { number: 10, merged: true },
    })
    expect(result?.status).toBe("MERGED")
  })

  it("returns null for pull_request.closed without merge", () => {
    const result = mapEventToStatus("pull_request", "closed", {
      pull_request: { number: 10, merged: false },
    })
    expect(result).toBeNull()
  })

  it("returns null for unhandled events", () => {
    expect(mapEventToStatus("push", "completed", {})).toBeNull()
  })
})
