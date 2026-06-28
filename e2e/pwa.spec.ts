import { test, expect } from "@playwright/test";

test.describe("PWA / Offline", () => {
  test("manifest.json is accessible", async ({ page }) => {
    const response = await page.request.get("/manifest.json");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.name).toBeTruthy();
    expect(Array.isArray(body.icons)).toBe(true);
  });

  test("icon-192.png is accessible", async ({ page }) => {
    const response = await page.request.get("/icons/icon-192.png");
    expect(response.status()).toBe(200);
  });

  test("icon-512.png is accessible", async ({ page }) => {
    const response = await page.request.get("/icons/icon-512.png");
    expect(response.status()).toBe(200);
  });

  test("service worker script is accessible", async ({ page }) => {
    const response = await page.request.get("/sw.js");
    expect(response.status()).toBe(200);
  });

  test("offline fallback page renders", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.locator("body")).toBeVisible();
  });
});
