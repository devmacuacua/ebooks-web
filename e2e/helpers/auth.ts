import type { Page } from "@playwright/test";

function b64(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

export function makeFakeJwt(overrides: Record<string, unknown> = {}): string {
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({
    sub: "test-user-1",
    email: "test@ebooksstore.co.mz",
    name: "Test User",
    role: "CUSTOMER",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...overrides,
  });
  return `${header}.${payload}.fakesig`;
}

export function makeAdminJwt(): string {
  return makeFakeJwt({ role: "ADMIN", name: "Admin User", email: "admin@ebooksstore.co.mz" });
}

export async function loginAs(page: Page, role: "customer" | "admin" = "customer") {
  const token = role === "admin" ? makeAdminJwt() : makeFakeJwt();
  await page.addInitScript((t) => {
    localStorage.setItem("ebooks_access_token", t);
    localStorage.setItem("ebooks_refresh_token", "fake-refresh-token");
  }, token);
}
