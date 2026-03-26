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

  test("support page redirects to login", async ({ page }) => {
    await page.goto("/dashboard/support")
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

  test("dashboard ticket detail API returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/dashboard/tickets/some-id")
    expect(response.status()).toBe(401)
  })

  test("dashboard ticket update API returns 401 without auth", async ({ request }) => {
    const response = await request.patch("/api/dashboard/tickets/some-id", {
      data: { status: "CLOSED" },
    })
    expect(response.status()).toBe(401)
  })

  test("dashboard users API returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/dashboard/users")
    expect(response.status()).toBe(401)
  })

  test("dashboard user update API returns 401 without auth", async ({ request }) => {
    const response = await request.patch("/api/dashboard/users/some-id", {
      data: { role: "ADMIN" },
    })
    expect(response.status()).toBe(401)
  })
})
