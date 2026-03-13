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
  })
})
