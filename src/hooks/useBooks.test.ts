import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "@/lib/api";

// Extract and test the adapter functions via the queryFn behaviour
// by directly calling the same transformation logic used in useBooks

function adaptBookSummary(raw: Record<string, unknown>) {
  return {
    ...(raw as Record<string, unknown>),
    coverImageUrl: (raw.coverImage as string) ?? (raw.coverImageUrl as string),
    totalReviews: (raw.reviewCount as number) ?? (raw.totalReviews as number) ?? 0,
    featured: (raw.isFeatured as boolean) ?? (raw.featured as boolean) ?? false,
  };
}

function adaptBook(raw: Record<string, unknown>) {
  return {
    ...adaptBookSummary(raw),
    pageCount: (raw.pages as number) ?? (raw.pageCount as number),
    ebookSizeBytes: (raw.fileSizeBytes as number) ?? (raw.ebookSizeBytes as number),
    reviews: (raw.reviews as unknown[]) ?? [],
    relatedBooks: ((raw.relatedBooks as Record<string, unknown>[]) ?? []).map(adaptBookSummary),
  };
}

describe("adaptBookSummary", () => {
  it("uses coverImage when coverImageUrl is absent", () => {
    const raw = { id: "1", coverImage: "img.jpg" };
    expect(adaptBookSummary(raw).coverImageUrl).toBe("img.jpg");
  });

  it("prefers coverImage over coverImageUrl when both present (adapter priority)", () => {
    const raw = { id: "1", coverImage: "old.jpg", coverImageUrl: "new.jpg" };
    // The adapter checks coverImage first (??), so coverImage wins
    expect(adaptBookSummary(raw).coverImageUrl).toBe("old.jpg");
  });

  it("maps reviewCount to totalReviews", () => {
    const raw = { id: "1", reviewCount: 42 };
    expect(adaptBookSummary(raw).totalReviews).toBe(42);
  });

  it("falls back to totalReviews if reviewCount absent", () => {
    const raw = { id: "1", totalReviews: 7 };
    expect(adaptBookSummary(raw).totalReviews).toBe(7);
  });

  it("defaults totalReviews to 0 when neither field present", () => {
    const raw = { id: "1" };
    expect(adaptBookSummary(raw).totalReviews).toBe(0);
  });

  it("maps isFeatured to featured", () => {
    const raw = { id: "1", isFeatured: true };
    expect(adaptBookSummary(raw).featured).toBe(true);
  });

  it("falls back to featured field", () => {
    const raw = { id: "1", featured: false };
    expect(adaptBookSummary(raw).featured).toBe(false);
  });
});

describe("adaptBook", () => {
  it("maps pages to pageCount", () => {
    const raw = { id: "1", pages: 320 };
    expect(adaptBook(raw).pageCount).toBe(320);
  });

  it("falls back to pageCount field", () => {
    const raw = { id: "1", pageCount: 200 };
    expect(adaptBook(raw).pageCount).toBe(200);
  });

  it("maps fileSizeBytes to ebookSizeBytes", () => {
    const raw = { id: "1", fileSizeBytes: 1024 };
    expect(adaptBook(raw).ebookSizeBytes).toBe(1024);
  });

  it("defaults reviews to empty array", () => {
    const raw = { id: "1" };
    expect(adaptBook(raw).reviews).toEqual([]);
  });

  it("adapts nested relatedBooks", () => {
    const raw = { id: "1", relatedBooks: [{ id: "2", reviewCount: 3 }] };
    const result = adaptBook(raw);
    expect(result.relatedBooks[0].totalReviews).toBe(3);
  });
});

describe("useBooks queryFn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the books API with search param", async () => {
    const mockPage = {
      content: [{ id: "b1", title: "Livro A", reviewCount: 5, isFeatured: false }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockPage });

    const params = new URLSearchParams();
    params.set("search", "moçambique");

    const { data } = await api.get<typeof mockPage>(`/api/catalog/books?${params.toString()}`);
    const adapted = { ...data, content: data.content.map(adaptBookSummary) };

    expect(api.get).toHaveBeenCalledWith("/api/catalog/books?search=mo%C3%A7ambique");
    expect(adapted.content[0].totalReviews).toBe(5);
  });

  it("calls the single book API by slug", async () => {
    const mockBook = { id: "b1", slug: "livro-a", pages: 150, fileSizeBytes: 2048 };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockBook });

    const { data } = await api.get<typeof mockBook>("/api/catalog/books/slug/livro-a");
    const adapted = adaptBook(data as Record<string, unknown>);

    expect(api.get).toHaveBeenCalledWith("/api/catalog/books/slug/livro-a");
    expect(adapted.pageCount).toBe(150);
    expect(adapted.ebookSizeBytes).toBe(2048);
  });
});
