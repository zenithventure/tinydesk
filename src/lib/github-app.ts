import { createPrivateKey, createSign } from "crypto"

function generateJWT(): string {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials not configured")
  }

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId })
  ).toString("base64url")

  const sign = createSign("RSA-SHA256")
  sign.update(`${header}.${payload}`)
  const signature = sign.sign(createPrivateKey(privateKey), "base64url")

  return `${header}.${payload}.${signature}`
}

async function getInstallationToken(): Promise<string> {
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID

  if (!installationId) {
    throw new Error("GitHub App installation ID not configured")
  }

  const jwt = generateJWT()
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get installation token: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.token
}

export async function createGitHubIssue(opts: {
  owner: string
  repo: string
  title: string
  body: string
  assignee?: string
}): Promise<{ number: number; html_url: string }> {
  const token = await getInstallationToken()

  const requestBody: any = {
    title: opts.title,
    body: opts.body,
  }
  if (opts.assignee) {
    requestBody.assignees = [opts.assignee]
  }

  const res = await fetch(
    `https://api.github.com/repos/${opts.owner}/${opts.repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create GitHub issue: ${res.status} ${text}`)
  }

  const data = await res.json()
  return { number: data.number, html_url: data.html_url }
}

export async function createGitHubWebhook(opts: {
  owner: string
  repo: string
  webhookUrl: string
  secret: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getInstallationToken()
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    }

    const requiredEvents = ["issues", "pull_request", "pull_request_review"]

    // Check for existing webhook with same URL to prevent duplicates
    const listRes = await fetch(
      `https://api.github.com/repos/${opts.owner}/${opts.repo}/hooks`,
      { headers }
    )
    if (listRes.ok) {
      const hooks = await listRes.json()
      const existing = hooks.find((h: any) => h.config?.url === opts.webhookUrl)
      if (existing) {
        // Verify the existing webhook has all required events; update if not
        const currentEvents: string[] = existing.events || []
        const missingEvents = requiredEvents.filter(
          (e) => !currentEvents.includes(e)
        )
        if (missingEvents.length === 0) {
          return { success: true }
        }
        // Patch the webhook to include all required events
        const patchRes = await fetch(
          `https://api.github.com/repos/${opts.owner}/${opts.repo}/hooks/${existing.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              events: requiredEvents,
            }),
          }
        )
        if (!patchRes.ok) {
          const text = await patchRes.text()
          return { success: false, error: `Failed to update webhook events: ${patchRes.status} ${text}` }
        }
        return { success: true }
      }
    }

    const res = await fetch(
      `https://api.github.com/repos/${opts.owner}/${opts.repo}/hooks`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "web",
          active: true,
          events: requiredEvents,
          config: {
            url: opts.webhookUrl,
            content_type: "application/json",
            secret: opts.secret,
            insecure_ssl: "0",
          },
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `${res.status} ${text}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function checkGitHubWebhookExists(opts: {
  owner: string
  repo: string
  webhookUrl: string
}): Promise<boolean> {
  try {
    const token = await getInstallationToken()
    const res = await fetch(
      `https://api.github.com/repos/${opts.owner}/${opts.repo}/hooks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    )
    if (!res.ok) return false
    const hooks = await res.json()
    return hooks.some((h: any) => h.config?.url === opts.webhookUrl)
  } catch {
    return false
  }
}

/**
 * Check whether the GitHub App is configured by reading env vars at call time.
 * Reading at call time (rather than module load time) avoids a Next.js module
 * caching edge case where constants captured at import time can be stale if the
 * module was first loaded before env vars were fully hydrated.
 */
export function isGitHubAppConfigured(): boolean {
  return !!(
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_APP_PRIVATE_KEY &&
    process.env.GITHUB_APP_INSTALLATION_ID
  )
}
