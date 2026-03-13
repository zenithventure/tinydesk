import { createHmac, timingSafeEqual } from "crypto"

export function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false
  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * Extract TinyDesk ticket ID from GitHub issue body.
 * Looks for `TinyDesk-Ticket: TD-XXXX` pattern.
 */
export function extractTicketId(body: string | null): string | null {
  if (!body) return null
  const match = body.match(/TinyDesk-Ticket:\s*(TD-\d+)/i)
  return match ? match[1].toUpperCase() : null
}

/**
 * Extract issue number from PR body.
 * Looks for `Closes #N`, `Fixes #N`, or `Resolves #N`.
 */
export function extractIssueNumber(body: string | null): number | null {
  if (!body) return null
  const match = body.match(/(?:closes|fixes|resolves)\s+#(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Map a GitHub event + action to the new ticket status.
 */
export function mapEventToStatus(
  event: string,
  action: string,
  payload: any
): { status: string; eventType: string; summary: string } | null {
  if (event === "issues" && action === "opened") {
    return {
      status: "ISSUE_CREATED",
      eventType: "issue_linked",
      summary: `GitHub issue #${payload.issue?.number} created`,
    }
  }

  if (event === "issues" && action === "assigned") {
    return {
      status: "FIX_IN_PROGRESS",
      eventType: "issue_assigned",
      summary: `Issue assigned to ${payload.assignee?.login || "someone"}`,
    }
  }

  if (event === "pull_request" && action === "opened") {
    return {
      status: "PR_OPEN",
      eventType: "pr_opened",
      summary: `Pull request #${payload.pull_request?.number} opened`,
    }
  }

  if (event === "pull_request_review" && action === "submitted") {
    if (payload.review?.state === "changes_requested") {
      return {
        status: "CHANGES_REQUESTED",
        eventType: "changes_requested",
        summary: `Changes requested by ${payload.review?.user?.login || "reviewer"}`,
      }
    }
  }

  if (event === "pull_request" && action === "closed" && payload.pull_request?.merged) {
    return {
      status: "MERGED",
      eventType: "pr_merged",
      summary: `Pull request #${payload.pull_request?.number} merged`,
    }
  }

  return null
}
