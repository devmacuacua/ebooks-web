import { describe, it, expect, beforeEach, vi } from "vitest";
import { getAccessToken, getRefreshToken, setTokens, clearTokens, getCurrentUser, isAuthenticated, isAdmin } from "./auth";

// Build a fake JWT without a real signature (jwtDecode just base64-decodes the payload)
function makeFakeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600;
const PAST_EXP = Math.floor(Date.now() / 1000) - 3600;

const VALID_PAYLOAD = {
  sub: "user-123",
  email: "user@test.com",
  name: "Test User",
  role: "CUSTOMER" as const,
  exp: FUTURE_EXP,
  iat: Math.floor(Date.now() / 1000) - 60,
};

describe("auth lib", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getAccessToken ─────────────────────────────────────────────────────────

  describe("getAccessToken", () => {
    it("returns null when no token stored", () => {
      expect(getAccessToken()).toBeNull();
    });

    it("returns the stored token", () => {
      localStorage.setItem("ebooks_access_token", "my-token");
      expect(getAccessToken()).toBe("my-token");
    });
  });

  // ── setTokens / getRefreshToken ────────────────────────────────────────────

  describe("setTokens", () => {
    it("stores both tokens in localStorage", () => {
      setTokens("access-abc", "refresh-xyz");
      expect(localStorage.getItem("ebooks_access_token")).toBe("access-abc");
      expect(localStorage.getItem("ebooks_refresh_token")).toBe("refresh-xyz");
    });

    it("getRefreshToken returns null when not set", () => {
      expect(getRefreshToken()).toBeNull();
    });

    it("getRefreshToken returns stored refresh token", () => {
      setTokens("access", "refresh-token-123");
      expect(getRefreshToken()).toBe("refresh-token-123");
    });
  });

  // ── clearTokens ────────────────────────────────────────────────────────────

  describe("clearTokens", () => {
    it("removes both tokens from localStorage", () => {
      setTokens("access", "refresh");
      clearTokens();
      expect(localStorage.getItem("ebooks_access_token")).toBeNull();
      expect(localStorage.getItem("ebooks_refresh_token")).toBeNull();
    });
  });

  // ── getCurrentUser ─────────────────────────────────────────────────────────

  describe("getCurrentUser", () => {
    it("returns null when no token", () => {
      expect(getCurrentUser()).toBeNull();
    });

    it("returns user object from valid JWT payload", () => {
      localStorage.setItem("ebooks_access_token", makeFakeJwt(VALID_PAYLOAD));
      const user = getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.id).toBe("user-123");
      expect(user!.email).toBe("user@test.com");
      expect(user!.name).toBe("Test User");
      expect(user!.role).toBe("CUSTOMER");
    });

    it("returns null for expired token", () => {
      const expired = makeFakeJwt({ ...VALID_PAYLOAD, exp: PAST_EXP });
      localStorage.setItem("ebooks_access_token", expired);
      expect(getCurrentUser()).toBeNull();
    });

    it("returns null for malformed token", () => {
      localStorage.setItem("ebooks_access_token", "not.a.jwt");
      expect(getCurrentUser()).toBeNull();
    });
  });

  // ── isAuthenticated ────────────────────────────────────────────────────────

  describe("isAuthenticated", () => {
    it("returns false when no token", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true for a valid non-expired token", () => {
      localStorage.setItem("ebooks_access_token", makeFakeJwt(VALID_PAYLOAD));
      expect(isAuthenticated()).toBe(true);
    });

    it("returns false for an expired token", () => {
      localStorage.setItem("ebooks_access_token", makeFakeJwt({ ...VALID_PAYLOAD, exp: PAST_EXP }));
      expect(isAuthenticated()).toBe(false);
    });
  });

  // ── isAdmin ────────────────────────────────────────────────────────────────

  describe("isAdmin", () => {
    it("returns false when not authenticated", () => {
      expect(isAdmin()).toBe(false);
    });

    it("returns false for a regular CUSTOMER role", () => {
      localStorage.setItem("ebooks_access_token", makeFakeJwt(VALID_PAYLOAD));
      expect(isAdmin()).toBe(false);
    });

    it("returns true for ADMIN role", () => {
      localStorage.setItem("ebooks_access_token", makeFakeJwt({ ...VALID_PAYLOAD, role: "ADMIN" }));
      expect(isAdmin()).toBe(true);
    });
  });
});
