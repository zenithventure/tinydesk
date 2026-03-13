import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator("text=TinyDesk")).toBeVisible()
    await expect(page.locator("text=Admin Login")).toBeVisible()
    await expect(page.locator("text=Continue with Google")).toBeVisible()
  })

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("dashboard API returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/dashboard/tickets")
    expect(response.status()).toBe(401)
  })

  test("dashboard products API returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/dashboard/products")
    expect(response.status()).toBe(401)
  })
})
