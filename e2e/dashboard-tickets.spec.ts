import { test, expect } from "@playwright/test"

test.describe("Dashboard (unauthenticated)", () => {
  test("redirects to login from ticket list", async ({ page }) => {
    await page.goto("/dashboard/tickets")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("redirects to login from products page", async ({ page }) => {
    await page.goto("/dashboard/products")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("redirects to login from settings", async ({ page }) => {
    await page.goto("/dashboard/settings")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("redirects to login from support", async ({ page }) => {
    await page.goto("/dashboard/support")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("redirects to login from users page", async ({ page }) => {
    await page.goto("/dashboard/users")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })
})

test.describe("Public ticket creation API", () => {
  test("rejects invalid ticket submission", async ({ request }) => {
    const response = await request.post("/api/tickets", {
      data: {
        productSlug: "",
        submitterEmail: "invalid",
        subject: "",
        body: "",
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBe("Validation failed")
    expect(body.details).toBeDefined()
  })

  test("returns 404 for non-existent product", async ({ request }) => {
    const response = await request.post("/api/tickets", {
      data: {
        productSlug: "nonexistent-product",
        submitterEmail: "user@example.com",
        subject: "Test",
        body: "Test body",
      },
    })
    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toBe("Product not found")
  })

  test("rejects ticket with too many screenshots", async ({ request }) => {
    const response = await request.post("/api/tickets", {
      data: {
        productSlug: "tinycal",
        submitterEmail: "user@example.com",
        subject: "Test",
        body: "Test body",
        screenshots: [
          "https://example.com/1.png",
          "https://example.com/2.png",
          "https://example.com/3.png",
          "https://example.com/4.png",
        ],
      },
    })
    expect(response.status()).toBe(400)
  })
})

test.describe("Screenshot upload API", () => {
  test("rejects upload with no files", async ({ request }) => {
    const response = await request.post("/api/tickets/upload", {
      multipart: {},
    })
    // Should fail - no files
    expect([400, 500]).toContain(response.status())
  })
})

test.describe("GitHub webhook API", () => {
  test("rejects webhook without X-GitHub-Event header", async ({ request }) => {
    const response = await request.post("/api/webhooks/github", {
      data: { action: "opened" },
    })
    expect(response.status()).toBe(400)
  })

  test("handles webhook for unknown repo gracefully", async ({ request }) => {
    const response = await request.post("/api/webhooks/github", {
      headers: {
        "X-GitHub-Event": "issues",
      },
      data: {
        action: "opened",
        repository: { full_name: "unknown/repo" },
        issue: { number: 1, body: "test" },
      },
    })
    // Should return 200 with "No matching product"
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.message).toContain("No matching product")
  })
})
