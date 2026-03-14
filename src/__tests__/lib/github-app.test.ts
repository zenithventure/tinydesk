import { describe, it, expect, vi, beforeEach } from "vitest"

describe("isGitHubAppConfigured", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns false when no env vars are set", async () => {
    delete process.env.GITHUB_APP_ID
    delete process.env.GITHUB_APP_PRIVATE_KEY
    delete process.env.GITHUB_APP_INSTALLATION_ID
    const { isGitHubAppConfigured } = await import("@/lib/github-app")
    expect(isGitHubAppConfigured()).toBe(false)
  })

  it("returns false when only APP_ID is set", async () => {
    process.env.GITHUB_APP_ID = "123"
    delete process.env.GITHUB_APP_PRIVATE_KEY
    delete process.env.GITHUB_APP_INSTALLATION_ID
    const { isGitHubAppConfigured } = await import("@/lib/github-app")
    expect(isGitHubAppConfigured()).toBe(false)
  })

  it("returns true when all env vars are set", async () => {
    process.env.GITHUB_APP_ID = "123"
    process.env.GITHUB_APP_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----"
    process.env.GITHUB_APP_INSTALLATION_ID = "456"
    const { isGitHubAppConfigured } = await import("@/lib/github-app")
    expect(isGitHubAppConfigured()).toBe(true)
  })
})
