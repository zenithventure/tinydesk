import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHmac } from "crypto"
import { verifyGitHubSignature, extractTicketId, extractIssueNumber, mapEventToStatus } from "@/lib/github"

describe("GitHub webhook handler logic", () => {
  describe("signature verification", () => {
    const secret = "webhook-secret-123"

    it("accepts valid webhook signature", () => {
      const payload = JSON.stringify({ action: "opened", issue: { number: 1 } })
      const sig = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")
      expect(verifyGitHubSignature(payload, sig, secret)).toBe(true)
    })

    it("rejects tampered payload", () => {
      const payload = JSON.stringify({ action: "opened" })
      const sig = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")
      expect(verifyGitHubSignature(payload + "tampered", sig, secret)).toBe(false)
    })

    it("rejects wrong secret", () => {
      const payload = JSON.stringify({ action: "opened" })
      const sig = "sha256=" + createHmac("sha256", "wrong-secret").update(payload).digest("hex")
      expect(verifyGitHubSignature(payload, sig, secret)).toBe(false)
    })
  })

  describe("issue event processing", () => {
    it("extracts ticket from issue body and maps to ISSUE_CREATED", () => {
      const body = "Bug report\n\nTinyDesk-Ticket: TD-0042"
      const ticketId = extractTicketId(body)
      expect(ticketId).toBe("TD-0042")

      const status = mapEventToStatus("issues", "opened", { issue: { number: 5 } })
      expect(status?.status).toBe("ISSUE_CREATED")
    })

    it("progresses to FIX_IN_PROGRESS on assignment", () => {
      const status = mapEventToStatus("issues", "assigned", {
        assignee: { login: "developer" },
      })
      expect(status?.status).toBe("FIX_IN_PROGRESS")
      expect(status?.summary).toContain("developer")
    })
  })

  describe("PR event processing", () => {
    it("extracts issue number from PR body", () => {
      expect(extractIssueNumber("Closes #42\n\nSome description")).toBe(42)
      expect(extractIssueNumber("fixes #7")).toBe(7)
    })

    it("maps PR opened to PR_OPEN", () => {
      const status = mapEventToStatus("pull_request", "opened", {
        pull_request: { number: 10 },
      })
      expect(status?.status).toBe("PR_OPEN")
    })

    it("maps merged PR to MERGED", () => {
      const status = mapEventToStatus("pull_request", "closed", {
        pull_request: { number: 10, merged: true },
      })
      expect(status?.status).toBe("MERGED")
    })

    it("ignores closed-without-merge PR", () => {
      const status = mapEventToStatus("pull_request", "closed", {
        pull_request: { number: 10, merged: false },
      })
      expect(status).toBeNull()
    })
  })

  describe("review event processing", () => {
    it("maps changes_requested review", () => {
      const status = mapEventToStatus("pull_request_review", "submitted", {
        review: { state: "changes_requested", user: { login: "reviewer" } },
      })
      expect(status?.status).toBe("CHANGES_REQUESTED")
    })

    it("ignores approved review", () => {
      const status = mapEventToStatus("pull_request_review", "submitted", {
        review: { state: "approved", user: { login: "reviewer" } },
      })
      expect(status).toBeNull()
    })
  })
})
