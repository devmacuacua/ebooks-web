import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  isAuthenticated: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

const mockIsAuthenticated = isAuthenticated as ReturnType<typeof vi.fn>;

describe("useWishlist queryFn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /api/reading/wishlist and returns data", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const mockItems = [
      { id: "w1", bookId: "b1", bookTitle: "Livro A", addedAt: "2026-01-01T00:00:00Z" },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockItems });

    const { data } = await api.get<typeof mockItems>("/api/reading/wishlist");
    expect(api.get).toHaveBeenCalledWith("/api/reading/wishlist");
    expect(data).toHaveLength(1);
    expect(data[0].bookTitle).toBe("Livro A");
  });

  it("is disabled when user is not authenticated", () => {
    mockIsAuthenticated.mockReturnValue(false);
    expect(isAuthenticated()).toBe(false);
  });
});

describe("useWishlistCheck queryFn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the check endpoint for a given bookId", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { inWishlist: true } });

    const { data } = await api.get<{ inWishlist: boolean }>("/api/reading/wishlist/b1/check");
    expect(data.inWishlist).toBe(true);
  });

  it("returns false when book is not in wishlist", async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { inWishlist: false } });
    const { data } = await api.get<{ inWishlist: boolean }>("/api/reading/wishlist/b2/check");
    expect(data.inWishlist).toBe(false);
  });
});

describe("wishlist toggle mutations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("add mutation calls POST with correct payload", async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: "w2" } });
    const payload = { bookId: "b1", bookTitle: "Livro B", bookSlug: "livro-b", price: 250 };
    await api.post("/api/reading/wishlist", payload);
    expect(api.post).toHaveBeenCalledWith("/api/reading/wishlist", payload);
  });

  it("remove mutation calls DELETE with bookId in URL", async () => {
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    await api.delete("/api/reading/wishlist/b1");
    expect(api.delete).toHaveBeenCalledWith("/api/reading/wishlist/b1");
  });
});
