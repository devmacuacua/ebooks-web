import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Book, BookSummary, CatalogFilters, PaginatedResponse } from "@/types";

function adaptBookSummary(raw: Record<string, unknown>): BookSummary {
  return {
    ...(raw as unknown as BookSummary),
    coverImageUrl: (raw.coverImage as string) ?? (raw.coverImageUrl as string),
    totalReviews: (raw.reviewCount as number) ?? (raw.totalReviews as number) ?? 0,
    featured: (raw.isFeatured as boolean) ?? (raw.featured as boolean) ?? false,
  };
}

function adaptBook(raw: Record<string, unknown>): Book {
  return {
    ...(adaptBookSummary(raw) as unknown as Book),
    pageCount: (raw.pages as number) ?? (raw.pageCount as number),
    ebookSizeBytes: (raw.fileSizeBytes as number) ?? (raw.ebookSizeBytes as number),
    reviews: (raw.reviews as Book["reviews"]) ?? [],
    relatedBooks: ((raw.relatedBooks as Record<string, unknown>[]) ?? []).map(adaptBookSummary),
  };
}

export function useBooks(filters: CatalogFilters = {}) {
  return useQuery<PaginatedResponse<BookSummary>>({
    queryKey: ["books", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.type) params.set("type", filters.type);
      if (filters.categories?.length) params.set("categories", filters.categories.join(","));
      if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
      if (filters.subscriptionOnly) params.set("subscriptionOnly", "true");
      if (filters.page !== undefined) params.set("page", String(filters.page));
      if (filters.size !== undefined) params.set("size", String(filters.size));
      if (filters.sort) params.set("sort", filters.sort);

      const { data } = await api.get<{ content: Record<string, unknown>[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean }>(
        `/api/catalog/books?${params.toString()}`
      );
      return {
        ...data,
        content: data.content.map(adaptBookSummary),
      };
    },
    staleTime: 60_000,
  });
}

export function useBook(slug: string) {
  return useQuery<Book>({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>(`/api/catalog/books/slug/${slug}`);
      return adaptBook(data);
    },
    enabled: Boolean(slug),
    staleTime: 120_000,
  });
}

export function useFeaturedBooks() {
  return useQuery<BookSummary[]>({
    queryKey: ["books", "featured"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>[]>("/api/catalog/books/featured");
      return data.map(adaptBookSummary);
    },
    staleTime: 300_000,
  });
}

export function useNewArrivals() {
  return useQuery<BookSummary[]>({
    queryKey: ["books", "new-arrivals"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>[]>("/api/catalog/books/new-arrivals");
      return data.map(adaptBookSummary);
    },
    staleTime: 300_000,
  });
}

export function useSearchBooks(query: string) {
  return useQuery<BookSummary[]>({
    queryKey: ["books", "search", query],
    queryFn: async () => {
      const { data } = await api.get<{ items: Record<string, unknown>[] }>(
        `/api/catalog/books/search?q=${encodeURIComponent(query)}`
      );
      return (data.items ?? []).map(adaptBookSummary);
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
