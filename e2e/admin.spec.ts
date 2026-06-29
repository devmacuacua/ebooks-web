import { test, expect } from "@playwright/test";

test.describe("Admin area", () => {
  test("admin pages redirect to login when not authenticated", async ({ page }) => {
    for (const path of ["/admin/dashboard", "/admin/reviews", "/admin/deliveries", "/admin/partners", "/admin/analytics"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/login/);
    }
  });

  test("admin/reviews redirect goes to login", async ({ page }) => {
    await page.goto("/admin/reviews");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Partner page", () => {
  test("partner page redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/partner");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Reader page", () => {
  test("reader redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/reader/some-book-id");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Library page", () => {
  test("library redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/library");
    await expect(page).toHaveURL(/login/);
  });
});
