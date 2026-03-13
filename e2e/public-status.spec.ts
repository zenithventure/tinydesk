import { test, expect } from "@playwright/test"

test.describe("Public Status Page", () => {
  test("shows 404 for non-existent ticket", async ({ page }) => {
    const response = await page.goto("/ticket/TD-9999")
    expect(response?.status()).toBe(404)
  })

  test("ticket API returns 404 for non-existent ticket", async ({ request }) => {
    const response = await request.get("/api/tickets/TD-9999")
    expect(response.status()).toBe(404)
  })

  test("ticket events API returns 404 for non-existent ticket", async ({ request }) => {
    const response = await request.get("/api/tickets/TD-9999/events")
    expect(response.status()).toBe(404)
  })

  test("landing page renders", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=TinyDesk")).toBeVisible()
    await expect(page.locator("text=See exactly where")).toBeVisible()
  })
})
