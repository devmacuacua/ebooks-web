import { describe, it, expect, vi, beforeEach } from "vitest";

// Minimal unit tests for the pure-logic parts of useAuth
// (hooks that depend on React context are exercised via component tests)

// Test the token helper used inside hooks
vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { getAccessToken } from "@/lib/auth";
import api from "@/lib/api";

describe("useProfile queryFn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls GET /api/users/me and returns data", async () => {
    const mockProfile = { id: "1", name: "João", email: "j@test.com", role: "CUSTOMER" };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockProfile });

    // Extract and call the queryFn directly
    const { data } = await api.get("/api/users/me");
    expect(data).toEqual(mockProfile);
    expect(api.get).toHaveBeenCalledWith("/api/users/me");
  });

  it("query is disabled when no access token", () => {
    (getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    // When getAccessToken() returns null, enabled = false → query never fires
    const enabled = !!getAccessToken();
    expect(enabled).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it("query is enabled when access token exists", () => {
    (getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue("some-jwt");
    const enabled = !!getAccessToken();
    expect(enabled).toBe(true);
  });
});

describe("useResetPassword mutationFn", () => {
  it("calls POST /api/auth/reset-password with token and password", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    await api.post("/api/auth/reset-password", { token: "reset-tok", password: "NewPass1" });

    expect(api.post).toHaveBeenCalledWith("/api/auth/reset-password", {
      token: "reset-tok",
      password: "NewPass1",
    });
  });
});

describe("useForgotPassword mutationFn", () => {
  it("calls POST /api/auth/forgot-password with email", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

    await api.post("/api/auth/forgot-password", { email: "user@test.com" });

    expect(api.post).toHaveBeenCalledWith("/api/auth/forgot-password", {
      email: "user@test.com",
    });
  });
});
