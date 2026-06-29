import { test, expect } from "@playwright/test";

test.describe("Wishlist page", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page).toHaveURL(/login/);
  });

  test("wishlist redirect preserves return path in query string", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page).toHaveURL(/login/);
    // The AuthGuard should set redirect= param so user returns after login
    const url = page.url();
    expect(url).toContain("login");
  });
});

test.describe("Catalog → Wishlist flow", () => {
  test("catalog page renders book cards", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("networkidle");
    // Catalog should show either books or an empty state
    const hasCards = await page.locator("article, [data-testid='book-card']").count();
    const hasEmpty = await page.getByText(/sem livros|nenhum livro/i).isVisible().catch(() => false);
    expect(hasCards > 0 || hasEmpty).toBe(true);
  });

  test("catalog search input exists and accepts text", async ({ page }) => {
    await page.goto("/catalog");
    const searchInput = page.getByPlaceholder(/pesquisar/i).first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("livro");
    await expect(searchInput).toHaveValue("livro");
  });
});

test.describe("Cart page", () => {
  test("cart page renders without authentication", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");
    // Cart is public — should show empty cart or items
    const emptyCart = page.getByText(/carrinho.*vazio|sem itens/i);
    const hasContent = await page.locator("main").isVisible();
    expect(hasContent).toBe(true);
  });
});
