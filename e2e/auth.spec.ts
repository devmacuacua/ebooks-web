import { test, expect } from "@playwright/test";

test.describe("Auth flows", () => {
  test("login page renders and shows form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("register page renders all fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel(/nome/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible();
  });

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enviar/i })).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("invalid@test.com");
    await page.getByLabel(/senha/i).fill("wrongpassword");
    await page.getByRole("button", { name: /entrar/i }).click();
    // Should stay on login page or show error toast
    await expect(page).toHaveURL(/login/);
  });

  test("register validates required fields", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /criar conta/i }).click();
    // Form validation should prevent submission
    await expect(page).toHaveURL(/register/);
  });

  test("email-verified page shows success state without error param", async ({ page }) => {
    await page.goto("/email-verified");
    await expect(page.getByRole("link", { name: /iniciar sess/i })).toBeVisible();
  });

  test("email-verified page shows error state when error param present", async ({ page }) => {
    await page.goto("/email-verified?error=Token+expirado");
    await expect(page.getByText(/token expirado/i)).toBeVisible();
  });

  test("reset-password page shows error when no token", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("link", { name: /solicitar/i })).toBeVisible();
  });
});
