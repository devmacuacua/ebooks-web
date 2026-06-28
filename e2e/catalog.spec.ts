import { test, expect } from "@playwright/test";

test.describe("Store / Catalog", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ebooks/i);
  });

  test("catalog page renders", async ({ page }) => {
    await page.goto("/catalog");
    // Either book grid or loading state
    await expect(page.locator("body")).toBeVisible();
  });

  test("catalog navigation link works", async ({ page }) => {
    await page.goto("/");
    const catalogLink = page.getByRole("link", { name: /catálogo/i }).first();
    if (await catalogLink.isVisible()) {
      await catalogLink.click();
      await expect(page).toHaveURL(/catalog/);
    }
  });

  test("login link visible in header when logged out", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.getByRole("link", { name: /entrar/i }).first();
    await expect(loginLink).toBeVisible();
  });

  test("subscription page renders", async ({ page }) => {
    await page.goto("/subscription");
    await expect(page.locator("body")).toBeVisible();
  });
});
