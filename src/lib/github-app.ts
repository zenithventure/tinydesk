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
