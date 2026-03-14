import { test, expect } from "@playwright/test"

test.describe("Public Status Page", () => {
  test("shows 404 for non-existent ticket", async ({ page }) => {
    const response = await page.goto("/ticket/TD-9999")
    expect(response?.status()).toBe(404)
  })

  test("ticket API returns 404 for non-existent ticket", async ({ request }) => {
    const response = await request.get("/api/tickets/TD-9999")
    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toBe("Ticket not found")
  })

  test("ticket events API returns 404 for non-existent ticket", async ({ request }) => {
    const response = await request.get("/api/tickets/TD-9999/events")
    expect(response.status()).toBe(404)
    const body = await response.json()
    expect(body.error).toBe("Ticket not found")
  })

  test("landing page renders", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=TinyDesk")).toBeVisible()
    await expect(page.locator("text=See exactly where")).toBeVisible()
  })

  test("landing page has admin login link", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=Admin Login")).toBeVisible()
  })

  test("landing page shows pipeline stages", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=The 8-stage pipeline")).toBeVisible()
    await expect(page.locator("text=Received")).toBeVisible()
    await expect(page.locator("text=Deployed & Closed")).toBeVisible()
  })
})
