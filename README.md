# TinyDesk

Transparent support tracker for the Tiny product suite. Customers see the full journey of their ticket — from submission to deployment.

**Production:** https://tinydesk.zenithstudio.app

---

## Integration Guide

Any product (TinyCal, TinySign, etc.) can integrate with TinyDesk in two steps:

1. **Submit tickets** via the public API
2. **Connect GitHub webhooks** for automatic pipeline tracking

### Prerequisites

Register your product in the TinyDesk admin dashboard at `/dashboard/products`:

| Field | Example |
|-------|---------|
| Name | TinyCal |
| Slug | `tinycal` |
| GitHub Owner | `zenithventure` |
| GitHub Repo | `tinycal` |
| Webhook Secret | *(generate a random string)* |

---

### 1. Submit a ticket

```
POST https://tinydesk.zenithstudio.app/api/tickets
Content-Type: application/json
```

**Request body:**

```json
{
  "productSlug": "tinycal",
  "submitterEmail": "user@example.com",
  "submitterName": "Jane Doe",
  "subject": "Calendar sync broken",
  "body": "Google Calendar events aren't showing up after connecting..."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `productSlug` | string | Yes | Must match a registered product slug |
| `submitterEmail` | string | Yes | Valid email, used for status notifications |
| `submitterName` | string | No | Display name |
| `subject` | string | Yes | Max 200 characters |
| `body` | string | Yes | Max 5000 characters |

**Response (201):**

```json
{
  "publicId": "TD-0042",
  "status": "RECEIVED",
  "createdAt": "2026-03-13T12:00:00.000Z"
}
```

The submitter automatically receives a receipt email with a link to track their ticket.

**Error responses:**

| Status | Reason |
|--------|--------|
| 400 | Validation failed (missing/invalid fields) |
| 404 | Product slug not found |
| 500 | Server error |

#### Example integration (React)

```tsx
async function submitTicket(subject: string, body: string, userEmail: string) {
  const res = await fetch("https://tinydesk.zenithstudio.app/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productSlug: "tinycal",
      submitterEmail: userEmail,
      subject,
      body,
    }),
  });

  if (!res.ok) throw new Error("Failed to submit ticket");

  const { publicId } = await res.json();
  // Redirect or show link: https://tinydesk.zenithstudio.app/ticket/TD-0042
  return publicId;
}
```

---

### 2. Get ticket status (public)

```
GET https://tinydesk.zenithstudio.app/api/tickets/{publicId}
```

**Response (200):**

```json
{
  "publicId": "TD-0042",
  "subject": "Calendar sync broken",
  "status": "PR_OPEN",
  "productName": "TinyCal",
  "createdAt": "2026-03-13T12:00:00.000Z",
  "updatedAt": "2026-03-14T09:30:00.000Z",
  "issueUrl": "https://github.com/zenithventure/tinycal/issues/47",
  "prUrl": "https://github.com/zenithventure/tinycal/pull/52",
  "deploymentUrl": null
}
```

---

### 3. Get ticket timeline (public)

```
GET https://tinydesk.zenithstudio.app/api/tickets/{publicId}/events
```

**Response (200):**

```json
[
  {
    "id": "evt_1",
    "eventType": "ticket_created",
    "actor": "user@example.com",
    "summary": "Ticket submitted",
    "createdAt": "2026-03-13T12:00:00.000Z"
  },
  {
    "id": "evt_2",
    "eventType": "issue_linked",
    "actor": "developer",
    "summary": "GitHub issue #47 created",
    "createdAt": "2026-03-13T14:00:00.000Z"
  }
]
```

---

### 4. GitHub webhook setup

Configure your repo to send events to TinyDesk so ticket status progresses automatically.

**In your GitHub repo** → Settings → Webhooks → Add webhook:

| Setting | Value |
|---------|-------|
| Payload URL | `https://tinydesk.zenithstudio.app/api/webhooks/github` |
| Content type | `application/json` |
| Secret | The webhook secret from your TinyDesk product config |
| Events | Issues, Pull requests, Pull request reviews |

#### How ticket status progresses

| GitHub event | Ticket status | Trigger |
|-------------|--------------|---------|
| Issue opened | `ISSUE_CREATED` | Issue body contains `TinyDesk-Ticket: TD-XXXX` |
| Issue assigned | `FIX_IN_PROGRESS` | Any assignee added |
| PR opened | `PR_OPEN` | PR body contains `Closes #N` matching a linked issue |
| PR review (changes requested) | `CHANGES_REQUESTED` | Reviewer requests changes |
| PR merged | `MERGED` | PR closed with merge |

#### Developer workflow

When working on a ticket, tag the TinyDesk ID in your GitHub issue:

```markdown
Calendar sync fails for Google Workspace accounts

TinyDesk-Ticket: TD-0042

Steps to reproduce:
1. Connect a Google Workspace calendar
2. Events don't appear
```

When opening a PR, reference the issue number (standard GitHub convention):

```markdown
Fix Google Workspace calendar sync

Closes #47
```

TinyDesk automatically links the PR to the ticket via the issue number.

---

### 5. Public status page

Every ticket has a public status page the customer can visit:

```
https://tinydesk.zenithstudio.app/ticket/TD-0042
```

The page shows:
- 8-stage pipeline progress bar
- Current status badge
- Links to GitHub issue/PR (when linked)
- Full timeline of events

You can link to this page from your product's UI after ticket submission.

---

## Ticket statuses

| Status | Stage | Description |
|--------|-------|-------------|
| `RECEIVED` | 1 | Ticket submitted, awaiting triage |
| `ISSUE_CREATED` | 2 | GitHub issue created and linked |
| `FIX_IN_PROGRESS` | 3 | Issue assigned to a developer |
| `PR_OPEN` | 4 | Pull request opened |
| `CHANGES_REQUESTED` | 5 | Code review requested changes |
| `MERGED` | 6 | PR merged into main branch |
| `DEPLOYED` | 7 | Fix deployed to production |
| `CLOSED` | 8 | Ticket resolved |

---

## Tech stack

- Next.js 14 (App Router)
- NextAuth v5 (Google OAuth)
- Prisma + NeonDB (PostgreSQL)
- Tailwind CSS
- Resend (transactional email)
- Vitest + Playwright (testing)

## Development

```bash
cp .env.example .env        # fill in credentials
npm install
npx prisma db push
npm run dev                  # http://localhost:3000
npm run test                 # unit tests
npm run e2e                  # e2e tests
```
