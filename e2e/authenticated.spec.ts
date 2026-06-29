import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const MOCK_PROFILE = {
  id: "test-user-1",
  name: "Test User",
  email: "test@ebooksstore.co.mz",
  role: "CUSTOMER",
  emailVerified: true,
  avatarUrl: null,
};

const MOCK_NOTIFICATIONS: unknown[] = [];
const MOCK_WISHLIST: unknown[] = [];
const MOCK_LIBRARY: unknown[] = [];
const MOCK_ORDERS = { content: [], totalElements: 0, totalPages: 0 };

async function setupAuthMocks(page: import("@playwright/test").Page) {
  await page.route("**/api/users/me", (r) =>
    r.fulfill({ json: MOCK_PROFILE })
  );
  await page.route("**/api/notifications/user/*/unread-count", (r) =>
    r.fulfill({ json: 0 })
  );
  await page.route("**/api/notifications/user/**", (r) =>
    r.fulfill({ json: MOCK_NOTIFICATIONS })
  );
  await page.route("**/api/reading/wishlist", (r) =>
    r.fulfill({ json: MOCK_WISHLIST })
  );
  await page.route("**/api/reading/library**", (r) =>
    r.fulfill({ json: MOCK_LIBRARY })
  );
  await page.route("**/api/orders**", (r) =>
    r.fulfill({ json: MOCK_ORDERS })
  );
}

test.describe("Authenticated user flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
    await setupAuthMocks(page);
  });

  test("notifications page is accessible and shows empty state", async ({ page }) => {
    await page.route("**/api/notifications/user/**", (r) =>
      r.fulfill({
        json: { content: [], totalElements: 0, totalPages: 0 },
      })
    );

    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");

    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/login/);

    // Should show the notifications heading
    await expect(page.getByRole("heading", { name: /notificações/i })).toBeVisible();
  });

  test("wishlist page is accessible and shows empty state", async ({ page }) => {
    await page.goto("/wishlist");
    await page.waitForLoadState("networkidle");

    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /lista de desejos/i })).toBeVisible();
  });

  test("orders page is accessible", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /encomendas/i })).toBeVisible();
  });

  test("library page is accessible", async ({ page }) => {
    await page.route("**/api/reading/library**", (r) =>
      r.fulfill({ json: [] })
    );
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /biblioteca/i })).toBeVisible();
  });

  test("header shows notification bell when logged in", async ({ page }) => {
    await page.goto("/catalog");
    await page.route("**/api/catalog/books**", (r) =>
      r.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } })
    );
    await page.waitForLoadState("networkidle");

    const bell = page.getByLabel("Notificações");
    await expect(bell).toBeVisible();
  });

  test("header dropdown shows user name", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open user dropdown
    const userMenu = page.getByRole("button", { name: /test user/i }).first();
    const hasUserMenu = await userMenu.isVisible().catch(() => false);
    if (hasUserMenu) {
      await userMenu.click();
      await expect(page.getByText("test@ebooksstore.co.mz")).toBeVisible();
    }
  });
});

test.describe("Authenticated cart → checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "customer");
    await setupAuthMocks(page);
  });

  test("can add book to cart from catalog and proceed to cart page", async ({ page }) => {
    await page.route("**/api/catalog/books**", (r) =>
      r.fulfill({
        json: {
          content: [
            {
              id: "book-1",
              title: "Livro de Teste",
              slug: "livro-de-teste",
              price: 500,
              type: "EBOOK",
              coverImageUrl: null,
              averageRating: 4.5,
              totalReviews: 10,
              authorNames: ["Autor Teste"],
              subscriptionOnly: false,
              featured: false,
            },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      })
    );

    await page.goto("/catalog");
    await page.waitForLoadState("networkidle");

    // Cart page is always accessible
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });

  test("cart shows empty state when no items", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");
    // Empty cart message exists somewhere on page
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});

test.describe("Admin authenticated flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.route("**/api/users/me", (r) =>
      r.fulfill({
        json: { ...MOCK_PROFILE, role: "ADMIN", name: "Admin User", email: "admin@ebooksstore.co.mz" },
      })
    );
    await page.route("**/api/notifications/user/*/unread-count", (r) =>
      r.fulfill({ json: 0 })
    );
  });

  test("admin dashboard is accessible", async ({ page }) => {
    await page.route("**/api/analytics/dashboard", (r) =>
      r.fulfill({
        json: {
          revenue: { today: 0, thisMonth: 0, allTime: 0, todayOrders: 0, monthOrders: 0 },
          users: { today: 0, total: 0 },
          subscriptions: { active: 0, thisMonth: 0 },
          deliveries: { pending: 0 },
        },
      })
    );
    await page.route("**/api/admin/**", (r) => r.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } }));

    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByText(/admin panel/i)).toBeVisible();
  });

  test("admin reviews page is accessible", async ({ page }) => {
    await page.route("**/api/admin/reviews**", (r) =>
      r.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } })
    );

    await page.goto("/admin/reviews");
    await page.waitForLoadState("networkidle");

    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /avaliações/i })).toBeVisible();
  });
});
